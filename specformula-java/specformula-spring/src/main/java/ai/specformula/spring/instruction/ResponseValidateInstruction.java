package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;

/**
 * DataTable 格式的 API 回應驗證指令介面。
 * <p>
 * 提供 custom step 開發者驗證 API 回應狀態碼與欄位值的能力。
 * </p>
 */
public interface ResponseValidateInstruction {

    /**
     * 驗證 API 回應的 HTTP 狀態碼和欄位值。
     *
     * @param summary    API operation summary
     * @param statusCode 預期的 HTTP 狀態碼
     * @param dataTable  預期欄位值（欄位名稱 → 預期值的列表，可為 null 僅驗證狀態碼）
     */
    void validate(String summary, String statusCode, List<Map<String, String>> dataTable) throws Exception;
}
