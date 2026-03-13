package ai.specformula.core.helper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.context.ScenarioContext;

/**
 * ISA Feature Argument Resolver
 *
 * 整合了三個系統：
 * 1. VAR-System (Variable System) - 變數符號系統
 *    - >contextKey: 定義要存入 scenario context 的變數名稱（header row）
 *    - <executionKey: 從 execution variable 取哪個欄位的值（data row）
 *    - $variableName: 引用 Context 中的值
 *
 * 2. CAS (Constraint Assertion System) - 約束斷言系統
 *    - &constraint(params): 約束斷言格式
 *
 * 3. TIME-System (Time Expression System) - 時間轉換系統
 *    - @time(...): 時間表達式轉換為 ZonedDateTime
 *    - @date(...): 日期表達式轉換為 LocalDate
 *    - @localtime(...): 時間表達式轉換為 LocalTime
 */
public class ISAFeatureArgumentResolver implements FeatureArgumentResolver {

    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();
    private final Supplier<ScenarioContext> scenarioContextSupplier;

    /**
     * 建構子：接受 Supplier 以延遲取得當前 Scenario 的 Context。
     * Resolver 在 loadGlue() 時建立（整個 Test Suite 生命週期），
     * 而 ScenarioContext 在 buildWorld() 時才建立（每個 Scenario）。
     */
    public ISAFeatureArgumentResolver(Supplier<ScenarioContext> scenarioContextSupplier) {
        this.scenarioContextSupplier = scenarioContextSupplier;
    }

    private ScenarioContext getScenarioContext() {
        return scenarioContextSupplier.get();
    }

    // ========== TIME-System: setNow 和 getNow ==========

    public void setNow(String timeString) {
        ZonedDateTime zonedDateTime = parseTimeExpression(timeString);
        getScenarioContext().putObject("now", zonedDateTime);
    }

    public ZonedDateTime getNow() {
        Object now = getScenarioContext().get("now");
        if (now instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime;
        }
        return ZonedDateTime.now();
    }

    // ========== VAR-System: 處理變數儲存 ==========

    public Map<Integer, String> parseContextKeys(List<String> headers) {
        Map<Integer, String> contextKeyMap = new HashMap<>();

        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i);
            if (header != null && header.startsWith(">")) {
                String contextKey = header.substring(1);

                if (contextKey.isEmpty()) {
                    throw new IllegalArgumentException(
                        String.format("VAR-System 錯誤：header 欄位 %d 使用了 > 符號但沒有提供變數名稱（>）。" +
                                     ">contextKey 必須有名稱，例如 >agentId。", i));
                }

                if ("now".equals(contextKey)) {
                    throw new IllegalArgumentException("'now' 是保留變數名稱，不可作為 context key 使用");
                }

                contextKeyMap.put(i, contextKey);
            }
        }

        return contextKeyMap;
    }

    public void extractAndStoreVariables(List<String> row, Map<Integer, String> contextKeyMap, Object executionVariable) {
        if (executionVariable == null) {
            if (!contextKeyMap.isEmpty()) {
                throw new IllegalStateException(
                    "VAR-System 錯誤：executionVariable 為 null，但有 contextKey 需要提取。" +
                    "請確認 executionVariable 不為 null。");
            }
            return;
        }

        for (Map.Entry<Integer, String> entry : contextKeyMap.entrySet()) {
            int columnIndex = entry.getKey();
            String contextKey = entry.getValue();

            if (columnIndex < row.size()) {
                String dataValue = row.get(columnIndex);
                if (dataValue == null || !dataValue.startsWith("<")) {
                    throw new IllegalArgumentException(
                        String.format("VAR-System 錯誤：header 欄位 %d 定義了 >%s，但 data row 對應位置不是 <executionKey 格式（實際值：%s）。" +
                                     ">contextKey 與 <executionKey 必須成對且同欄位對齊。",
                                     columnIndex, contextKey, dataValue));
                }

                String executionKeyName = dataValue.substring(1);
                if (executionKeyName.isEmpty()) {
                    throw new IllegalArgumentException(
                        String.format("VAR-System 錯誤：data row 欄位 %d 使用了 < 符號但沒有提供變數名稱（<）。" +
                                     "<executionKey 必須有名稱，例如 <id。", columnIndex));
                }
            }
        }

        for (int i = 0; i < row.size(); i++) {
            String dataValue = row.get(i);
            if (dataValue != null && dataValue.startsWith("<")) {
                String executionKeyName = dataValue.substring(1);
                if (executionKeyName.isEmpty()) {
                    throw new IllegalArgumentException(
                        String.format("VAR-System 錯誤：data row 欄位 %d 使用了 < 符號但沒有提供變數名稱（<）。" +
                                     "<executionKey 必須有名稱，例如 <id。", i));
                }

                if (!contextKeyMap.containsKey(i)) {
                    throw new IllegalArgumentException(
                        String.format("VAR-System 錯誤：data row 欄位 %d 使用了 <executionKey（<%s），但 header 對應位置沒有定義 >contextKey。" +
                                     ">contextKey 與 <executionKey 必須成對且同欄位對齊。",
                                     i, executionKeyName));
                }
            }
        }

        Map<String, Object> executionMap = toMap(executionVariable);

        for (Map.Entry<Integer, String> entry : contextKeyMap.entrySet()) {
            int columnIndex = entry.getKey();
            String contextKey = entry.getValue();

            if (columnIndex < row.size()) {
                String executionKey = row.get(columnIndex);

                if (executionKey != null && executionKey.startsWith("<")) {
                    String executionKeyName = executionKey.substring(1);

                    // Check if the key exists in executionMap
                    if (!containsNestedKey(executionMap, executionKeyName)) {
                        throw new IllegalStateException(
                            String.format("VAR-System 錯誤：找不到 execution key '%s'。" +
                                         "請確認 executionVariable 中包含此 key。", executionKeyName));
                    }

                    Object value = getNestedValue(executionMap, executionKeyName);
                    getScenarioContext().putObject(contextKey, value);
                }
            }
        }
    }

    private Object getNestedValue(Map<String, Object> map, String path) {
        if (map == null || path == null) {
            return null;
        }

        if (!path.contains(".") && !path.contains("[")) {
            return map.get(path);
        }

        String[] keys = path.split("\\.");
        Object current = map;

        for (String key : keys) {
            if (current == null) {
                return null;
            }

            if (key.contains("[")) {
                int bracketStart = key.indexOf('[');
                int bracketEnd = key.indexOf(']');
                String baseKey = key.substring(0, bracketStart);
                int index = Integer.parseInt(key.substring(bracketStart + 1, bracketEnd));

                if (current instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> currentMap = (Map<String, Object>) current;
                    current = currentMap.get(baseKey);
                } else {
                    return null;
                }

                if (current instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> list = (List<Object>) current;
                    if (index >= 0 && index < list.size()) {
                        current = list.get(index);
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                if (current instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> currentMap = (Map<String, Object>) current;
                    current = currentMap.get(key);
                    if (current == null) {
                        return null;
                    }
                } else {
                    return null;
                }
            }
        }

        return current;
    }

    private boolean containsNestedKey(Map<String, Object> map, String path) {
        if (map == null || path == null) {
            return false;
        }

        if (!path.contains(".") && !path.contains("[")) {
            return map.containsKey(path);
        }

        String[] keys = path.split("\\.");
        Object current = map;

        for (int i = 0; i < keys.length; i++) {
            String key = keys[i];
            if (current == null) {
                return false;
            }

            if (key.contains("[")) {
                int bracketStart = key.indexOf('[');
                int bracketEnd = key.indexOf(']');
                String baseKey = key.substring(0, bracketStart);
                int index = Integer.parseInt(key.substring(bracketStart + 1, bracketEnd));

                if (current instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> currentMap = (Map<String, Object>) current;
                    if (!currentMap.containsKey(baseKey)) {
                        return false;
                    }
                    current = currentMap.get(baseKey);
                } else {
                    return false;
                }

                if (current instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> list = (List<Object>) current;
                    if (index < 0 || index >= list.size()) {
                        throw new IllegalStateException(
                            String.format("VAR-System 錯誤：陣列索引 '%s[%d]' 超出範圍（List 大小為 %d）。",
                                baseKey, index, list.size()));
                    }
                    current = list.get(index);
                } else {
                    throw new IllegalStateException(
                        String.format("VAR-System 錯誤：'%s' 不是 List，無法使用陣列索引存取。實際類型為 %s。",
                            baseKey, current == null ? "null" : current.getClass().getSimpleName()));
                }
            } else {
                if (current instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> currentMap = (Map<String, Object>) current;
                    if (!currentMap.containsKey(key)) {
                        return false;
                    }
                    current = currentMap.get(key);
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    private Map<String, Object> toMap(Object executionVariable) {
        if (executionVariable instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) executionVariable;
            return map;
        }

        Map<String, Object> result = new HashMap<>();

        if (executionVariable != null) {
            try {
                java.lang.reflect.Field[] fields = executionVariable.getClass().getDeclaredFields();
                for (java.lang.reflect.Field field : fields) {
                    field.setAccessible(true);
                    Object value = field.get(executionVariable);
                    result.put(field.getName(), value);
                }
            } catch (IllegalAccessException | IllegalArgumentException | SecurityException e) {
                result.put("value", executionVariable);
            }
        }

        return result;
    }

    // ========== VAR-System: 處理變數引用 ==========

    @Override
    public Object resolveVariable(String value) {
        return resolveValue(value);
    }

    @Override
    public Object resolveAndValidate(String expectedValue, Object actualValue, String fieldName, String entityName) {
        Object resolved = resolveVariable(expectedValue);
        String resolvedStr = resolved != null ? resolved.toString() : "";

        if (resolvedStr.contains("&")) {
            evaluateConstraints(resolvedStr, actualValue, fieldName, entityName);
            return null;
        }

        if (resolved instanceof Number && actualValue instanceof LocalDateTime) {
            LocalDateTime expectedDateTime = parseDateTime(resolved);
            LocalDateTime actualDateTime = (LocalDateTime) actualValue;

            if (expectedDateTime != null &&
                !actualDateTime.truncatedTo(ChronoUnit.SECONDS)
                    .equals(expectedDateTime.truncatedTo(ChronoUnit.SECONDS))) {
                throw new AssertionError(
                    String.format("%s.%s 時間不匹配。\n  預期: %s (timestamp: %s)\n  實際: %s",
                        entityName, fieldName, expectedDateTime, resolved, actualDateTime));
            }
            return null;
        }

        if (resolved instanceof Number && actualValue instanceof LocalDate) {
            LocalDate expectedDate = parseDate(resolved);
            LocalDate actualDate = (LocalDate) actualValue;

            if (expectedDate != null && !actualDate.equals(expectedDate)) {
                throw new AssertionError(
                    String.format("%s.%s 日期不匹配。\n  預期: %s (timestamp: %s)\n  實際: %s",
                        entityName, fieldName, expectedDate, resolved, actualDate));
            }
            return null;
        }

        if (resolved instanceof Number && actualValue instanceof Instant) {
            long expectedMillis = ((Number) resolved).longValue();
            long actualMillis = ((Instant) actualValue).toEpochMilli();

            if (expectedMillis != actualMillis) {
                throw new AssertionError(
                    String.format("%s.%s 時間不匹配。\n  預期: %s (timestamp)\n  實際: %s (timestamp: %s)",
                        entityName, fieldName, expectedMillis, actualValue, actualMillis));
            }
            return null;
        }

        if (resolved instanceof Number && actualValue instanceof Number) {
            double expectedNum = ((Number) resolved).doubleValue();
            double actualNum = ((Number) actualValue).doubleValue();

            if (expectedNum != actualNum) {
                throw new AssertionError(
                    String.format("%s.%s 數值不匹配。\n  預期: %s (%s)\n  實際: %s (%s)",
                        entityName, fieldName, resolved, resolved.getClass().getSimpleName(),
                        actualValue, actualValue.getClass().getSimpleName()));
            }
            return null;
        }

        return resolved;
    }

    private Object resolveValue(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String trimmed = value.trim();

        if (trimmed.startsWith("@time(") && trimmed.endsWith(")")) {
            String timeExpr = trimmed.substring(6, trimmed.length() - 1);
            return parseTimeExpression(timeExpr);
        }

        if (trimmed.startsWith("@date(") && trimmed.endsWith(")")) {
            String dateExpr = trimmed.substring(6, trimmed.length() - 1);
            return parseDateExpression(dateExpr);
        }

        if (trimmed.startsWith("@localtime(") && trimmed.endsWith(")")) {
            String timeExpr = trimmed.substring(11, trimmed.length() - 1);
            return parseLocalTimeExpression(timeExpr);
        }

        if (trimmed.startsWith("@localTime(") && trimmed.endsWith(")")) {
            String timeExpr = trimmed.substring(11, trimmed.length() - 1);
            return parseLocalTimeExpression(timeExpr);
        }

        boolean isQuoted = false;
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
            isQuoted = true;
        }

        if (!isQuoted && trimmed.contains("${")) {
            return interpolateString(trimmed);
        }

        if (!isQuoted && trimmed.contains(",") && trimmed.contains("$")) {
            String[] parts = trimmed.split(",");
            StringBuilder result = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                String part = parts[i].trim();
                Object resolvedPart = resolveSingleVariable(part);
                if (i > 0) {
                    result.append(",");
                }
                result.append(resolvedPart != null ? resolvedPart.toString() : part);
            }
            return result.toString();
        }

        if (!isQuoted && trimmed.startsWith("$")) {
            return resolveSingleVariable(trimmed);
        }

        return trimmed;
    }

    private Object resolveSingleVariable(String value) {
        if (value == null || !value.startsWith("$")) {
            return value;
        }
        String varName = value.substring(1);
        Object resolved = getScenarioContext().get(varName);
        if (resolved != null) {
            return resolved;
        }
        if ("now".equals(varName)) {
            return getNow();
        }
        return value;
    }

    private LocalDate parseDateExpression(String expr) {
        String cleaned = expr.replaceAll("^\"|\"$", "").trim();

        if (cleaned.equals("now")) {
            return getNow().toLocalDate();
        }

        String normalized = cleaned.replace("/", "-");

        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                String.format("無法解析日期表達式: @date(\"%s\")。支援格式：ISO 8601 (2025-12-16)、斜線分隔 (2025/12/16)、或 now", cleaned), e);
        }
    }

    private ZonedDateTime parseTimeExpression(String expr) {
        String cleaned = expr.replaceAll("^\"|\"$", "").trim();

        if (cleaned.equals("now")) {
            return getNow();
        }

        if (cleaned.startsWith("now")) {
            return parseRelativeTimeToZonedDateTime(cleaned);
        }

        try {
            if (cleaned.contains("T")) {
                return parseISODateTimeToZonedDateTime(cleaned);
            }

            LocalDate date = LocalDate.parse(cleaned);
            return date.atStartOfDay(ZoneId.systemDefault());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                String.format("無法解析時間表達式: @time(\"%s\")。支援格式：ISO 8601 (2025-11-04T08:00:00)、日期 (2025-11-04)、相對時間 (now, now-1d)", cleaned), e);
        }
    }

    private LocalTime parseLocalTimeExpression(String expr) {
        String cleaned = expr.replaceAll("^\"|\"$", "").trim();

        if (cleaned.equals("now")) {
            return getNow().toLocalTime();
        }

        try {
            return LocalTime.parse(cleaned);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                String.format("無法解析 LocalTime 表達式: @localTime(\"%s\")。支援格式：HH:mm:ss (09:00:00)、HH:mm:ss.SSS (09:00:00.123)、或 now", cleaned), e);
        }
    }

    private ZonedDateTime parseISODateTimeToZonedDateTime(String datetimeStr) {
        try {
            if (datetimeStr.contains("+") || datetimeStr.contains("-") && datetimeStr.lastIndexOf("-") > 10 || datetimeStr.endsWith("Z")) {
                return ZonedDateTime.parse(datetimeStr);
            }

            LocalDateTime localDateTime = LocalDateTime.parse(datetimeStr);
            return localDateTime.atZone(ZoneId.systemDefault());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                String.format("無法解析 ISO 8601 日期時間: %s", datetimeStr), e);
        }
    }

    private ZonedDateTime parseRelativeTimeToZonedDateTime(String expr) {
        ZonedDateTime now = getNow();

        if (expr.equals("now")) {
            return now;
        }

        String pattern = expr.substring(3);
        ZonedDateTime result = now;

        java.util.regex.Pattern monthPattern = java.util.regex.Pattern.compile("([+-]?\\d+)M");
        java.util.regex.Matcher monthMatcher = monthPattern.matcher(pattern);
        while (monthMatcher.find()) {
            int months = Integer.parseInt(monthMatcher.group(1));
            result = result.plusMonths(months);
        }

        java.util.regex.Pattern dayPattern = java.util.regex.Pattern.compile("([+-]?\\d+)d");
        java.util.regex.Matcher dayMatcher = dayPattern.matcher(pattern);
        while (dayMatcher.find()) {
            int days = Integer.parseInt(dayMatcher.group(1));
            result = result.plusDays(days);
        }

        java.util.regex.Pattern hourPattern = java.util.regex.Pattern.compile("([+-]?\\d+)h");
        java.util.regex.Matcher hourMatcher = hourPattern.matcher(pattern);
        while (hourMatcher.find()) {
            int hours = Integer.parseInt(hourMatcher.group(1));
            result = result.plusHours(hours);
        }

        java.util.regex.Pattern minutePattern = java.util.regex.Pattern.compile("([+-]?\\d+)m(?!M)");
        java.util.regex.Matcher minuteMatcher = minutePattern.matcher(pattern);
        while (minuteMatcher.find()) {
            int minutes = Integer.parseInt(minuteMatcher.group(1));
            result = result.plusMinutes(minutes);
        }

        java.util.regex.Pattern secondPattern = java.util.regex.Pattern.compile("([+-]?\\d+)s");
        java.util.regex.Matcher secondMatcher = secondPattern.matcher(pattern);
        while (secondMatcher.find()) {
            int seconds = Integer.parseInt(secondMatcher.group(1));
            result = result.plusSeconds(seconds);
        }

        return result;
    }

    private String interpolateString(String str) {
        if (str == null || !str.contains("${")) {
            return str;
        }

        StringBuilder result = new StringBuilder();
        int i = 0;

        while (i < str.length()) {
            int startIndex = str.indexOf("${", i);

            if (startIndex == -1) {
                result.append(str.substring(i));
                break;
            }

            result.append(str.substring(i, startIndex));

            int endIndex = str.indexOf("}", startIndex + 2);

            if (endIndex == -1) {
                result.append(str.substring(startIndex));
                break;
            }

            String varName = str.substring(startIndex + 2, endIndex);

            if (varName.isEmpty()) {
                result.append("${}");
            } else {
                Object varValue = getScenarioContext().get(varName);

                if (varValue == null) {
                    result.append("${").append(varName).append("}");
                } else {
                    result.append(varValue.toString());
                }
            }

            i = endIndex + 1;
        }

        return result.toString();
    }

    private String resolveString(String value) {
        Object resolved = resolveValue(value);
        return resolved != null ? String.valueOf(resolved) : "";
    }

    // ========== CAS: 約束斷言系統 ==========

    public boolean evaluateConstraints(String constraintString, Object actualValue, String fieldName, String entityName) {
        if (constraintString == null || constraintString.trim().isEmpty()) {
            return true;
        }

        List<Constraint> constraints = parseConstraints(constraintString);

        for (Constraint constraint : constraints) {
            if (!evaluateConstraint(constraint, actualValue)) {
                String constraintDesc = constraint.getParams() != null
                    ? String.format("&%s(%s)", constraint.getName(), constraint.getParams())
                    : String.format("&%s", constraint.getName());
                String jsonPath = (entityName != null && fieldName != null)
                    ? String.format("%s.%s", entityName, fieldName)
                    : "未知欄位";
                throw new AssertionError(
                    String.format("JSON Path '%s' 的約束條件 '%s' 驗證失敗。\n  預期: %s\n  實際: %s",
                        jsonPath, constraintDesc, constraintDesc, actualValue));
            }
        }

        return true;
    }

    public boolean evaluateConstraints(String constraintString, Object actualValue) {
        return evaluateConstraints(constraintString, actualValue, null, null);
    }

    private List<Constraint> parseConstraints(String constraintString) {
        List<Constraint> constraints = new ArrayList<>();

        int i = 0;
        while (i < constraintString.length()) {
            int ampIndex = constraintString.indexOf('&', i);
            if (ampIndex == -1) {
                break;
            }

            int nameEnd = ampIndex + 1;
            while (nameEnd < constraintString.length() &&
                   (Character.isLetterOrDigit(constraintString.charAt(nameEnd)) ||
                    constraintString.charAt(nameEnd) == '_')) {
                nameEnd++;
            }

            String constraintName = constraintString.substring(ampIndex + 1, nameEnd);
            String params = null;

            if (nameEnd < constraintString.length() && constraintString.charAt(nameEnd) == '(') {
                int openParen = nameEnd;
                int closeParen = findMatchingCloseParen(constraintString, openParen);

                if (closeParen != -1) {
                    params = constraintString.substring(openParen + 1, closeParen);
                    i = closeParen + 1;
                } else {
                    i = nameEnd + 1;
                }
            } else {
                i = nameEnd;
            }

            constraints.add(new Constraint(constraintName, params));

            while (i < constraintString.length() && Character.isWhitespace(constraintString.charAt(i))) {
                i++;
            }
        }

        return constraints;
    }

    private int findMatchingCloseParen(String str, int openParenIndex) {
        if (openParenIndex >= str.length() || str.charAt(openParenIndex) != '(') {
            return -1;
        }

        int depth = 0;
        boolean inString = false;
        char stringChar = '\0';

        for (int i = openParenIndex; i < str.length(); i++) {
            char c = str.charAt(i);

            if ((c == '"' || c == '\'') && (i == 0 || str.charAt(i - 1) != '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = c;
                } else if (c == stringChar) {
                    inString = false;
                }
            }

            if (!inString) {
                if (c == '(') {
                    depth++;
                } else if (c == ')') {
                    depth--;
                    if (depth == 0) {
                        return i;
                    }
                }
            }
        }

        return -1;
    }

    private boolean evaluateConstraint(Constraint constraint, Object actualValue) {
        String name = constraint.getName();
        String params = constraint.getParams();

        try {
            switch (name) {
                case "eq" -> {
                    return evaluateEq(actualValue, params);
                }
                case "ne" -> {
                    return evaluateNe(actualValue, params);
                }
                case "gt" -> {
                    return evaluateGt(actualValue, params);
                }
                case "lt" -> {
                    return evaluateLt(actualValue, params);
                }
                case "ge" -> {
                    return evaluateGe(actualValue, params);
                }
                case "le" -> {
                    return evaluateLe(actualValue, params);
                }

                case "isNum" -> {
                    return actualValue instanceof Number;
                }
                case "isStr" -> {
                    return actualValue instanceof String;
                }
                case "isBool" -> {
                    return actualValue instanceof Boolean;
                }
                case "isNull" -> {
                    return actualValue == null;
                }
                case "isNotNull" -> {
                    return actualValue != null;
                }
                case "isUndef" -> {
                    return actualValue == null;
                }
                case "isDef" -> {
                    return actualValue != null;
                }

                case "contains" -> {
                    return evaluateContains(actualValue, params);
                }
                case "startsWith" -> {
                    return evaluateStartsWith(actualValue, params);
                }
                case "endsWith" -> {
                    return evaluateEndsWith(actualValue, params);
                }
                case "matches" -> {
                    return evaluateMatches(actualValue, params);
                }
                case "length" -> {
                    return evaluateLength(actualValue, params);
                }

                case "hasItem" -> {
                    return evaluateHasItem(actualValue, params);
                }
                case "hasNoItem" -> {
                    return evaluateHasNoItem(actualValue, params);
                }
                case "size" -> {
                    return evaluateSize(actualValue, params);
                }
                case "isEmpty" -> {
                    return evaluateIsEmpty(actualValue);
                }
                case "isNotEmpty" -> {
                    return evaluateIsNotEmpty(actualValue);
                }

                case "exists" -> {
                    return actualValue != null;
                }
                case "notExists" -> {
                    return actualValue == null;
                }
                case "hasField" -> {
                    return evaluateHasField(actualValue, params);
                }
                case "noField" -> {
                    return !evaluateHasField(actualValue, params);
                }

                case "between" -> {
                    return evaluateBetween(actualValue, params);
                }
                case "notBetween" -> {
                    return !evaluateBetween(actualValue, params);
                }
                case "oneOf" -> {
                    return evaluateOneOf(actualValue, params);
                }
                case "noneOf" -> {
                    return !evaluateOneOf(actualValue, params);
                }

                case "before" -> {
                    return evaluateBefore(actualValue, params);
                }
                case "after" -> {
                    return evaluateAfter(actualValue, params);
                }
                case "sameDay" -> {
                    return evaluateSameDay(actualValue, params);
                }
                case "sameTime" -> {
                    return evaluateSameTime(actualValue, params);
                }
                case "timeRange" -> {
                    return evaluateTimeRange(actualValue, params);
                }
                case "withinDays" -> {
                    return evaluateWithinDays(actualValue, params);
                }

                default -> throw new IllegalArgumentException("未知的約束條件: &" + name);
            }
        } catch (IllegalArgumentException e) {
            throw new AssertionError(
                String.format("評估約束條件 '&%s(%s)' 時發生錯誤: %s",
                    name, params != null ? params : "", e.getMessage()), e);
        }
    }

    // ========== CAS: 數值比較斷言實作 ==========

    private boolean evaluateEq(Object actualValue, String params) {
        Object expectedValue = resolveValue(params);
        return Objects.equals(actualValue, expectedValue) ||
               Objects.equals(String.valueOf(actualValue), String.valueOf(expectedValue));
    }

    private boolean evaluateNe(Object actualValue, String params) {
        return !evaluateEq(actualValue, params);
    }

    private boolean evaluateGt(Object actualValue, String params) {
        double actual = toDouble(actualValue);
        double expected = toDouble(resolveValue(params));
        return actual > expected;
    }

    private boolean evaluateLt(Object actualValue, String params) {
        double actual = toDouble(actualValue);
        double expected = toDouble(resolveValue(params));
        return actual < expected;
    }

    private boolean evaluateGe(Object actualValue, String params) {
        double actual = toDouble(actualValue);
        double expected = toDouble(resolveValue(params));
        return actual >= expected;
    }

    private boolean evaluateLe(Object actualValue, String params) {
        double actual = toDouble(actualValue);
        double expected = toDouble(resolveValue(params));
        return actual <= expected;
    }

    // ========== CAS: 字串操作斷言實作 ==========

    private boolean evaluateContains(Object actualValue, String params) {
        if (!(actualValue instanceof String)) {
            return false;
        }
        String substring = resolveString(params);
        return ((String) actualValue).contains(substring);
    }

    private boolean evaluateStartsWith(Object actualValue, String params) {
        if (!(actualValue instanceof String)) {
            return false;
        }
        String prefix = resolveString(params);
        return ((String) actualValue).startsWith(prefix);
    }

    private boolean evaluateEndsWith(Object actualValue, String params) {
        if (!(actualValue instanceof String)) {
            return false;
        }
        String suffix = resolveString(params);
        return ((String) actualValue).endsWith(suffix);
    }

    private boolean evaluateMatches(Object actualValue, String params) {
        if (!(actualValue instanceof String)) {
            return false;
        }
        String regex = resolveString(params);
        return Pattern.matches(regex, (String) actualValue);
    }

    private boolean evaluateLength(Object actualValue, String params) {
        if (!(actualValue instanceof String)) {
            return false;
        }
        String[] parts = params.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException("&length 需要兩個參數: min,max");
        }
        int min = Integer.parseInt(parts[0].trim());
        int max = Integer.parseInt(parts[1].trim());
        int length = ((String) actualValue).length();
        return length >= min && length <= max;
    }

    // ========== CAS: 集合/陣列斷言實作 ==========

    /**
     * 嘗試將 JSON 陣列字串（如 "[1,2,3]"）解析為 List。
     * 若不是 JSON 陣列格式則回傳 null。
     */
    private List<?> tryParseJsonArray(Object value) {
        if (!(value instanceof String str)) {
            return null;
        }
        String trimmed = str.trim();
        if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
            return null;
        }
        try {
            return JSON_MAPPER.readValue(trimmed, List.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private boolean evaluateHasItem(Object actualValue, String params) {
        if (actualValue == null) {
            return false;
        }
        Object item = resolveValue(params);

        if (actualValue instanceof Collection) {
            return ((Collection<?>) actualValue).contains(item);
        } else if (actualValue.getClass().isArray()) {
            Object[] array = (Object[]) actualValue;
            return Arrays.asList(array).contains(item);
        }
        List<?> jsonArray = tryParseJsonArray(actualValue);
        if (jsonArray != null) {
            return jsonArray.contains(item);
        }
        return false;
    }

    private boolean evaluateHasNoItem(Object actualValue, String params) {
        return !evaluateHasItem(actualValue, params);
    }

    private boolean evaluateSize(Object actualValue, String params) {
        if (actualValue == null) {
            return false;
        }
        int expectedSize = Integer.parseInt(resolveString(params));
        int actualSize;

        if (actualValue instanceof Collection) {
            actualSize = ((Collection<?>) actualValue).size();
        } else if (actualValue.getClass().isArray()) {
            actualSize = ((Object[]) actualValue).length;
        } else if (actualValue instanceof String) {
            List<?> jsonArray = tryParseJsonArray(actualValue);
            if (jsonArray != null) {
                actualSize = jsonArray.size();
            } else {
                actualSize = ((String) actualValue).length();
            }
        } else {
            return false;
        }

        return actualSize == expectedSize;
    }

    private boolean evaluateIsEmpty(Object actualValue) {
        if (actualValue == null) {
            return true;
        }
        if (actualValue instanceof Collection) {
            return ((Collection<?>) actualValue).isEmpty();
        } else if (actualValue.getClass().isArray()) {
            return ((Object[]) actualValue).length == 0;
        } else if (actualValue instanceof String string) {
            List<?> jsonArray = tryParseJsonArray(actualValue);
            if (jsonArray != null) {
                return jsonArray.isEmpty();
            }
            return string.isEmpty();
        }
        return false;
    }

    private boolean evaluateIsNotEmpty(Object actualValue) {
        return !evaluateIsEmpty(actualValue);
    }

    // ========== CAS: 存在性斷言實作 ==========

    private boolean evaluateHasField(Object actualValue, String params) {
        if (actualValue == null) {
            return false;
        }
        String fieldName = resolveString(params);

        if (actualValue instanceof Map) {
            return ((Map<?, ?>) actualValue).containsKey(fieldName);
        }

        try {
            java.lang.reflect.Field field = actualValue.getClass().getDeclaredField(fieldName);
            return field != null;
        } catch (NoSuchFieldException e) {
            return false;
        }
    }

    // ========== CAS: 範圍檢查斷言實作 ==========

    private boolean evaluateBetween(Object actualValue, String params) {
        String[] parts = params.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException("&between 需要兩個參數: min,max");
        }
        double actual = toDouble(actualValue);
        double min = toDouble(resolveValue(parts[0].trim()));
        double max = toDouble(resolveValue(parts[1].trim()));
        return actual >= min && actual <= max;
    }

    private boolean evaluateOneOf(Object actualValue, String params) {
        String[] parts = params.split(",");
        for (String part : parts) {
            Object expected = resolveValue(part.trim());
            if (Objects.equals(actualValue, expected) ||
                Objects.equals(String.valueOf(actualValue), String.valueOf(expected))) {
                return true;
            }
        }
        return false;
    }

    // ========== CAS: 時間相關斷言實作 ==========

    private boolean evaluateBefore(Object actualValue, String params) {
        LocalDateTime actual = convertToLocalDateTime(actualValue);
        LocalDateTime expected = parseDateTime(resolveValue(params));
        return actual != null && expected != null && actual.isBefore(expected);
    }

    private boolean evaluateAfter(Object actualValue, String params) {
        LocalDateTime actual = convertToLocalDateTime(actualValue);
        LocalDateTime expected = parseDateTime(resolveValue(params));
        return actual != null && expected != null && actual.isAfter(expected);
    }

    private boolean evaluateSameDay(Object actualValue, String params) {
        LocalDateTime actualDateTime = convertToLocalDateTime(actualValue);
        if (actualDateTime == null) {
            return false;
        }
        LocalDate actual = actualDateTime.toLocalDate();
        String expectedStr = resolveString(params);
        LocalDate expected;

        if ("today".equalsIgnoreCase(expectedStr)) {
            expected = LocalDate.now();
        } else {
            expected = parseDate(expectedStr);
        }

        return actual != null && expected != null && actual.equals(expected);
    }

    private boolean evaluateWithinDays(Object actualValue, String params) {
        LocalDateTime actual = convertToLocalDateTime(actualValue);
        if (actual == null) {
            return false;
        }

        int days = Integer.parseInt(resolveString(params));
        LocalDateTime now = LocalDateTime.now();
        long diffDays = ChronoUnit.DAYS.between(actual, now);
        return Math.abs(diffDays) <= days;
    }

    private boolean evaluateSameTime(Object actualValue, String params) {
        LocalDateTime actual = convertToLocalDateTime(actualValue);
        LocalDateTime expected = parseDateTime(resolveValue(params));

        if (actual == null || expected == null) {
            return false;
        }

        return actual.truncatedTo(ChronoUnit.SECONDS)
                     .equals(expected.truncatedTo(ChronoUnit.SECONDS));
    }

    private boolean evaluateTimeRange(Object actualValue, String params) {
        LocalDateTime actual = convertToLocalDateTime(actualValue);
        if (actual == null) {
            return false;
        }

        String[] parts = params.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException("&timeRange 需要兩個參數: start,end");
        }

        LocalTime actualTime = actual.toLocalTime();
        LocalTime startTime = LocalTime.parse(resolveString(parts[0].trim()));
        LocalTime endTime = LocalTime.parse(resolveString(parts[1].trim()));

        return !actualTime.isBefore(startTime) && !actualTime.isAfter(endTime);
    }

    // ========== 值比對 ==========

    /**
     * 比對期望值與實際值（型別感知）。
     */
    @Override
    public boolean valuesEqual(Object expected, Object actual) {
        if (expected == null) return actual == null;
        if (actual == null) return false;

        // 先解析變數和時間表達式
        Object resolved = (expected instanceof String s) ? resolveValue(s) : expected;
        if (resolved == null) return false;

        // 將兩邊正規化後比較
        Object normalizedExpected = normalizeValue(resolved);
        Object normalizedActual = normalizeValue(actual);

        if (normalizedExpected instanceof java.math.BigDecimal e && normalizedActual instanceof java.math.BigDecimal a) {
            return e.compareTo(a) == 0;
        }
        if (normalizedExpected instanceof LocalDateTime e && normalizedActual instanceof LocalDateTime a) {
            return e.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
        }
        if (normalizedExpected instanceof Instant e && normalizedActual instanceof Instant a) {
            return e.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
        }

        // 字串與 LocalDateTime 比較：嘗試解析字串為 LocalDateTime
        if (normalizedExpected instanceof String s && normalizedActual instanceof LocalDateTime a) {
            LocalDateTime parsed = parseDateTime(s);
            if (parsed != null) {
                return parsed.truncatedTo(ChronoUnit.SECONDS).equals(a.truncatedTo(ChronoUnit.SECONDS));
            }
        }

        // 字串與 LocalDate 比較：嘗試解析字串為 LocalDate
        if (normalizedExpected instanceof String s && normalizedActual instanceof LocalDate a) {
            LocalDate parsed = parseDate(s);
            if (parsed != null) {
                return parsed.equals(a);
            }
        }

        // MSSQL BIT 欄位：JDBC 回傳 Boolean，DataTable 預期 "0"/"1"
        if (normalizedActual instanceof Boolean b) {
            String expectedStr = String.valueOf(normalizedExpected);
            if ("0".equals(expectedStr) || "1".equals(expectedStr)) {
                return b == "1".equals(expectedStr);
            }
            return String.valueOf(b).equals(expectedStr);
        }

        // 嘗試字串比對（處理 JDBC 回傳型別與預期型別不一致的情況）
        if (normalizedExpected != null && normalizedActual != null
                && !normalizedExpected.getClass().equals(normalizedActual.getClass())) {
            return String.valueOf(normalizedExpected).equals(String.valueOf(normalizedActual));
        }

        return Objects.equals(normalizedExpected, normalizedActual);
    }

    /**
     * 正規化 JDBC 值：將 java.sql 型別轉為 java.time 型別。
     */
    private Object normalizeValue(Object value) {
        if (value instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime();
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof java.sql.Time t) {
            return t.toLocalTime();
        }
        if (value instanceof ZonedDateTime zdt) {
            return zdt.toLocalDateTime();
        }
        return value;
    }

    // ========== 輔助方法 ==========

    private LocalDateTime convertToLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime();
        }

        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate().atStartOfDay();
        }

        if (value instanceof Instant instant) {
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        }

        if (value instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        }

        if (value instanceof String strValue) {
            try {
                Instant instant = Instant.parse(strValue);
                return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            } catch (Exception e1) {
                try {
                    return LocalDateTime.parse(strValue);
                } catch (Exception e2) {
                    try {
                        return LocalDate.parse(strValue).atStartOfDay();
                    } catch (Exception e3) {
                        throw new IllegalArgumentException(
                            "無法將字串轉換為日期時間: " + strValue +
                            ". 支援的格式: ISO Instant (yyyy-MM-ddTHH:mm:ssZ), ISO LocalDateTime (yyyy-MM-ddTHH:mm:ss) 或 ISO LocalDate (yyyy-MM-dd)");
                    }
                }
            }
        }

        if (value instanceof Number number) {
            long millis = number.longValue();
            return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(millis),
                ZoneId.systemDefault());
        }

        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof LocalDate localDate) {
            return localDate.atStartOfDay();
        }

        return null;
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof Instant instant) {
            return instant.toEpochMilli();
        }
        if (value instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime.toInstant().toEpochMilli();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
        if (value instanceof LocalDate localDate) {
            return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("無法將值轉換為數字: " + value);
        }
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Instant instant) {
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        }

        if (value instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        }

        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }

        if (value instanceof Number number) {
            long millis = number.longValue();
            return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(millis),
                ZoneId.systemDefault()
            );
        }

        String str = String.valueOf(value);

        if (str.endsWith("Z") || str.contains("+") || (str.contains("T") && str.lastIndexOf("-") > 10)) {
            try {
                ZonedDateTime zonedDateTime = ZonedDateTime.parse(str);
                return zonedDateTime.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception e) {
                try {
                    Instant instant = Instant.parse(str);
                    return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                } catch (Exception e2) {
                    // continue
                }
            }
        }

        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                if (formatter == DateTimeFormatter.ofPattern("yyyy-MM-dd")) {
                    return LocalDate.parse(str, formatter).atStartOfDay();
                } else {
                    return LocalDateTime.parse(str, formatter);
                }
            } catch (Exception e) {
                // continue
            }
        }

        return null;
    }

    private LocalDate parseDate(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Instant instant) {
            return instant.atZone(ZoneId.systemDefault()).toLocalDate();
        }

        if (value instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime.toLocalDate();
        }

        if (value instanceof LocalDate localDate) {
            return localDate;
        }

        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.toLocalDate();
        }

        if (value instanceof Number number) {
            long millis = number.longValue();
            return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(millis),
                ZoneId.systemDefault()
            ).toLocalDate();
        }

        String str = String.valueOf(value);
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(str, formatter);
            } catch (Exception e) {
                // continue
            }
        }

        return null;
    }

    // ========== 內部類別 ==========

    public static class ColumnInfo {
        public final String prefix;
        public final String name;

        public ColumnInfo(String prefix, String name) {
            this.prefix = prefix != null ? prefix : "";
            this.name = name != null ? name : "";
        }
    }

    public ColumnInfo parseColumnPrefix(String columnHeader) {
        if (columnHeader == null || columnHeader.isEmpty()) {
            return new ColumnInfo("", "");
        }

        String trimmed = columnHeader.trim();

        int colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0 && colonIndex < trimmed.length() - 1) {
            String prefix = trimmed.substring(0, colonIndex).toUpperCase();
            String name = trimmed.substring(colonIndex + 1);

            if ("P".equals(prefix) || "Q".equals(prefix) || "H".equals(prefix)) {
                return new ColumnInfo(prefix, name);
            }
        }

        return new ColumnInfo("", trimmed);
    }

    private static class Constraint {
        private final String name;
        private final String params;

        public Constraint(String name, String params) {
            this.name = name;
            this.params = params;
        }

        public String getName() {
            return name;
        }

        public String getParams() {
            return params;
        }
    }
}
