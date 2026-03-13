package ai.specformula.core.spec.data.model;

import ai.specformula.core.dialect.CleanupPlan;
import ai.specformula.core.dialect.DatabaseDialect;
import ai.specformula.core.dialect.DatabaseDialectFactory;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DatabaseSchema {

    /** TableDefinition 列表（保持原有行為） */
    private List<TableDefinition> tables = new ArrayList<>();

    /** 以 entity name 為 key 的 Map（延遲建立） */
    private Map<String, TableDefinition> tablesByEntityName;

    private EntityTableMapping entityTableMapping;
    private String dataSourceName;
    private String dbType;

    @JsonIgnore
    private DatabaseDialect dialect;

    /** 快取的清理計畫（延遲建立） */
    @JsonIgnore
    private CleanupPlan cleanupPlan;

    /**
     * 從 schema 列表中查找包含指定 entity 的 schema 和 table。
     *
     * @return SchemaTablePair，若找不到則返回 null
     */
    public static SchemaTablePair findSchemaAndTable(List<DatabaseSchema> schemas, String entityName) {
        for (DatabaseSchema schema : schemas) {
            TableDefinition table = schema.findByEntityName(entityName);
            if (table != null) {
                return new SchemaTablePair(schema, table);
            }
        }
        return null;
    }

    public record SchemaTablePair(DatabaseSchema schema, TableDefinition table) {}

    /**
     * 根據 entity name 查找 TableDefinition。
     *
     * @param entityName entity 名稱
     * @return 對應的 TableDefinition，若不存在則返回 null
     */
    public TableDefinition findByEntityName(String entityName) {
        ensureMapBuilt();
        return tablesByEntityName.get(entityName);
    }

    /**
     * 新增 TableDefinition（以 entity name 為 key）。
     */
    public void addTable(String entityName, TableDefinition table) {
        ensureMapBuilt();
        tablesByEntityName.put(entityName, table);
        if (!tables.contains(table)) {
            tables.add(table);
        }
    }

    /**
     * 取得 entity name -> TableDefinition 的 Map。
     * 用於測試或需要遍歷所有 entity 對應關係時使用。
     */
    public Map<String, TableDefinition> getTablesByEntityName() {
        ensureMapBuilt();
        return Collections.unmodifiableMap(tablesByEntityName);
    }

    /**
     * 取得所有 TableDefinition。
     */
    public List<TableDefinition> getTables() {
        return tables;
    }

    /**
     * 設定 TableDefinition。
     */
    public void setTables(List<TableDefinition> tables) {
        this.tables = tables;
        this.tablesByEntityName = null; // 重置 map，下次使用時重新建立
    }

    /**
     * 延遲建立 entity name -> TableDefinition 的 Map。
     */
    private void ensureMapBuilt() {
        if (tablesByEntityName != null) {
            return;
        }
        tablesByEntityName = new LinkedHashMap<>();

        // 先建立 tableName -> TableDefinition 的查找表
        Map<String, TableDefinition> tableByName = new LinkedHashMap<>();
        for (TableDefinition table : tables) {
            tableByName.put(table.getTableName(), table);
        }

        if (entityTableMapping != null) {
            Map<String, String> mapping = entityTableMapping.asMap();
            // 直接使用 entity -> tableName mapping，支援多個 entity 對應同一個 table
            for (Map.Entry<String, String> entry : mapping.entrySet()) {
                String entityName = entry.getKey();
                String tableName = entry.getValue();
                TableDefinition table = tableByName.get(tableName);
                if (table != null) {
                    tablesByEntityName.put(entityName, table);
                }
            }
        } else {
            // 沒有 mapping，使用 tableName 作為 entityName
            for (TableDefinition table : tables) {
                tablesByEntityName.put(table.getTableName(), table);
            }
        }
    }

    public EntityTableMapping getEntityTableMapping() {
        return entityTableMapping;
    }

    public void setEntityTableMapping(EntityTableMapping entityTableMapping) {
        this.entityTableMapping = entityTableMapping;
        this.tablesByEntityName = null; // 重置 map，下次使用時重新建立
    }

    public String getDataSourceName() {
        return dataSourceName;
    }

    public void setDataSourceName(String dataSourceName) {
        this.dataSourceName = dataSourceName;
    }

    public String getDbType() {
        return dbType;
    }

    public void setDbType(String dbType) {
        this.dbType = dbType;
        this.dialect = null; // 重置 dialect，下次使用時重新建立
        this.cleanupPlan = null; // 重置快取
    }

    /**
     * 取得結構化的資料表清理計畫（延遲建立）。
     * <p>
     * 拆分為：關閉 FK 約束 → 每個 table 的清理 SQL → 恢復 FK 約束，
     * 讓呼叫端可以選擇性地只清理有資料的 table。
     * </p>
     *
     * @return 結構化的清理計畫，若 tables 為空則返回 null
     */
    public CleanupPlan getCleanupPlan() {
        if (cleanupPlan != null) {
            return cleanupPlan;
        }
        if (tables.isEmpty()) {
            return null;
        }
        ensureDialectBuilt();
        cleanupPlan = dialect.buildCleanupPlan(tables);
        return cleanupPlan;
    }

    /**
     * 延遲建立 DatabaseDialect。
     */
    private void ensureDialectBuilt() {
        if (dialect == null) {
            dialect = DatabaseDialectFactory.create(dbType);
        }
    }
}
