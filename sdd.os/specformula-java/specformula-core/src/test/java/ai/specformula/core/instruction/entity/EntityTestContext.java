package ai.specformula.core.instruction.entity;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.sql.DataSource;

import org.h2.jdbcx.JdbcDataSource;
import org.testcontainers.containers.JdbcDatabaseContainer;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.EntityNonExistenceValidate;
import ai.specformula.core.instruction.EntitySetup;
import ai.specformula.core.instruction.EntityValidate;
import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.data.model.EntityTableMapping;
import ai.specformula.core.spec.data.model.TableDefinition;
import io.cucumber.datatable.DataTable;

/**
 * PicoContainer 管理的共享測試狀態。
 * 根據 -Ddb.type 或 Maven Profile 建立對應的資料庫 container。
 * 啟動時自動建立 primary 與 secondary 兩個獨立的 database（權限隔離）。
 *
 * 使用方式：
 * - mvn test -Ph2         (預設，使用 H2 in-memory)
 * - mvn test -Ppostgresql (使用 PostgreSQL container)
 * - mvn test -Pmysql      (使用 MySQL container)
 * - mvn test -Pmssql      (使用 MSSQL container)
 */
public class EntityTestContext {

    public static final String PRIMARY = "primary";
    public static final String SECONDARY = "secondary";

    private static final String PRIMARY_DB = "primary_db";
    private static final String SECONDARY_DB = "secondary_db";

    private static final String DB_TYPE_PROPERTY = "db.type";
    private static final String DEFAULT_DB_TYPE = "h2";

    /** 單一 Testcontainer（static 確保整個 Test Suite 只啟動一次） */
    private static JdbcDatabaseContainer<?> sharedContainer;
    private static String sharedContainerDbType;

    /** 多個 DataSource，以 name 為 key（static 跨 Scenario 共用） */
    private static final Map<String, DataSource> sharedDataSources = new HashMap<>();
    private static boolean sharedInitialized = false;

    /** 目前使用的 DataSource name */
    private String currentDataSourceName;

    /** 執行過程中拋出的例外 */
    private Exception thrownException;

    /** 目前的 db type */
    private final String dbType;

    /** 每個 DataSource 對應的 DatabaseSchema */
    private final Map<String, DatabaseSchema> schemas = new HashMap<>();

    /** ScenarioContext（每個 Scenario 一個） */
    private ScenarioContext scenarioContext;

    /** ISAFeatureArgumentResolver（延遲建立） */
    private ISAFeatureArgumentResolver resolver;

    /** EntitySetup 實例（延遲建立） */
    private EntitySetup entitySetup;

    /** EntityValidate 實例（延遲建立） */
    private EntityValidate entityValidate;

    /** EntityNonExistenceValidate 實例（延遲建立） */
    private EntityNonExistenceValidate entityNonExistenceValidate;

    public EntityTestContext() {
        this.dbType = System.getProperty(DB_TYPE_PROPERTY, DEFAULT_DB_TYPE).toLowerCase();
    }

    /**
     * 取得 db type。
     */
    public String getDbType() {
        return dbType;
    }

    /**
     * 確保 DataSources 已建立（lazy initialization）。
     * 使用 synchronized 確保多執行緒安全。
     */
    private synchronized void ensureInitialized() {
        // 檢查是否已經初始化過（跨所有實例共用）
        if (sharedInitialized && dbType.equals(sharedContainerDbType)) {
            return;
        }
        initDataSources();
        sharedInitialized = true;
        sharedContainerDbType = dbType;
    }

    /**
     * 初始化 primary 與 secondary DataSources。
     */
    private void initDataSources() {
        if (isH2()) {
            sharedDataSources.put(PRIMARY, createH2DataSource(PRIMARY_DB));
            sharedDataSources.put(SECONDARY, createH2DataSource(SECONDARY_DB));
        } else {
            // 啟動 container（只啟動一次）
            if (sharedContainer == null || !sharedContainer.isRunning()) {
                sharedContainer = createContainer();
                sharedContainer.start();

                // 建立兩個獨立的 database
                createDatabases();
            }

            // 建立指向不同 database 的 DataSource
            sharedDataSources.put(PRIMARY, createContainerDataSource(sharedContainer, PRIMARY_DB));
            sharedDataSources.put(SECONDARY, createContainerDataSource(sharedContainer, SECONDARY_DB));
        }
        currentDataSourceName = PRIMARY;
    }

    /**
     * 在 container 中建立兩個 database。
     */
    private void createDatabases() {
        // MySQL 需要使用 root 使用者來建立資料庫（test 使用者沒有 CREATE 權限）
        String username = sharedContainer.getUsername();
        String password = sharedContainer.getPassword();
        if ("mysql".equals(dbType)) {
            username = "root";
            // MySQLContainer 的 root 密碼與普通使用者密碼相同
        }

        try (Connection conn = java.sql.DriverManager.getConnection(
                sharedContainer.getJdbcUrl(), username, password);
             Statement stmt = conn.createStatement()) {

            switch (dbType) {
                case "postgresql" -> {
                    stmt.execute("CREATE DATABASE " + PRIMARY_DB);
                    stmt.execute("CREATE DATABASE " + SECONDARY_DB);
                }
                case "mysql" -> {
                    stmt.execute("CREATE DATABASE IF NOT EXISTS " + PRIMARY_DB);
                    stmt.execute("CREATE DATABASE IF NOT EXISTS " + SECONDARY_DB);
                    // 授權 test 使用者存取新建的資料庫
                    stmt.execute("GRANT ALL PRIVILEGES ON " + PRIMARY_DB + ".* TO 'test'@'%'");
                    stmt.execute("GRANT ALL PRIVILEGES ON " + SECONDARY_DB + ".* TO 'test'@'%'");
                    stmt.execute("FLUSH PRIVILEGES");
                }
                case "mssql" -> {
                    stmt.execute("CREATE DATABASE " + PRIMARY_DB);
                    stmt.execute("CREATE DATABASE " + SECONDARY_DB);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to create databases", e);
        }
    }

    /**
     * 取得 primary DataSource。
     */
    public DataSource getPrimaryDataSource() {
        ensureInitialized();
        return sharedDataSources.get(PRIMARY);
    }

    /**
     * 取得 secondary DataSource。
     */
    public DataSource getSecondaryDataSource() {
        ensureInitialized();
        return sharedDataSources.get(SECONDARY);
    }

    /**
     * 取得指定名稱的 DataSource。
     */
    public DataSource getDataSource(String name) {
        ensureInitialized();
        DataSource ds = sharedDataSources.get(name);
        if (ds == null) {
            throw new IllegalArgumentException("DataSource not found: " + name);
        }
        return ds;
    }

    /**
     * 取得目前使用的 DataSource。
     */
    public DataSource getCurrentDataSource() {
        ensureInitialized();
        if (currentDataSourceName == null) {
            throw new IllegalStateException("No current DataSource set.");
        }
        return getDataSource(currentDataSourceName);
    }

    /**
     * 取得 JDBC Connection（從 current DataSource）。
     */
    public Connection getConnection() throws SQLException {
        return getCurrentDataSource().getConnection();
    }

    /**
     * 取得 Testcontainer（若使用 H2 則返回 null）。
     */
    public JdbcDatabaseContainer<?> getContainer() {
        ensureInitialized();
        return sharedContainer;
    }

    /**
     * 是否使用 H2。
     */
    public boolean isH2() {
        return "h2".equals(dbType);
    }

    /**
     * 初始化（每個 Scenario 開始時呼叫）。
     */
    public void init() {
        thrownException = null;
        currentDataSourceName = PRIMARY;
        // DataSource 和 Container 不清除，跨 Scenario 共用以提升效能

        // 建立新的 ScenarioContext
        scenarioContext = new ScenarioContext();

        // 清空 schemas（每個 Scenario 重新定義）
        schemas.clear();

        // 重置 resolver 和 entitySetup 和 entityValidate 和 entityNonExistenceValidate
        resolver = null;
        entitySetup = null;
        entityValidate = null;
        entityNonExistenceValidate = null;
    }

    // ==================== Schema 管理 ====================

    /**
     * 取得或建立指定 DataSource 的 DatabaseSchema。
     */
    public DatabaseSchema getOrCreateSchema(String dataSourceName) {
        ensureInitialized();
        return schemas.computeIfAbsent(dataSourceName, name -> {
            DatabaseSchema schema = new DatabaseSchema();
            schema.setDataSourceName(name);
            schema.setDbType(dbType);
            return schema;
        });
    }

    /**
     * 取得所有 DatabaseSchema。
     */
    public List<DatabaseSchema> getAllSchemas() {
        return new ArrayList<>(schemas.values());
    }

    /**
     * 從 DataTable 建立資料表。
     * DataTable 格式：| column | type | pk | fk | notnull |
     */
    public void createTable(String dataSourceName, String tableName, DataTable dataTable) {
        ensureInitialized();
        DatabaseSchema schema = getOrCreateSchema(dataSourceName);

        // 解析 DataTable 為 TableDefinition
        TableDefinition tableDef = parseTableDefinition(tableName, dataTable);
        tableDef.setDbType(schema.getDbType());

        // 新增到 schema（使用 tableName 作為臨時 entityName）
        schema.addTable(tableName, tableDef);

        // 執行 CREATE TABLE SQL
        executeCreateTable(dataSourceName, tableDef);
    }

    /**
     * 設定 entity_to_table_mapping。
     */
    public void setEntityTableMapping(String dataSourceName, DataTable dataTable) {
        DatabaseSchema schema = getOrCreateSchema(dataSourceName);

        List<Map<String, String>> mappings = new ArrayList<>();
        for (Map<String, String> row : dataTable.asMaps(String.class, String.class)) {
            String entityName = row.get("entity");
            String tableName = row.get("table");
            if (entityName != null && tableName != null) {
                Map<String, String> mapping = new LinkedHashMap<>();
                mapping.put(entityName, tableName);
                mappings.add(mapping);
            }
        }

        EntityTableMapping mapping = new EntityTableMapping();
        mapping.setEntityToTableMapping(mappings);
        schema.setEntityTableMapping(mapping);
    }

    // ==================== EntitySetup 相關 ====================

    /**
     * 取得 ISAFeatureArgumentResolver（延遲建立）。
     */
    public ISAFeatureArgumentResolver getResolver() {
        if (resolver == null) {
            resolver = new ISAFeatureArgumentResolver(this::getScenarioContext);
        }
        return resolver;
    }

    /**
     * 取得 ScenarioContext。
     */
    public ScenarioContext getScenarioContext() {
        if (scenarioContext == null) {
            scenarioContext = new ScenarioContext();
        }
        return scenarioContext;
    }

    /**
     * 取得 EntitySetup（延遲建立）。
     */
    public EntitySetup getEntitySetup() {
        if (entitySetup == null) {
            entitySetup = new EntitySetup(
                getResolver(),
                getAllSchemas(),
                this::getConnectionForDataSource
            );
        }
        return entitySetup;
    }

    /**
     * 取得 EntityValidate（延遲建立）。
     */
    public EntityValidate getEntityValidate() {
        if (entityValidate == null) {
            entityValidate = new EntityValidate(
                getResolver(),
                getAllSchemas(),
                this::getConnectionForDataSource
            );
        }
        return entityValidate;
    }

    /**
     * 取得 EntityNonExistenceValidate（延遲建立）。
     */
    public EntityNonExistenceValidate getEntityNonExistenceValidate() {
        if (entityNonExistenceValidate == null) {
            entityNonExistenceValidate = new EntityNonExistenceValidate(
                getResolver(),
                getAllSchemas(),
                this::getConnectionForDataSource
            );
        }
        return entityNonExistenceValidate;
    }

    /**
     * 取得指定 DataSource 的 Connection。
     */
    private Connection getConnectionForDataSource(String dataSourceName) {
        try {
            return getDataSource(dataSourceName).getConnection();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to get connection for " + dataSourceName, e);
        }
    }

    // ==================== 資料驗證 ====================

    /**
     * 驗證資料表資料。
     */
    public void verifyTableData(String tableName, DataTable expectedData) {
        // 找出 tableName 對應的 DataSource
        String dataSourceName = findDataSourceForTable(tableName);

        List<Map<String, String>> expectedRows = expectedData.asMaps(String.class, String.class);
        List<String> expectedColumns = new ArrayList<>(expectedData.row(0));

        try (Connection conn = getDataSource(dataSourceName).getConnection()) {
            // 查詢資料表所有資料
            String sql = "SELECT * FROM " + quoteIdentifier(tableName);
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {

                List<Map<String, Object>> actualRows = new ArrayList<>();
                ResultSetMetaData meta = rs.getMetaData();
                int colCount = meta.getColumnCount();

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= colCount; i++) {
                        row.put(meta.getColumnLabel(i).toLowerCase(), rs.getObject(i));
                    }
                    actualRows.add(row);
                }

                // 驗證筆數
                if (expectedRows.size() != actualRows.size()) {
                    throw new AssertionError(String.format(
                        "資料表 %s 資料筆數不符。預期: %d, 實際: %d",
                        tableName, expectedRows.size(), actualRows.size()));
                }

                // 逐行驗證
                for (int i = 0; i < expectedRows.size(); i++) {
                    Map<String, String> expected = expectedRows.get(i);
                    Map<String, Object> actual = actualRows.get(i);

                    for (String col : expectedColumns) {
                        String expectedValue = expected.get(col);
                        String snakeCol = camelToSnake(col);
                        Object actualValue = actual.get(snakeCol);

                        // 使用 CAS 約束驗證
                        verifyValue(tableName, col, expectedValue, actualValue);
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to verify table data: " + tableName, e);
        }
    }

    /**
     * 驗證 context 變數。
     * 支援水平格式：header 是變數名稱，data row 是預期值或 CAS 約束。
     * 格式：
     *   | orderId | orderNumber |
     *   | 1       | ORD-001     |
     */
    public void verifyContextVariables(DataTable expectedData) {
        List<String> headers = expectedData.row(0);
        List<String> values = expectedData.row(1);

        for (int i = 0; i < headers.size(); i++) {
            String varName = headers.get(i);
            String expectedValue = i < values.size() ? values.get(i) : "";

            Object actualValue = getScenarioContext().get(varName);

            // 空值表示跳過驗證（只確認變數存在）
            if (expectedValue == null || expectedValue.isEmpty()) {
                if (actualValue == null) {
                    throw new AssertionError(String.format(
                        "Context 變數 '%s' 不存在", varName));
                }
                continue;
            }

            if (expectedValue.startsWith("&")) {
                // CAS 約束驗證
                getResolver().evaluateConstraints(expectedValue, actualValue, varName, "context");
            } else {
                // 直接比較
                String actualStr = actualValue != null ? actualValue.toString() : null;
                if (!expectedValue.equals(actualStr)) {
                    throw new AssertionError(String.format(
                        "Context 變數 '%s' 不符。預期: %s, 實際: %s",
                        varName, expectedValue, actualStr));
                }
            }
        }
    }

    // ==================== Private Helper Methods ====================

    private TableDefinition parseTableDefinition(String tableName, DataTable dataTable) {
        TableDefinition tableDef = new TableDefinition(tableName);
        List<ColumnDefinition> columns = new ArrayList<>();
        Set<String> pkColumns = new LinkedHashSet<>();

        for (Map<String, String> row : dataTable.asMaps(String.class, String.class)) {
            String colName = row.get("column");
            String colType = row.get("type");
            String pk = row.get("pk");
            String notnull = row.get("notnull");
            String defaultVal = row.get("default");
            String auto = row.get("auto");
            String fk = row.get("fk");

            ColumnDefinition col = new ColumnDefinition(colName, colType);

            if ("Y".equalsIgnoreCase(pk)) {
                col.setPrimaryKey(true);
                pkColumns.add(colName);
            }
            if ("Y".equalsIgnoreCase(notnull)) {
                col.setNotNull(true);
            }
            if (defaultVal != null && !defaultVal.isBlank()) {
                col.setDefaultValue(defaultVal);
            }
            // 支援新格式 auto 欄位，以及舊格式 type 內含 AUTO
            if ("Y".equalsIgnoreCase(auto)) {
                col.setAutoIncrement(true);
            } else if (colType != null && colType.toUpperCase().contains("AUTO")) {
                col.setAutoIncrement(true);
                col.setType(colType.replace(" AUTO", "").replace("AUTO", "").trim());
            }
            // FK 格式: table.column (如 tb_User.id)
            if (fk != null && !fk.isBlank()) {
                col.setForeignKey(fk);
            }

            columns.add(col);
        }

        tableDef.setColumns(columns);
        tableDef.setPkColumns(pkColumns);
        return tableDef;
    }

    private void executeCreateTable(String dataSourceName, TableDefinition tableDef) {
        String sql = buildCreateTableSql(tableDef);

        try (Connection conn = getDataSource(dataSourceName).getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to create table: " + tableDef.getTableName(), e);
        }
    }

    private String buildCreateTableSql(TableDefinition tableDef) {
        StringBuilder sb = new StringBuilder();
        sb.append("CREATE TABLE ").append(quoteIdentifier(tableDef.getTableName())).append(" (\n");

        List<ColumnDefinition> columns = tableDef.getColumns();
        List<String> fkConstraints = new ArrayList<>();

        for (int i = 0; i < columns.size(); i++) {
            ColumnDefinition col = columns.get(i);
            sb.append("  ").append(quoteIdentifier(col.getName())).append(" ");
            String mappedType = mapColumnType(col.getType(), col.isAutoIncrement());
            sb.append(mappedType);

            // IDENTITY/GENERATED 類型已隱含 NOT NULL，不需要再加
            boolean isIdentityType = mappedType.contains("IDENTITY") ||
                                     mappedType.contains("GENERATED") ||
                                     mappedType.contains("SERIAL");
            if ((col.isNotNull() || col.isPrimaryKey()) && !isIdentityType) {
                sb.append(" NOT NULL");
            }

            // DEFAULT 值
            if (col.getDefaultValue() != null && !col.getDefaultValue().isBlank()) {
                sb.append(" DEFAULT ").append(col.getDefaultValue());
            }

            if (i < columns.size() - 1) {
                sb.append(",");
            }
            sb.append("\n");

            // 收集 FK 約束（格式: table.column）
            if (col.getForeignKey() != null && !col.getForeignKey().isBlank()) {
                String fkRef = col.getForeignKey();
                int dotIdx = fkRef.indexOf('.');
                if (dotIdx > 0) {
                    String refTable = quoteIdentifier(fkRef.substring(0, dotIdx));
                    String refColumn = quoteIdentifier(fkRef.substring(dotIdx + 1));
                    fkConstraints.add(String.format("FOREIGN KEY (%s) REFERENCES %s(%s)",
                            quoteIdentifier(col.getName()), refTable, refColumn));
                }
            }
        }

        // 加入主鍵約束
        if (!tableDef.getPkColumns().isEmpty()) {
            sb.append(", PRIMARY KEY (");
            sb.append(tableDef.getPkColumns().stream()
                .map(this::quoteIdentifier)
                .collect(java.util.stream.Collectors.joining(", ")));
            sb.append(")\n");
        }

        // 加入外鍵約束
        for (String fk : fkConstraints) {
            sb.append(", ").append(fk).append("\n");
        }

        sb.append(")");
        return sb.toString();
    }

    private String mapColumnType(String type, boolean autoIncrement) {
        if (type == null) return "VARCHAR(255)";

        String upperType = type.toUpperCase().trim();

        // 處理自動遞增
        if (autoIncrement) {
            return switch (dbType) {
                case "postgresql" -> "BIGSERIAL";
                case "mysql" -> upperType.replace("BIGINT", "BIGINT AUTO_INCREMENT")
                                        .replace("INT", "INT AUTO_INCREMENT");
                case "mssql" -> upperType + " IDENTITY(1,1)";
                default -> upperType + " GENERATED BY DEFAULT AS IDENTITY"; // H2
            };
        }

        // 型別對應
        return switch (dbType) {
            case "mssql" -> mapMssqlType(upperType);
            case "postgresql" -> mapPostgresType(upperType);
            default -> mapDefaultType(upperType);
        };
    }

    private String mapMssqlType(String type) {
        return switch (type) {
            case "VARCHAR" -> "NVARCHAR(255)";
            case "TEXT" -> "NVARCHAR(MAX)";
            case "BOOLEAN" -> "BIT";
            case "DOUBLE" -> "FLOAT";
            case "TIMESTAMP" -> "DATETIME2";
            default -> type;
        };
    }

    private String mapPostgresType(String type) {
        return switch (type) {
            case "VARCHAR" -> "VARCHAR(255)";
            case "DOUBLE" -> "DOUBLE PRECISION";
            default -> type;
        };
    }

    private String mapDefaultType(String type) {
        return switch (type) {
            case "VARCHAR" -> "VARCHAR(255)";
            default -> type;
        };
    }

    private String findDataSourceForTable(String tableName) {
        for (Map.Entry<String, DatabaseSchema> entry : schemas.entrySet()) {
            for (TableDefinition table : entry.getValue().getTables()) {
                if (table.getTableName().equals(tableName)) {
                    return entry.getKey();
                }
            }
        }
        return PRIMARY; // 預設使用 primary
    }

    private void verifyValue(String tableName, String column, String expectedValue, Object actualValue) {
        if (expectedValue == null || expectedValue.isEmpty()) {
            return;
        }

        // CAS 約束驗證
        if (expectedValue.startsWith("&")) {
            getResolver().evaluateConstraints(expectedValue, actualValue, column, tableName);
            return;
        }

        // 直接比較（處理不同型別）
        String actualStr = formatActualValue(actualValue);
        if (!expectedValue.equals(actualStr)) {
            throw new AssertionError(String.format(
                "資料表 %s 欄位 %s 不符。預期: %s, 實際: %s",
                tableName, column, expectedValue, actualStr));
        }
    }

    private String formatActualValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Timestamp ts) {
            // 確保輸出格式包含秒數 (ISO-8601)
            return ts.toLocalDateTime().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        if (value instanceof java.time.LocalDateTime ldt) {
            return ldt.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate().toString();
        }
        if (value instanceof java.sql.Time t) {
            // 確保輸出格式包含秒數 (HH:mm:ss)
            return t.toLocalTime().format(java.time.format.DateTimeFormatter.ISO_LOCAL_TIME);
        }
        if (value instanceof java.time.LocalTime lt) {
            return lt.format(java.time.format.DateTimeFormatter.ISO_LOCAL_TIME);
        }
        if (value instanceof Boolean b) {
            // MSSQL BIT type returns Boolean, but tests expect 1/0
            if ("mssql".equals(dbType)) {
                return b ? "1" : "0";
            }
            return b.toString();
        }
        return value.toString();
    }

    /**
     * 根據資料庫類型處理標識符（表名、欄位名）。
     * PostgreSQL 轉小寫，其他資料庫保持原樣。
     */
    private String quoteIdentifier(String identifier) {
        return switch (dbType) {
            case "postgresql" -> identifier.toLowerCase();
            default -> identifier;
        };
    }

    private static String camelToSnake(String camelCase) {
        if (camelCase == null) return null;
        return camelCase.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * 清除指定 DataSource 中的所有資料表。
     */
    public void cleanAllTables(String dataSourceName) {
        ensureInitialized();
        DataSource ds = getDataSource(dataSourceName);
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            cleanAllTables(conn, stmt);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to clean tables in " + dataSourceName, e);
        }
    }

    /**
     * 清除目前 DataSource 中的所有資料表。
     */
    public void cleanAllTables() {
        cleanAllTables(currentDataSourceName);
    }

    /**
     * 清除所有 DataSource 中的所有資料表。
     */
    public void cleanAllTablesInAllDataSources() {
        ensureInitialized();
        for (String name : sharedDataSources.keySet()) {
            cleanAllTables(name);
        }
    }

    private void cleanAllTables(Connection conn, Statement stmt) throws SQLException {
        List<String> tableNames = getTableNames(conn);
        if (tableNames.isEmpty()) {
            return;
        }

        switch (dbType) {
            case "h2", "postgresql" -> {
                // 暫時停用 FK 約束，刪除所有表，再啟用
                for (String table : tableNames) {
                    stmt.execute("DROP TABLE IF EXISTS \"" + table + "\" CASCADE");
                }
            }
            case "mysql" -> {
                stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
                for (String table : tableNames) {
                    stmt.execute("DROP TABLE IF EXISTS `" + table + "`");
                }
                stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
            }
            case "mssql" -> {
                // MSSQL: 先刪除所有 FK 約束，再刪除表
                for (String table : tableNames) {
                    // 查詢並刪除該表的所有 FK 約束
                    String dropFkSql = """
                        DECLARE @sql NVARCHAR(MAX) = '';
                        SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];'
                        FROM sys.foreign_keys
                        WHERE OBJECT_NAME(parent_object_id) = '%s';
                        EXEC sp_executesql @sql;
                        """.formatted(table);
                    try {
                        stmt.execute(dropFkSql);
                    } catch (SQLException ignored) {
                        // 忽略 FK 不存在的錯誤
                    }
                }
                // 再刪除所有表
                for (String table : tableNames) {
                    stmt.execute("DROP TABLE IF EXISTS [" + table + "]");
                }
            }
        }
    }

    private List<String> getTableNames(Connection conn) throws SQLException {
        List<String> tables = new ArrayList<>();
        try (ResultSet rs = conn.getMetaData().getTables(
                conn.getCatalog(),
                conn.getSchema(),
                "%",
                new String[]{"TABLE"})) {
            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }
        }
        return tables;
    }

    /**
     * 清理資源（測試結束時呼叫）。
     * 注意：由於使用 static 共享容器，此方法通常不需要呼叫。
     * 容器會在 JVM 結束時由 Testcontainers 自動清理。
     */
    public static synchronized void cleanup() {
        sharedDataSources.clear();
        if (sharedContainer != null && sharedContainer.isRunning()) {
            sharedContainer.stop();
        }
        sharedContainer = null;
        sharedInitialized = false;
        sharedContainerDbType = null;
    }

    // ==================== Private Methods ====================

    private DataSource createH2DataSource(String dbName) {
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
        ds.setUser("sa");
        ds.setPassword("");
        return ds;
    }

    @SuppressWarnings({"resource"})
    private JdbcDatabaseContainer<?> createContainer() {
        try {
            return switch (dbType) {
                case "postgresql" -> {
                    Class<?> clazz = Class.forName("org.testcontainers.containers.PostgreSQLContainer");
                    yield (JdbcDatabaseContainer<?>) clazz.getConstructor(String.class)
                            .newInstance("postgres:15-alpine");
                }
                case "mysql" -> {
                    Class<?> clazz = Class.forName("org.testcontainers.containers.MySQLContainer");
                    yield (JdbcDatabaseContainer<?>) clazz.getConstructor(String.class)
                            .newInstance("mysql:8.0");
                }
                case "mssql" -> {
                    Class<?> clazz = Class.forName("org.testcontainers.containers.MSSQLServerContainer");
                    JdbcDatabaseContainer<?> container = (JdbcDatabaseContainer<?>) clazz.getConstructor(String.class)
                            .newInstance("mcr.microsoft.com/mssql/server:2022-latest");
                    clazz.getMethod("acceptLicense").invoke(container);
                    yield container;
                }
                default -> throw new IllegalArgumentException("Unsupported db.type: " + dbType);
            };
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(
                    "Failed to create container for db.type=" + dbType
                    + ". Ensure the corresponding Testcontainers module is on the classpath (run with -P " + dbType + ")", e);
        }
    }

    private DataSource createContainerDataSource(JdbcDatabaseContainer<?> c, String dbName) {
        String baseUrl = c.getJdbcUrl();
        String dbUrl = replaceDatabase(baseUrl, dbName);
        return new SimpleDataSource(dbUrl, c.getUsername(), c.getPassword());
    }

    /**
     * 替換 JDBC URL 中的 database 名稱。
     */
    private String replaceDatabase(String jdbcUrl, String dbName) {
        return switch (dbType) {
            case "postgresql" -> {
                // jdbc:postgresql://host:port/test -> jdbc:postgresql://host:port/primary_db
                int lastSlash = jdbcUrl.lastIndexOf('/');
                yield jdbcUrl.substring(0, lastSlash + 1) + dbName;
            }
            case "mysql" -> {
                // jdbc:mysql://host:port/test -> jdbc:mysql://host:port/primary_db
                int lastSlash = jdbcUrl.lastIndexOf('/');
                int queryStart = jdbcUrl.indexOf('?', lastSlash);
                if (queryStart > 0) {
                    yield jdbcUrl.substring(0, lastSlash + 1) + dbName + jdbcUrl.substring(queryStart);
                } else {
                    yield jdbcUrl.substring(0, lastSlash + 1) + dbName;
                }
            }
            case "mssql" -> {
                // jdbc:sqlserver://host:port;databaseName=master -> jdbc:sqlserver://host:port;databaseName=primary_db
                if (jdbcUrl.contains("databaseName=")) {
                    yield jdbcUrl.replaceFirst("databaseName=[^;]*", "databaseName=" + dbName);
                } else {
                    yield jdbcUrl + ";databaseName=" + dbName;
                }
            }
            default -> jdbcUrl;
        };
    }

    // ==================== Getters / Setters ====================

    public String getCurrentDataSourceName() {
        return currentDataSourceName;
    }

    public void setCurrentDataSourceName(String name) {
        ensureInitialized();
        if (!sharedDataSources.containsKey(name)) {
            throw new IllegalArgumentException("DataSource not found: " + name);
        }
        this.currentDataSourceName = name;
    }

    public Exception getThrownException() {
        return thrownException;
    }

    public void setThrownException(Exception thrownException) {
        this.thrownException = thrownException;
    }

    // ==================== Simple DataSource Implementation ====================

    private static class SimpleDataSource implements DataSource {
        private final String url;
        private final String username;
        private final String password;

        SimpleDataSource(String url, String username, String password) {
            this.url = url;
            this.username = username;
            this.password = password;
        }

        @Override
        public Connection getConnection() throws SQLException {
            return java.sql.DriverManager.getConnection(url, username, password);
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            return java.sql.DriverManager.getConnection(url, username, password);
        }

        @Override
        public java.io.PrintWriter getLogWriter() { return null; }

        @Override
        public void setLogWriter(java.io.PrintWriter out) { }

        @Override
        public void setLoginTimeout(int seconds) { }

        @Override
        public int getLoginTimeout() { return 0; }

        @Override
        public java.util.logging.Logger getParentLogger() { return null; }

        @Override
        public <T> T unwrap(Class<T> iface) { return null; }

        @Override
        public boolean isWrapperFor(Class<?> iface) { return false; }
    }
}
