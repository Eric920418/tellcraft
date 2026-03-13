package ai.specformula.cucumber.backend;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.spec.SpecReaderConfig;
import ai.specformula.core.spec.api.ApiSpecReader;
import ai.specformula.core.spec.api.model.ApiSpec;
import ai.specformula.core.spec.data.EntityDdlReader;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.isa.IsaSpecReader;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import ai.specformula.core.spec.isa.model.IsaSpec;
import ai.specformula.cucumber.backend.stepdefinition.AbstractIsaStepDefinition;
import ai.specformula.cucumber.backend.stepdefinition.StepDefinitionFactory;
import ai.specformula.cucumber.listener.PerformanceMetrics;
import ai.specformula.spring.SpecFormulaBridge;
import io.cucumber.core.backend.Backend;
import io.cucumber.core.backend.Glue;
import io.cucumber.core.backend.Snippet;

public class SpecFormulaBackend implements Backend {

    private static final System.Logger LOG = System.getLogger(SpecFormulaBackend.class.getName());

    private final SpecFormulaBridge bridge;

    SpecFormulaBackend(SpecFormulaBridge bridge) {
        this.bridge = bridge;
    }

    @Override
    public void loadGlue(Glue glue, List<URI> gluePaths) {
        long start = System.nanoTime();
        try {
            doLoadGlue(glue);
        } finally {
            PerformanceMetrics.getInstance().recordPhase("loadGlue", System.nanoTime() - start);
        }
    }

    private void doLoadGlue(Glue glue) {
        SpecReaderConfig config = new SpecReaderConfig();

        // Phase 1: Read all spec files
        IsaSpecReader isaReader = new IsaSpecReader(config.getIsaPath());
        IsaSpec isaSpec = isaReader.read();
        LOG.log(System.Logger.Level.INFO, "Loaded ISA spec");

        // 從 isa.yml 的 config 區塊套用設定（apiPath, dataSources, timeFormat）
        if (isaSpec.getConfig() != null) {
            config.applyIsaConfig(isaSpec.getConfig());
            LOG.log(System.Logger.Level.INFO,
                    "Applied ISA config: apiResourcePath={0}, apiProjectPath={1}, timeFormat={2}, dataSources={3}",
                    config.getApiConfig().getResourcePath(), config.getApiConfig().getProjectPath(),
                    config.getTimeFormat(), config.getDataSources().size());
        }

        // 系統屬性補充（優先順序：isa.yml > System property > default）
        config.applySystemPropertyOverrides();
        LOG.log(System.Logger.Level.INFO,
                "After system property overrides: dataSources={0}",
                config.getDataSources().size());

        // 非同步讀取每個 DataSource 的 schema 與 API spec
        List<CompletableFuture<Map.Entry<String, DatabaseSchema>>> schemaFutures = new ArrayList<>();
        for (var source : config.getDataSources()) {
            CompletableFuture<Map.Entry<String, DatabaseSchema>> future = CompletableFuture.supplyAsync(() -> {
                IsaDataSourceConfig dsConfig = new IsaDataSourceConfig();
                dsConfig.setName(source.getName());
                dsConfig.setResourcePath(source.getResourcePath());
                dsConfig.setProjectPath(source.getProjectPath());
                dsConfig.setDbType(source.getDbType());
                EntityDdlReader ddlReader = new EntityDdlReader(dsConfig);
                DatabaseSchema schema = ddlReader.read();
                schema.setDataSourceName(source.getName());
                schema.setDbType(source.getDbType());
                LOG.log(System.Logger.Level.INFO,
                        "Loaded DataSource ''{0}'': resourcePath={1}, dbType={2}, tables={3}",
                        source.getName(), source.getResourcePath(), source.getDbType(),
                        schema.getTables().size());
                return Map.entry(source.getName(), schema);
            });
            schemaFutures.add(future);
        }

        CompletableFuture<ApiSpec> apiFuture = CompletableFuture.supplyAsync(() -> {
            ApiSpecReader apiReader = new ApiSpecReader(config.getApiConfig());
            return apiReader.read();
        });

        // 等待所有非同步任務完成
        CompletableFuture.allOf(
                CompletableFuture.allOf(schemaFutures.toArray(CompletableFuture[]::new)),
                apiFuture
        ).join();

        // 收集 schema 結果
        Map<String, DatabaseSchema> schemaMap = new LinkedHashMap<>();
        for (var future : schemaFutures) {
            var entry = future.join();
            schemaMap.put(entry.getKey(), entry.getValue());
        }

        ApiSpec apiSpec = apiFuture.join();
        LOG.log(System.Logger.Level.INFO, "Loaded {0} API operation(s)",
                apiSpec != null ? apiSpec.getOperations().size() : 0);

        // Phase 2: Initialize bridge（resolver、mockTime、shared state）
        ISAFeatureArgumentResolver resolver = new ISAFeatureArgumentResolver(bridge::currentContext);
        bridge.initialize(resolver, schemaMap, apiSpec, config.getTimeFormat());

        // Phase 3: Generate step definitions from ISA instructions
        StepDefinitionFactory factory = new StepDefinitionFactory(
                resolver,
                bridge::getTimeControl, bridge::getEntitySetup,
                bridge::getEntityValidate, bridge::getEntityNonExistenceValidate,
                bridge::getApiCall,
                bridge::getDataTableResponseValidate, bridge::getJsonResponseValidate,
                bridge::getAuthenticator);
        int registered = 0;
        for (IsaInstruction instruction : isaSpec.getInstructions()) {
            AbstractIsaStepDefinition stepDef = factory.create(instruction);
            if (stepDef != null) {
                glue.addStepDefinition(stepDef);
                registered++;
            }
        }
        LOG.log(System.Logger.Level.INFO, "Registered {0} ISA step definition(s)", registered);
    }

    @Override
    public void buildWorld() {
        long start = System.nanoTime();
        try {
            bridge.newScenario();
        } finally {
            PerformanceMetrics.getInstance().recordPhase("buildWorld", System.nanoTime() - start);
        }
    }

    @Override
    public void disposeWorld() {
        long start = System.nanoTime();
        try {
            bridge.endScenario();
        } finally {
            PerformanceMetrics.getInstance().recordPhase("disposeWorld", System.nanoTime() - start);
        }
    }

    @Override
    public Snippet getSnippet() {
        return new SpecFormulaSnippet();
    }
}
