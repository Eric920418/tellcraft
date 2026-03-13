package ai.specformula.core.helper;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 命名轉換工具類
 *
 * 提供 camelCase ↔ snake_case 的命名轉換方法。
 */
public class NamingConverter {

    /**
     * camelCase → snake_case（如 managerId → manager_id）。
     */
    public static String camelToSnake(String camelCase) {
        if (camelCase == null) return null;
        return camelCase.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * snake_case → camelCase（如 agent_id → agentId）。
     */
    public static String snakeToCamel(String snake) {
        if (snake == null) return null;
        StringBuilder sb = new StringBuilder();
        boolean nextUpper = false;
        for (char c : snake.toCharArray()) {
            if (c == '_') {
                nextUpper = true;
            } else {
                sb.append(nextUpper ? Character.toUpperCase(c) : c);
                nextUpper = false;
            }
        }
        return sb.toString();
    }

    /**
     * 從 DataTable row 中取值，支援 snake_case key 對應 camelCase header。
     */
    public static String getRowValue(Map<String, String> row, String key) {
        if (row.containsKey(key)) return row.get(key);
        String camelCase = snakeToCamel(key);
        if (row.containsKey(camelCase)) return row.get(camelCase);
        return null;
    }

    /**
     * 將 Map 的所有 key 從 snake_case 轉為 camelCase。
     */
    public static Map<String, Object> toCamelCaseKeys(Map<String, Object> snakeCaseMap) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : snakeCaseMap.entrySet()) {
            result.put(snakeToCamel(entry.getKey()), entry.getValue());
        }
        return result;
    }
}
