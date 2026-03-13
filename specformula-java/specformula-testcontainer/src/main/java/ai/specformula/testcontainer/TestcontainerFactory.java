package ai.specformula.testcontainer;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.testcontainers.containers.JdbcDatabaseContainer;

import ai.specformula.spring.TrackingDataSource;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;

/**
 * 根據 db_type 建立對應的 Testcontainer 或 DataSource。
 * <p>
 * 支援 postgresql、mssql、mysql、mariadb、h2。
 * 各 DB 模組為 optional dependency，透過反射檢查 classpath 可用性。
 * </p>
 */
public class TestcontainerFactory {

    private static final System.Logger LOG = System.getLogger(TestcontainerFactory.class.getName());

    /**
     * 包含 DataSource 與憑證資訊的記錄。
     */
    public record DataSourceInfo(DataSource dataSource, String username, String password) {}

    /**
     * 建立並啟動 Testcontainer。
     *
     * @param dbType 資料庫類型（postgresql, mssql, mysql, mariadb）
     * @return 已啟動的容器
     * @throws IllegalArgumentException 若 dbType 不支援或對應模組不在 classpath
     */
    public static JdbcDatabaseContainer<?> createAndStartContainer(String dbType) {
        return createAndStartContainer(dbType, false);
    }

    /**
     * 建立並啟動 Testcontainer，可選擇是否啟用容器重複使用。
     *
     * @param dbType 資料庫類型（postgresql, mssql, mysql, mariadb）
     * @param reuse  若為 true，容器在測試結束後不會被關閉，下次可直接連接
     * @return 已啟動的容器
     * @throws IllegalArgumentException 若 dbType 不支援或對應模組不在 classpath
     */
    public static JdbcDatabaseContainer<?> createAndStartContainer(String dbType, boolean reuse) {
        if (reuse) {
            ensureReuseEnabled();
        }
        JdbcDatabaseContainer<?> container = createContainer(dbType, reuse);
        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 啟動 {0} 容器 (reuse={1})...", dbType, reuse);
        container.start();
        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] {0} 容器已啟動。JDBC URL: {1}",
                dbType, container.getJdbcUrl());
        return container;
    }

    /**
     * 建立 H2 in-memory DataSource（不需要容器）。
     *
     * @param name DataSource 名稱（用於產生唯一的資料庫名稱）
     * @return H2 in-memory DataSource
     */
    public static DataSource createH2DataSource(String name) {
        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException(
                    "H2 database driver not found. Please add com.h2database:h2 dependency.", e);
        }

        var config = new HikariConfig();
        config.setPoolName("HikariPool-h2-" + name);
        config.setJdbcUrl("jdbc:h2:mem:" + name + ";DB_CLOSE_DELAY=-1");
        config.setDriverClassName("org.h2.Driver");
        config.setUsername("sa");
        config.setPassword("");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(5);

        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 建立 H2 in-memory DataSource (HikariCP): {0}", name);
        return TrackingDataSource.wrap(new HikariDataSource(config));
    }

    /**
     * 在容器中建立指定名稱的資料庫。若資料庫已存在則跳過。
     */
    public static void createDatabase(JdbcDatabaseContainer<?> container, String databaseName) {
        String jdbcUrl = container.getJdbcUrl();
        String quoted = quoteIdentifier(jdbcUrl, databaseName);

        // MySQL 需要 root 權限來建立資料庫
        String adminUser = container.getUsername();
        String adminPass = container.getPassword();
        if (jdbcUrl.startsWith("jdbc:mysql")) {
            adminUser = "root";
            adminPass = "test"; // MySQLContainer 預設 root 密碼
        }

        try (var conn = DriverManager.getConnection(jdbcUrl, adminUser, adminPass);
             var stmt = conn.createStatement()) {

            if (databaseExists(stmt, jdbcUrl, databaseName)) {
                LOG.log(System.Logger.Level.INFO,
                        "[Testcontainer] 資料庫已存在，跳過建立: {0}", databaseName);
                return;
            }

            stmt.execute("CREATE DATABASE " + quoted);

            // MySQL: 授權 container 預設用戶存取新資料庫（shared 模式需要）
            if (jdbcUrl.startsWith("jdbc:mysql")) {
                String defaultUser = container.getUsername();
                stmt.execute(String.format("GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'%%'",
                        databaseName, defaultUser));
                stmt.execute("FLUSH PRIVILEGES");
            }

            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] 已建立資料庫: {0}", databaseName);
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "[Testcontainer] 建立資料庫失敗: " + databaseName, e);
        }
    }

    /**
     * 檢查資料庫是否已存在。
     */
    private static boolean databaseExists(
            java.sql.Statement stmt, String jdbcUrl, String databaseName) throws SQLException {
        String sql;
        if (jdbcUrl.startsWith("jdbc:postgresql")) {
            sql = String.format("SELECT 1 FROM pg_database WHERE datname = '%s'", databaseName);
        } else if (jdbcUrl.startsWith("jdbc:mysql") || jdbcUrl.startsWith("jdbc:mariadb")) {
            sql = String.format("SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '%s'", databaseName);
        } else if (jdbcUrl.startsWith("jdbc:sqlserver")) {
            sql = String.format("SELECT 1 FROM sys.databases WHERE name = '%s'", databaseName);
        } else {
            return false;
        }
        try (ResultSet rs = stmt.executeQuery(sql)) {
            return rs.next();
        }
    }

    /**
     * 根據 JDBC URL 判斷引號風格。
     */
    private static String quoteIdentifier(String jdbcUrl, String identifier) {
        if (jdbcUrl.startsWith("jdbc:sqlserver")) {
            return "[" + identifier + "]";
        } else if (jdbcUrl.startsWith("jdbc:mysql") || jdbcUrl.startsWith("jdbc:mariadb")) {
            return "`" + identifier + "`";
        } else {
            // PostgreSQL 等標準 SQL
            return "\"" + identifier + "\"";
        }
    }

    /**
     * 從已啟動的容器建立 DataSource，指向特定資料庫（使用 admin 帳號）。
     */
    public static DataSource createDataSource(JdbcDatabaseContainer<?> container, String databaseName) {
        return createDataSourceWithInfo(container, databaseName).dataSource();
    }

    /**
     * 從已啟動的容器建立 DataSource 並回傳憑證資訊（使用 admin 帳號）。
     */
    public static DataSourceInfo createDataSourceWithInfo(JdbcDatabaseContainer<?> container, String databaseName) {
        String username = container.getUsername();
        String password = container.getPassword();
        DataSource ds = createDataSourceWithCredentials(container, databaseName, username, password);
        return new DataSourceInfo(ds, username, password);
    }

    /**
     * 建立隔離的 DataSource：建立專屬使用者，只能存取指定的資料庫。
     *
     * @param container    已啟動的容器
     * @param databaseName 資料庫名稱
     * @return 使用專屬使用者的 DataSource
     */
    public static DataSource createIsolatedDataSource(JdbcDatabaseContainer<?> container, String databaseName) {
        return createIsolatedDataSourceWithInfo(container, databaseName, false).dataSource();
    }

    /**
     * 建立隔離的 DataSource 並回傳憑證資訊。
     *
     * @param container    已啟動的容器
     * @param databaseName 資料庫名稱
     * @param reuse        若為 true，使用固定密碼且跳過已存在的使用者
     * @return DataSourceInfo 包含 DataSource、username、password
     */
    public static DataSourceInfo createIsolatedDataSourceWithInfo(
            JdbcDatabaseContainer<?> container, String databaseName, boolean reuse) {
        String username = "user_" + databaseName;
        // MSSQL 密碼政策要求：至少 8 字元，含大小寫 + 數字 + 符號中的三類
        String password = reuse
                ? "Pass_" + databaseName + "!0"
                : "Pass_" + databaseName + "_" + System.currentTimeMillis() + "!0";

        createUserWithPermission(container, databaseName, username, password, reuse);

        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 已建立隔離 DataSource: {0} (user={1}, reuse={2})",
                databaseName, username, reuse);

        DataSource ds = createDataSourceWithCredentials(container, databaseName, username, password);
        return new DataSourceInfo(ds, username, password);
    }

    /**
     * 建立專屬使用者並授權存取指定資料庫。若 reuse 為 true 且使用者已存在，則跳過。
     */
    private static void createUserWithPermission(
            JdbcDatabaseContainer<?> container, String databaseName,
            String username, String password, boolean reuse) {
        String jdbcUrl = container.getJdbcUrl();

        // MySQL 需要 root 權限來建立使用者
        String adminUser = container.getUsername();
        String adminPass = container.getPassword();
        if (jdbcUrl.startsWith("jdbc:mysql")) {
            adminUser = "root";
            adminPass = "test";
        }

        try (var conn = DriverManager.getConnection(jdbcUrl, adminUser, adminPass);
             var stmt = conn.createStatement()) {

            if (reuse && userExists(stmt, jdbcUrl, username)) {
                LOG.log(System.Logger.Level.INFO,
                        "[Testcontainer] 使用者已存在，跳過建立: {0}", username);
                return;
            }

            if (jdbcUrl.startsWith("jdbc:postgresql")) {
                // PostgreSQL
                stmt.execute(String.format("CREATE USER \"%s\" WITH PASSWORD '%s'", username, password));
                // 撤銷 PUBLIC 對此資料庫的 CONNECT 權限，實現真正的隔離
                stmt.execute(String.format("REVOKE CONNECT ON DATABASE \"%s\" FROM PUBLIC", databaseName));
                stmt.execute(String.format("GRANT CONNECT ON DATABASE \"%s\" TO \"%s\"",
                        databaseName, username));
                stmt.execute(String.format("GRANT ALL PRIVILEGES ON DATABASE \"%s\" TO \"%s\"",
                        databaseName, username));
                // 連到目標資料庫授權 schema
                try (var dbConn = DriverManager.getConnection(
                        buildJdbcUrl(container, databaseName),
                        container.getUsername(), container.getPassword());
                     var dbStmt = dbConn.createStatement()) {
                    dbStmt.execute(String.format("GRANT ALL ON SCHEMA public TO \"%s\"", username));
                    dbStmt.execute(String.format(
                            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"%s\"", username));
                }
            } else if (jdbcUrl.startsWith("jdbc:mysql") || jdbcUrl.startsWith("jdbc:mariadb")) {
                // MySQL / MariaDB
                stmt.execute(String.format("CREATE USER '%s'@'%%' IDENTIFIED BY '%s'", username, password));
                stmt.execute(String.format("GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'%%'",
                        databaseName, username));
                stmt.execute("FLUSH PRIVILEGES");
            } else if (jdbcUrl.startsWith("jdbc:sqlserver")) {
                // MSSQL: 建立 Login，然後在目標資料庫建立 User
                stmt.execute(String.format("CREATE LOGIN [%s] WITH PASSWORD = '%s'", username, password));
                try (var dbConn = DriverManager.getConnection(
                        buildJdbcUrl(container, databaseName),
                        container.getUsername(), container.getPassword());
                     var dbStmt = dbConn.createStatement()) {
                    dbStmt.execute(String.format("CREATE USER [%s] FOR LOGIN [%s]", username, username));
                    dbStmt.execute(String.format("ALTER ROLE db_owner ADD MEMBER [%s]", username));
                }
            } else {
                throw new IllegalArgumentException("Unsupported database type for permission isolation: " + jdbcUrl);
            }

            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] 已建立使用者 {0}，授權存取資料庫 {1}", username, databaseName);

        } catch (SQLException e) {
            throw new IllegalStateException(
                    "[Testcontainer] 建立使用者失敗: " + username, e);
        }
    }

    /**
     * 檢查使用者是否已存在。
     */
    private static boolean userExists(
            java.sql.Statement stmt, String jdbcUrl, String username) throws SQLException {
        String sql;
        if (jdbcUrl.startsWith("jdbc:postgresql")) {
            sql = String.format("SELECT 1 FROM pg_roles WHERE rolname = '%s'", username);
        } else if (jdbcUrl.startsWith("jdbc:mysql") || jdbcUrl.startsWith("jdbc:mariadb")) {
            sql = String.format("SELECT 1 FROM mysql.user WHERE User = '%s'", username);
        } else if (jdbcUrl.startsWith("jdbc:sqlserver")) {
            sql = String.format("SELECT 1 FROM sys.server_principals WHERE name = '%s'", username);
        } else {
            return false;
        }
        try (ResultSet rs = stmt.executeQuery(sql)) {
            return rs.next();
        }
    }

    /**
     * 使用指定的帳號密碼建立 DataSource（HikariCP 連線池）。
     */
    private static DataSource createDataSourceWithCredentials(
            JdbcDatabaseContainer<?> container, String databaseName, String username, String password) {
        String url = buildJdbcUrl(container, databaseName);

        var config = new HikariConfig();
        config.setPoolName("HikariPool-" + databaseName);
        config.setJdbcUrl(url);
        config.setDriverClassName(container.getDriverClassName());
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(10000);
        return TrackingDataSource.wrap(new HikariDataSource(config));
    }

    /**
     * 建立連接特定資料庫的 JDBC URL。
     */
    public static String buildJdbcUrl(JdbcDatabaseContainer<?> container, String databaseName) {
        String baseUrl = container.getJdbcUrl();

        if (baseUrl.startsWith("jdbc:sqlserver")) {
            // MSSQL: jdbc:sqlserver://host:port; → 加上 databaseName 參數
            String sep = baseUrl.endsWith(";") ? "" : ";";
            return baseUrl + sep + "databaseName=" + databaseName;
        } else {
            // PostgreSQL, MySQL, MariaDB: 替換 URL path 中的資料庫名稱
            int lastSlash = baseUrl.lastIndexOf('/');
            int queryStart = baseUrl.indexOf('?', lastSlash);
            if (queryStart >= 0) {
                return baseUrl.substring(0, lastSlash + 1) + databaseName + baseUrl.substring(queryStart);
            } else {
                return baseUrl.substring(0, lastSlash + 1) + databaseName;
            }
        }
    }

    /**
     * 判斷 db_type 是否為 H2（不需要容器）。
     */
    public static boolean isH2(String dbType) {
        return "h2".equalsIgnoreCase(dbType);
    }

    /**
     * 判斷 db_type 是否需要 Testcontainer。
     */
    public static boolean needsContainer(String dbType) {
        return dbType != null && !isH2(dbType);
    }

    // ==================== 內部方法 ====================

    @SuppressWarnings("resource")
    private static JdbcDatabaseContainer<?> createContainer(String dbType, boolean reuse) {
        return switch (dbType.toLowerCase()) {
            case "postgresql", "postgres" -> createByReflection(
                    "org.testcontainers.containers.PostgreSQLContainer",
                    "postgres:16-alpine",
                    "org.testcontainers:postgresql", reuse);
            case "mssql", "sqlserver" -> createByReflection(
                    "org.testcontainers.containers.MSSQLServerContainer",
                    "mcr.microsoft.com/mssql/server:2022-latest",
                    "org.testcontainers:mssqlserver", reuse);
            case "mysql" -> createByReflection(
                    "org.testcontainers.containers.MySQLContainer",
                    "mysql:8.0",
                    "org.testcontainers:mysql", reuse);
            case "mariadb" -> createByReflection(
                    "org.testcontainers.containers.MariaDBContainer",
                    "mariadb:11",
                    "org.testcontainers:mariadb", reuse);
            default -> throw new IllegalArgumentException(
                    "[Testcontainer] 不支援的 db_type: " + dbType +
                    "。支援的類型: postgresql, mssql, mysql, mariadb, h2");
        };
    }

    /**
     * 透過反射建立容器，避免直接引用 optional 依賴的類別。
     * <p>
     * 當 optional 依賴不在 classpath 時，直接引用會導致 JVM 在方法驗證階段
     * 拋出 {@link NoClassDefFoundError}，即使該分支不會被執行。
     * </p>
     *
     * @param reuse 若為 true，呼叫 withReuse(true) 使容器跨 test run 存活
     */
    private static JdbcDatabaseContainer<?> createByReflection(
            String className, String dockerImage, String moduleName, boolean reuse) {
        try {
            Class<?> clazz = Class.forName(className);
            var constructor = clazz.getConstructor(String.class);
            JdbcDatabaseContainer<?> container =
                    (JdbcDatabaseContainer<?>) constructor.newInstance(dockerImage);

            // MSSQLServerContainer 需要 acceptLicense()
            if (className.contains("MSSQLServerContainer")) {
                clazz.getMethod("acceptLicense").invoke(container);
            }

            if (reuse) {
                container.withReuse(true);
            }

            return container;
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException(
                    className.substring(className.lastIndexOf('.') + 1) +
                    " not found. Please add " + moduleName + " dependency.", e);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(
                    "Failed to create container: " + className, e);
        }
    }

    /**
     * 確保 ~/.testcontainers.properties 包含 testcontainers.reuse.enable=true。
     * <p>
     * Testcontainers 的 reuse 機制需要兩個條件同時成立：
     * <ol>
     *   <li>{@code container.withReuse(true)} — 程式碼端啟用</li>
     *   <li>{@code ~/.testcontainers.properties} 包含 {@code testcontainers.reuse.enable=true} — 環境端啟用</li>
     * </ol>
     * 若缺少第二項，Testcontainers 會忽略 reuse 設定並照常清理容器。
     * 此方法在 reuse 模式下自動建立或補充該設定檔，避免使用者需要手動配置。
     * </p>
     */
    private static void ensureReuseEnabled() {
        Path propsFile = Path.of(System.getProperty("user.home"), ".testcontainers.properties");
        Properties props = new Properties();

        if (Files.exists(propsFile)) {
            try (var reader = Files.newBufferedReader(propsFile)) {
                props.load(reader);
            } catch (IOException e) {
                LOG.log(System.Logger.Level.WARNING,
                        "[Testcontainer] 無法讀取 {0}，將嘗試建立新檔案。", propsFile);
            }
        }

        if ("true".equals(props.getProperty("testcontainers.reuse.enable"))) {
            return;
        }

        props.setProperty("testcontainers.reuse.enable", "true");
        try (var writer = Files.newBufferedWriter(propsFile)) {
            props.store(writer, "Auto-configured by SpecFormula testcontainer reuse");
            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] 已寫入 testcontainers.reuse.enable=true 至 {0}", propsFile);
        } catch (IOException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "[Testcontainer] 無法寫入 {0}，reuse 可能無法生效。請手動建立此檔案並加入 testcontainers.reuse.enable=true",
                    propsFile);
        }
    }
}
