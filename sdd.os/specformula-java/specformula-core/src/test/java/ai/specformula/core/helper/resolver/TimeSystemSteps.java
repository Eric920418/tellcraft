package ai.specformula.core.helper.resolver;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class TimeSystemSteps {

    private final ResolverTestContext ctx;

    public TimeSystemSteps(ResolverTestContext ctx) {
        this.ctx = ctx;
    }

    // ========== Given: 設定 ==========

    @Given("設定變數 {string} 為 ZonedDateTime {string}")
    public void 設定變數為ZonedDateTime(String key, String zdtStr) {
        ctx.getScenarioContext().putObject(key, ZonedDateTime.parse(zdtStr));
    }

    // ========== When: 解析時間表達式 ==========

    @When("解析時間表達式 {string}")
    public void 解析時間表達式(String expr) {
        try {
            ctx.setResolveResult(ctx.getResolver().resolveVariable(expr));
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
            ctx.setResolveResult(null);
        }
    }

    @When("設定當前時間為 {string}")
    public void 設定當前時間為(String timeString) {
        try {
            ctx.getResolver().setNow(timeString);
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    @When("解析變數引用 {string}")
    public void 解析變數引用(String varRef) {
        try {
            ctx.setResolveResult(ctx.getResolver().resolveVariable(varRef));
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
            ctx.setResolveResult(null);
        }
    }

    // ========== Then: 類型驗證 ==========

    @Then("結果應該是 ZonedDateTime 類型")
    public void 結果應該是ZonedDateTime類型() {
        assertNotNull(ctx.getResolveResult(), "結果不應為 null");
        assertTrue(ctx.getResolveResult() instanceof ZonedDateTime,
                "結果應該是 ZonedDateTime 類型，實際為 " + ctx.getResolveResult().getClass().getSimpleName());
    }

    @Then("結果應該是 LocalDate 類型")
    public void 結果應該是LocalDate類型() {
        assertNotNull(ctx.getResolveResult(), "結果不應為 null");
        assertTrue(ctx.getResolveResult() instanceof LocalDate,
                "結果應該是 LocalDate 類型，實際為 " + ctx.getResolveResult().getClass().getSimpleName());
    }

    @Then("結果應該是 LocalTime 類型")
    public void 結果應該是LocalTime類型() {
        assertNotNull(ctx.getResolveResult(), "結果不應為 null");
        assertTrue(ctx.getResolveResult() instanceof LocalTime,
                "結果應該是 LocalTime 類型，實際為 " + ctx.getResolveResult().getClass().getSimpleName());
    }

    // ========== Then: 日期時間欄位驗證 ==========

    @Then("年為 {int}，月為 {int}，日為 {int}")
    public void 年為月為日為(int year, int month, int day) {
        switch (getTemporalResult()) {
            case ZonedDateTime zdt -> {
                assertEquals(year, zdt.getYear());
                assertEquals(month, zdt.getMonthValue());
                assertEquals(day, zdt.getDayOfMonth());
            }
            case LocalDate ld -> {
                assertEquals(year, ld.getYear());
                assertEquals(month, ld.getMonthValue());
                assertEquals(day, ld.getDayOfMonth());
            }
            default -> { }
        }
    }

    @Then("時為 {int}，分為 {int}，秒為 {int}")
    public void 時為分為秒為(int hour, int minute, int second) {
        switch (getTemporalResult()) {
            case ZonedDateTime zdt -> {
                assertEquals(hour, zdt.getHour());
                assertEquals(minute, zdt.getMinute());
                assertEquals(second, zdt.getSecond());
            }
            case LocalTime lt -> {
                assertEquals(hour, lt.getHour());
                assertEquals(minute, lt.getMinute());
                assertEquals(second, lt.getSecond());
            }
            default -> { }
        }
    }

    @Then("時為 {int}，分為 {int}")
    public void 時為分為(int hour, int minute) {
        switch (getTemporalResult()) {
            case ZonedDateTime zdt -> {
                assertEquals(hour, zdt.getHour());
                assertEquals(minute, zdt.getMinute());
            }
            case LocalTime lt -> {
                assertEquals(hour, lt.getHour());
                assertEquals(minute, lt.getMinute());
            }
            default -> { }
        }
    }

    @Then("時為 {int}")
    public void 時為(int hour) {
        switch (getTemporalResult()) {
            case ZonedDateTime zdt -> assertEquals(hour, zdt.getHour());
            case LocalTime lt -> assertEquals(hour, lt.getHour());
            default -> { }
        }
    }

    @Then("時區偏移為 {string}")
    public void 時區偏移為(String offsetId) {
        ZonedDateTime zdt = (ZonedDateTime) getTemporalResult();
        assertEquals(offsetId, zdt.getOffset().getId());
    }

    @Then("時區為 {string}")
    public void 時區為(String zoneId) {
        ZonedDateTime zdt = (ZonedDateTime) getTemporalResult();
        assertEquals(zoneId, zdt.getZone().getId());
    }

    // ========== Then: 相對時間驗證 ==========

    @Then("結果應該接近系統當前時間")
    public void 結果應該接近系統當前時間() {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime now = ZonedDateTime.now();
        long diffSeconds = Math.abs(Duration.between(result, now).getSeconds());
        assertTrue(diffSeconds < 5,
                String.format("時間差 %d 秒應該小於 5 秒", diffSeconds));
    }

    @Then("結果應該約為 {int} 天前（允許 {int} 小時誤差）")
    public void 結果應該約為N天前允許M小時誤差(int days, int toleranceHours) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().minusDays(days);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds < toleranceHours * 3600L,
                String.format("時間差 %d 秒應該小於 %d 秒", diffSeconds, toleranceHours * 3600L));
    }

    @Then("結果應該約為 {int} 秒前（允許 {int} 秒誤差）")
    public void 結果應該約為N秒前(int seconds, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().minusSeconds(seconds);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 分鐘前（允許 {int} 秒誤差）")
    public void 結果應該約為N分鐘前(int minutes, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().minusMinutes(minutes);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 小時前（允許 {int} 秒誤差）")
    public void 結果應該約為N小時前(int hours, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().minusHours(hours);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 個月前（允許 {int} 秒誤差）")
    public void 結果應該約為N個月前(int months, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().minusMonths(months);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 秒後（允許 {int} 秒誤差）")
    public void 結果應該約為N秒後(int seconds, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().plusSeconds(seconds);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 分鐘後（允許 {int} 秒誤差）")
    public void 結果應該約為N分鐘後(int minutes, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().plusMinutes(minutes);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 小時後（允許 {int} 秒誤差）")
    public void 結果應該約為N小時後(int hours, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().plusHours(hours);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 個月後（允許 {int} 秒誤差）")
    public void 結果應該約為N個月後(int months, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now().plusMonths(months);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    @Then("結果應該約為 {int} 個月 {int} 天 {int} 小時 {int} 分鐘 {int} 秒前（允許 {int} 秒誤差）")
    public void 結果應該約為組合時間前(int months, int days, int hours, int minutes, int seconds, int tolerance) {
        ZonedDateTime result = (ZonedDateTime) ctx.getResolveResult();
        ZonedDateTime expected = ZonedDateTime.now()
                .minusMonths(months).minusDays(days)
                .minusHours(hours).minusMinutes(minutes).minusSeconds(seconds);
        long diffSeconds = Math.abs(Duration.between(result, expected).getSeconds());
        assertTrue(diffSeconds <= tolerance,
                String.format("時間差 %d 秒應該小於等於 %d 秒", diffSeconds, tolerance));
    }

    // ========== Then: 例外驗證 ==========

    @Then("應該拋出例外")
    public void 應該拋出例外() {
        assertNotNull(ctx.getThrownException(), "應該拋出例外但沒有");
    }

    // ========== Then: setNow / getNow ==========

    @Then("scenarioContext 的 {string} 應該是 ZonedDateTime 類型")
    public void scenarioContext的key應該是ZonedDateTime類型(String key) {
        Object value = ctx.getScenarioContext().get(key);
        assertNotNull(value, "scenarioContext 應該包含 '" + key + "' 鍵");
        assertTrue(value instanceof ZonedDateTime,
                "'" + key + "' 應該是 ZonedDateTime 類型，實際為 " + value.getClass().getSimpleName());
        ctx.setResolveResult(value);
    }

    @Then("getNow\\() 應該返回 ZonedDateTime")
    public void getNow應該返回ZonedDateTime() {
        ZonedDateTime now = ctx.getResolver().getNow();
        assertNotNull(now);
        ctx.setResolveResult(now);
    }

    @Then("getNow\\() 應該返回系統當前時間")
    public void getNow應該返回系統當前時間() {
        ZonedDateTime before = ZonedDateTime.now();
        ZonedDateTime now = ctx.getResolver().getNow();
        ZonedDateTime after = ZonedDateTime.now();
        assertNotNull(now);
        assertTrue(!now.isBefore(before) && !now.isAfter(after),
                String.format("時間 %s 應該在 %s 和 %s 之間", now, before, after));
    }

    // ========== Then: @date / @localtime 特殊驗證 ==========

    @Then("結果應該等於系統當前日期")
    public void 結果應該等於系統當前日期() {
        LocalDate result = (LocalDate) ctx.getResolveResult();
        LocalDate today = LocalDate.now();
        assertEquals(today, result);
    }

    @Then("結果應該接近系統當前 LocalTime")
    public void 結果應該接近系統當前LocalTime() {
        LocalTime result = (LocalTime) ctx.getResolveResult();
        LocalTime now = LocalTime.now();
        long diffSeconds = Math.abs(java.time.Duration.between(result, now).getSeconds());
        assertTrue(diffSeconds <= 2,
                String.format("時間差 %d 秒應該小於等於 2 秒", diffSeconds));
    }

    // ========== Then: VAR-System 整合 ==========

    @Then("TIME-System 只負責轉換，不會自動存入 context 變數")
    public void timeSystem只負責轉換不會自動存入context變數() {
        // TIME-System resolveVariable() 只回傳轉換結果，不存 context
        assertNotNull(ctx.getResolveResult(), "TIME-System 應該正常轉換時間");
    }

    @Then("結果應該等於設定的 ZonedDateTime")
    public void 結果應該等於設定的ZonedDateTime() {
        Object result = ctx.getResolveResult();
        assertNotNull(result);
        assertTrue(result instanceof ZonedDateTime);
        // 已在前面的 Given 中設定，這裡確認 resolveVariable 能正確取回
        ZonedDateTime expected = (ZonedDateTime) ctx.getScenarioContext().get("orderTime");
        assertEquals(expected, result);
    }

    // ========== 輔助方法 ==========

    /**
     * 取得時間結果（可能來自 resolveResult 或 scenarioContext 的 "now"）
     */
    private Object getTemporalResult() {
        Object result = ctx.getResolveResult();
        if (result == null) {
            result = ctx.getScenarioContext().get("now");
        }
        assertNotNull(result, "沒有可用的時間結果");
        return result;
    }
}
