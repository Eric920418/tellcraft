package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;

/**
 * API 呼叫指令介面。
 * <p>
 * 提供 custom step 開發者執行 HTTP API 請求的能力。
 * </p>
 */
public interface ApiCallInstruction {

    /**
     * 以指定身份執行 API 呼叫。
     *
     * @param summary   API operation summary
     * @param token     身份驗證 token
     * @param dataTable 請求參數（欄位名稱 → 值）
     */
    void invokeWithActor(String summary, String token,
                         List<Map<String, String>> dataTable) throws Exception;

    /**
     * 以無身份執行 API 呼叫。
     *
     * @param summary   API operation summary
     * @param dataTable 請求參數（欄位名稱 → 值）
     */
    void invokeWithoutActor(String summary, List<Map<String, String>> dataTable) throws Exception;
}
