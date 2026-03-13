package ai.specformula.core.instruction.entity;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;

/**
 * Entity Setup 相關的 Step Definitions。
 * 負責資料表建立、資料準備等前置作業。
 */
public class EntitySetupSteps {

    private final EntityTestContext context;

    public EntitySetupSteps(EntityTestContext context) {
        this.context = context;
    }

    @Before("@entity_setup")
    public void setUp() {
        context.init();
        context.cleanAllTablesInAllDataSources();
    }

    // ==================== Given Steps ====================

    @Given("entity-setup {word} 建立資料表 {word}:")
    public void entitysetup_建立資料表(String dataSourceName, String tableName, DataTable dataTable) {
        context.createTable(dataSourceName, tableName, dataTable);
    }

    @Given("entity-setup {word} entity_to_table_mapping:")
    public void entitysetup_entity_to_table_mapping(String dataSourceName, DataTable dataTable) {
        context.setEntityTableMapping(dataSourceName, dataTable);
    }

    @Given("entity-setup 設定時間為 {string}")
    public void entitysetup_設定時間為(String timeString) {
        context.getResolver().setNow(timeString);
    }

    @Given("entity-setup context 變數 {string} 為 {int}")
    public void entitysetup_context_變數為(String variableName, Integer value) {
        context.getScenarioContext().putObject(variableName, value);
    }

    @Given("entity-setup context 變數 {string} 為 {string}")
    public void entitysetup_context_變數為字串(String variableName, String value) {
        context.getScenarioContext().put(variableName, value);
    }

    // ==================== When Steps ====================

    /**
     * 處理不帶引號的 entity name（使用正則避免與引號版本衝突）。
     * 匹配非引號開頭的單字。
     */
    @When("^entity-setup 準備一個 ([^\"\\s][^\\s]*):$")
    public void entitysetup_準備一個(String entityName, DataTable dataTable) {
        try {
            context.getEntitySetup().setup(entityName, dataTable);
        } catch (Exception e) {
            context.setThrownException(e);
        }
    }

    /**
     * 處理帶引號的 entity name（包括空字串 ""）。
     */
    @When("^entity-setup 準備一個 \"([^\"]*)\":$")
    public void entitysetup_準備一個_quoted(String entityName, DataTable dataTable) {
        try {
            context.getEntitySetup().setup(entityName, dataTable);
        } catch (Exception e) {
            context.setThrownException(e);
        }
    }

    // ==================== Then Steps ====================

    @Then("entity-setup {word} 資料表應有資料:")
    public void entitysetup_資料表應有資料(String tableName, DataTable expectedData) {
        context.verifyTableData(tableName, expectedData);
    }

    @Then("entity-setup context 應有變數:")
    public void entitysetup_context_應有變數(DataTable expectedData) {
        context.verifyContextVariables(expectedData);
    }

    @Then("entity-setup 應拋出例外:")
    public void entitysetup_應拋出例外(DataTable expectedData) {
        Exception ex = context.getThrownException();
        if (ex == null) {
            throw new AssertionError("預期應拋出例外，但沒有例外發生。");
        }

        String actualMessage = ex.getMessage();
        for (var row : expectedData.asMaps(String.class, String.class)) {
            String expectedMessage = row.get("message");
            if (expectedMessage != null && !actualMessage.contains(expectedMessage)) {
                throw new AssertionError(String.format(
                    "例外訊息不符。預期包含: %s, 實際: %s",
                    expectedMessage, actualMessage));
            }
        }
    }
}
