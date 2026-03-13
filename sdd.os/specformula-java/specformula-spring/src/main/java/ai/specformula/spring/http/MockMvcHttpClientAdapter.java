package ai.specformula.spring.http;

import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.core.http.TestRequest;
import ai.specformula.core.http.TestResponse;

import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MockMvc 轉接 HttpClientAdapter 的 Adapter。
 * <p>
 * 將 framework-agnostic 的 {@link TestRequest} 轉換為 Spring MockMvc 請求執行，
 * 再將 {@link MvcResult} 轉換為 {@link TestResponse} 回傳。
 * </p>
 */
public class MockMvcHttpClientAdapter implements HttpClientAdapter {

    private final MockMvc mockMvc;

    public MockMvcHttpClientAdapter(MockMvc mockMvc) {
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

        Map<String, List<String>> responseHeaders = new LinkedHashMap<>();
        for (String headerName : result.getResponse().getHeaderNames()) {
            responseHeaders.put(headerName, new ArrayList<>(result.getResponse().getHeaders(headerName)));
        }

        return new TestResponse(status, body, responseHeaders);
    }
}
