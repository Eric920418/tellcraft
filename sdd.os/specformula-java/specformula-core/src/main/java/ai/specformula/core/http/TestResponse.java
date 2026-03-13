package ai.specformula.core.http;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Framework-agnostic HTTP response representation.
 */
public class TestResponse {

    private final int status;
    private final String body;
    private final Map<String, List<String>> headers;

    public TestResponse(int status, String body, Map<String, List<String>> headers) {
        this.status = status;
        this.body = body;
        this.headers = (headers != null) ? Collections.unmodifiableMap(headers) : Collections.emptyMap();
    }

    public TestResponse(int status, String body) {
        this(status, body, Collections.emptyMap());
    }

    public int getStatus() {
        return status;
    }

    public String getBody() {
        return body;
    }

    public Map<String, List<String>> getHeaders() {
        return headers;
    }
}
