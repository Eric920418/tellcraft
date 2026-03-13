package ai.specformula.core.instruction.responsevalidate;

import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.http.TestResponse;
import ai.specformula.core.instruction.DataTableResponseValidate;
import ai.specformula.core.instruction.JsonResponseValidate;
import ai.specformula.core.spec.api.model.ApiSpec;

/**
 * PicoContainer 管理的共享測試狀態。 所有 ResponseValidate 相關的 Step Definition
 * 類別透過建構子注入此物件， 以共享 ScenarioContext、Validators 和例外狀態。
 */
public class ResponseValidateTestContext {

    private ScenarioContext scenarioContext;
    private ISAFeatureArgumentResolver resolver;
    private DataTableResponseValidate dataTableValidator;
    private JsonResponseValidate jsonValidator;
    private Throwable thrownException;

    public void init() {
        scenarioContext = new ScenarioContext();
        resolver = new ISAFeatureArgumentResolver(() -> scenarioContext);
        dataTableValidator = null;
        jsonValidator = null;
        thrownException = null;
    }

    public void buildValidators(String apiSpecJson) throws Exception {
        ObjectMapper om = new ObjectMapper();
        ApiSpec apiSpec = om.readValue(apiSpecJson, ApiSpec.class);
        dataTableValidator = new DataTableResponseValidate(resolver, () -> scenarioContext, apiSpec);
        jsonValidator = new JsonResponseValidate(resolver, () -> scenarioContext, apiSpec);
    }

    public void setupMockResponse(int statusCode, String body) {
        scenarioContext.setLastResponse(new TestResponse(statusCode, body));
    }

    public ScenarioContext getScenarioContext() {
        return scenarioContext;
    }

    public DataTableResponseValidate getDataTableValidator() {
        return dataTableValidator;
    }

    public JsonResponseValidate getJsonValidator() {
        return jsonValidator;
    }

    public Throwable getThrownException() {
        return thrownException;
    }

    public void setThrownException(Throwable thrownException) {
        this.thrownException = thrownException;
    }
}
