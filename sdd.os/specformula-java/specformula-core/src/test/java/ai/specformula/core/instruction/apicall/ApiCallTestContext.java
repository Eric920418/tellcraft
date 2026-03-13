package ai.specformula.core.instruction.apicall;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.core.http.TestRequest;
import ai.specformula.core.http.TestResponse;
import ai.specformula.core.instruction.ApiCall;
import ai.specformula.core.spec.api.model.ApiSpec;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

/**
 * PicoContainer 管理的共享測試狀態。
 * 所有 ApiCall 相關的 Step Definition 類別透過建構子注入此物件，
 * 以共享 ScenarioContext、ApiCall 和例外狀態。
 */
public class ApiCallTestContext {

    private ScenarioContext scenarioContext;
    private ISAFeatureArgumentResolver resolver;
    private ApiCall apiCall;
    private Exception thrownException;

    public void init() {
        scenarioContext = new ScenarioContext();
        resolver = new ISAFeatureArgumentResolver(() -> scenarioContext);
        apiCall = null;
        thrownException = null;
        EchoController.reset();
    }

    public void buildApiCall(String apiSpecJson, String timeFormat) throws Exception {
        ObjectMapper om = new ObjectMapper();
        ApiSpec apiSpec = om.readValue(apiSpecJson, ApiSpec.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new EchoController()).build();
        HttpClientAdapter httpClient = new MockMvcHttpClientAdapter(mockMvc);
        apiCall = new ApiCall(resolver, () -> scenarioContext, httpClient, apiSpec, timeFormat);
    }

    public ScenarioContext getScenarioContext() {
        return scenarioContext;
    }

    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public ApiCall getApiCall() {
        return apiCall;
    }

    public Exception getThrownException() {
        return thrownException;
    }

    public void setThrownException(Exception thrownException) {
        this.thrownException = thrownException;
    }

    /**
     * 測試用 MockMvc HttpClientAdapter。
     * 將 TestRequest 轉換為 MockMvc 請求執行，再將 MvcResult 轉換為 TestResponse。
     */
    private static class MockMvcHttpClientAdapter implements HttpClientAdapter {

        private final MockMvc mockMvc;

        MockMvcHttpClientAdapter(MockMvc mockMvc) {
            this.mockMvc = mockMvc;
        }

        @Override
        public TestResponse execute(TestRequest request) throws Exception {
            HttpMethod method = HttpMethod.valueOf(request.getMethod());
            @SuppressWarnings("null")
            MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.request(method, request.getUrl());

            for (Map.Entry<String, List<String>> header : request.getHeaders().entrySet()) {
                for (String value : header.getValue()) {
                    builder.header(header.getKey(), value);
                }
            }

            for (Map.Entry<String, String> param : request.getQueryParams().entrySet()) {
                builder.queryParam(param.getKey(), param.getValue());
            }

            if (request.getBody() != null) {
                builder.content(request.getBody());
            }

            @SuppressWarnings("null")
            MvcResult result = mockMvc.perform(builder).andReturn();
            int status = result.getResponse().getStatus();
            String body = result.getResponse().getContentAsString();
            return new TestResponse(status, body);
        }
    }
}
