package ai.specformula.spring.instruction;

/**
 * 時間控制指令介面。
 * <p>
 * 提供 custom step 開發者設定測試情境當前時間的能力。
 * </p>
 */
public interface TimeControlInstruction {

    /**
     * 設定測試情境的當前時間。
     * <p>
     * 支援格式：ISO 8601、日期、相對時間（now-1d）、@time() / @date() 表達式。
     *
     * @param timeString 時間字串
     */
    void setTime(String timeString);
}
