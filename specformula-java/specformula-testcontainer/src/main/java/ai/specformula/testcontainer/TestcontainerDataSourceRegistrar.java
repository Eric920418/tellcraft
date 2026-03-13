package ai.specformula.testcontainer;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.BeanDefinitionBuilder;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.datasource.init.ScriptException;
import org.springframework.lang.NonNull;
import org.testcontainers.containers.JdbcDatabaseContainer;

import ai.specformula.core.spec.isa.IsaSpecReader;
import ai.specformula.core.spec.isa.model.IsaConfig;
import ai.specformula.core.spec.isa.model.IsaDataConfig;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;
import ai.specformula.core.spec.isa.model.IsaSpec;

/**
 * 動態註冊 DataSource beans。
 * <p>
 * 讀取 isa.yml 的 data.source 設定，為每個 DataSource entry：
 * <ol>
 *   <li>依 db_type 建立並啟動 Testcontainer（或建立 H2 in-memory DataSource）</li>
 *   <li>建立 DataSource</li>
 *   <li>執行 schema.sql（若存在）</li>
 *   <li>以 source name 為 bean name 註冊到 Spring ApplicationContext</li>
 * </ol>
 * </p>
 */
public class TestcontainerDataSourceRegistrar implements BeanDefinitionRegistryPostProcessor {

    private static final System.Logger LOG = System.getLogger(TestcontainerDataSourceRegistrar.class.getName());

    /**
     * 保存已啟動的容器引用，避免被 GC 回收。
     * key = source name, value = container instance
     */
    private static final Map<String, JdbcDatabaseContainer<?>> activeContainers = new LinkedHashMap<>();

    public static Map<String, JdbcDatabaseContainer<?>> getActiveContainers() {
        return activeContainers;
    }

    @Override
    public void postProcessBeanDefinitionRegistry(@NonNull BeanDefinitionRegistry registry) throws BeansException {
        IsaDataConfig dataConfig = readDataConfig();
        if (dataConfig == null || dataConfig.getSource() == null || dataConfig.getSource().isEmpty()) {
            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] isa.yml 未定義 data.source，跳過 Testcontainer 配置。");
            return;
        }

        List<IsaDataSourceConfig> sources = dataConfig.getSource();
        String permission = dataConfig.getPermission();
        boolean isolated = "isolated".equals(permission);
        boolean reuse = dataConfig.isReuse();

        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 讀取到 {0} 個 DataSource 定義，permission={1}，reuse={2}，開始建立容器...",
                sources.size(), permission, reuse);

        DataSource firstDataSource = null;
        String firstSourceName = null;
        Map<String, JdbcDatabaseContainer<?>> containersByDbType = new LinkedHashMap<>();

        for (IsaDataSourceConfig source : sources) {
            applySystemPropertyOverrides(source);
            String name = source.getName();
            String dbType = resolveDbType(source.getDbType());
            String resourcePath = source.getResourcePath();

            if (name == null || name.isBlank()) {
                name = "default";
            }

            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] 處理 DataSource ''{0}'': db_type={1}, resource_path={2}",
                    name, dbType, resourcePath);

            DataSource ds;
            if (TestcontainerFactory.isH2(dbType)) {
                // H2 不需要容器
                ds = TestcontainerFactory.createH2DataSource(name);
            } else {
                // 同 dbType 共用同一個容器，用 databaseName 隔離
                JdbcDatabaseContainer<?> container = containersByDbType.get(dbType);
                if (container == null) {
                    container = TestcontainerFactory.createAndStartContainer(dbType, reuse);
                    containersByDbType.put(dbType, container);
                    activeContainers.put(dbType, container);
                }
                TestcontainerFactory.createDatabase(container, name);

                // 根據 permission 決定建立方式
                if (isolated) {
                    ds = TestcontainerFactory.createIsolatedDataSourceWithInfo(container, name, reuse).dataSource();
                } else {
                    ds = TestcontainerFactory.createDataSource(container, name);
                }
            }

            Objects.requireNonNull(ds, "DataSource must not be null for source: " + name);
            executeSchema(ds, resourcePath, reuse);
            registerDataSourceBean(registry, name, ds);

            if (firstDataSource == null) {
                firstDataSource = ds;
                firstSourceName = name;
            }
        }

        // 若 Spring Boot DataSourceAutoConfiguration 已註冊 "dataSource" bean，
        // 用第一個 testcontainer DataSource 覆蓋，確保 JPA/Hibernate 使用正確的 DataSource。
        if (firstDataSource != null
                && registry.containsBeanDefinition("dataSource")
                && !"dataSource".equals(firstSourceName)) {
            registry.removeBeanDefinition("dataSource");
            registerDataSourceBean(registry, "dataSource", firstDataSource);
            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] 已覆蓋 auto-configured DataSource bean。");
        }

        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 已建立 {0} 個 DataSource bean(s)。", sources.size());
    }

    @Override
    public void postProcessBeanFactory(@NonNull ConfigurableListableBeanFactory beanFactory) throws BeansException {
        // No-op
    }

    // ==================== 內部方法 ====================

    /**
     * 從 isa.yml 讀取 data 設定（包含 permission 與 source）。
     */
    private IsaDataConfig readDataConfig() {
        IsaSpecReader reader = new IsaSpecReader();
        IsaSpec spec = reader.read();

        IsaConfig config = spec.getConfig();
        if (config == null) {
            return null;
        }

        return config.getData();
    }

    /**
     * 從系統屬性覆蓋 isa.yml 中的 db_type 與 resource_path。
     * <p>
     * 優先順序（db_type）：
     * <ol>
     *   <li>{@code specformula.testcontainer.{name}.db_type} — per-source 覆蓋</li>
     *   <li>isa.yml 的 db_type</li>
     *   <li>{@code specformula.db_type} — 全域 fallback（僅補充 null）</li>
     * </ol>
     * 優先順序（resource_path）：
     * <ol>
     *   <li>{@code specformula.testcontainer.{name}.resource_path} — per-source 覆蓋</li>
     *   <li>isa.yml 的 resource_path</li>
     * </ol>
     */
    private void applySystemPropertyOverrides(IsaDataSourceConfig source) {
        String name = (source.getName() != null && !source.getName().isBlank())
                ? source.getName() : "default";

        // db_type: per-source override > isa.yml > global fallback
        String perSourceDbType = System.getProperty("specformula.testcontainer." + name + ".db_type");
        String globalDbType = System.getProperty("specformula.db_type");

        if (perSourceDbType != null && !perSourceDbType.isBlank()) {
            source.setDbType(perSourceDbType);
        } else if ((source.getDbType() == null || source.getDbType().isBlank())
                   && globalDbType != null && !globalDbType.isBlank()) {
            source.setDbType(globalDbType);
        }

        // resource_path: per-source override > isa.yml
        String perSourcePath = System.getProperty("specformula.testcontainer." + name + ".resource_path");
        if (perSourcePath != null && !perSourcePath.isBlank()) {
            source.setResourcePath(perSourcePath);
        }
    }

    /**
     * 解析 db_type：null 或空白預設為 h2。
     */
    private String resolveDbType(String dbType) {
        if (dbType == null || dbType.isBlank()) {
            return "h2";
        }
        return dbType.toLowerCase();
    }

    /**
     * 執行 resourcePath 目錄下所有 *.sql 檔案。
     * 若 reuse 為 true 且資料庫中已有 table，則跳過 schema 執行。
     */
    private void executeSchema(@NonNull DataSource dataSource, String resourcePath, boolean reuse) {
        if (resourcePath == null || resourcePath.isBlank()) return;

        if (reuse && hasExistingTables(dataSource)) {
            LOG.log(System.Logger.Level.INFO,
                    "[Testcontainer] Reuse 模式偵測到 schema 已存在，跳過 SQL 腳本執行。");
            return;
        }

        String dirPath = resourcePath.endsWith("/") ? resourcePath : resourcePath + "/";

        try {
            ClassLoader cl = Thread.currentThread().getContextClassLoader();
            URL dirUrl = cl.getResource(dirPath);
            if (dirUrl == null) {
                LOG.log(System.Logger.Level.DEBUG,
                        "[Testcontainer] 資源目錄不存在: {0}，跳過。", dirPath);
                return;
            }

            Path dir = Path.of(dirUrl.toURI());
            if (!Files.isDirectory(dir)) return;

            ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
            populator.setSeparator(";");
            boolean hasScripts = false;

            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.sql")) {
                for (Path file : stream) {
                    String classpathLocation = dirPath + file.getFileName().toString();
                    populator.addScript(new ClassPathResource(classpathLocation));
                    hasScripts = true;
                    LOG.log(System.Logger.Level.DEBUG,
                            "[Testcontainer] 加入 SQL 腳本: {0}", classpathLocation);
                }
            }

            if (hasScripts) {
                populator.execute(dataSource);
                LOG.log(System.Logger.Level.INFO,
                        "[Testcontainer] 已執行 {0} 下所有 SQL 腳本。", dirPath);
            }
        } catch (IOException | URISyntaxException | ScriptException e) {
            throw new IllegalStateException(
                    "[Testcontainer] 執行 SQL 腳本失敗: " + dirPath, e);
        }
    }

    /**
     * 透過 JDBC DatabaseMetaData 檢查資料庫中是否已有 user table。
     * 用於 reuse 模式判斷 schema 是否已建立。
     * <p>
     * 使用 {@code conn.getSchema()} 限定查詢範圍，避免將系統表誤判為使用者表。
     * MSSQL 回傳 "dbo"，PostgreSQL 回傳 "public"，MySQL/MariaDB 回傳 null（無 schema 概念）。
     * </p>
     */
    private boolean hasExistingTables(@NonNull DataSource dataSource) {
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            String schema = conn.getSchema();
            try (ResultSet rs = meta.getTables(null, schema, "%", new String[]{"TABLE"})) {
                return rs.next();
            }
        } catch (SQLException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "[Testcontainer] 檢查 schema 是否存在時發生錯誤，將執行 SQL 腳本。", e);
            return false;
        }
    }

    /**
     * 註冊 DataSource bean 到 Spring ApplicationContext。
     */
    private void registerDataSourceBean(@NonNull BeanDefinitionRegistry registry,@NonNull String beanName, DataSource dataSource) {
        var beanDef = BeanDefinitionBuilder
                .genericBeanDefinition(DataSource.class, () -> dataSource)
                .getBeanDefinition();
        registry.registerBeanDefinition(beanName, beanDef);
        LOG.log(System.Logger.Level.INFO,
                "[Testcontainer] 已註冊 DataSource bean: ''{0}''", beanName);
    }
}
