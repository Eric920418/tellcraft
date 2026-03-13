package ai.specformula.core.spec.data;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.TableDefinition;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

public class TableDefinitionSqlSteps {

    private TableDefinition tableDefinition;

    @Given("spec.data TableDefinition 為 {string} 包含欄位:")
    public void tableDefinition為包含欄位(String tableName, DataTable dataTable) {
        tableDefinition = new TableDefinition(tableName);
        List<ColumnDefinition> columns = new ArrayList<>();
        Set<String> pkColumns = new LinkedHashSet<>();

        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        for (Map<String, String> row : rows) {
            ColumnDefinition col = new ColumnDefinition();
            col.setName(row.get("name"));
            col.setType(row.get("type"));
            col.setPrimaryKey(Boolean.parseBoolean(row.get("primaryKey")));
            col.setAutoIncrement(Boolean.parseBoolean(row.get("autoIncrement")));
            columns.add(col);

            if (col.isPrimaryKey()) {
                pkColumns.add(col.getName());
            }
        }

        tableDefinition.setColumns(columns);
        tableDefinition.setPkColumns(pkColumns);
    }

    @When("spec.data 新增欄位 {string} 類型 {string}")
    public void 新增欄位(String columnName, String columnType) {
        List<ColumnDefinition> columns = new ArrayList<>(tableDefinition.getColumns());
        ColumnDefinition col = new ColumnDefinition();
        col.setName(columnName);
        col.setType(columnType);
        col.setPrimaryKey(false);
        col.setAutoIncrement(false);
        columns.add(col);
        tableDefinition.setColumns(columns);
    }

    @Then("spec.data selectSql 應為:")
    public void selectSql應為(String expected) {
        assertEquals(expected.trim(), tableDefinition.getSelectSql());
    }

    @Then("spec.data selectSql 應包含 {string}")
    public void selectSql應包含(String expected) {
        assertTrue(tableDefinition.getSelectSql().contains(expected),
                "Expected selectSql to contain '" + expected + "' but was: " + tableDefinition.getSelectSql());
    }

    @Then("spec.data selectWhereColumnIndex 應包含 {string}")
    public void selectWhereColumnIndex應包含(String columnName) {
        Map<String, Integer> index = tableDefinition.getSelectWhereColumnIndex();
        assertTrue(index.containsKey(columnName),
                "Expected selectWhereColumnIndex to contain '" + columnName + "'");
    }

    @Then("spec.data selectWhereColumnIndex 大小應為 {int}")
    public void selectWhereColumnIndex大小應為(int expectedSize) {
        Map<String, Integer> index = tableDefinition.getSelectWhereColumnIndex();
        assertEquals(expectedSize, index.size());
    }

    @When("spec.data 設定查詢欄位為:")
    public void 設定查詢欄位為(DataTable dataTable) {
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        List<String> queryColumns = rows.stream()
                .map(row -> row.get("column"))
                .filter(col -> col != null && !col.isEmpty())
                .collect(Collectors.toList());
        tableDefinition.setQueryColumns(queryColumns);
    }

    @Then("spec.data selectByValuesSql 應為:")
    public void selectByValuesSql應為(String expected) {
        assertEquals(expected.trim(), tableDefinition.getSelectByValuesSql());
    }

    @Then("spec.data selectByValuesIndex 應包含:")
    public void selectByValuesIndex應包含(DataTable dataTable) {
        Map<String, List<Integer>> index = tableDefinition.getSelectByValuesIndex();
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);

        for (Map<String, String> row : rows) {
            String column = row.get("column");
            String indicesStr = row.get("indices");
            List<Integer> expectedIndices = Arrays.stream(indicesStr.split(","))
                    .map(String::trim)
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());
            assertEquals(expectedIndices, index.get(column),
                    "Column '" + column + "' should have indices " + expectedIndices);
        }
    }
}
