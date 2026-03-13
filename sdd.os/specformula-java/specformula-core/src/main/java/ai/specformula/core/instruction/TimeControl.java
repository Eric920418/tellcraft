package ai.specformula.core.instruction;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;


/**
 * 時間控制輔助工具。
 * <p>
 * 負責設定測試情境的當前時間，供 TIME-System 使用。
 * </p>
 */
public class TimeControl {

    private final ISAFeatureArgumentResolver resolver;

    public TimeControl(ISAFeatureArgumentResolver resolver) {
        this.resolver = resolver;
    }

    /**
     * 設定測試情境的當前時間。
     * <p>
     * 支援格式：
     * <ul>
     *   <li>ISO 8601: {@code 2025-12-25T14:30:00+08:00}</li>
     *   <li>日期: {@code 2025-12-25}</li>
     *   <li>相對時間: {@code now}, {@code now-1d}</li>
     *   <li>@time() 表達式: {@code @time(now-1M-1d+3h)}</li>
     *   <li>@date() 表達式: {@code @date(2025-12-16)}</li>
     * </ul>
     *
     * @param timeString 時間字串
     */
    public void setTime(String timeString) {
        if (timeString == null || timeString.isBlank()) {
            throw new IllegalArgumentException("[TimeControl] 缺少時間參數。");
        }

        String trimmed = timeString.trim();

        if (trimmed.startsWith("@time(") && trimmed.endsWith(")")) {
            resolver.setNow(trimmed.substring(6, trimmed.length() - 1));
        } else if (trimmed.startsWith("@date(") && trimmed.endsWith(")")) {
            resolver.setNow(trimmed.substring(6, trimmed.length() - 1));
        } else {
            resolver.setNow(timeString);
        }
    }
}
