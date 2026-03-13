package ai.specformula.spring.time;

import java.time.ZonedDateTime;

/**
 * 時間抽象介面，提供可被測試框架控制的「現在時間」。
 * <p>
 * 受測專案在需要取得當前時間的地方注入此介面，
 * 取代直接呼叫 {@code ZonedDateTime.now()}。
 * 測試執行期間，框架透過 ISA 時間控制指令設定模擬時間，
 * {@code now()} 回傳該模擬時間（UTC 時區）；未設定時回傳實際 UTC 時間。
 * </p>
 */
@FunctionalInterface
public interface MockTime {

    /**
     * 取得當前時間（UTC 時區）。
     *
     * @return UTC 時區的 ZonedDateTime
     */
    ZonedDateTime now();
}
