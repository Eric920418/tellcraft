package ai.specformula.core.instruction;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.core.http.TestRequest;
import ai.specformula.core.http.TestResponse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiParameter;
import ai.specformula.core.spec.api.model.ApiSpec;
import io.cucumber.datatable.DataTable;

/**
 * API 呼叫輔助工具。
 * <p>
 * 負責根據 ISA 指令的 DataTable 建構 HTTP 請求，透過 HttpClientAdapter 執行，並將回應存入 ScenarioContext。
 * 由 SpecFormulaBackend.loadGlue() 建立，整個 Test Suite 生命週期共用。
 * </p>
 */
public class ApiCall {

    private static final Pattern SEG = Pattern.compile("([A-Za-z0-9_]+)(?:\\[(\\d+)])?");
    private static final DateTimeFormatter TIME_FORMATTER
            = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final ISAFeatureArgumentResolver resolver;
    private final Supplier<ScenarioContext> contextSupplier;
    private final HttpClientAdapter httpClient;
    private final ObjectMapper objectMapper;
    private final ApiSpec apiSpec;
    private final String timeFormat;

    public ApiCall(ISAFeatureArgumentResolver resolver,
            Supplier<ScenarioContext> contextSupplier,
            HttpClientAdapter httpClient,
            ApiSpec apiSpec,
            String timeFormat) {
        this.resolver = resolver;
        this.contextSupplier = contextSupplier;
        this.httpClient = httpClient;
        this.objectMapper = new ObjectMapper();
        this.apiSpec = apiSpec;
        this.timeFormat = (timeFormat != null) ? timeFormat : "iso";
    }

    // ==================== 公開 API ====================
    public void invokeWithActor(DataTable dataTable, String summary,
            Supplier<String> tokenProvider) throws Exception {
        String token = (tokenProvider != null) ? tokenProvider.get() : null;
        invokeInternal(dataTable, summary, token);
    }

    public void invokeWithoutActor(DataTable dataTable, String summary) throws Exception {
        invokeInternal(dataTable, summary, null);
    }

    // ==================== 內部邏輯 ====================
    private void invokeInternal(DataTable dataTable, String summary, String token) throws Exception {
        if (summary == null || summary.isBlank()) {
            throw new IllegalArgumentException("[ApiCall] 缺少 API summary。");
        }

        ApiOperation operation = apiSpec.findBySummary(summary);
        if (operation == null) {
            throw new IllegalArgumentException(
                    "[ApiCall] 找不到 API 操作 '" + summary + "'。"
                    + "請確認 api-spec.yml 中定義了對應的 summary。");
        }

        String urlTemplate = operation.getPath();
        String methodName = operation.getMethod();
        if (methodName == null) {
            throw new IllegalArgumentException("[ApiCall] API 操作 '" + summary + "' 缺少 method。");
        }
        String method = methodName.toUpperCase();

        Set<String> pathParamNames = new LinkedHashSet<>();
        Set<String> queryParamNames = new LinkedHashSet<>();
        Set<String> headerParamNames = new LinkedHashSet<>();

        if (operation.getParameters() != null) {
            for (ApiParameter param : operation.getParameters()) {
                if (param.getIn() == null) {
                    continue;
                }
                switch (param.getIn()) {
                    case "path" ->
                        pathParamNames.add(param.getName());
                    case "query" ->
                        queryParamNames.add(param.getName());
                    case "header" ->
                        headerParamNames.add(param.getName());
                }
            }
        }

        validateTimeFormat(this.timeFormat);

        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        if (rows.isEmpty()) {
            executeEmptyDataTableRequest(urlTemplate, method, token);
            return;
        }

        Map<String, String> row = rows.get(0);
        List<String> headers = new ArrayList<>(dataTable.row(0));

        Map<Integer, String> contextKeyMap = resolver.parseContextKeys(headers);

        Map<String, String> pathParams = new HashMap<>();
        Map<String, String> queryParams = new HashMap<>();
        Map<String, String> headerParams = new HashMap<>();
        Map<String, String> bodyParams = new HashMap<>();

        for (String header : headers) {
            String cleanHeader = header.trim();
            String value = row.get(header);
            if (value == null) {
                continue;
            }
            if (cleanHeader.startsWith("<") || cleanHeader.startsWith(">")) {
                continue;
            }

            ISAFeatureArgumentResolver.ColumnInfo columnInfo = resolver.parseColumnPrefix(cleanHeader);
            Object resolvedValue = resolver.resolveVariable(value);
            String actualValue = resolveValue(resolvedValue, this.timeFormat);

            if (!columnInfo.prefix.isEmpty()) {
                switch (columnInfo.prefix) {
                    case "P" -> {
                        if (actualValue != null) {
                            pathParams.put(columnInfo.name, actualValue);

                        }
                    }
                    case "Q" -> {
                        if (actualValue != null) {
                            queryParams.put(columnInfo.name, actualValue);

                        }
                    }
                    case "H" -> {
                        if (actualValue != null) {
                            headerParams.put(columnInfo.name, actualValue);

                        }
                    }
                }
                continue;
            }

            String paramName = columnInfo.name;
            if (pathParamNames.contains(paramName) && !pathParams.containsKey(paramName) && actualValue != null) {
                pathParams.put(paramName, actualValue);
            }
            if (queryParamNames.contains(paramName) && !queryParams.containsKey(paramName) && actualValue != null) {
                queryParams.put(paramName, actualValue);
            }
            if (headerParamNames.contains(paramName) && !headerParams.containsKey(paramName) && actualValue != null) {
                headerParams.put(paramName, actualValue);
            }

            bodyParams.put(paramName, actualValue);
        }

        // 路徑參數替換
        String url = urlTemplate;
        for (Map.Entry<String, String> entry : pathParams.entrySet()) {
            url = url.replace("{" + entry.getKey() + "}", entry.getValue());
        }

        // 建構請求
        TestRequest.Builder requestBuilder = TestRequest.builder(method, url);

        if (token != null && !token.isEmpty()) {
            requestBuilder.header("Authorization", "Bearer " + token);
        }

        for (Map.Entry<String, String> qe : queryParams.entrySet()) {
            String qKey = qe.getKey();
            String qVal = qe.getValue();
            if (qKey != null && qVal != null) {
                requestBuilder.queryParam(qKey, qVal);
            }
        }

        for (Map.Entry<String, String> he : headerParams.entrySet()) {
            String hKey = he.getKey();
            String hVal = he.getValue();
            if (hKey != null && hVal != null) {
                requestBuilder.header(hKey, hVal);
            }
        }

        if (!bodyParams.isEmpty()) {
            ObjectNode body = objectMapper.createObjectNode();
            for (Map.Entry<String, String> entry : bodyParams.entrySet()) {
                setJson(body, entry.getKey(), entry.getValue());
            }
            String json = objectMapper.writeValueAsString(body);
            requestBuilder.header("Content-Type", "application/json");
            requestBuilder.body(json);
        }

        // 執行請求
        TestResponse response = httpClient.execute(requestBuilder.build());
        getScenarioContext().setLastResponse(response);

        // 變數擷取
        if (!contextKeyMap.isEmpty()) {
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    Map<String, Object> executionVariable = objectMapper.readValue(
                            responseBody,
                            new TypeReference<Map<String, Object>>() {
                    }
                    );

                    List<String> dataRow = new ArrayList<>();
                    for (String header : headers) {
                        dataRow.add(row.get(header));
                    }

                    resolver.extractAndStoreVariables(dataRow, contextKeyMap, executionVariable);
                } catch (JsonProcessingException e) {
                    // 回應非 JSON 物件（例如陣列或空白），跳過變數擷取
                }
            }
        }
    }

    private void executeEmptyDataTableRequest(String urlTemplate, String method, String token) throws Exception {
        TestRequest.Builder requestBuilder = TestRequest.builder(method, urlTemplate);

        if (token != null && !token.isEmpty()) {
            requestBuilder.header("Authorization", "Bearer " + token);
        }

        TestResponse response = httpClient.execute(requestBuilder.build());
        getScenarioContext().setLastResponse(response);
    }

    private ScenarioContext getScenarioContext() {
        return contextSupplier.get();
    }

    // ==================== 值格式化 ====================
    private String resolveValue(Object resolvedValue, String timeFormat) {
        if (resolvedValue == null) {
            return null;
        }

        if (resolvedValue instanceof java.time.ZonedDateTime zdt) {
            return formatZonedDateTime(zdt, timeFormat);
        }
        if (resolvedValue instanceof java.time.LocalDate ld) {
            return formatLocalDate(ld, timeFormat);
        }
        if (resolvedValue instanceof java.time.LocalTime lt) {
            return formatLocalTime(lt);
        }
        return resolvedValue.toString();
    }

    private String formatZonedDateTime(java.time.ZonedDateTime dateTime, String timeFormat) {
        if (timeFormat == null || "ISO".equalsIgnoreCase(timeFormat)) {
            return dateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }
        return switch (timeFormat.toUpperCase()) {
            case "TIMESTAMP" ->
                String.valueOf(dateTime.toInstant().toEpochMilli());
            case "EPOCH" ->
                String.valueOf(dateTime.toEpochSecond());
            case "DATE_ONLY" ->
                dateTime.toLocalDate().toString();
            case "TIME_ONLY" ->
                dateTime.toLocalTime().format(TIME_FORMATTER);
            default ->
                dateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        };
    }

    private String formatLocalDate(java.time.LocalDate date, String timeFormat) {
        if (timeFormat == null || "ISO".equalsIgnoreCase(timeFormat)) {
            return date.toString();
        }
        return switch (timeFormat.toUpperCase()) {
            case "TIMESTAMP" ->
                String.valueOf(date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
            case "EPOCH" ->
                String.valueOf(date.atStartOfDay(java.time.ZoneId.systemDefault()).toEpochSecond());
            case "DATE_ONLY" ->
                date.toString();
            case "TIME_ONLY" ->
                "00:00:00";
            default ->
                date.toString();
        };
    }

    private String formatLocalTime(java.time.LocalTime time) {
        return time.format(TIME_FORMATTER);
    }

    private void validateTimeFormat(String timeFormat) {
        if (timeFormat == null) {
            return;
        }
        String upper = timeFormat.toUpperCase();
        if (!upper.equals("ISO") && !upper.equals("TIMESTAMP") && !upper.equals("EPOCH")
                && !upper.equals("DATE_ONLY") && !upper.equals("TIME_ONLY")) {
            throw new IllegalArgumentException(
                    "不支援的時間格式: " + timeFormat + "。支援的格式: ISO, TIMESTAMP, EPOCH, DATE_ONLY, TIME_ONLY");
        }
    }

    // ==================== JSON 建構 ====================
    private static void setJson(ObjectNode root, String path, String value) {
        if (path == null || path.isEmpty()) {
            return;
        }
        String[] parts = path.split("\\.");
        ObjectNode curr = root;

        for (int i = 0; i < parts.length; i++) {
            Matcher m = SEG.matcher(parts[i]);
            if (!m.matches()) {
                throw new IllegalArgumentException("Bad path: " + path);
            }
            String name = m.group(1);
            String idxStr = m.group(2);
            boolean last = (i == parts.length - 1);

            if (idxStr == null) {
                if (last) {
                    curr.set(name, toNode(value));
                } else {
                    curr = curr.withObject(name);
                }
            } else {
                ArrayNode arr = ensureArray(curr, name);
                int idx = Integer.parseInt(idxStr);
                ensureArraySize(arr, idx + 1);

                if (last) {
                    arr.set(idx, toNode(value));
                } else {
                    JsonNode elem = arr.get(idx);
                    if (!(elem instanceof ObjectNode)) {
                        ObjectNode child = JsonNodeFactory.instance.objectNode();
                        arr.set(idx, child);
                        curr = child;
                    } else {
                        curr = (ObjectNode) elem;
                    }
                }
            }
        }
    }

    private static ArrayNode ensureArray(ObjectNode parent, String field) {
        JsonNode n = parent.get(field);
        if (!(n instanceof ArrayNode)) {
            ArrayNode arr = JsonNodeFactory.instance.arrayNode();
            parent.set(field, arr);
            return arr;
        }
        return (ArrayNode) n;
    }

    private static void ensureArraySize(ArrayNode arr, int size) {
        while (arr.size() < size) {
            arr.add(NullNode.instance);
        }
    }

    private static JsonNode toNode(String v) {
        if (v == null) {
            return NullNode.instance;
        }
        String s = v.trim();

        if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
            try {
                return new ObjectMapper().readTree(s);
            } catch (JsonProcessingException ignore) {
                // 解析失敗，視為文字
            }
        }
        return TextNode.valueOf(v);
    }

    // ==================== Getters ====================
    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public HttpClientAdapter getHttpClient() {
        return httpClient;
    }
}
