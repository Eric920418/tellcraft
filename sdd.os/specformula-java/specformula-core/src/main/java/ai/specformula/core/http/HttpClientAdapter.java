package ai.specformula.core.http;

/**
 * Framework-agnostic HTTP client adapter interface.
 * <p>
 * specformula-spring provides MockMvc-based and TestRestTemplate-based implementations.
 */
public interface HttpClientAdapter {

    /**
     * Execute an HTTP request and return the response.
     *
     * @param request the HTTP request to execute
     * @return the HTTP response
     * @throws Exception if the request execution fails
     */
    TestResponse execute(TestRequest request) throws Exception;
}
