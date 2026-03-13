package ai.specformula.core.spec.api;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ai.specformula.core.spec.api.model.ApiSpec;
import ai.specformula.core.spec.isa.model.IsaApiConfig;
import io.cucumber.java.After;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class ApiSpecReaderSteps {

    private Path tempDir;
    private ApiSpec result;
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

    @Given("spec.api 目標路徑下存在檔案 {string}:")
    public void 目標路徑下存在檔案(String relativePath, String content) throws IOException {
        if (tempDir == null) {
            tempDir = Files.createTempDirectory("api-spec-test-");
        }
        Path file = tempDir.resolve(relativePath);
        Files.createDirectories(file.getParent());
        Files.writeString(file, content);
    }

    @Given("spec.api 目標路徑是空目錄")
    public void 目標路徑是空目錄() throws IOException {
        tempDir = Files.createTempDirectory("api-spec-test-");
    }

    @When("spec.api 讀取 API spec")
    public void 讀取_API_spec() {
        try {
            IsaApiConfig apiConfig = new IsaApiConfig();
            apiConfig.setResourcePath(tempDir.toString());
            result = new ApiSpecReader(apiConfig).read();
        } catch (IllegalArgumentException e) {
            thrownException = e;
        }
    }

    @Then("spec.api ApiSpec 的解析結果為:")
    public void apiSpec的解析結果為(String expectedJson) throws IOException {
        assertNull(thrownException,
                "Expected no exception but got: "
                        + (thrownException != null ? thrownException.getMessage() : ""));
        JsonNode expected = jsonMapper.readTree(expectedJson);
        JsonNode actual = jsonMapper.valueToTree(result);
        assertEquals(expected, actual);
    }

    @Then("spec.api 解析應拋出例外訊息包含 {string}")
    public void 解析應拋出例外訊息包含(String expectedMessage) {
        assertNotNull(thrownException, "Expected exception but none was thrown");
        assertTrue(thrownException.getMessage().contains(expectedMessage),
                "Expected message to contain '" + expectedMessage
                        + "' but was: " + thrownException.getMessage());
    }
}
