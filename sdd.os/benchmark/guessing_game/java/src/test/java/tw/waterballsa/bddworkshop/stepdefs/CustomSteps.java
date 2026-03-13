package tw.waterballsa.bddworkshop.stepdefs;

import ai.specformula.core.http.TestResponse;
import ai.specformula.spring.SpecFormulaBridge;
import io.cucumber.java.en.Then;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class CustomSteps {

    @Then("操作失敗")
    public void operationFailed() {
        TestResponse response = SpecFormulaBridge.getInstance().currentContext().getLastResponse();
        int status = response.getStatus();
        assertTrue(status >= 400 && status < 500,
                "預期 HTTP 4xx 但實際為 " + status);
    }

    @Then("操作成功")
    public void operationSuccess() {
        TestResponse response = SpecFormulaBridge.getInstance().currentContext().getLastResponse();
        int status = response.getStatus();
        assertTrue(status >= 200 && status < 300,
                "預期 HTTP 2xx 但實際為 " + status);
    }
}
