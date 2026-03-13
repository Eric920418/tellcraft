package ai.specformula.spring;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import javax.sql.DataSource;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.core.dialect.CleanupPlan;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.ApiCall;
import ai.specformula.core.instruction.DataTableResponseValidate;
import ai.specformula.core.instruction.EntityNonExistenceValidate;
import ai.specformula.core.instruction.EntitySetup;
import ai.specformula.core.instruction.EntityValidate;
import ai.specformula.core.instruction.JsonResponseValidate;
import ai.specformula.core.instruction.TimeControl;
import ai.specformula.core.spec.api.model.ApiSpec;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.spring.auth.Authenticator;
import ai.specformula.spring.auth.DefaultAuthenticator;
import ai.specformula.spring.time.MockTime;

/**
 * Cucumber SPI 與 Spring DI 之間的橋接器。
 * <p>
 * Instance-based 設計：由 {@code SpecFormulaBackendProviderService} 建立實例並注入
 * {@code SpecFormulaBackend}。保留 static {@link #getInstance()} 供
 * {@code SpecFormulaSpringConfiguration} 在 Spring Context 啟動後注入
 * DataSource、HttpClientAdapter 等。
 * </p>
 */
public class SpecFormulaBridge {

    private static final System.Logger LOG = System.getLogger(SpecFormulaBridge.class.getName());

    // ==================== Static singleton（供 Spring Configuration 存取） ====================
    private static volatile SpecFormulaBridge instance;

    public static SpecFormulaBridge getInstance() {
        return instance;
    }

    public static void setInstance(SpecFormulaBridge bridge) {
        instance = bridge;
    }

    // ==================== Instance 欄位 ====================
    private final Map<String, Supplier<Connection>> connectionSupplierMap = new ConcurrentHashMap<>();
    private final Map<String, TrackingDataSource> trackingMap = new ConcurrentHashMap<>();
    private volatile HttpClientAdapter httpClient;
    private volatile Authenticator authenticator = new DefaultAuthenticator();
    private volatile MockTime mockTime;

    // ScenarioContext（ThreadLocal，per-scenario 生命週期）
    // sharedContext 供 cross-thread 存取（RestTemplate 模式下 Tomcat worker thread 使用）
    private final ThreadLocal<ScenarioContext> scenarioContext = new ThreadLocal<>();
    private volatile ScenarioContext sharedContext;

    // 由 initialize() 設定的共用元件
    private ISAFeatureArgumentResolver resolver;
    private Map<String, DatabaseSchema> schemaMap;
    private ApiSpec apiSpec;
    private String timeFormat;

    // Lazy init instructions（Spring Context 啟動後才有值）
    private volatile TimeControl timeControl;
    private volatile EntitySetup entitySetup;
    private volatile EntityValidate entityValidate;
    private volatile EntityNonExistenceValidate entityNonExistenceValidate;
    private volatile ApiCall apiCall;
    private volatile DataTableResponseValidate dataTableResponseValidate;
    private volatile JsonResponseValidate jsonResponseValidate;
    private volatile boolean instructionsInitialized = false;

    // ==================== 初始化（由 Backend.loadGlue() 呼叫） ====================
    /**
     * 初始化 bridge 共用元件。在 spec 讀取完成後呼叫。
     */
    public void initialize(ISAFeatureArgumentResolver resolver,
            Map<String, DatabaseSchema> schemaMap,
            ApiSpec apiSpec,
            String timeFormat) {
        this.resolver = resolver;
        this.schemaMap = schemaMap;
        this.apiSpec = apiSpec;
        this.timeFormat = timeFormat;
        this.mockTime = () -> resolver.getNow().withZoneSameInstant(ZoneOffset.UTC);
        LOG.log(System.Logger.Level.INFO, "SpecFormulaBridge initialized");
    }

    // ==================== ScenarioContext 管理 ====================
    public ScenarioContext currentContext() {
        ScenarioContext ctx = scenarioContext.get();
        if (ctx == null) {
            // Fallback: cross-thread 存取（RestTemplate 模式下 Tomcat worker thread）
            ctx = sharedContext;
        }
        if (ctx == null) {
            throw new IllegalStateException(
                    "ScenarioContext 尚未初始化。請確認 newScenario() 已被呼叫。");
        }
        return ctx;
    }

    /**
     * Scenario 開始：建立 ScenarioContext，lazy init instructions。
     */
    public void newScenario() {
        ScenarioContext ctx = new ScenarioContext();
        scenarioContext.set(ctx);
        sharedContext = ctx;
        if (!instructionsInitialized) {
            initInstructions();
        }
    }

    /**
     * Scenario 結束：清除 ScenarioContext，truncate 所有資料表。
     */
    public void endScenario() {
        ScenarioContext ctx = scenarioContext.get();
        if (ctx != null) {
            ctx.reset();
        }
        scenarioContext.remove();
        sharedContext = null;
        truncateAllTables();
    }

    // ==================== Lazy init instructions ====================
    private synchronized void initInstructions() {
        if (instructionsInitialized) {
            return;
        }

        List<DatabaseSchema> schemaList = new ArrayList<>(schemaMap.values());
        timeControl = new TimeControl(resolver);
        entitySetup = new EntitySetup(resolver, schemaList, this::getConnection);
        entityValidate = new EntityValidate(resolver, schemaList, this::getConnection);
        entityNonExistenceValidate = new EntityNonExistenceValidate(resolver, schemaList, this::getConnection);
        dataTableResponseValidate = new DataTableResponseValidate(resolver, this::currentContext, apiSpec);
        jsonResponseValidate = new JsonResponseValidate(resolver, this::currentContext, apiSpec);
        LOG.log(System.Logger.Level.INFO, "Instructions initialized");

        if (httpClient != null) {
            apiCall = new ApiCall(resolver, this::currentContext, httpClient, apiSpec, timeFormat);
            LOG.log(System.Logger.Level.INFO, "ApiCall initialized with {0}",
                    httpClient.getClass().getSimpleName());
        }

        instructionsInitialized = true;
    }

    // ==================== Instruction getters（供 StepDefinitionFactory 使用） ====================
    public TimeControl getTimeControl() {
        return timeControl;
    }

    public EntitySetup getEntitySetup() {
        return entitySetup;
    }

    public EntityValidate getEntityValidate() {
        return entityValidate;
    }

    public EntityNonExistenceValidate getEntityNonExistenceValidate() {
        return entityNonExistenceValidate;
    }

    public ApiCall getApiCall() {
        return apiCall;
    }

    public DataTableResponseValidate getDataTableResponseValidate() {
        return dataTableResponseValidate;
    }

    public JsonResponseValidate getJsonResponseValidate() {
        return jsonResponseValidate;
    }

    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public Map<String, DatabaseSchema> getSchemaMap() {
        return schemaMap;
    }

    public ApiSpec getApiSpec() {
        return apiSpec;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    // ==================== DataSource / Connection ====================
    public void setConnectionSupplier(String name, Supplier<Connection> supplier) {
        if (supplier == null) {
            connectionSupplierMap.remove(name);
        } else {
            connectionSupplierMap.put(name, supplier);
        }
    }

    /**
     * 註冊 DataSource。
     * <p>
     * 若 dataSource 為 {@link TrackingDataSource}，自動啟用 dirty table tracking，
     * 清理時只清理有被 INSERT 的 table；否則清理時會清理全部資料表。
     * </p>
     */
    public void setDataSource(String name, DataSource dataSource) {
        if (dataSource == null) {
            connectionSupplierMap.remove(name);
            trackingMap.remove(name);
        } else {
            if (dataSource instanceof TrackingDataSource tracking) {
                trackingMap.put(name, tracking);
            }
            connectionSupplierMap.put(name, () -> {
                try {
                    return dataSource.getConnection();
                } catch (SQLException e) {
                    throw new RuntimeException(
                            "Failed to get JDBC connection from DataSource '" + name + "'", e);
                }
            });
        }
    }

    public Supplier<Connection> getConnectionSupplier(String name) {
        return connectionSupplierMap.get(name);
    }

    public Map<String, Supplier<Connection>> getConnectionSupplierMap() {
        return connectionSupplierMap;
    }

    public Set<String> getDataSourceNames() {
        return connectionSupplierMap.keySet();
    }

    // 向後相容
    public void setConnectionSupplier(Supplier<Connection> supplier) {
        setConnectionSupplier("default", supplier);
    }

    public void setDataSource(DataSource dataSource) {
        setDataSource("default", dataSource);
    }

    public Supplier<Connection> getConnectionSupplier() {
        return getConnectionSupplier("default");
    }

    /**
     * 根據 DataSource 名稱取得 Connection，含 fallback 邏輯。
     */
    public Connection getConnection(String dataSourceName) {
        var supplier = getConnectionSupplier(dataSourceName);
        if (supplier == null) {
            supplier = findMatchingConnectionSupplier(dataSourceName);
        }
        if (supplier == null) {
            throw new IllegalStateException(
                    "[SpecFormulaBridge] ConnectionSupplier 未初始化。"
                    + "DataSource='" + dataSourceName + "'，請確認已設定。可用的 DataSource: "
                    + getDataSourceNames());
        }
        return supplier.get();
    }

    private Supplier<Connection> findMatchingConnectionSupplier(String dsName) {
        String beanName = dsName + "DataSource";
        if (connectionSupplierMap.containsKey(beanName)) {
            return connectionSupplierMap.get(beanName);
        }
        if (schemaMap != null && schemaMap.size() == 1 && connectionSupplierMap.size() == 1) {
            return connectionSupplierMap.values().iterator().next();
        }
        return null;
    }

    // ==================== HttpClientAdapter / Authenticator / MockTime ====================
    public void setHttpClient(HttpClientAdapter client) {
        this.httpClient = client;
    }

    public HttpClientAdapter getHttpClient() {
        return httpClient;
    }

    public void setAuthenticator(Authenticator auth) {
        authenticator = (auth != null) ? auth : new DefaultAuthenticator();
    }

    public Authenticator getAuthenticator() {
        return authenticator;
    }

    public void setMockTime(MockTime mt) {
        mockTime = mt;
    }

    public MockTime getMockTime() {
        return mockTime;
    }

    // ==================== Truncate ====================
    private void truncateAllTables() {
        if (schemaMap == null || schemaMap.isEmpty()) {
            return;
        }

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (var entry : schemaMap.entrySet()) {
            String dsName = entry.getKey();
            DatabaseSchema schema = entry.getValue();
            CleanupPlan plan = schema.getCleanupPlan();
            if (plan == null) {
                continue;
            }

            // Dirty table tracking：只清理有被 INSERT 的 table
            TrackingDataSource tracking = trackingMap.get(dsName);
            if (tracking == null) {
                tracking = findMatchingTracking(dsName);
            }
            Set<String> dirtyTables = (tracking != null) ? tracking.getDirtyTables() : null;

            // 若有 tracking 且沒有 dirty table，跳過清理
            if (dirtyTables != null && dirtyTables.isEmpty()) {
                if (tracking != null) {
                    tracking.clearDirtyTables();
                }
                continue;
            }

            Supplier<Connection> connSupplier = getConnectionSupplier(dsName);
            if (connSupplier == null) {
                var fallback = findMatchingConnectionSupplier(dsName);
                if (fallback == null) {
                    continue;
                }
                connSupplier = fallback;
            }

            // 快照 dirty tables（避免 async task 執行前被清除）
            final Set<String> dirtySnapshot = (dirtyTables != null) ? Set.copyOf(dirtyTables) : null;
            if (tracking != null) {
                tracking.clearDirtyTables();
            }

            final Supplier<Connection> finalConnSupplier = connSupplier;
            futures.add(CompletableFuture.runAsync(() -> {
                try (Connection conn = finalConnSupplier.get(); Statement stmt = conn.createStatement()) {

                    // 計算需要清理的 table 數量
                    int cleanedCount = 0;
                    for (var tableEntry : plan.getTableCleanupSql().entrySet()) {
                        String tableName = tableEntry.getKey();
                        if (dirtySnapshot != null && !dirtySnapshot.contains(tableName.toLowerCase())) {
                            continue;
                        }
                        cleanedCount++;
                    }

                    if (cleanedCount > 0) {
                        // 1. 關閉 FK 約束
                        for (String sql : plan.getDisableFkSql()) {
                            stmt.addBatch(sql);
                        }
                        // 2. 清理 table（有 tracking 時只清理 dirty tables）
                        for (var tableEntry : plan.getTableCleanupSql().entrySet()) {
                            String tableName = tableEntry.getKey();
                            if (dirtySnapshot != null && !dirtySnapshot.contains(tableName.toLowerCase())) {
                                continue;
                            }
                            for (String sql : tableEntry.getValue()) {
                                stmt.addBatch(sql);
                            }
                        }
                        // 3. 恢復 FK 約束
                        for (String sql : plan.getEnableFkSql()) {
                            stmt.addBatch(sql);
                        }
                        stmt.executeBatch();
                    }

                    LOG.log(System.Logger.Level.DEBUG,
                            "已清空 DataSource ''{0}'' 的 {1}/{2} 個資料表",
                            dsName, cleanedCount, plan.getTableCleanupSql().size());

                } catch (Exception e) {
                    LOG.log(System.Logger.Level.WARNING,
                            "清空 DataSource ''{0}'' 資料表時發生錯誤: {1}", dsName, e.getMessage());
                }
            }));
        }

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }

    private TrackingDataSource findMatchingTracking(String dsName) {
        String beanName = dsName + "DataSource";
        if (trackingMap.containsKey(beanName)) {
            return trackingMap.get(beanName);
        }
        if (schemaMap != null && schemaMap.size() == 1 && trackingMap.size() == 1) {
            return trackingMap.values().iterator().next();
        }
        return null;
    }

    public void reset() {
        connectionSupplierMap.clear();
        trackingMap.clear();
        httpClient = null;
        authenticator = new DefaultAuthenticator();
        mockTime = null;
        sharedContext = null;
        instructionsInitialized = false;
        timeControl = null;
        entitySetup = null;
        entityValidate = null;
        entityNonExistenceValidate = null;
        apiCall = null;
        dataTableResponseValidate = null;
        jsonResponseValidate = null;
    }
}
