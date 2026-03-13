package ai.specformula.core.instruction.timecontrol;

import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class TimeControlSteps {

    private final TimeControlTestContext ctx;

    public TimeControlSteps(TimeControlTestContext ctx) {
        this.ctx = ctx;
    }

    @Before
    public void setUp() {
        ctx.init();
    }

    // ==================== Given / When ====================

    @Given("time-control 設定時間為 {string}")
    public void 設定時間為(String timeString) {
        try {
            ctx.getTimeControl().setTime(timeString);
            ctx.setThrownException(null);
        } catch (Exception e) {
            ctx.setThrownException(e);
        }
    }

    // ==================== Then: 時間驗證 ====================

    @Then("time-control 現在時間的年月日為 {int}-{int}-{int}")
    public void 現在時間的年月日為(int year, int month, int day) {
        ZonedDateTime now = ctx.getResolver().getNow();
        assertNotNull(now, "getNow() should not return null");
        assertEquals(LocalDate.of(year, month, day), now.toLocalDate(),
                "Date mismatch");
    }

    @Then("time-control 現在時間的時分秒為 {string}")
    public void 現在時間的時分秒為(String timeStr) {
        ZonedDateTime now = ctx.getResolver().getNow();
        assertNotNull(now, "getNow() should not return null");
        LocalTime expected = LocalTime.parse(timeStr);
        assertEquals(expected, now.toLocalTime().withNano(0),
                "Time mismatch");
    }

    @Then("time-control 現在時間的時區偏移為 {string}")
    public void 現在時間的時區偏移為(String expectedOffset) {
        ZonedDateTime now = ctx.getResolver().getNow();
        assertNotNull(now, "getNow() should not return null");
        assertEquals(expectedOffset, now.getOffset().toString(),
                "Zone offset mismatch");
    }

    @Then("time-control 現在時間為 ZonedDateTime 類型")
    public void 現在時間為ZonedDateTime類型() {
        ZonedDateTime now = ctx.getResolver().getNow();
        assertNotNull(now, "getNow() should return a ZonedDateTime");
    }

    // ==================== Then: 例外驗證 ====================

    @Then("time-control 設定時間應拋出例外訊息包含 {string}")
    public void 設定時間應拋出例外訊息包含(String expected) {
        assertNotNull(ctx.getThrownException(),
                "Expected exception but none was thrown");
        assertTrue(ctx.getThrownException().getMessage().contains(expected),
                "Expected message to contain '" + expected
                        + "' but was: " + ctx.getThrownException().getMessage());
    }
}
