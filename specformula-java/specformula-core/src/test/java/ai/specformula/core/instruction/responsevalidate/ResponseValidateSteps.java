package ai.specformula.core.instruction.responsevalidate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import io.cucumber.datatable.DataTable;
import io.cucumber.docstring.DocString;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class ResponseValidateSteps {

    private final ResponseValidateTestContext ctx;

    public ResponseValidateSteps(ResponseValidateTestContext ctx) {
        this.ctx = ctx;
    }

    @Before
    public void setUp() {
        ctx.init();
    }

    // ==================== Given ====================

    @Given("response-validate 回應驗證 ApiSpec:")
    public void apiSpec(String json) throws Exception {
        ctx.buildValidators(json);
    }

    @Given("response-validate 設定回應 {string} 狀態碼 {int}:")
    public void 設定回應(String summary, int statusCode, String body) {
        ctx.setupMockResponse(statusCode, body);
    }

    @Given("response-validate ScenarioContext 預設變數 {string} 為 {string}")
    public void scenarioContext預設變數(String key, String value) {
        ctx.getScenarioContext().put(key, value);
    }

    // ==================== When ====================

    @When("response-validate 驗證 {string} \\({int}), with Table:")
    public void 驗證WithTable(String summary, int statusCode, DataTable dataTable) {
        ctx.setThrownException(null);
        try {
            ctx.getDataTableValidator().validate(summary, String.valueOf(statusCode), dataTable);
        } catch (Exception | AssertionError e) {
            ctx.setThrownException(e);
        }
    }

    @When("response-validate 驗證 {string} \\({int}), with Json:")
    public void 驗證WithJson(String summary, int statusCode, DocString docString) {
        ctx.setThrownException(null);
        try {
            ctx.getJsonValidator().validate(summary, String.valueOf(statusCode), docString);
        } catch (Exception | AssertionError e) {
            ctx.setThrownException(e);
        }
    }

    // ==================== Then ====================

    @Then("response-validate 通過")
    public void 通過() {
        if (ctx.getThrownException() != null) {
            fail("預期驗證通過，但拋出例外: " + ctx.getThrownException().getMessage());
        }
    }

    @Then("response-validate 失敗, 訊息包含 {string}")
    public void 失敗訊息包含(String expected) {
        assertNotNull(ctx.getThrownException(),
                "預期驗證失敗，但驗證通過了");
        assertTrue(ctx.getThrownException().getMessage().contains(expected),
                "預期訊息包含 '" + expected
                        + "' 但實際為: " + ctx.getThrownException().getMessage());
    }

    @Then("response-validate ScenarioContext 應有變數 {string} 為 {string}")
    public void scenarioContext應有變數(String key, String expected) {
        Object actual = ctx.getScenarioContext().get(key);
        assertNotNull(actual, "ScenarioContext 變數 '" + key + "' 為 null");
        assertEquals(expected, actual.toString());
    }
}
