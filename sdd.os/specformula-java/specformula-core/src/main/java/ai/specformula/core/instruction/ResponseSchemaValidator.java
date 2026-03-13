package ai.specformula.core.instruction;

import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiResponse;
import ai.specformula.core.spec.api.model.ApiSchema;
import ai.specformula.core.spec.api.model.ApiSpec;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * 驗證 API 回應 JSON 是否完整對應 api-spec 中定義的 response schema。
 * <p>
 * 驗證規則：
 * <ul>
 *   <li>回應中的每個欄位型別必須與 schema 定義一致</li>
 *   <li>值為 null 時不驗證型別</li>
 *   <li>schema 中定義的所有 properties 都必須出現在回應中（除非值為 null）</li>
 *   <li>支援巢狀 object 和 array 遞迴驗證</li>
 * </ul>
 */
public class ResponseSchemaValidator {

    private static final System.Logger LOG = System.getLogger(ResponseSchemaValidator.class.getName());

    /**
     * 根據 summary 和 statusCode 查找 response schema，驗證 actualJson 是否符合。
     *
     * @param actualJson      實際的回應 JSON
     * @param summary         API summary（用於查找 ApiOperation）
     * @param statusCode      HTTP 狀態碼（用於查找 ApiResponse）
     * @param apiSpec         API 規格定義
     * @param label           日誌前綴（如 "ResponseValidate:DataTable"）
     */
    public static void validate(JsonNode actualJson, String summary, String statusCode,
                                ApiSpec apiSpec, String label) {
        if (apiSpec == null || summary == null || statusCode == null) return;

        ApiOperation operation = apiSpec.findBySummary(summary);
        if (operation == null) return;

        Map<String, ApiResponse> responses = operation.getResponses();
        if (responses == null) return;

        ApiResponse apiResponse = responses.get(statusCode);
        if (apiResponse == null) return;

        ApiSchema schema = apiResponse.getSchema();
        if (schema == null) return;

        List<String> errors = new ArrayList<>();
        validateNode(actualJson, schema, "$", errors);

        if (!errors.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("[%s] API '%s' 回應不符合 schema 定義（status=%s）：\n",
                    label, summary, statusCode));
            for (String err : errors) {
                sb.append("  - ").append(err).append("\n");
            }
            throw new AssertionError(sb.toString().trim());
        }

        LOG.log(System.Logger.Level.DEBUG,
                "[{0}] Schema 驗證通過。API: {1}, status: {2}", label, summary, statusCode);
    }

    /**
     * 遞迴驗證 JsonNode 是否符合 ApiSchema 定義。
     */
    private static void validateNode(JsonNode actual, ApiSchema schema, String path, List<String> errors) {
        if (actual == null || actual.isNull() || actual.isMissingNode()) {
            // 值為 null，不驗證型別
            return;
        }

        String schemaType = schema.getType();
        if (schemaType == null) return;

        switch (schemaType) {
            case "object" -> validateObject(actual, schema, path, errors);
            case "array" -> validateArray(actual, schema, path, errors);
            case "string" -> {
                if (!actual.isTextual()) {
                    errors.add(String.format("路徑 %s 型別不符：schema 定義為 string，實際為 %s",
                            path, describeNodeType(actual)));
                }
            }
            case "integer" -> {
                if (!actual.isIntegralNumber()) {
                    errors.add(String.format("路徑 %s 型別不符：schema 定義為 integer，實際為 %s",
                            path, describeNodeType(actual)));
                }
            }
            case "number" -> {
                if (!actual.isNumber()) {
                    errors.add(String.format("路徑 %s 型別不符：schema 定義為 number，實際為 %s",
                            path, describeNodeType(actual)));
                }
            }
            case "boolean" -> {
                if (!actual.isBoolean()) {
                    errors.add(String.format("路徑 %s 型別不符：schema 定義為 boolean，實際為 %s",
                            path, describeNodeType(actual)));
                }
            }
            // 其他型別不做嚴格檢查
        }
    }

    private static void validateObject(JsonNode actual, ApiSchema schema, String path, List<String> errors) {
        if (!actual.isObject()) {
            errors.add(String.format("路徑 %s 型別不符：schema 定義為 object，實際為 %s",
                    path, describeNodeType(actual)));
            return;
        }

        Map<String, ApiSchema> properties = schema.getProperties();
        if (properties == null) return;

        List<String> requiredFields = schema.getRequired();

        // 驗證 schema 定義的每個 property 是否存在且型別正確
        for (Map.Entry<String, ApiSchema> entry : properties.entrySet()) {
            String propName = entry.getKey();
            ApiSchema propSchema = entry.getValue();
            JsonNode propNode = actual.get(propName);
            String propPath = path + "." + propName;

            if (propNode == null || propNode.isMissingNode()) {
                // 欄位不存在：僅在 required 清單中才報錯，否則視為 null（允許）
                if (requiredFields != null && requiredFields.contains(propName)) {
                    errors.add(String.format("路徑 %s 缺少必填欄位 '%s'（schema 定義為 %s）",
                            path, propName, propSchema.getType()));
                }
                continue;
            }

            // null 值不驗證型別
            if (propNode.isNull()) continue;

            validateNode(propNode, propSchema, propPath, errors);
        }

        // 驗證回應中是否有 schema 未定義的欄位
        Iterator<String> fieldNames = actual.fieldNames();
        while (fieldNames.hasNext()) {
            String fieldName = fieldNames.next();
            if (!properties.containsKey(fieldName)) {
                errors.add(String.format("路徑 %s 包含 schema 未定義的欄位 '%s'",
                        path, fieldName));
            }
        }
    }

    private static void validateArray(JsonNode actual, ApiSchema schema, String path, List<String> errors) {
        if (!actual.isArray()) {
            errors.add(String.format("路徑 %s 型別不符：schema 定義為 array，實際為 %s",
                    path, describeNodeType(actual)));
            return;
        }

        ApiSchema itemsSchema = schema.getItems();
        if (itemsSchema == null) return;

        for (int i = 0; i < actual.size(); i++) {
            validateNode(actual.get(i), itemsSchema, path + "[" + i + "]", errors);
        }
    }

    private static String describeNodeType(JsonNode node) {
        if (node == null) return "null";
        if (node.isTextual()) return "string";
        if (node.isIntegralNumber()) return "integer";
        if (node.isFloat() || node.isDouble()) return "number";
        if (node.isBoolean()) return "boolean";
        if (node.isObject()) return "object";
        if (node.isArray()) return "array";
        if (node.isNull()) return "null";
        return node.getNodeType().toString();
    }
}
