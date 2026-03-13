package ai.specformula.core.dialect;

import ai.specformula.core.spec.data.model.TableDefinition;

import java.util.List;

/**
 * 資料庫方言抽象介面。
 * <p>
 * 封裝不同資料庫在 Scenario 清理時的語法差異：
 * 關閉/恢復 FK 約束、清空資料表、重置自動遞增序列。
 * </p>
 */
public interface DatabaseDialect {

    /**
     * 產生結構化的資料表清理計畫。
     * <p>
     * 拆分為：關閉 FK 約束 → 每個 table 的清理 SQL → 恢復 FK 約束，
     * 讓呼叫端可以選擇性地只清理有資料的 table。
     * </p>
     *
     * @param tables TableDefinition 列表
     * @return 結構化的清理計畫
     */
    CleanupPlan buildCleanupPlan(List<TableDefinition> tables);
}
