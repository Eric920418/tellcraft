package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;

/**
 * Entity 資料表不存在性驗證指令介面。
 * <p>
 * 提供 custom step 開發者驗證資料庫中不存在符合條件記錄的能力。
 * </p>
 */
public interface EntityNonExistenceValidateInstruction {

    /**
     * 斷言資料庫中不存在符合條件的記錄。
     *
     * @param entityName entity 名稱
     * @param dataTable  欄位名稱 → 查詢條件值的列表
     */
    void assertNotExists(String entityName, List<Map<String, String>> dataTable) throws Exception;
}
