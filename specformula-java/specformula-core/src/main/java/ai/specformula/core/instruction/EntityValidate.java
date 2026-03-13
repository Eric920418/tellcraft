package ai.specformula.core.instruction;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.helper.NamingConverter;
import ai.specformula.core.helper.TypeConverter;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.data.model.DatabaseSchema.SchemaTablePair;
import ai.specformula.core.spec.data.model.TableDefinition;
import io.cucumber.datatable.DataTable;

/**
 * Entity 資料表存在性驗證輔助工具（純 JDBC 實作）。
 * <p>
 * 驗證 DataTable 內的每一列 row，資料庫中都存在一筆符合的記錄，且欄位驗證通過。
 * </p>
 */
public class EntityValidate {

    private final ISAFeatureArgumentResolver resolver;
    private final List<DatabaseSchema> schemas;
    private final Function<String, Connection> connectionProvider;

    public EntityValidate(ISAFeatureArgumentResolver resolver,
                          List<DatabaseSchema> schemas,
                          Function<String, Connection> connectionProvider) {
        this.resolver = resolver;
        this.schemas = schemas;
        this.connectionProvider = connectionProvider;
    }

    /**
     * 斷言：DataTable 內的每一列 row，資料庫中都存在一筆符合的記錄，且欄位驗證通過。
     *
     * @param entityName entity 名稱
     * @param dataTable  Cucumber DataTable（asMaps 形式：欄位名稱 → 字串）
     */
    public void assertExists(String entityName, DataTable dataTable) throws Exception {
        SchemaTablePair pair = DatabaseSchema.findSchemaAndTable(schemas, entityName);
        if (pair == null) {
            throw new IllegalArgumentException(
                    "[EntityValidate] 找不到 entity '" + entityName + "' 的定義。" +
                    "請確認 entity_to_table_mapping 設定。");
        }
        TableDefinition tableDef = pair.table();
        List<String> headers = new ArrayList<>(dataTable.row(0));
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);

        if (rows.isEmpty()) {
            throw new IllegalArgumentException(
                "[EntityValidate] DataTable 必須至少有一列資料。entity=" + entityName);
        }

        try (Connection conn = connectionProvider.apply(pair.schema().getDataSourceName())) {
            for (Map<String, String> row : rows) {
                Map<String, Object> actual = findActual(row, entityName, tableDef, conn);
                assertRowMatches(row, actual, entityName);

                // 處理變數儲存：提取 >contextKey 和 <executionKey
                Map<Integer, String> contextKeyMap = resolver.parseContextKeys(headers);
                if (!contextKeyMap.isEmpty()) {
                    List<String> dataRow = new ArrayList<>();
                    for (String header : headers) {
                        dataRow.add(row.get(header));
                    }
                    // 將 DB 結果的 key 轉為 camelCase（H2 回傳 UPPER_SNAKE，需對應 camelCase executionKey）
                    Map<String, Object> camelCaseActual = new LinkedHashMap<>();
                    for (var col : tableDef.getColumns()) {
                        String colName = col.getName();
                        String camelName = NamingConverter.snakeToCamel(colName);
                        Object value = getActualValue(actual, colName);
                        camelCaseActual.put(camelName, value);
                        // 同時保留原始欄位名稱（支援 <order_id 格式的 executionKey）
                        if (!camelName.equals(colName)) {
                            camelCaseActual.put(colName, value);
                        }
                    }
                    resolver.extractAndStoreVariables(dataRow, contextKeyMap, camelCaseActual);
                }
            }
        }
    }

    // ==================== 查詢邏輯 ====================

    /**
     * 針對單列 row 取得實際記錄：
     * <ul>
     *   <li>若 row 有所有 pkColumns 且不是空白/constraint：使用 PK 查詢</li>
     *   <li>否則：用 probeFields 建條件查詢，必要時再縮小候選</li>
     * </ul>
     */
    private Map<String, Object> findActual(Map<String, String> row, String entityName,
                                            TableDefinition tableDef, Connection conn) throws Exception {
        // 嘗試 PK 查詢
        Map<String, Object> pkValues = new LinkedHashMap<>();
        Set<String> pkColumns = tableDef.getPkColumns();
        boolean hasAllPks = !pkColumns.isEmpty();

        for (String pkCol : pkColumns) {
            String pkRaw = NamingConverter.getRowValue(row,pkCol);
            if (pkRaw == null || pkRaw.trim().isEmpty() || pkRaw.trim().startsWith("&")) {
                hasAllPks = false;
                break;
            }
            Object resolvedPk = resolver.resolveVariable(pkRaw);
            Object typed = TypeConverter.convertToColumnType(
                    resolvedPk != null ? resolvedPk : pkRaw,
                    tableDef.findColumnType(pkCol));
            pkValues.put(pkCol, typed);
        }

        if (hasAllPks) {
            Map<String, Object> result = queryByPk(tableDef, pkValues, conn);
            if (result == null) {
                throw new AssertionError(entityName + " with " + pkValues + " should exist");
            }
            return result;
        }

        // Probe 查詢（使用 selectByValuesSql）
        Set<String> probeFields = tableDef.getNonPkColumnNames();
        Map<String, Object> probeConditions = new LinkedHashMap<>();
        for (String fieldName : probeFields) {
            String expected = NamingConverter.getRowValue(row,fieldName);
            if (expected == null) continue;
            String trim = expected.trim();
            if (trim.isEmpty() || trim.startsWith("&")) continue;

            Object rv = resolver.resolveVariable(expected);
            if (rv != null) {
                Object typed = TypeConverter.convertToColumnType(rv, tableDef.findColumnType(fieldName));
                probeConditions.put(fieldName, typed);
            }
        }

        // 無查詢條件且無提取欄位時，無法定位記錄
        if (probeConditions.isEmpty()) {
            boolean hasExtractionColumns = row.keySet().stream().anyMatch(k -> k.startsWith(">"));
            if (!hasExtractionColumns) {
                throw new AssertionError("缺少查詢條件：請提供至少一個非約束欄位或主鍵");
            }
        }

        // 設定 queryColumns 為有值的條件欄位（空時產生無 WHERE 的 SQL，查詢所有記錄）
        tableDef.setQueryColumns(new ArrayList<>(probeConditions.keySet()));

        List<Map<String, Object>> results = queryByProbe(tableDef, probeConditions, conn);

        // 多筆時先用 CAS 後置篩選
        if (results.size() > 1) {
            List<Map<String, Object>> filteredByConstraints = filterByConstraints(row, results, entityName);
            if (!filteredByConstraints.isEmpty()) {
                results = filteredByConstraints;
            }
        }

        if (results.isEmpty()) {
            throw new AssertionError(
                    "找不到符合條件的" + entityName + "，請確認資料是否存在或提供主鍵精準查詢");
        } else if (results.size() > 1) {
            throw new AssertionError(
                    "找到多筆" + entityName + "，請提供更多欄位或主鍵以唯一識別");
        }

        return results.get(0);
    }

    /**
     * 使用 TableDefinition 的快取 SQL 查詢 PK。
     */
    private Map<String, Object> queryByPk(TableDefinition tableDef, Map<String, Object> pkValues,
                                           Connection conn) throws SQLException {
        String sql = tableDef.getSelectSql();
        Map<String, Integer> columnIndex = tableDef.getSelectWhereColumnIndex();

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Map.Entry<String, Object> entry : pkValues.entrySet()) {
                Integer idx = columnIndex.get(entry.getKey());
                if (idx != null) {
                    ps.setObject(idx, TypeConverter.toJdbcValue(entry.getValue()));
                }
            }
            try (ResultSet rs = ps.executeQuery()) {
                List<Map<String, Object>> results = resultSetToList(rs);
                return results.isEmpty() ? null : results.get(0);
            }
        }
    }

    // ==================== JDBC 查詢 ====================

    /**
     * 使用 TableDefinition 的快取 selectByValuesSql 查詢非 PK 條件的記錄。
     * SQL 格式: SELECT ... FROM table WHERE (? IS NULL OR col1=?) AND (? IS NULL OR col2=?)
     * PostgreSQL 版本使用 CAST: (CAST(? AS type) IS NULL OR col=?)
     */
    private List<Map<String, Object>> queryByProbe(TableDefinition tableDef, Map<String, Object> conditions,
                                                    Connection conn) throws SQLException {
        String sql = tableDef.getSelectByValuesSql();
        Map<String, List<Integer>> columnIndex = tableDef.getSelectByValuesIndex();

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Map.Entry<String, List<Integer>> entry : columnIndex.entrySet()) {
                String colName = entry.getKey();
                List<Integer> indices = entry.getValue();
                Object value = conditions.get(colName);
                Object jdbcValue = TypeConverter.toJdbcValue(value);
                ps.setObject(indices.get(0), jdbcValue);
                ps.setObject(indices.get(1), jdbcValue);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return resultSetToList(rs);
            }
        }
    }

    /**
     * 將 ResultSet 轉為 List&lt;Map&lt;String, Object&gt;&gt;。
     */
    private List<Map<String, Object>> resultSetToList(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        int columnCount = meta.getColumnCount();
        List<Map<String, Object>> list = new ArrayList<>();

        while (rs.next()) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= columnCount; i++) {
                String colName = meta.getColumnLabel(i);
                Object value = rs.getObject(i);
                row.put(colName, value);
            }
            list.add(row);
        }
        return list;
    }

    // ==================== 驗證邏輯 ====================

    /**
     * 對單列 row 做欄位驗證。
     */
    private void assertRowMatches(Map<String, String> row, Map<String, Object> actual, String entityName) {
        for (Map.Entry<String, String> entry : row.entrySet()) {
            String fieldName = entry.getKey();
            if (fieldName == null || fieldName.isBlank()) continue;
            if (fieldName.startsWith(">") || fieldName.startsWith("<")) continue;

            String expected = entry.getValue();
            if (expected == null) continue;

            Object actualValue = getActualValue(actual, fieldName);
            Object resolved = resolver.resolveAndValidate(expected, actualValue, fieldName, entityName);
            if (resolved == null) continue;

            // resolveAndValidate 回傳非 null 表示需要進行值比較
            if (!valuesEqual(resolved, actualValue)) {
                throw new AssertionError(String.format(
                        "[%s.%s] expect: [%s], actual: [%s]",
                        entityName, fieldName,
                        String.valueOf(resolved), String.valueOf(actualValue)
                ));
            }
        }
    }

    // ==================== 值比對 ====================

    /**
     * 比對期望值與實際值（型別感知）。
     */
    private boolean valuesEqual(Object expected, Object actual) {
        if (expected == null) return actual == null;
        if (actual == null) return false;

        // 將兩邊正規化後比較
        Object normalizedExpected = TypeConverter.normalizeJdbcValue(expected);
        Object normalizedActual = TypeConverter.normalizeJdbcValue(actual);

        if (normalizedExpected instanceof BigDecimal e && normalizedActual instanceof BigDecimal a) {
            return e.compareTo(a) == 0;
        }
        if (normalizedExpected instanceof LocalDateTime e && normalizedActual instanceof LocalDateTime a) {
            return e.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
        }
        if (normalizedExpected instanceof Instant e && normalizedActual instanceof Instant a) {
            return e.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
        }
        if (normalizedExpected instanceof OffsetDateTime e && normalizedActual instanceof OffsetDateTime a) {
            return e.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
        }

        // ZonedDateTime vs LocalDateTime 比較
        if (normalizedExpected instanceof ZonedDateTime zdt && normalizedActual instanceof LocalDateTime ldt) {
            return zdt.toLocalDateTime().truncatedTo(ChronoUnit.SECONDS).equals(ldt.truncatedTo(ChronoUnit.SECONDS));
        }
        if (normalizedExpected instanceof LocalDateTime ldt && normalizedActual instanceof ZonedDateTime zdt) {
            return ldt.truncatedTo(ChronoUnit.SECONDS).equals(zdt.toLocalDateTime().truncatedTo(ChronoUnit.SECONDS));
        }
        // LocalTime 比較
        if (normalizedExpected instanceof LocalTime e && normalizedActual instanceof LocalTime a) {
            return e.equals(a);
        }
        // OffsetDateTime vs ZonedDateTime 比較
        if (normalizedExpected instanceof OffsetDateTime odt && normalizedActual instanceof ZonedDateTime zdt) {
            return odt.truncatedTo(ChronoUnit.SECONDS).equals(zdt.toOffsetDateTime().truncatedTo(ChronoUnit.SECONDS));
        }
        if (normalizedExpected instanceof ZonedDateTime zdt && normalizedActual instanceof OffsetDateTime odt) {
            return zdt.toOffsetDateTime().truncatedTo(ChronoUnit.SECONDS).equals(odt.truncatedTo(ChronoUnit.SECONDS));
        }

        // MSSQL BIT 欄位：JDBC 回傳 Boolean，DataTable 預期 "0"/"1"
        if (normalizedActual instanceof Boolean b) {
            String expectedStr = String.valueOf(normalizedExpected);
            if ("0".equals(expectedStr) || "1".equals(expectedStr)) {
                return b == "1".equals(expectedStr);
            }
            return String.valueOf(b).equals(expectedStr);
        }

        // 嘗試字串比對（處理 JDBC 回傳型別與預期型別不一致的情況）
        if (!normalizedExpected.getClass().equals(normalizedActual.getClass())) {
            // 數值語義比較：String vs Number 或 Number vs Number（不同子型別）
            // 如 "50000.00"(String) vs BigDecimal(50000.0000)，或 "100.00"(String) vs Integer(100)
            {
                BigDecimal expectedBd = toBigDecimal(normalizedExpected);
                BigDecimal actualBd = toBigDecimal(normalizedActual);
                if (expectedBd != null && actualBd != null) {
                    return expectedBd.compareTo(actualBd) == 0;
                }
            }
            // MySQL YEAR 類型：JDBC 回傳 LocalDate(yyyy-01-01)，預期為年份字串 "yyyy"
            if (normalizedExpected instanceof String s && normalizedActual instanceof LocalDate ld) {
                try {
                    int year = Integer.parseInt(s);
                    if (ld.getMonthValue() == 1 && ld.getDayOfMonth() == 1 && ld.getYear() == year) {
                        return true;
                    }
                } catch (NumberFormatException ignored) {
                }
            }
            // String vs LocalTime
            if (normalizedExpected instanceof String s && normalizedActual instanceof LocalTime lt) {
                try {
                    return LocalTime.parse(s).equals(lt);
                } catch (Exception e) {
                    // fall through
                }
            }
            if (normalizedExpected instanceof LocalTime lt && normalizedActual instanceof String s) {
                try {
                    return lt.equals(LocalTime.parse(s));
                } catch (Exception e) {
                    // fall through
                }
            }
            // 如果期望值是字串且實際值是 LocalDateTime，嘗試解析字串為 LocalDateTime
            if (normalizedExpected instanceof String && normalizedActual instanceof LocalDateTime) {
                try {
                    LocalDateTime parsedExpected = LocalDateTime.parse((String) normalizedExpected);
                    return parsedExpected.truncatedTo(ChronoUnit.SECONDS)
                        .equals(((LocalDateTime) normalizedActual).truncatedTo(ChronoUnit.SECONDS));
                } catch (Exception e) {
                    // 解析失敗，繼續字串比較
                }
            }
            // 如果期望值是 LocalDateTime 且實際值是字串，嘗試解析字串為 LocalDateTime
            if (normalizedExpected instanceof LocalDateTime && normalizedActual instanceof String) {
                try {
                    LocalDateTime parsedActual = LocalDateTime.parse((String) normalizedActual);
                    return ((LocalDateTime) normalizedExpected).truncatedTo(ChronoUnit.SECONDS)
                        .equals(parsedActual.truncatedTo(ChronoUnit.SECONDS));
                } catch (Exception e) {
                    // 解析失敗，繼續字串比較
                }
            }
            return String.valueOf(normalizedExpected).equals(String.valueOf(normalizedActual));
        }

        return normalizedExpected.equals(normalizedActual);
    }

    /**
     * 當查詢回傳多筆時，對 row 裡「以 & 開頭」的欄位做後置 CAS 篩選。
     */
    private List<Map<String, Object>> filterByConstraints(Map<String, String> row,
                                                          List<Map<String, Object>> results,
                                                          String entityName) {
        List<Map<String, Object>> filtered = new ArrayList<>();
        for (Map<String, Object> it : results) {
            boolean ok = true;
            for (Map.Entry<String, String> entry : row.entrySet()) {
                String fieldName = entry.getKey();
                String expected = entry.getValue();
                if (expected == null) continue;
                String trim = expected.trim();
                if (!trim.startsWith("&")) continue;

                Object actualValue = getActualValue(it, fieldName);
                boolean pass;
                try {
                    resolver.resolveAndValidate(trim, actualValue, fieldName, entityName);
                    pass = true;
                } catch (AssertionError e) {
                    pass = false;
                }
                if (!pass) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                filtered.add(it);
            }
        }
        return filtered;
    }

    // ==================== 數值轉換工具 ====================

    /**
     * 嘗試將值轉為 BigDecimal（用於數值語義比較）。
     * 支援 Number 子型別與可解析為數值的 String。
     * 無法轉換時回傳 null。
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return new BigDecimal(n.toString());
        if (value instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 從 actual Map（snake_case 或大寫 key）中找值，支援 camelCase→snake_case 轉換。
     * 優先精確匹配，再嘗試 snake_case 轉換，最後嘗試忽略大小寫。
     */
    private Object getActualValue(Map<String, Object> actual, String fieldName) {
        // 精確匹配
        if (actual.containsKey(fieldName)) return actual.get(fieldName);

        // camelCase → snake_case
        String snakeCase = NamingConverter.camelToSnake(fieldName);
        if (actual.containsKey(snakeCase)) return actual.get(snakeCase);

        // 小寫匹配（PostgreSQL 將未加引號的 camelCase 識別符轉為全小寫，如 lastUpdated → lastupdated）
        String lower = fieldName.toLowerCase();
        if (actual.containsKey(lower)) return actual.get(lower);

        // 忽略大小寫（H2 回傳大寫 column name）
        String upper = snakeCase.toUpperCase();
        if (actual.containsKey(upper)) return actual.get(upper);
        String fieldUpper = fieldName.toUpperCase();
        if (actual.containsKey(fieldUpper)) return actual.get(fieldUpper);

        return null;
    }

    // ==================== Getters ====================

    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public List<DatabaseSchema> getSchemas() {
        return schemas;
    }

    public Function<String, Connection> getConnectionProvider() {
        return connectionProvider;
    }
}
