package ai.specformula.core.helper.resolver;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class CASSteps {

    private final ResolverTestContext ctx;

    public CASSteps(ResolverTestContext ctx) {
        this.ctx = ctx;
    }

    @Given("初始化 ScenarioContext 和 ISAFeatureArgumentResolver")
    public void 初始化ScenarioContext和ISAFeatureArgumentResolver() {
        ctx.init();
    }

    // ========== Given: 設定變數 ==========

    @Given("設定變數 {string} 為整數 {int}")
    public void 設定變數為整數(String key, int value) {
        ctx.getScenarioContext().putObject(key, value);
    }

    // ========== When: 設定實際值 ==========

    @When("實際值為整數 {int}")
    public void 實際值為整數(int value) {
        ctx.setActualValue(value);
    }

    @When("實際值為浮點數 {double}")
    public void 實際值為浮點數(double value) {
        ctx.setActualValue(value);
    }

    @When("實際值為字串 {string}")
    public void 實際值為字串(String value) {
        ctx.setActualValue(value);
    }

    @When("實際值為布林 {word}")
    public void 實際值為布林(String value) {
        ctx.setActualValue(Boolean.valueOf(value));
    }

    @When("實際值為 null")
    public void 實際值為null() {
        ctx.setActualValue(null);
    }

    @When("實際值為字串列表 {string}")
    public void 實際值為字串列表(String csv) {
        ctx.setActualValue(Arrays.asList(csv.split(",")));
    }

    @When("實際值為整數列表 {string}")
    public void 實際值為整數列表(String csv) {
        ctx.setActualValue(Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(java.util.stream.Collectors.toList()));
    }

    @When("實際值為浮點數列表 {string}")
    public void 實際值為浮點數列表(String csv) {
        ctx.setActualValue(Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(Double::parseDouble)
                .collect(java.util.stream.Collectors.toList()));
    }

    @When("實際值為布林列表 {string}")
    public void 實際值為布林列表(String csv) {
        ctx.setActualValue(Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(Boolean::parseBoolean)
                .collect(java.util.stream.Collectors.toList()));
    }

    @When("實際值為 Map 列表:")
    public void 實際值為Map列表(DataTable dataTable) {
        ctx.setActualValue(dataTable.asMaps(String.class, String.class));
    }

    @When("實際值為空列表")
    public void 實際值為空列表() {
        ctx.setActualValue(Collections.emptyList());
    }

    @When("實際值為 Map:")
    public void 實際值為Map(DataTable dataTable) {
        Map<String, Object> map = new HashMap<>();
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        for (Map<String, String> row : rows) {
            map.put(row.get("key"), row.get("value"));
        }
        ctx.setActualValue(map);
    }

    // ========== When: 時間相關實際值 ==========

    @When("實際值為 LocalDateTime {string}")
    public void 實際值為LocalDateTime(String dateTimeStr) {
        ctx.setActualValue(LocalDateTime.parse(dateTimeStr));
    }

    @When("實際值為 LocalDateTime {string} 的 timestamp")
    public void 實際值為LocalDateTime的timestamp(String dateTimeStr) {
        ctx.setActualValue(LocalDateTime.parse(dateTimeStr)
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli());
    }

    @When("實際值為 LocalDate {string}")
    public void 實際值為LocalDate(String dateStr) {
        ctx.setActualValue(LocalDate.parse(dateStr));
    }

    @When("實際值為當前 LocalDateTime")
    public void 實際值為當前LocalDateTime() {
        ctx.setActualValue(LocalDateTime.now());
    }

    @When("實際值為 {int} 天前的 LocalDateTime")
    public void 實際值為N天前的LocalDateTime(int days) {
        ctx.setActualValue(LocalDateTime.now().minusDays(days));
    }

    @When("實際值為當前 LocalDateTime 的 timestamp")
    public void 實際值為當前LocalDateTime的timestamp() {
        ctx.setActualValue(LocalDateTime.now()
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli());
    }

    @When("實際值為當前 LocalDateTime 的字串")
    public void 實際值為當前LocalDateTime的字串() {
        ctx.setActualValue(LocalDateTime.now().toString());
    }

    @When("實際值為 LocalDateTime {string} 帶奈秒 {long}")
    public void 實際值為LocalDateTime帶奈秒(String dateTimeStr, long nanos) {
        ctx.setActualValue(LocalDateTime.parse(dateTimeStr).withNano((int) nanos));
    }

    @When("實際值為 ZonedDateTime {string}")
    public void 實際值為ZonedDateTime(String dateTimeStr) {
        ctx.setActualValue(ZonedDateTime.parse(dateTimeStr));
    }

    @When("實際值為 Instant {string}")
    public void 實際值為Instant(String instantStr) {
        ctx.setActualValue(Instant.parse(instantStr));
    }

    @When("實際值為 Instant {string} 轉換為系統時區")
    public void 實際值為Instant轉換為系統時區(String instantStr) {
        ctx.setActualValue(Instant.parse(instantStr));
    }

    @When("實際值為當前 Instant")
    public void 實際值為當前Instant() {
        ctx.setActualValue(Instant.now());
    }

    @When("實際值為系統時區 {string} 的 Instant")
    public void 實際值為系統時區的Instant(String dateTimeStr) {
        LocalDateTime localDateTime = LocalDateTime.parse(dateTimeStr);
        ctx.setActualValue(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    @When("實際值為 java.sql.Date {string}")
    public void 實際值為JavaSqlDate(String dateStr) {
        ctx.setActualValue(java.sql.Date.valueOf(LocalDate.parse(dateStr)));
    }

    @When("實際值為今天的 java.sql.Date")
    public void 實際值為今天的JavaSqlDate() {
        ctx.setActualValue(new java.sql.Date(System.currentTimeMillis()));
    }

    @When("實際值為 {int} 天前的 java.sql.Date")
    public void 實際值為N天前的JavaSqlDate(int days) {
        ctx.setActualValue(java.sql.Date.valueOf(LocalDate.now().minusDays(days)));
    }

    @When("實際值為 JSON 陣列字串 {string}")
    public void 實際值為JSON陣列字串(String jsonArrayStr) {
        ctx.setActualValue(jsonArrayStr);
    }

    @When("實際值為今天 {word} 的 timestamp")
    public void 實際值為今天某時間的timestamp(String timeStr) {
        String[] parts = timeStr.split(":");
        LocalDateTime dateTime = LocalDateTime.now()
                .withHour(Integer.parseInt(parts[0]))
                .withMinute(Integer.parseInt(parts[1]))
                .withSecond(Integer.parseInt(parts[2]))
                .withNano(0);
        ctx.setActualValue(dateTime
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli());
    }

    // ========== Then: 驗證約束 ==========

    @Then("約束 {string} 驗證通過")
    public void 約束驗證通過(String constraint) {
        assertTrue(ctx.getResolver().evaluateConstraints(constraint, ctx.getActualValue()));
    }

    @Then("約束 {string} 驗證失敗")
    public void 約束驗證失敗(String constraint) {
        assertNotNull(assertThrows(AssertionError.class, () ->
                ctx.getResolver().evaluateConstraints(constraint, ctx.getActualValue())
        ));
    }

    @Then("約束應該驗證通過（與系統時區對應的 LocalDateTime）")
    public void 約束應該驗證通過與系統時區對應的LocalDateTime() {
        Instant instant = (Instant) ctx.getActualValue();
        LocalDateTime expectedLocalDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        String expectedTimeStr = expectedLocalDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        assertTrue(ctx.getResolver().evaluateConstraints("&sameTime(\"" + expectedTimeStr + "\")", ctx.getActualValue()));
    }

    @Then("約束應該通過 sameDay 驗證（與系統時區對應的日期）")
    public void 約束應該通過sameDay驗證與系統時區對應的日期() {
        Instant instant = (Instant) ctx.getActualValue();
        LocalDate expectedDate = instant.atZone(ZoneId.systemDefault()).toLocalDate();
        assertTrue(ctx.getResolver().evaluateConstraints("&sameDay(\"" + expectedDate + "\")", ctx.getActualValue()));
    }
}
