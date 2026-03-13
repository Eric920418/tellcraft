package ai.specformula.core.dialect;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 結構化的資料表清理計畫。
 * <p>
 * 將清理 SQL 拆分為三部分，讓呼叫端可以逐 table 清理。 所有 SQL 以 {@code String[]} 儲存，每個元素為一條獨立的 SQL
 * 指令。
 * </p>
 */
public class CleanupPlan {

    private final String[] disableFkSql;
    private final Map<String, String[]> tableCleanupSql;
    private final String[] enableFkSql;

    public CleanupPlan(String[] disableFkSql, Map<String, String[]> tableCleanupSql, String[] enableFkSql) {
        this.disableFkSql = disableFkSql;
        this.tableCleanupSql = tableCleanupSql;
        this.enableFkSql = enableFkSql;
    }

    public String[] getDisableFkSql() {
        return disableFkSql;
    }

    /**
     * tableName → DELETE + 重置序列的 SQL 指令陣列
     */
    public Map<String, String[]> getTableCleanupSql() {
        return tableCleanupSql;
    }

    public String[] getEnableFkSql() {
        return enableFkSql;
    }

    /**
     * 建立 Builder。
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private final List<String> disableFkSql = new ArrayList<>();
        private final Map<String, List<String>> tableCleanupSql = new LinkedHashMap<>();
        private final List<String> enableFkSql = new ArrayList<>();

        public Builder addDisableFkSql(String sql) {
            this.disableFkSql.add(sql);
            return this;
        }

        public Builder addTableCleanup(String tableName, String... sqls) {
            this.tableCleanupSql.computeIfAbsent(tableName, k -> new ArrayList<>());
            this.tableCleanupSql.get(tableName).addAll(Arrays.asList(sqls));
            return this;
        }

        public Builder addEnableFkSql(String sql) {
            this.enableFkSql.add(sql);
            return this;
        }

        public CleanupPlan build() {
            Map<String, String[]> tableMap = new LinkedHashMap<>();
            for (var entry : tableCleanupSql.entrySet()) {
                tableMap.put(entry.getKey(), entry.getValue().toArray(String[]::new));
            }
            return new CleanupPlan(
                    disableFkSql.toArray(String[]::new),
                    tableMap,
                    enableFkSql.toArray(String[]::new));
        }
    }
}
