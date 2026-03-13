package ai.specformula.testcontainer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.cucumber.java.After;
import io.cucumber.java.zh_tw.假設;
import io.cucumber.java.zh_tw.並且;
import io.cucumber.java.zh_tw.當;
import io.cucumber.java.zh_tw.那麼;
import org.testcontainers.containers.JdbcDatabaseContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class PermissionIsolationSteps {

    private String isaYamlContent;
    private JdbcDatabaseContainer<?> container;
    private Map<String, DataSource> dataSources = new HashMap<>();
    private Map<String, String> userPasswords = new HashMap<>();
    private String currentDbType;
    private Exception lastException;
    private boolean querySuccess;

    @After
    public void cleanup() {
        if (container != null && container.isRunning()) {
            container.stop();
        }
        dataSources.clear();
        userPasswords.clear();
        lastException = null;
        querySuccess = false;
    }

    @假設("存在一個 isa.yml 檔:")
    public void 存在一個_isa_yml_檔(String yamlContent) {
        this.isaYamlContent = yamlContent;
    }

    @並且("啟動 Testcontainer 並建立所有 DataSource")
    public void 啟動_testcontainer_並建立所有_datasource() throws Exception {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        @SuppressWarnings("unchecked")
        Map<String, Object> spec = mapper.readValue(isaYamlContent, Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> config = (Map<String, Object>) spec.get("config");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) config.get("data");

        String permission = (String) data.getOrDefault("permission", "isolated");
        boolean isIsolated = "isolated".equals(permission);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sources = (List<Map<String, Object>>) data.get("source");

        // 取得第一個 source 的 db_type
        currentDbType = (String) sources.get(0).get("db_type");

        // 啟動對應的容器
        container = TestcontainerFactory.createAndStartContainer(currentDbType);

        // 為每個 source 建立資料庫和 DataSource
        for (Map<String, Object> source : sources) {
            String name = (String) source.get("name");

            TestcontainerFactory.createDatabase(container, name);

            TestcontainerFactory.DataSourceInfo info;
            if (isIsolated) {
                info = TestcontainerFactory.createIsolatedDataSourceWithInfo(container, name, false);
            } else {
                info = TestcontainerFactory.createDataSourceWithInfo(container, name);
            }
            dataSources.put(name, info.dataSource());
            userPasswords.put(name, info.password());
        }
    }

    @並且("啟動 H2 DataSource")
    public void 啟動_h2_datasource() throws Exception {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        @SuppressWarnings("unchecked")
        Map<String, Object> spec = mapper.readValue(isaYamlContent, Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> config = (Map<String, Object>) spec.get("config");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) config.get("data");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sources = (List<Map<String, Object>>) data.get("source");

        currentDbType = "h2";

        // H2 每個 DataSource 是獨立的 in-memory 資料庫
        for (Map<String, Object> source : sources) {
            String name = (String) source.get("name");
            DataSource ds = TestcontainerFactory.createH2DataSource(name);
            dataSources.put(name, ds);
        }
    }

    @並且("在 {string} 執行 SQL:")
    public void 在_db_執行_sql(String dbName, String sql) throws SQLException {
        DataSource ds = dataSources.get(dbName);
        assertNotNull(ds, "DataSource not found: " + dbName);

        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String s : sql.split(";")) {
                String trimmed = s.trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }
        }
    }

    @當("使用 {string} 的連線查詢 {string}")
    public void 使用_db_的連線查詢(String dbName, String sql) {
        DataSource ds = dataSources.get(dbName);
        assertNotNull(ds, "DataSource not found: " + dbName);

        lastException = null;
        querySuccess = false;

        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeQuery(sql);
            querySuccess = true;
        } catch (SQLException e) {
            lastException = e;
        }
    }

    @當("使用 {string} 的憑證連線到 {string}")
    public void 使用_db_的憑證連線到(String fromDb, String targetDb) {
        DataSource ds = dataSources.get(fromDb);
        assertNotNull(ds, "DataSource not found: " + fromDb);

        lastException = null;
        querySuccess = false;

        try (Connection conn = ds.getConnection()) {
            String username = conn.getMetaData().getUserName();
            String password = userPasswords.get(fromDb);

            // 嘗試用 fromDb 的憑證連到 targetDb
            String targetUrl = TestcontainerFactory.buildJdbcUrl(container, targetDb);

            try (Connection targetConn = java.sql.DriverManager.getConnection(targetUrl, username, password);
                 Statement stmt = targetConn.createStatement()) {
                stmt.executeQuery("SELECT 1");
                querySuccess = true;
            }
        } catch (SQLException e) {
            lastException = e;
        }
    }

    @那麼("應該成功存取")
    public void 應該成功存取() {
        if (lastException != null) {
            fail("Expected success but got exception: " + lastException.getMessage());
        }
        assertTrue(querySuccess, "Query should succeed");
    }

    @那麼("應該拋出權限不足的錯誤")
    public void 應該拋出權限不足的錯誤() {
        assertNotNull(lastException, "Expected permission error but query succeeded");
        String message = lastException.getMessage().toLowerCase();
        assertTrue(
                message.contains("permission") ||
                message.contains("denied") ||
                message.contains("authentication") ||
                message.contains("password") ||
                message.contains("login failed") ||
                message.contains("access denied") ||
                message.contains("not able to access") ||
                message.contains("does not exist"),
                "Expected permission error but got: " + lastException.getMessage()
        );
    }

    @那麼("應該拋出資料表不存在的錯誤")
    public void 應該拋出資料表不存在的錯誤() {
        assertNotNull(lastException, "Expected table not found error but query succeeded");
        String message = lastException.getMessage().toLowerCase();
        assertTrue(
                message.contains("not found") ||
                message.contains("does not exist") ||
                message.contains("doesn't exist") ||
                message.contains("table") ||
                message.contains("unknown"),
                "Expected table not found error but got: " + lastException.getMessage()
        );
    }
}
