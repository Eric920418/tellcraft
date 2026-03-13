package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;

/**
 * Entity 資料準備指令介面。
 * <p>
 * 提供 custom step 開發者插入測試資料的能力，不依賴 Cucumber DataTable。
 * </p>
 */
public interface EntitySetupInstruction {

    /**
     * 準備測試資料（INSERT INTO）。
     *
     * @param entityName entity 名稱
     * @param dataTable  欄位名稱 → 值的列表
     */
    void setup(String entityName, List<Map<String, String>> dataTable) throws Exception;
}
