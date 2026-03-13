package ai.specformula.core.spec.api;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiSpec;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class ApiSpecSteps {

    private ApiSpec apiSpec;
    private ApiOperation foundOperation;

    @Given("一個 ApiSpec 包含以下 operations:")
    public void 一個ApiSpec包含以下operations(DataTable dataTable) {
        apiSpec = new ApiSpec();
        List<ApiOperation> operations = new ArrayList<>();
        List<java.util.Map<String, String>> rows = dataTable.asMaps();
        for (java.util.Map<String, String> row : rows) {
            ApiOperation op = new ApiOperation();
            op.setMethod(row.get("method"));
            op.setPath(row.get("path"));
            op.setSummary(row.get("summary"));
            operations.add(op);
        }
        apiSpec.setOperations(operations);
    }

    @When("使用 summary {string} 搜尋")
    public void 使用summary搜尋(String summary) {
        foundOperation = apiSpec.findBySummary(summary);
    }

    @Then("應找到 operation 的 method 為 {string} 且 path 為 {string}")
    public void 應找到operation的method為且path為(String expectedMethod, String expectedPath) {
        assertNotNull(foundOperation, "Expected to find an operation but got null");
        assertEquals(expectedMethod, foundOperation.getMethod());
        assertEquals(expectedPath, foundOperation.getPath());
    }

    @Then("應找不到 operation")
    public void 應找不到operation() {
        assertNull(foundOperation, "Expected null but found: " + foundOperation);
    }
}
