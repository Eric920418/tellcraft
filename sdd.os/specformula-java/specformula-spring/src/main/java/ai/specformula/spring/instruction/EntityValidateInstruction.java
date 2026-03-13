package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;

/**
 * Entity 資料表存在性驗證指令介面。
 * <p>
 * 提供 custom step 開發者驗證資料庫中記錄存在且欄位值正確的能力。
 * </p>
 */
public interface EntityValidateInstruction {

    /**
     * 斷言資料庫中存在符合條件的記錄。
     *
     * @param entityName entity 名稱
     * @param dataTable  欄位名稱 → 預期值的列表
     */
    void assertExists(String entityName, List<Map<String, String>> dataTable) throws Exception;
}
