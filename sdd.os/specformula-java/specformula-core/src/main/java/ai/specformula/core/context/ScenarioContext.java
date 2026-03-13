package ai.specformula.core.context;

import java.util.HashMap;
import java.util.Map;

import ai.specformula.core.http.TestResponse;

/**
 * 場景生命週期內的鍵值儲存容器。
 * <p>
 * 每個 Cucumber Scenario 執行期間持有一個 ScenarioContext 實例，
 * 透過 {@code SpecFormulaBackend.buildWorld()} 建立、{@code disposeWorld()} 清除。
 * </p>
 */
public class ScenarioContext implements ScenarioContextAccessor {

    private TestResponse lastResponse;
    private final Map<String, Object> contextData = new HashMap<>();

    public TestResponse getLastResponse() {
        return lastResponse;
    }

    public void setLastResponse(TestResponse lastResponse) {
        this.lastResponse = lastResponse;
    }

    public void clear() {
        this.lastResponse = null;
    }

    public void reset() {
        this.lastResponse = null;
        this.contextData.clear();
    }

    public void put(String key, String value) {
        contextData.put(key, value);
    }

    @Override
    public void putObject(String key, Object value) {
        contextData.put(key, value);
    }

    @Override
    public Object get(String key) {
        return contextData.get(key);
    }
}
