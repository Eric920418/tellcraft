package ai.specformula.core.instruction.apicall;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

public class ApiCallSteps {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern ARRAY_SEG = Pattern.compile("([A-Za-z0-9_]+)\\[(\\d+)]");

    private final ApiCallTestContext ctx;

    public ApiCallSteps(ApiCallTestContext ctx) {
        this.ctx = ctx;
    }

    @Before
    public void setUp() {
        ctx.init();
    }

    // ==================== Given ====================

    @Given("api-call ApiSpec:")
    public void apiSpec(String json) throws Exception {
        ctx.buildApiCall(json, null);
    }

    @Given("api-call ApiSpec timeFormat {string}:")
    public void apiSpecWithTimeFormat(String timeFormat, String json) throws Exception {
        ctx.buildApiCall(json, timeFormat);
    }

    @Given("api-call {string} 回應 {int}:")
    public void 回應(String summary, int statusCode, String body) {
        EchoController.configureResponse(statusCode, body);
    }

    @Given("api-call ScenarioContext 設定變數 {string} 為 {string}")
    public void scenarioContext設定變數(String key, String value) {
        ctx.getScenarioContext().put(key, value);
    }

    // ==================== When ====================

    @When("api-call {string} WithActor token {string}:")
    public void withActor(String summary, String token, DataTable dataTable) {
        try {
            ctx.getApiCall().invokeWithActor(dataTable, summary, () -> token);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    @When("api-call {string} WithoutActor:")
    public void withoutActor(String summary, DataTable dataTable) {
        try {
            ctx.getApiCall().invokeWithoutActor(dataTable, summary);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    // ==================== Then: 請求驗證 ====================

    @Then("api-call 請求的 path 為 {string}")
    public void 請求的path為(String expected) {
        assertCaptured();
        assertEquals(expected, EchoController.getLastCapture().path);
    }

    @Then("api-call 請求的 path 包含 {string}")
    public void 請求的path包含(String expected) {
        assertCaptured();
        String actual = EchoController.getLastCapture().path;
        assertTrue(actual.contains(expected),
                "Expected path to contain '" + expected + "' but was: " + actual);
    }

    @Then("api-call 請求的 header {string} 為 {string}")
    public void 請求的header為(String name, String expected) {
        assertCaptured();
        String actual = findHeader(name);
        assertEquals(expected, actual, "Header '" + name + "' mismatch");
    }

    @Then("api-call 請求不包含 header {string}")
    public void 請求不包含header(String name) {
        assertCaptured();
        assertNull(findHeader(name), "Header '" + name + "' should not exist");
    }

    @Then("api-call 請求的 query 參數 {string} 為 {string}")
    public void 請求的query參數為(String name, String expected) {
        assertCaptured();
        assertEquals(expected, EchoController.getLastCapture().queryParams.get(name),
                "Query param '" + name + "' mismatch");
    }

    @Then("api-call 請求的 body 包含 {string} 為 {string}")
    public void 請求的body包含(String key, String expected) throws Exception {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertNotNull(body, "Request body should not be null");
        JsonNode root = OBJECT_MAPPER.readTree(body);
        JsonNode node = root.get(key);
        assertNotNull(node, "Body field '" + key + "' not found");
        assertEquals(expected, node.asText());
    }

    @Then("api-call 請求的 body nested {string} 為 {string}")
    public void 請求的bodyNested為(String path, String expected) throws Exception {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertNotNull(body, "Request body should not be null");
        JsonNode node = OBJECT_MAPPER.readTree(body);

        for (String seg : path.split("\\.")) {
            Matcher m = ARRAY_SEG.matcher(seg);
            if (m.matches()) {
                node = node.get(m.group(1));
                assertNotNull(node, "Body path '" + path + "' not found at '" + m.group(1) + "'");
                node = node.get(Integer.parseInt(m.group(2)));
                assertNotNull(node, "Body path '" + path + "' index out of bounds");
            } else {
                node = node.get(seg);
                assertNotNull(node, "Body path '" + path + "' not found at '" + seg + "'");
            }
        }
        assertEquals(expected, node.asText());
    }

    @Then("api-call 請求不包含 body")
    public void 請求不包含body() {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertTrue(body == null || body.isEmpty(),
                "Request should not have body but was: " + body);
    }

    @Then("api-call 請求的 body {string} 為 JSON array 長度 {int}")
    public void 請求的body為JsonArray(String key, int expectedSize) throws Exception {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertNotNull(body);
        JsonNode node = OBJECT_MAPPER.readTree(body).get(key);
        assertNotNull(node, "Body field '" + key + "' not found");
        assertTrue(node.isArray(), "'" + key + "' should be JSON array");
        assertEquals(expectedSize, node.size(), "Array '" + key + "' size mismatch");
    }

    @Then("api-call 請求的 body {string} 為 JSON object")
    public void 請求的body為JsonObject(String key) throws Exception {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertNotNull(body);
        JsonNode node = OBJECT_MAPPER.readTree(body).get(key);
        assertNotNull(node, "Body field '" + key + "' not found");
        assertTrue(node.isObject(), "'" + key + "' should be JSON object");
    }

    @Then("api-call 請求的 body {string} 符合數字格式")
    public void 請求的body符合數字格式(String key) throws Exception {
        assertCaptured();
        String body = EchoController.getLastCapture().body;
        assertNotNull(body);
        JsonNode node = OBJECT_MAPPER.readTree(body).get(key);
        assertNotNull(node, "Body field '" + key + "' not found");
        String value = node.asText();
        assertTrue(value.matches("\\d+"),
                "'" + key + "' should be numeric string but was: " + value);
    }

    // ==================== Then: 回應驗證 ====================

    @Then("api-call 回應狀態碼為 {int}")
    public void 回應狀態碼為(int expected) {
        assertNotNull(ctx.getScenarioContext().getLastResponse(),
                "lastResponse is null");
        assertEquals(expected,
                ctx.getScenarioContext().getLastResponse().getStatus());
    }

    @Then("api-call ScenarioContext 的 lastResponse 不為 null")
    public void lastResponse不為null() {
        assertNotNull(ctx.getScenarioContext().getLastResponse(),
                "lastResponse should not be null");
    }

    @Then("api-call ScenarioContext 變數 {string} 為 {string}")
    public void scenarioContext變數驗證(String key, String expected) {
        Object actual = ctx.getScenarioContext().get(key);
        assertNotNull(actual, "ScenarioContext variable '" + key + "' is null");
        assertEquals(expected, actual.toString());
    }

    // ==================== Then: 例外驗證 ====================

    @Then("api-call 應拋出例外訊息包含 {string}")
    public void 應拋出例外訊息包含(String expected) {
        assertNotNull(ctx.getThrownException(),
                "Expected exception but none was thrown");
        assertTrue(ctx.getThrownException().getMessage().contains(expected),
                "Expected message to contain '" + expected
                        + "' but was: " + ctx.getThrownException().getMessage());
    }

    // ==================== Helper ====================

    private void assertCaptured() {
        assertNull(ctx.getThrownException(),
                () -> "Expected no exception but got: " + ctx.getThrownException().getMessage());
        assertNotNull(EchoController.getLastCapture(),
                "No request was captured");
    }

    private String findHeader(String name) {
        var capture = EchoController.getLastCapture();
        if (capture == null || capture.headers == null) {
            return null;
        }
        for (Map.Entry<String, String> entry : capture.headers.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return null;
    }
}
