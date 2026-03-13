package ai.specformula.core.instruction;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.helper.NamingConverter;
import ai.specformula.core.helper.TypeConverter;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.data.model.DatabaseSchema.SchemaTablePair;
import ai.specformula.core.spec.data.model.TableDefinition;
import io.cucumber.datatable.DataTable;

import java.sql.*;
import java.util.*;
import java.util.function.Function;

/**
 * Entity 資料表不存在性驗證輔助工具（純 JDBC 實作）。
 * <p>
 * 驗證 DataTable 內的每一列 row，資料庫中都不存在符合條件的記錄。
 * 支援 PK 查詢和非 PK 欄位查詢。
 * </p>
 */
public class EntityNonExistenceValidate {

    private final ISAFeatureArgumentResolver resolver;
    private final List<DatabaseSchema> schemas;
    private final Function<String, Connection> connectionProvider;

    public EntityNonExistenceValidate(ISAFeatureArgumentResolver resolver,
                                       List<DatabaseSchema> schemas,
                                       Function<String, Connection> connectionProvider) {
        this.resolver = resolver;
        this.schemas = schemas;
        this.connectionProvider = connectionProvider;
    }

    /**
     * 斷言：DataTable 內的每一列 row，資料庫中都不存在符合條件的記錄。
     * <p>
     * 優先使用 PK 查詢；若 PK 不完整，則使用非 PK 欄位查詢。
     * </p>
     *
     * @param entityName entity 名稱
     * @param dataTable  Cucumber DataTable（asMaps 形式：欄位名稱 → 字串）
     */
    public void assertNotExists(String entityName, DataTable dataTable) throws Exception {
        SchemaTablePair pair = DatabaseSchema.findSchemaAndTable(schemas, entityName);
        if (pair == null) {
            throw new IllegalArgumentException(
                    "[EntityNonExistenceValidate] 找不到 entity '" + entityName + "' 的定義。" +
                    "請確認 entity_to_table_mapping 設定。");
        }
        TableDefinition tableDef = pair.table();
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);

        try (Connection conn = connectionProvider.apply(pair.schema().getDataSourceName())) {
            Set<String> pkColumns = tableDef.getPkColumns();
            for (Map<String, String> row : rows) {
                // 嘗試收集 PK 值
                Map<String, Object> pkValues = new LinkedHashMap<>();
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
                    // 使用 selectSql（PK 查詢）
                    boolean exists = existsByPk(tableDef, pkValues, conn);
                    if (exists) {
                        throw new AssertionError(entityName + " with " + pkValues + " should not exist");
                    }
                } else {
                    // 使用 selectByValuesSql（非 PK 欄位查詢）
                    Map<String, Object> conditions = buildProbeConditions(row, tableDef);
                    if (conditions.isEmpty()) {
                        throw new AssertionError("缺少查詢條件：請提供至少一個欄位以檢查不存在性");
                    }

                    // 設定 queryColumns 為有值的條件欄位，避免 null 參數型別推斷問題
                    tableDef.setQueryColumns(new ArrayList<>(conditions.keySet()));

                    boolean exists = existsByProbe(tableDef, conditions, conn);
                    if (exists) {
                        throw new AssertionError(entityName + " with " + conditions + " should not exist");
                    }
                }
            }
        }
    }

    /**
     * 從 row 中建立非 PK 欄位的查詢條件。
     */
    private Map<String, Object> buildProbeConditions(Map<String, String> row, TableDefinition tableDef) {
        Set<String> probeFields = tableDef.getNonPkColumnNames();
        Map<String, Object> conditions = new LinkedHashMap<>();

        for (String fieldName : probeFields) {
            String expected = NamingConverter.getRowValue(row,fieldName);
            if (expected == null) continue;
            String trim = expected.trim();
            if (trim.isEmpty() || trim.startsWith("&")) continue;

            Object rv = resolver.resolveVariable(expected);
            if (rv != null) {
                Object typed = TypeConverter.convertToColumnType(rv, tableDef.findColumnType(fieldName));
                conditions.put(fieldName, typed);
            }
        }
        return conditions;
    }

    // ==================== JDBC 查詢 ====================

    /**
     * 使用 TableDefinition 的快取 SQL 檢查 PK 條件是否存在記錄。
     */
    private boolean existsByPk(TableDefinition tableDef, Map<String, Object> pkValues,
                                Connection conn) throws SQLException {
        String selectSql = tableDef.getSelectSql();
        Map<String, Integer> columnIndex = tableDef.getSelectWhereColumnIndex();

        // 使用 SELECT SQL 並檢查是否有結果
        try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
            for (Map.Entry<String, Object> entry : pkValues.entrySet()) {
                Integer idx = columnIndex.get(entry.getKey());
                if (idx != null) {
                    ps.setObject(idx, TypeConverter.toJdbcValue(entry.getValue()));
                }
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * 使用 TableDefinition 的快取 selectByValuesSql 檢查非 PK 條件是否存在記錄。
     * SQL 格式: SELECT ... FROM table WHERE (? IS NULL OR col1=?) AND (? IS NULL OR col2=?)
     * PostgreSQL 版本使用 CAST: (CAST(? AS type) IS NULL OR col=?)
     */
    private boolean existsByProbe(TableDefinition tableDef, Map<String, Object> conditions,
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
                return rs.next();
            }
        }
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
