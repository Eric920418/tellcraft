package ai.specformula.core.context;

/**
 * ScenarioContext 的對外存取介面。
 * <p>
 * 提供 custom step 開發者在 Scenario 生命週期內讀寫 context 資料的能力。
 * </p>
 */
public interface ScenarioContextAccessor {

    /**
     * 將任意物件存入 context。
     *
     * @param key   鍵值名稱
     * @param value 要存入的物件
     */
    void putObject(String key, Object value);

    /**
     * 從 context 取得物件。
     *
     * @param key 鍵值名稱
     * @return 對應的物件，若不存在則回傳 {@code null}
     */
    Object get(String key);
}
