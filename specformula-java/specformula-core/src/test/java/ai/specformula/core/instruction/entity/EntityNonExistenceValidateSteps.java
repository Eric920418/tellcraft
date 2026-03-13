package ai.specformula.core.instruction.entity;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;

/**
 * Entity Non-Existence Validate 相關的 Step Definitions。
 * 負責驗證資料不存在等負面案例。
 */
public class EntityNonExistenceValidateSteps {

    private final EntityTestContext context;

    /** 用於追蹤驗證結果 */
    private boolean lastValidationPassed = false;

    public EntityNonExistenceValidateSteps(EntityTestContext context) {
        this.context = context;
    }

    @Before("@entity_non_existence_validate")
    public void setUp() {
        context.init();
        context.cleanAllTablesInAllDataSources();
        lastValidationPassed = false;
    }

    // ==================== Given Steps ====================

    @Given("entity-non-existence-validate {word} 建立資料表 {word}:")
    public void entity_non_existence_validate_建立資料表(String dataSourceName, String tableName, DataTable dataTable) {
        context.createTable(dataSourceName, tableName, dataTable);
    }

    @Given("entity-non-existence-validate {word} entity_to_table_mapping:")
    public void entity_non_existence_validate_entity_to_table_mapping(String dataSourceName, DataTable dataTable) {
        context.setEntityTableMapping(dataSourceName, dataTable);
    }

    @Given("entity-non-existence-validate 設定時間為 {string}")
    public void entity_non_existence_validate_設定時間為(String timeString) {
        context.getResolver().setNow(timeString);
    }

    @Given("entity-non-existence-validate context 變數 {string} 為 {int}")
    public void entity_non_existence_validate_context_變數為(String variableName, Integer value) {
        context.getScenarioContext().putObject(variableName, value);
    }

    @Given("entity-non-existence-validate context 變數 {string} 為 {string}")
    public void entity_non_existence_validate_context_變數為字串(String variableName, String value) {
        context.getScenarioContext().put(variableName, value);
    }

    // ==================== When Steps ====================

    /**
     * 準備一個 entity（使用 EntitySetup 插入資料）。
     * 處理不帶引號的 entity name。
     */
    @When("^entity-non-existence-validate 準備一個 ([^\"\\s][^\\s]*):$")
    public void entity_non_existence_validate_準備一個(String entityName, DataTable dataTable) {
        try {
            context.getEntitySetup().setup(entityName, dataTable);
        } catch (Exception e) {
            context.setThrownException(e);
        }
    }

    /**
     * 準備一個 entity（使用 EntitySetup 插入資料）。
     * 處理帶引號的 entity name。
     */
    @When("^entity-non-existence-validate 準備一個 \"([^\"]*)\":$")
    public void entity_non_existence_validate_準備一個_quoted(String entityName, DataTable dataTable) {
        try {
            context.getEntitySetup().setup(entityName, dataTable);
        } catch (Exception e) {
            context.setThrownException(e);
        }
    }

    /**
     * 驗證 entity 資料不存在（使用 EntityNonExistenceValidate）。
     */
    @When("entity-non-existence-validate 驗證 {word} 不存在:")
    public void entity_non_existence_validate_驗證不存在(String entityName, DataTable dataTable) {
        try {
            context.getEntityNonExistenceValidate().assertNotExists(entityName, dataTable);
            lastValidationPassed = true;
        } catch (Exception e) {
            lastValidationPassed = false;
            context.setThrownException(e);
        } catch (AssertionError e) {
            lastValidationPassed = false;
            context.setThrownException(new RuntimeException(e.getMessage(), e));
        }
    }

    // ==================== Then Steps ====================

    @Then("entity-non-existence-validate 通過")
    public void entity_non_existence_validate_通過() {
        Exception ex = context.getThrownException();
        if (ex != null) {
            throw new AssertionError("驗證失敗: " + ex.getMessage(), ex);
        }
        if (!lastValidationPassed) {
            throw new AssertionError("驗證未執行或失敗");
        }
    }

    @Then("entity-non-existence-validate 應拋出例外:")
    public void entity_non_existence_validate_應拋出例外(DataTable expectedData) {
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

    @Then("entity-non-existence-validate context 應有變數:")
    public void entity_non_existence_validate_context_應有變數(DataTable expectedData) {
        context.verifyContextVariables(expectedData);
    }
}
