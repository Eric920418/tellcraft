package ai.specformula.core.spec.data.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TableDefinition {

    private String tableName;
    private String comment;
    private List<ColumnDefinition> columns = new ArrayList<>();
    private Set<String> pkColumns = new LinkedHashSet<>();

    // 非 PK 查詢欄位（用於 selectByValues）
    private List<String> queryColumns = new ArrayList<>();

    // 資料庫類型（用於產生不同方言的 SQL，如 PostgreSQL 需要 CAST）
    @JsonIgnore
    private String dbType;

    // 快取的 SQL 字串
    private String selectSql;
    private String selectByValuesSql;

    // 快取的欄位 index 字典表（欄位名稱 -> PreparedStatement 的 1-based index）
    private Map<String, Integer> selectWhereColumnIndex;
    private Map<String, List<Integer>> selectByValuesIndex;

    public TableDefinition() {
    }

    public TableDefinition(String tableName) {
        this.tableName = tableName;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
        invalidateSqlCache();
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public List<ColumnDefinition> getColumns() {
        return columns;
    }

    public void setColumns(List<ColumnDefinition> columns) {
        this.columns = columns;
        invalidateSqlCache();
    }

    public Set<String> getPkColumns() {
        return pkColumns;
    }

    public void setPkColumns(Set<String> pkColumns) {
        this.pkColumns = pkColumns;
        invalidateSqlCache();
    }

    public List<String> getQueryColumns() {
        return queryColumns;
    }

    public void setQueryColumns(List<String> queryColumns) {
        this.queryColumns = queryColumns;
        invalidateSelectByValuesCache();
    }

    public String getDbType() {
        return dbType;
    }

    public void setDbType(String dbType) {
        this.dbType = dbType;
    }

    /**
     * 產生 SELECT SQL。
     * 格式: SELECT col1, col2 FROM table WHERE pk1=? AND pk2=?
     */
    public String getSelectSql() {
        ensureSelectBuilt();
        return selectSql;
    }

    /**
     * 取得 SELECT SQL WHERE 部分的欄位 index 字典表（PK 欄位）。
     * Key: PK 欄位名稱, Value: PreparedStatement 的 1-based index
     */
    public Map<String, Integer> getSelectWhereColumnIndex() {
        ensureSelectBuilt();
        return selectWhereColumnIndex;
    }

    /**
     * 產生非 PK 條件查詢的 SELECT SQL。
     * 格式: SELECT ... FROM table WHERE (? IS NULL OR col1=?) AND (? IS NULL OR col2=?)
     */
    public String getSelectByValuesSql() {
        ensureSelectByValuesBuilt();
        return selectByValuesSql;
    }

    /**
     * 取得非 PK 條件查詢的欄位 index 字典表。
     * Key: 欄位名稱, Value: PreparedStatement 的 1-based index 列表 (每個欄位有兩個 index)
     */
    public Map<String, List<Integer>> getSelectByValuesIndex() {
        ensureSelectByValuesBuilt();
        return selectByValuesIndex;
    }

    /**
     * 查找指定欄位的 SQL 類型。
     */
    public String findColumnType(String columnName) {
        for (ColumnDefinition col : columns) {
            if (col.getName().equals(columnName)) {
                return col.getType();
            }
        }
        return null;
    }

    /**
     * 取得非 PK 欄位名稱集合。
     */
    @JsonIgnore
    public Set<String> getNonPkColumnNames() {
        Set<String> result = new LinkedHashSet<>();
        for (ColumnDefinition col : columns) {
            result.add(col.getName());
        }
        result.removeAll(pkColumns);
        return result;
    }

    /**
     * 取得 PK 欄位列表。
     */
    public List<ColumnDefinition> getPkColumnDefinitions() {
        List<ColumnDefinition> result = new ArrayList<>();
        for (ColumnDefinition col : columns) {
            if (pkColumns.contains(col.getName())) {
                result.add(col);
            }
        }
        return result;
    }

    private void ensureSelectBuilt() {
        if (selectSql != null) {
            return;
        }
        selectWhereColumnIndex = new LinkedHashMap<>();

        StringBuilder colNames = new StringBuilder();
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) {
                colNames.append(", ");
            }
            colNames.append(columns.get(i).getName());
        }

        StringBuilder whereClause = new StringBuilder();
        if (!pkColumns.isEmpty()) {
            whereClause.append(" WHERE ");
            int index = 1;
            int j = 0;
            for (String pk : pkColumns) {
                if (j > 0) {
                    whereClause.append(" AND ");
                }
                whereClause.append(pk).append("=?");
                selectWhereColumnIndex.put(pk, index++);
                j++;
            }
        }

        selectSql = "SELECT " + colNames + " FROM " + tableName + whereClause;
        selectWhereColumnIndex = Collections.unmodifiableMap(selectWhereColumnIndex);
    }

    private void invalidateSqlCache() {
        selectSql = null;
        selectWhereColumnIndex = null;
        invalidateSelectByValuesCache();
    }

    private void invalidateSelectByValuesCache() {
        selectByValuesSql = null;
        selectByValuesIndex = null;
    }

    private void ensureSelectByValuesBuilt() {
        if (selectByValuesSql != null) {
            return;
        }
        selectByValuesIndex = new LinkedHashMap<>();

        // 建立欄位名稱 -> 類型的查找表
        Map<String, String> columnTypeMap = new LinkedHashMap<>();
        for (ColumnDefinition col : columns) {
            columnTypeMap.put(col.getName(), col.getType());
        }

        boolean isPostgres = "postgresql".equalsIgnoreCase(dbType) || "postgres".equalsIgnoreCase(dbType);

        StringBuilder colNames = new StringBuilder();
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) {
                colNames.append(", ");
            }
            colNames.append(columns.get(i).getName());
        }

        StringBuilder whereClause = new StringBuilder();
        if (queryColumns != null && !queryColumns.isEmpty()) {
            whereClause.append(" WHERE ");
            int index = 1;
            for (int i = 0; i < queryColumns.size(); i++) {
                if (i > 0) {
                    whereClause.append(" AND ");
                }
                String col = queryColumns.get(i);
                // PostgreSQL 無法推斷 (? IS NULL) 中 ? 的型別，需要 CAST
                if (isPostgres) {
                    String colType = columnTypeMap.getOrDefault(col, "VARCHAR");
                    whereClause.append("(CAST(? AS ").append(colType).append(") IS NULL OR ").append(col).append("=?)");
                } else {
                    whereClause.append("(? IS NULL OR ").append(col).append("=?)");
                }
                List<Integer> indices = new ArrayList<>();
                indices.add(index++);
                indices.add(index++);
                selectByValuesIndex.put(col, Collections.unmodifiableList(indices));
            }
        }

        selectByValuesSql = "SELECT " + colNames + " FROM " + tableName + whereClause;
        selectByValuesIndex = Collections.unmodifiableMap(selectByValuesIndex);
    }
}
