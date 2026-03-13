package ai.specformula.core.instruction;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.http.TestResponse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiResponse;
import ai.specformula.core.spec.api.model.ApiSpec;
import io.cucumber.datatable.DataTable;

/**
 * DataTable 格式的 API 回應驗證輔助工具。
 * <p>
 * 驗證 API 回應的 HTTP 狀態碼和回應內容。 使用 Cucumber DataTable 進行欄位層級的比對，支援：
 * <ul>
 * <li>VAR-System 變數擷取（>contextKey / &lt;executionKey）</li>
 * <li>$variable 變數引用</li>
 * <li>CAS 約束斷言（&amp;constraint(params)）</li>
 * <li>TIME-System 時間比對</li>
 * </ul>
 * </p>
 */
public class DataTableResponseValidate {

    private static final System.Logger LOG = System.getLogger(DataTableResponseValidate.class.getName());

    private final ISAFeatureArgumentResolver resolver;
    private final Supplier<ScenarioContext> contextSupplier;
    private final ApiSpec apiSpec;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DataTableResponseValidate(ISAFeatureArgumentResolver resolver,
            Supplier<ScenarioContext> contextSupplier,
            ApiSpec apiSpec) {
        this.resolver = resolver;
        this.contextSupplier = contextSupplier;
        this.apiSpec = apiSpec;
    }

    /**
     * 驗證 API 回應的 HTTP 狀態碼和 DataTable 欄位。
     *
     * @param summary API summary
     * @param statusCode 預期的 HTTP 狀態碼
     * @param dataTable 預期的欄位值 DataTable（可為 null，僅驗證狀態碼）
     */
    public void validate(String summary, String statusCode, DataTable dataTable) throws Exception {
        ScenarioContext ctx = contextSupplier.get();
        TestResponse result = ctx.getLastResponse();

        if (result == null) {
            throw new IllegalStateException(
                    "[ResponseValidate:DataTable] 沒有可驗證的 HTTP 回應。"
                    + "請確認已執行 API 呼叫。");
        }

        // 驗證 HTTP 狀態碼
        if (statusCode != null) {
            int expectedStatus = Integer.parseInt(statusCode);
            int actualStatus = result.getStatus();
            if (expectedStatus != actualStatus) {
                String body = result.getBody();
                throw new AssertionError(String.format("""
                                                       [ResponseValidate:DataTable] HTTP \u72c0\u614b\u78bc\u4e0d\u5339\u914d\u3002
                                                         API: %s
                                                         \u9810\u671f: %d
                                                         \u5be6\u969b: %d
                                                         \u56de\u61c9: %s""",
                        summary, expectedStatus, actualStatus, body));
            }
        }

        // 若無 DataTable，僅驗證狀態碼即可
        if (dataTable == null) {
            return;
        }

        // 解析回應 JSON
        String responseBody = result.getBody();
        if (responseBody == null || responseBody.trim().isEmpty()) {
            // API spec 未定義 response schema 時，允許空回應（如 204 No Content）
            if (!hasResponseSchema(summary, statusCode)) {
                LOG.log(System.Logger.Level.INFO,
                        "[ResponseValidate:DataTable] API spec 未定義 response schema，跳過欄位驗證。API: {0}", summary);
                return;
            }
            throw new AssertionError(
                    "[ResponseValidate:DataTable] API spec 定義了 " + statusCode + " 的 response schema，"
                    + "但實際回應內容為空，不符合預期格式。API: " + summary);
        }

        Map<String, Object> responseMap;
        try {
            responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            throw new AssertionError(
                    summary + """
                              [ResponseValidate:DataTable] \u56de\u61c9\u5167\u5bb9\u975e\u5408\u6cd5 JSON \u7269\u4ef6\uff0c\u4e0d\u7b26\u5408\u9810\u671f\u683c\u5f0f\u3002
                                API: """ + "\n  回應: " + responseBody, e);
        }

        // 解析 DataTable
        List<String> headers = new ArrayList<>(dataTable.row(0));
        boolean allBlank = headers.stream().allMatch(h -> h == null || h.trim().isEmpty());
        if (allBlank) {
            return;
        }

        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        if (rows.isEmpty()) {
            return;
        }

        Map<String, String> row = rows.get(0);

        // 解析 context key 映射（>contextKey 欄位）
        Map<Integer, String> contextKeyMap = resolver.parseContextKeys(headers);

        // 欄位層級驗證
        for (String header : headers) {
            String cleanHeader = header.trim();

            // 跳過 VAR-System 欄位（> 和 < 前綴）
            if (cleanHeader.startsWith(">") || cleanHeader.startsWith("<")) {
                continue;
            }

            String expectedValue = row.get(header);
            if (expectedValue == null || expectedValue.isEmpty()) {
                continue;
            }

            // 從回應 JSON 取得實際值
            Object actualValue = getNestedValue(responseMap, cleanHeader);

            // 使用 resolver 進行比對與驗證
            Object resolved = resolver.resolveAndValidate(expectedValue, actualValue, cleanHeader, summary);

            // resolveAndValidate 回傳 null 表示已完成驗證（包含 $notnull、CAS、時間比對等）
            // 回傳非 null 表示需要進行一般字串比對
            if (resolved != null) {
                String resolvedStr = resolved.toString();
                String actualStr = actualValue != null ? actualValue.toString() : "";
                if (!resolvedStr.equals(actualStr)
                        && !(actualValue instanceof Number && numericEquals(resolvedStr, actualStr))) {
                    throw new AssertionError(String.format(
                            "[ResponseValidate:DataTable] %s.%s 值不匹配。\n  預期: %s\n  實際: %s",
                            summary, cleanHeader, resolvedStr, actualStr));
                }
            }
        }

        // VAR-System 變數擷取
        if (!contextKeyMap.isEmpty()) {
            List<String> dataRow = new ArrayList<>();
            for (String header : headers) {
                dataRow.add(row.get(header));
            }
            resolver.extractAndStoreVariables(dataRow, contextKeyMap, responseMap);
            LOG.log(System.Logger.Level.INFO,
                    "[ResponseValidate:DataTable] 已擷取 {0} 個變數。API: {1}",
                    contextKeyMap.size(), summary);
        }

        // 驗證回應 JSON 是否完整對應 api-spec 中的 response schema
        JsonNode actualJson = objectMapper.readTree(responseBody);
        ResponseSchemaValidator.validate(actualJson, summary, statusCode,
                apiSpec, "ResponseValidate:DataTable");
    }

    /**
     * 檢查 API spec 是否有為該 statusCode 定義 response schema。
     */
    private boolean hasResponseSchema(String summary, String statusCode) {
        if (apiSpec == null || summary == null || statusCode == null) {
            return false;
        }
        ApiOperation operation = apiSpec.findBySummary(summary);
        if (operation == null || operation.getResponses() == null) {
            return false;
        }
        ApiResponse apiResponse = operation.getResponses().get(statusCode);
        return apiResponse != null && apiResponse.getSchema() != null;
    }

    /**
     * 使用 BigDecimal 進行數值語義比較（JSON RFC 8259）。
     */
    private static boolean numericEquals(String a, String b) {
        try {
            return new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * 從巢狀結構中依路徑取值。 支援 JSON path：dot-notation（data.user.id）、array
     * index（users[0].name）。
     */
    @SuppressWarnings("unchecked")
    private Object getNestedValue(Map<String, Object> map, String path) {
        if (map == null || path == null) {
            return null;
        }

        String[] segments = path.split("\\.");
        Object current = map;
        for (String segment : segments) {
            if (current == null) {
                return null;
            }

            // 解析 array index：fieldName[index]
            int bracketStart = segment.indexOf('[');
            if (bracketStart >= 0) {
                String fieldName = segment.substring(0, bracketStart);
                int bracketEnd = segment.indexOf(']', bracketStart);
                if (bracketEnd < 0) {
                    return null;
                }
                int index = Integer.parseInt(segment.substring(bracketStart + 1, bracketEnd));

                if (!fieldName.isEmpty() && current instanceof Map) {
                    current = ((Map<String, Object>) current).get(fieldName);
                }
                if (!(current instanceof List)) {
                    return null;
                }
                List<?> list = (List<?>) current;
                if (index < 0 || index >= list.size()) {
                    return null;
                }
                current = list.get(index);
            } else if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(segment);
            } else {
                return null;
            }
        }
        return current;
    }
}
