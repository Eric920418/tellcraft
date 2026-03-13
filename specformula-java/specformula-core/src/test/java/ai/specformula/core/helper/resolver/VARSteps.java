package ai.specformula.core.helper.resolver;

import java.lang.reflect.Method;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class VARSteps {

    private final ResolverTestContext ctx;

    // VAR-specific state
    private List<String> headers;
    private List<String> dataRow;
    private Object executionVariable;
    private Map<Integer, String> contextKeyMap;
    private List<?> parsedConstraints;

    public VARSteps(ResolverTestContext ctx) {
        this.ctx = ctx;
    }

    // ========== Given: 設定變數 ==========

    @Given("設定變數 {string} 為字串 {string}")
    public void 設定變數為字串(String key, String value) {
        ctx.getScenarioContext().putObject(key, value);
    }

    // ========== Given: execution variable (JSON 格式) ==========

    /**
     * 設定 execution variable 為 JSON 格式。
     * 支援：物件、null、空物件 {}
     * 範例：
     *   Given var execution variable:
     *     """
     *     {"id": 12345, "name": "王大明"}
     *     """
     */
    @Given("var execution variable:")
    public void var_executionVariable(String jsonStr) {
        String trimmed = jsonStr.trim();
        if ("null".equals(trimmed)) {
            executionVariable = null;
        } else {
            try {
                ObjectMapper mapper = new ObjectMapper();
                executionVariable = mapper.readValue(trimmed, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                throw new RuntimeException("解析 JSON 失敗: " + jsonStr, e);
            }
        }
    }

    // ========== When: context key 解析 ==========

    @When("var 解析 context keys:")
    public void var解析contextKeys(DataTable dataTable) {
        // 水平格式: | >agentId | name | email |
        List<String> headerList = new ArrayList<>(dataTable.row(0));
        try {
            contextKeyMap = ctx.getResolver().parseContextKeys(headerList);
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
            contextKeyMap = null;
        }
    }

    @When("var 解析空 headers 的 context keys")
    public void var解析空headers的contextKeys() {
        contextKeyMap = ctx.getResolver().parseContextKeys(Collections.emptyList());
    }

    @When("var 解析 context keys（含 null）:")
    public void var解析contextKeys含null(DataTable dataTable) {
        // 水平格式: | >agentId | null | name |
        List<String> headerList = new ArrayList<>();
        for (String h : dataTable.row(0)) {
            headerList.add("null".equals(h) ? null : h);
        }
        contextKeyMap = ctx.getResolver().parseContextKeys(headerList);
    }

    // ========== When: 提取並儲存變數 ==========

    @When("var 提取並儲存變數:")
    public void var_提取並儲存變數(DataTable dataTable) {
        // 水平格式:
        // | >agentId | name   | email           |
        // | <id      | 王大明 | wang@example.tw |
        headers = new ArrayList<>(dataTable.row(0));
        dataRow = new ArrayList<>(dataTable.row(1));
        try {
            Map<Integer, String> keyMap = ctx.getResolver().parseContextKeys(headers);
            ctx.getResolver().extractAndStoreVariables(dataRow, keyMap, executionVariable);
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    @When("提取並儲存變數")
    public void 提取並儲存變數() {
        try {
            Map<Integer, String> keyMap = ctx.getResolver().parseContextKeys(headers);
            ctx.getResolver().extractAndStoreVariables(dataRow, keyMap, executionVariable);
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    // ========== When: 解析變數引用 null ==========

    @When("解析變數引用 null")
    public void 解析變數引用null() {
        ctx.setResolveResult(ctx.getResolver().resolveVariable(null));
    }

    // ========== When: 解析約束條件 ==========

    @When("解析約束條件字串 {string}")
    public void 解析約束條件字串(String constraintStr) {
        try {
            Method parseMethod = ctx.getResolver().getClass()
                    .getDeclaredMethod("parseConstraints", String.class);
            parseMethod.setAccessible(true);
            parsedConstraints = (List<?>) parseMethod.invoke(ctx.getResolver(), constraintStr);
        } catch (Exception e) {
            throw new RuntimeException("反射呼叫 parseConstraints 失敗", e);
        }
    }

    // ========== Then: context key 驗證 ==========

    @Then("var context key map 為:")
    public void var_contextKeyMap為(String jsonStr) {
        assertNotNull(contextKeyMap, "contextKeyMap 不應為 null");
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> expected = mapper.readValue(jsonStr.trim(), new TypeReference<Map<String, String>>() {});
            assertEquals(expected.size(), contextKeyMap.size(), "context key 數量不符");
            for (Map.Entry<String, String> entry : expected.entrySet()) {
                int index = Integer.parseInt(entry.getKey());
                assertEquals(entry.getValue(), contextKeyMap.get(index),
                        "索引 " + index + " 的 context key 不符");
            }
        } catch (Exception e) {
            throw new RuntimeException("解析 JSON 失敗: " + jsonStr, e);
        }
    }

    // ========== Then: scenarioContext 驗證 ==========

    @Then("scenarioContext 的 {string} 應該等於整數 {int}")
    public void scenarioContext的應該等於整數(String key, int expected) {
        Object actual = ctx.getScenarioContext().get(key);
        assertNotNull(actual, "scenarioContext 的 '" + key + "' 不應為 null");
        assertEquals(expected, ((Number) actual).intValue());
    }

    @Then("scenarioContext 的 {string} 應該等於 {string}")
    public void scenarioContext的應該等於(String key, String expected) {
        Object actual = ctx.getScenarioContext().get(key);
        assertNotNull(actual, "scenarioContext 的 '" + key + "' 不應為 null");
        assertEquals(expected, actual.toString());
    }

    @Then("scenarioContext 的 {string} 應該為 null")
    public void scenarioContext的應該為null(String key) {
        Object actual = ctx.getScenarioContext().get(key);
        assertNull(actual, "scenarioContext 的 '" + key + "' 應該為 null");
    }

    // ========== Then: 結果驗證 ==========

    @Then("結果應該等於整數 {int}")
    public void 結果應該等於整數(int expected) {
        Object result = ctx.getResolveResult();
        assertNotNull(result, "結果不應為 null");
        assertEquals(expected, ((Number) result).intValue());
    }

    @Then("結果應該等於字串 {string}")
    public void 結果應該等於字串(String expected) {
        Object result = ctx.getResolveResult();
        assertNotNull(result, "結果不應為 null");
        assertEquals(expected, result.toString());
    }

    @Then("結果應該為 null")
    public void 結果應該為null() {
        assertNull(ctx.getResolveResult(), "結果應該為 null");
    }

    @Then("結果應該等於 LocalTime {word}")
    public void 結果應該等於LocalTime(String timeStr) {
        Object result = ctx.getResolveResult();
        assertNotNull(result, "結果不應為 null");
        assertTrue(result instanceof LocalTime,
                "結果應該是 LocalTime 類型，實際為 " + result.getClass().getSimpleName());
        assertEquals(LocalTime.parse(timeStr), result);
    }

    // ========== Then: 例外驗證 ==========

    @Then("應該拋出 IllegalArgumentException")
    public void 應該拋出IllegalArgumentException() {
        assertNotNull(ctx.getThrownException(), "應該拋出異常但沒有");
        assertTrue(ctx.getThrownException() instanceof IllegalArgumentException,
                "應該是 IllegalArgumentException，實際為 " + ctx.getThrownException().getClass().getSimpleName());
    }

    @Then("應該拋出 IllegalStateException")
    public void 應該拋出IllegalStateException() {
        assertNotNull(ctx.getThrownException(), "應該拋出異常但沒有");
        assertTrue(ctx.getThrownException() instanceof IllegalStateException,
                "應該是 IllegalStateException，實際為 " + ctx.getThrownException().getClass().getSimpleName());
    }

    @Then("錯誤訊息包含 {string} 和 {string}")
    public void 錯誤訊息包含(String keyword1, String keyword2) {
        assertNotNull(ctx.getThrownException());
        String message = ctx.getThrownException().getMessage();
        assertTrue(message.contains(keyword1),
                "錯誤訊息應包含 '" + keyword1 + "'，實際為: " + message);
        assertTrue(message.contains(keyword2),
                "錯誤訊息應包含 '" + keyword2 + "'，實際為: " + message);
    }

    @Then("不應該拋出異常")
    public void 不應該拋出異常() {
        assertNull(ctx.getThrownException(),
                "不應該拋出異常，但拋出了: " +
                        (ctx.getThrownException() != null ? ctx.getThrownException().getMessage() : ""));
    }

    // ========== Then: 約束條件驗證 ==========

    @Then("約束條件數量為 {int}")
    public void 約束條件數量為(int count) {
        assertNotNull(parsedConstraints, "parsedConstraints 不應為 null");
        assertEquals(count, parsedConstraints.size());
    }

    @Then("約束條件參數應該包含 {string}")
    public void 約束條件參數應該包含(String expected) {
        assertNotNull(parsedConstraints);
        assertFalse(parsedConstraints.isEmpty(), "約束條件列表不應為空");
        try {
            Object constraint = parsedConstraints.get(0);
            Method getParams = constraint.getClass().getDeclaredMethod("getParams");
            getParams.setAccessible(true);
            String params = (String) getParams.invoke(constraint);
            assertTrue(params.contains(expected),
                    "約束條件參數應包含 '" + expected + "'，實際為: " + params);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("反射呼叫 getParams 失敗", e);
        }
    }
}
