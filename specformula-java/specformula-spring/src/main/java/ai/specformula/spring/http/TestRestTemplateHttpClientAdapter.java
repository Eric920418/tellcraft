package ai.specformula.spring.http;

import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.core.http.TestRequest;
import ai.specformula.core.http.TestResponse;

import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TestRestTemplate 轉接 HttpClientAdapter 的 Adapter。
 * <p>
 * 適用於 {@code @SpringBootTest(webEnvironment = RANDOM_PORT)} 等需要啟動真實伺服器的場景。
 * 將 framework-agnostic 的 {@link TestRequest} 轉換為 TestRestTemplate 呼叫，
 * 再將 {@link ResponseEntity} 轉換為 {@link TestResponse} 回傳。
 * </p>
 * <p>
 * 內部使用 Apache HttpClient（{@link HttpComponentsClientHttpRequestFactory}）取代預設的
 * {@code HttpURLConnection}，避免 JDK 內建的 401 authentication retry 機制導致
 * {@code HttpRetryException} 與 response body 遺失。
 * </p>
 */
public class TestRestTemplateHttpClientAdapter implements HttpClientAdapter {

    private final TestRestTemplate restTemplate;

    public TestRestTemplateHttpClientAdapter(TestRestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        // 使用 Apache HttpClient 取代 HttpURLConnection，
        // 避免 401 response 觸發 JDK 內建 auth retry 導致 HttpRetryException
        restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
    }

    @Override
    public TestResponse execute(TestRequest request) throws Exception {
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        HttpHeaders headers = new HttpHeaders();
        for (Map.Entry<String, List<String>> header : request.getHeaders().entrySet()) {
            headers.put(header.getKey(), header.getValue());
        }

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromPath(request.getUrl());
        for (Map.Entry<String, String> param : request.getQueryParams().entrySet()) {
            uriBuilder.queryParam(param.getKey(), param.getValue());
        }
        String url = uriBuilder.toUriString();

        HttpEntity<String> entity = new HttpEntity<>(request.getBody(), headers);

        ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

        Map<String, List<String>> responseHeaders = new LinkedHashMap<>(response.getHeaders());
        return new TestResponse(response.getStatusCode().value(), response.getBody(), responseHeaders);
    }
}
