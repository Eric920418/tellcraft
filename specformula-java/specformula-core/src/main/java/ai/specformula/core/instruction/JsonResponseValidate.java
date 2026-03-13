package ai.specformula.core.instruction;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;

import java.util.Iterator;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.http.TestResponse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiResponse;
import ai.specformula.core.spec.api.model.ApiSpec;
import io.cucumber.docstring.DocString;

/**
 * JSON 格式的 API 回應驗證輔助工具。
 * <p>
 * 驗證 API 回應的 HTTP 狀態碼和 JSON 結構。
 * 使用 DocString 提供預期的 JSON 內容，支援：
 * <ul>
 *   <li>$variable 變數引用（在預期 JSON 的字串值中）</li>
 *   <li>$notnull 非空驗證</li>
 *   <li>巢狀 JSON 物件和陣列比對</li>
 *   <li>CAS 約束斷言（&amp;constraint(params)）</li>
 *   <li>VAR-System 變數擷取（&gt;contextKey / &lt;executionKey）</li>
 * </ul>
 * </p>
 */
public class JsonResponseValidate {

    private static final System.Logger LOG = System.getLogger(JsonResponseValidate.class.getName());

    private final ISAFeatureArgumentResolver resolver;
    private final Supplier<ScenarioContext> contextSupplier;
    private final ApiSpec apiSpec;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonResponseValidate(ISAFeatureArgumentResolver resolver,
                                       Supplier<ScenarioContext> contextSupplier,
                                       ApiSpec apiSpec) {
        this.resolver = resolver;
        this.contextSupplier = contextSupplier;
        this.apiSpec = apiSpec;
    }

    /**
     * 驗證 API 回應的 HTTP 狀態碼和 JSON 結構。
     *
     * @param summary    API summary
     * @param statusCode 預期的 HTTP 狀態碼
     * @param docString  預期的 JSON 內容（可為 null，僅驗證狀態碼）
     */
    public void validate(String summary, String statusCode, DocString docString) throws Exception {
        ScenarioContext ctx = contextSupplier.get();
        TestResponse result = ctx.getLastResponse();

        if (result == null) {
            throw new IllegalStateException(
                    "[ResponseValidate:JSON] 沒有可驗證的 HTTP 回應。" +
                    "請確認已執行 API 呼叫。");
        }

        // 驗證 HTTP 狀態碼
        if (statusCode != null) {
            int expectedStatus = Integer.parseInt(statusCode);
            int actualStatus = result.getStatus();
            if (expectedStatus != actualStatus) {
                String body = result.getBody();
                throw new AssertionError(String.format("""
                                                       [ResponseValidate:JSON] HTTP \u72c0\u614b\u78bc\u4e0d\u5339\u914d\u3002
                                                         API: %s
                                                         \u9810\u671f: %d
                                                         \u5be6\u969b: %d
                                                         \u56de\u61c9: %s""",
                        summary, expectedStatus, actualStatus, body));
            }
        }

        // 若無 DocString，僅驗證狀態碼即可
        if (docString == null) return;

        // 解析回應 JSON
        String responseBody = result.getBody();
        if (responseBody == null || responseBody.trim().isEmpty()) {
            // API spec 未定義 response schema 時，允許空回應（如 204 No Content）
            if (!hasResponseSchema(summary, statusCode)) {
                LOG.log(System.Logger.Level.INFO,
                        "[ResponseValidate:JSON] API spec 未定義 response schema，跳過 JSON 驗證。API: {0}", summary);
                return;
            }
            throw new AssertionError(
                    "[ResponseValidate:JSON] API spec 定義了 " + statusCode + " 的 response schema，" +
                    "但實際回應內容為空，不符合預期格式。API: " + summary);
        }

        JsonNode actualTree = objectMapper.readTree(responseBody);
        JsonNode expectedTree = objectMapper.readTree(docString.getContent());

        // 遞迴比對 JSON 結構（支援變數解析）
        compareJsonNodes(expectedTree, actualTree, "$", summary);

        // 驗證回應 JSON 是否完整對應 api-spec 中的 response schema
        ResponseSchemaValidator.validate(actualTree, summary, statusCode,
                apiSpec, "ResponseValidate:JSON");

        LOG.log(System.Logger.Level.INFO,
                "[ResponseValidate:JSON] JSON 驗證通過。API: {0}", summary);
    }

    /**
     * 遞迴比對 JSON 節點。
     * 預期值中的字串會透過 resolver 解析變數引用。
     */
    private void compareJsonNodes(JsonNode expected, JsonNode actual, String path, String summary) {
        if (expected.isObject()) {
            if (!actual.isObject()) {
                throw new AssertionError(String.format(
                        "[ResponseValidate:JSON] %s 型別不匹配。\n  路徑: %s\n  預期: Object\n  實際: %s",
                        summary, path, actual.getNodeType()));
            }

            Iterator<Map.Entry<String, JsonNode>> fields = expected.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String fieldName = field.getKey();
                JsonNode expectedChild = field.getValue();

                // VAR-System: >contextKey / <executionKey 變數擷取
                if (fieldName.startsWith(">")) {
                    String contextKey = fieldName.substring(1);
                    if (expectedChild.isTextual() && expectedChild.textValue().startsWith("<")) {
                        String executionKey = expectedChild.textValue().substring(1);
                        JsonNode actualChild = actual.get(executionKey);
                        if (actualChild != null && !actualChild.isNull() && !actualChild.isMissingNode()) {
                            Object value = extractActualValue(actualChild);
                            if (value != null) {
                                contextSupplier.get().put(contextKey, value.toString());
                            }
                        }
                    }
                    continue;
                }

                JsonNode actualChild = actual.get(fieldName);

                if (actualChild == null || actualChild.isMissingNode()) {
                    // $notnull 僅需確認欄位存在，這裡欄位不存在
                    if (expectedChild.isTextual() && "$notnull".equals(expectedChild.textValue())) {
                        throw new AssertionError(String.format(
                                "[ResponseValidate:JSON] %s.%s 應該存在且不為 null，但欄位不存在",
                                summary, fieldName));
                    }
                    throw new AssertionError(String.format(
                            "[ResponseValidate:JSON] %s 缺少欄位 '%s'。\n  路徑: %s",
                            summary, fieldName, path));
                }

                compareJsonNodes(expectedChild, actualChild, path + "." + fieldName, summary);
            }
        } else if (expected.isArray()) {
            if (!actual.isArray()) {
                throw new AssertionError(String.format(
                        "[ResponseValidate:JSON] %s 型別不匹配。\n  路徑: %s\n  預期: Array\n  實際: %s",
                        summary, path, actual.getNodeType()));
            }

            if (expected.size() != actual.size()) {
                throw new AssertionError(String.format(
                        "[ResponseValidate:JSON] %s 陣列長度不匹配。\n  路徑: %s\n  預期: %d\n  實際: %d",
                        summary, path, expected.size(), actual.size()));
            }

            for (int i = 0; i < expected.size(); i++) {
                compareJsonNodes(expected.get(i), actual.get(i), path + "[" + i + "]", summary);
            }
        } else if (expected.isTextual()) {
            String expectedText = expected.textValue();

            Object actualObj = extractActualValue(actual);
            Object resolved = resolver.resolveAndValidate(expectedText, actualObj, extractFieldName(path), summary);

            // resolveAndValidate 回傳 null 表示已由內部處理完畢（&constraint、時間/數值比對）
            if (resolved != null) {
                String resolvedStr = resolved.toString();
                String actualStr = actualObj != null ? actualObj.toString() : "";
                if (!resolvedStr.equals(actualStr)) {
                    throw new AssertionError(String.format(
                            "[ResponseValidate:JSON] %s 值不匹配。\n  路徑: %s\n  預期: %s\n  實際: %s",
                            summary, path, resolvedStr, actualStr));
                }
            }
        } else {
            // 數值、布林、null 的直接比對
            if (!expected.equals(actual)) {
                // JSON RFC 8259: 數值語義比較（3000 == 3000.0, 1500.00 == 1500.0）
                if (expected.isNumber() && actual.isNumber()
                        && expected.decimalValue().compareTo(actual.decimalValue()) == 0) {
                    return;
                }
                throw new AssertionError(String.format(
                        "[ResponseValidate:JSON] %s 值不匹配。\n  路徑: %s\n  預期: %s\n  實際: %s",
                        summary, path, expected, actual));
            }
        }
    }

    /**
     * 從 JsonNode 提取 Java 原生值（用於傳遞給 resolver 的比對方法）。
     */
    private Object extractActualValue(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isTextual()) return node.textValue();
        if (node.isInt()) return node.intValue();
        if (node.isLong()) return node.longValue();
        if (node.isDouble() || node.isFloat()) return node.doubleValue();
        if (node.isBoolean()) return node.booleanValue();
        return node.toString();
    }

    /**
     * 從 JSON path 提取最後的欄位名稱。
     */
    private String extractFieldName(String path) {
        if (path == null) return "";
        int lastDot = path.lastIndexOf('.');
        return lastDot >= 0 ? path.substring(lastDot + 1) : path;
    }

    /**
     * 檢查 API spec 是否有為該 statusCode 定義 response schema。
     */
    private boolean hasResponseSchema(String summary, String statusCode) {
        if (apiSpec == null || summary == null || statusCode == null) return false;
        ApiOperation operation = apiSpec.findBySummary(summary);
        if (operation == null || operation.getResponses() == null) return false;
        ApiResponse apiResponse = operation.getResponses().get(statusCode);
        return apiResponse != null && apiResponse.getSchema() != null;
    }
}
