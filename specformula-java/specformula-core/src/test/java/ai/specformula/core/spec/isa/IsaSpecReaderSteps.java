package ai.specformula.core.spec.isa;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.spec.isa.model.IsaSpec;
import io.cucumber.java.After;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class IsaSpecReaderSteps {

    private Path tempDir;
    private IsaSpec result;
    private IsaSpecReader reader;
    private Exception thrownException;

    private final ObjectMapper jsonMapper = new ObjectMapper();

    @After
    public void cleanup() throws IOException {
        if (tempDir != null && Files.exists(tempDir)) {
            Path isaFile = tempDir.resolve("isa.yml");
            if (Files.exists(isaFile)) {
                Files.delete(isaFile);
            }
            Files.delete(tempDir);
        }
    }

    @Given("spec.isa 存在一個 isa.yml 檔:")
    public void 存在一個_isa_yml_檔(String yamlContent) throws IOException {
        this.tempDir = Files.createTempDirectory("isa-test-");
        Path isaFile = tempDir.resolve("isa.yml");
        Files.writeString(isaFile, yamlContent);
        this.reader = new IsaSpecReader(isaFile.toString());
    }

    @Given("spec.isa 使用不存在的路徑 {string}")
    public void 使用不存在的路徑(String path) {
        this.reader = new IsaSpecReader(path);
    }

    @When("spec.isa 讀取 isa.yml")
    public void 讀取_isa_yml() {
        try {
            this.result = reader.read();
        } catch (IllegalArgumentException e) {
            this.thrownException = e;
        }
    }

    @Then("spec.isa 解析結果為:")
    public void 解析結果為(String expectedJson) throws IOException {
        assertNull(thrownException,
                "Expected no exception but got: "
                        + (thrownException != null ? thrownException.getMessage() : ""));
        JsonNode expected = jsonMapper.readTree(expectedJson);
        JsonNode actual = jsonMapper.valueToTree(result);
        assertEquals(expected, actual);
    }

    @Then("spec.isa 解析應拋出例外訊息為 {string}")
    public void 解析應拋出例外訊息為(String expectedMessage) {
        assertNotNull(thrownException, "Expected exception but none was thrown");
        assertEquals(expectedMessage, thrownException.getMessage());
    }
}
