package ai.specformula.core.spec.data;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Iterator;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;
import io.cucumber.java.After;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class EntityDdlReaderSteps {

    private Path tempDir;
    private IsaDataSourceConfig dataSourceConfig;
    private DatabaseSchema result;
    private Exception thrownException;

    private final ObjectMapper jsonMapper = new ObjectMapper();

    @After
    public void cleanup() throws IOException {
        if (tempDir != null && Files.exists(tempDir)) {
            try (Stream<Path> walk = Files.walk(tempDir)) {
                walk.sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.delete(p);
                            } catch (IOException ignored) {
                            }
                        });
            }
        }
    }

    @Given("spec.data 資料目錄下存在檔案 {string}:")
    public void 資料目錄下存在檔案(String relativePath, String content) throws IOException {
        if (tempDir == null) {
            tempDir = Files.createTempDirectory("ddl-reader-test-");
        }
        Path file = tempDir.resolve(relativePath);
        Files.createDirectories(file.getParent());
        Files.writeString(file, content);
    }

    @Given("spec.data 資料目錄是空目錄")
    public void 資料目錄是空目錄() throws IOException {
        tempDir = Files.createTempDirectory("ddl-reader-test-");
    }

    @Given("spec.data IsaDataSourceConfig 為:")
    public void isaDataSourceConfig為(String json) throws IOException {
        this.dataSourceConfig = jsonMapper.readValue(json, IsaDataSourceConfig.class);
    }

    @When("spec.data 讀取 Entity DDL")
    public void 讀取EntityDDL() {
        try {
            if (tempDir == null) {
                tempDir = Files.createTempDirectory("ddl-reader-test-");
            }
            dataSourceConfig.setResourcePath(tempDir.toString());
            result = new EntityDdlReader(dataSourceConfig).read();
        } catch (IOException | IllegalArgumentException e) {
            thrownException = e;
        }
    }

    // 計算欄位，比對時應忽略（包含 TableDefinition 和 DatabaseSchema 的計算欄位）
    private static final Set<String> COMPUTED_FIELDS = Set.of(
            "selectSql", "selectWhereColumnIndex",
            "pkColumnDefinitions",
            "selectByValuesSql", "selectByValuesIndex",
            "tablesByEntityName"
    );

    @Then("spec.data DatabaseSchema 的解析結果為:")
    public void databaseSchema的解析結果為(String expectedJson) throws IOException {
        assertNull(thrownException,
                "Expected no exception but got: "
                        + (thrownException != null ? thrownException.getMessage() : ""));
        JsonNode expected = jsonMapper.readTree(expectedJson);
        JsonNode actual = jsonMapper.valueToTree(result);
        // 移除計算欄位後再比對
        removeComputedFields(actual);
        assertEquals(expected, actual);
    }

    /**
     * 遞迴移除 TableDefinition 的計算欄位。
     */
    private void removeComputedFields(JsonNode node) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            // 移除計算欄位
            COMPUTED_FIELDS.forEach(obj::remove);
            // 遞迴處理子節點
            Iterator<JsonNode> elements = obj.elements();
            while (elements.hasNext()) {
                removeComputedFields(elements.next());
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                removeComputedFields(child);
            }
        }
    }

    @Then("spec.data 解析應拋出例外訊息包含 {string}")
    public void ddl解析應拋出例外訊息包含(String expectedMessage) {
        assertNotNull(thrownException, "Expected exception but none was thrown");
        assertTrue(thrownException.getMessage().contains(expectedMessage),
                "Expected message to contain '" + expectedMessage
                        + "' but was: " + thrownException.getMessage());
    }

}
