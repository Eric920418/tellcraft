package ai.specformula.core.instruction;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;
import java.util.function.Function;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.helper.NamingConverter;
import ai.specformula.core.helper.TypeConverter;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.data.model.DatabaseSchema.SchemaTablePair;
import ai.specformula.core.spec.data.model.EntityTableMapping;
import ai.specformula.core.spec.data.model.TableDefinition;
import io.cucumber.datatable.DataTable;

/**
 * Entity 資料準備輔助工具。
 * <p>
 * 負責 INSERT INTO 測試資料、取得 generated key 並回查完整記錄，
 * 以及 VAR-System 變數擷取。
 * 支援：
 * <ul>
 *   <li>camelCase → snake_case 欄位名稱轉換</li>
 *   <li>VAR-System 變數擷取（>contextKey / &lt;executionKey）</li>
 *   <li>$variable 變數引用（在資料值中）</li>
 *   <li>TIME-System 時間轉換（@time、@date、@localtime）</li>
 *   <li>自動取得 generated key 並回查完整記錄</li>
 * </ul>
 * </p>
 */
public class EntitySetup {

    private static final System.Logger LOG = System.getLogger(EntitySetup.class.getName());

    private final ISAFeatureArgumentResolver resolver;
    private final List<DatabaseSchema> schemas;
    private final Function<String, Connection> connectionProvider;

    public EntitySetup(ISAFeatureArgumentResolver resolver,
                       List<DatabaseSchema> schemas,
                       Function<String, Connection> connectionProvider) {
        this.resolver = resolver;
        this.schemas = schemas;
        this.connectionProvider = connectionProvider;
    }

    /**
     * 準備測試資料（INSERT INTO），支援 VAR-System 變數擷取。
     *
     * @param entityName entity 名稱
     * @param dataTable  Cucumber DataTable
     */
    public void setup(String entityName, DataTable dataTable) throws Exception {
        if (entityName == null || entityName.isBlank()) {
            throw new IllegalArgumentException("[EntitySetup] 缺少 entity 名稱。");
        }
        if (dataTable == null) {
            throw new IllegalArgumentException("[EntitySetup] 缺少 DataTable。");
        }

        // 從 schemas 中查找 entity
        SchemaTablePair pair = DatabaseSchema.findSchemaAndTable(schemas, entityName);
        if (pair == null) {
            List<String> availableEntities = new ArrayList<>();
            for (DatabaseSchema schema : schemas) {
                EntityTableMapping mapping = schema.getEntityTableMapping();
                if (mapping != null) {
                    availableEntities.addAll(mapping.asMap().keySet());
                } else {
                    for (TableDefinition table : schema.getTables()) {
                        availableEntities.add(table.getTableName());
                    }
                }
            }
            throw new IllegalArgumentException(
                    "[EntitySetup] 找不到 entity '" + entityName + "'。" +
                    "可用的 entity: " + availableEntities);
        }

        DatabaseSchema schema = pair.schema();
        TableDefinition tableDef = pair.table();
        String dataSourceName = schema.getDataSourceName();

        List<String> headers = new ArrayList<>(dataTable.row(0));
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);

        // 解析 VAR-System context key 映射（>contextKey 欄位）
        Map<Integer, String> contextKeyMap = resolver.parseContextKeys(headers);

        // 分離資料欄位（排除 VAR-System > 前綴欄位）
        List<String> dataHeaders = new ArrayList<>();
        for (String header : headers) {
            String trimmed = header.trim();
            if (!trimmed.startsWith(">") && !trimmed.startsWith("<")) {
                dataHeaders.add(header);
            }
        }

        String dbType = schema.getDbType();
        boolean needsSelect = !contextKeyMap.isEmpty();

        try (Connection conn = connectionProvider.apply(dataSourceName)) {
            for (Map<String, String> row : rows) {
                // 執行 INSERT，僅在有 VAR-System 欄位時回查完整記錄
                Map<String, Object> insertedRow = insertRow(conn, row, dataHeaders, tableDef, dbType,
                        needsSelect);

                // VAR-System 變數擷取
                if (needsSelect) {
                    // 使用 TableDefinition 欄位定義建立 camelCase key 映射
                    // insertedRow 的 key 已 lowercase（resultSetToMap），需對應回 camelCase/snake_case
                    Map<String, Object> camelCaseRow = new LinkedHashMap<>();
                    for (var col : tableDef.getColumns()) {
                        String colName = col.getName();
                        String camelName = NamingConverter.snakeToCamel(colName);
                        Object value = findValueInDbRow(insertedRow, colName);
                        camelCaseRow.put(camelName, value);
                        // 同時保留原始欄位名稱（支援 <order_id 格式的 executionKey）
                        if (!camelName.equals(colName)) {
                            camelCaseRow.put(colName, value);
                        }
                    }
                    List<String> dataRow = new ArrayList<>();
                    for (String header : headers) {
                        dataRow.add(row.get(header));
                    }
                    resolver.extractAndStoreVariables(dataRow, contextKeyMap, camelCaseRow);
                    LOG.log(System.Logger.Level.INFO,
                            "[EntitySetup] 已擷取 {0} 個變數。entity: {1}",
                            contextKeyMap.size(), entityName);
                }

                LOG.log(System.Logger.Level.INFO,
                        "[EntitySetup] 已插入 {0} 記錄到 {1}",
                        entityName, tableDef.getTableName());
            }
        }
    }

    /**
     * 插入一列資料。若 needsSelect 為 true，回查完整記錄供 VAR-System 使用。
     */
    private Map<String, Object> insertRow(Connection conn, Map<String, String> row,
                                           List<String> dataHeaders, TableDefinition tableDef,
                                           String dbType, boolean needsSelect) throws SQLException {
        String tableName = normalizeIdentifier(tableDef.getTableName(), dbType);

        // 建立欄位名稱到類型的映射
        Map<String, String> columnTypes = new HashMap<>();
        // 建立自動遞增欄位集合（MSSQL 不允許直接插入 IDENTITY 欄位）
        Set<String> autoIncrementColumns = new HashSet<>();
        for (var col : tableDef.getColumns()) {
            columnTypes.put(col.getName().toLowerCase(), col.getType());
            if (col.isAutoIncrement()) {
                autoIncrementColumns.add(col.getName().toLowerCase());
            }
        }

        // 收集要插入的欄位和值
        List<String> columns = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        List<String> valueColumnTypes = new ArrayList<>();

        for (String header : dataHeaders) {
            String value = row.get(header);
            if (value == null || value.isEmpty()) continue;

            // 從 TableDefinition 查找實際欄位名稱（支援 snake_case 和 camelCase 欄位定義）
            String actualColName = resolveColumnName(tableDef, header);
            String snakeCol = normalizeIdentifier(actualColName, dbType);

            // MSSQL: 跳過自動遞增欄位（IDENTITY），不允許直接插入值
            if ("mssql".equalsIgnoreCase(dbType) && autoIncrementColumns.contains(snakeCol.toLowerCase())) {
                LOG.log(System.Logger.Level.DEBUG,
                        "[EntitySetup] 跳過 IDENTITY 欄位: {0}", snakeCol);
                continue;
            }

            // 解析變數引用（$variable、@time(...)、@date(...) 等）
            Object resolved = resolver.resolveVariable(value);

            columns.add(snakeCol);

            // 根據欄位類型轉換值
            Object resolvedValue = resolved != null ? resolved : value;
            String colType = columnTypes.get(snakeCol.toLowerCase());
            values.add(TypeConverter.convertToColumnType(resolvedValue, colType));
            valueColumnTypes.add(colType);
        }

        if (columns.isEmpty()) {
            throw new IllegalArgumentException(
                    "[EntitySetup] 沒有可插入的欄位。請確認 DataTable 有非空資料欄位。");
        }

        // 動態建構 INSERT SQL（只包含有提供值的欄位）
        // JSON/JSONB 欄位需要 SQL 層級的 CAST，避免 PostgreSQL 型別推斷失敗
        StringJoiner colJoiner = new StringJoiner(", ");
        StringJoiner valJoiner = new StringJoiner(", ");
        for (int i = 0; i < columns.size(); i++) {
            colJoiner.add(columns.get(i));
            String colType = valueColumnTypes.get(i);
            if (colType != null && colType.toUpperCase().contains("JSON")) {
                valJoiner.add("CAST(? AS " + colType + ")");
            } else {
                valJoiner.add("?");
            }
        }
        String sql = "INSERT INTO " + tableName + " (" + colJoiner + ") VALUES (" + valJoiner + ")";

        LOG.log(System.Logger.Level.DEBUG,
                "[EntitySetup] SQL: {0}, values: {1}", sql, values);

        try (PreparedStatement ps = conn.prepareStatement(sql,
                needsSelect ? Statement.RETURN_GENERATED_KEYS : Statement.NO_GENERATED_KEYS)) {
            for (int i = 0; i < values.size(); i++) {
                ps.setObject(i + 1, TypeConverter.toJdbcValue(values.get(i)));
            }
            ps.executeUpdate();

            // 不需要 VAR-System 擷取時，跳過回查
            if (!needsSelect) {
                return Collections.emptyMap();
            }

            // 取得生成的主鍵
            Object generatedKey = null;
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    generatedKey = keys.getObject(1);
                }
            }

            // 回查完整記錄（含自動生成的欄位），使用 TableDefinition 快取的 SELECT SQL
            return selectInsertedRow(conn, tableDef, generatedKey, columns, values, dbType);
        }
    }

    /**
     * 透過 PK 或插入欄位條件回查已插入的完整記錄。
     * PK SELECT SQL 使用 TableDefinition 快取。
     */
    private Map<String, Object> selectInsertedRow(Connection conn, TableDefinition tableDef,
                                                   Object generatedKey,
                                                   List<String> insertedColumns,
                                                   List<Object> insertedValues,
                                                   String dbType) throws SQLException {
        String tableName = normalizeIdentifier(tableDef.getTableName(), dbType);

        // 優先使用生成的主鍵查詢（使用 TableDefinition 快取的 SELECT SQL）
        if (generatedKey != null && !tableDef.getPkColumns().isEmpty()) {
            try (PreparedStatement ps = conn.prepareStatement(tableDef.getSelectSql())) {
                ps.setObject(1, generatedKey);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return resultSetToMap(rs);
                    }
                }
            }
        }

        // 回退：使用插入的欄位值作為查詢條件（columns 已經過正規化）
        StringBuilder sql = new StringBuilder("SELECT * FROM ").append(tableName).append(" WHERE ");
        StringJoiner joiner = new StringJoiner(" AND ");
        for (String col : insertedColumns) {
            joiner.add(col + " = ?");
        }
        sql.append(joiner);

        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < insertedValues.size(); i++) {
                ps.setObject(i + 1, TypeConverter.toJdbcValue(insertedValues.get(i)));
            }
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return resultSetToMap(rs);
                }
            }
        }

        // 若仍找不到，回傳空 Map（不中斷流程，但 VAR-System 可能無法擷取值）
        LOG.log(System.Logger.Level.WARNING,
                "[EntitySetup] 無法回查已插入的記錄。table: {0}", tableName);
        return Collections.emptyMap();
    }

    /**
     * 將 ResultSet 當前列轉為 Map。
     */
    private Map<String, Object> resultSetToMap(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        int count = meta.getColumnCount();
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 1; i <= count; i++) {
            map.put(meta.getColumnLabel(i).toLowerCase(), rs.getObject(i));
        }
        return map;
    }

    /**
     * 根據資料庫類型正規化識別符（table name、column name）。
     * PostgreSQL 會自動將未加引號的識別符轉為小寫，因此需要統一使用小寫。
     */
    private static String normalizeIdentifier(String identifier, String dbType) {
        if (identifier == null) return null;
        if ("postgresql".equalsIgnoreCase(dbType)) {
            return identifier.toLowerCase();
        }
        return identifier;
    }

    /**
     * 從 TableDefinition 查找 DataTable header 對應的實際欄位名稱。
     * 支援 camelCase header 對應 snake_case 或 camelCase 欄位定義。
     */
    private String resolveColumnName(TableDefinition tableDef, String header) {
        String snake = NamingConverter.camelToSnake(header);
        for (var col : tableDef.getColumns()) {
            String name = col.getName();
            if (name.equals(header) || name.equals(snake)
                    || name.equalsIgnoreCase(header) || name.equalsIgnoreCase(snake)) {
                return name;
            }
        }
        return snake; // fallback
    }

    /**
     * 從 DB 查詢結果 Map（key 已 lowercase）中，根據欄位定義名稱查找值。
     * 支援 snake_case（order_id）和 camelCase（lastUpdated）欄位名稱。
     */
    private Object findValueInDbRow(Map<String, Object> dbRow, String colName) {
        if (dbRow.containsKey(colName)) return dbRow.get(colName);
        String lower = colName.toLowerCase();
        if (dbRow.containsKey(lower)) return dbRow.get(lower);
        String snakeLower = NamingConverter.camelToSnake(colName).toLowerCase();
        if (dbRow.containsKey(snakeLower)) return dbRow.get(snakeLower);
        return null;
    }
}
