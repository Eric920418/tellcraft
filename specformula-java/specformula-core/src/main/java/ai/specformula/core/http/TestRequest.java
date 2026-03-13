package ai.specformula.core.http;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Framework-agnostic HTTP request representation.
 * Built by ApiCall, consumed by HttpClientAdapter implementations.
 */
public class TestRequest {

    private final String method;
    private final String url;
    private final Map<String, List<String>> headers;
    private final Map<String, String> queryParams;
    private final String body;

    private TestRequest(Builder builder) {
        this.method = builder.method;
        this.url = builder.url;
        Map<String, List<String>> h = new LinkedHashMap<>();
        for (var entry : builder.headers.entrySet()) {
            h.put(entry.getKey(), Collections.unmodifiableList(new ArrayList<>(entry.getValue())));
        }
        this.headers = Collections.unmodifiableMap(h);
        this.queryParams = Collections.unmodifiableMap(builder.queryParams);
        this.body = builder.body;
    }

    public String getMethod() { return method; }
    public String getUrl() { return url; }
    public Map<String, List<String>> getHeaders() { return headers; }
    public Map<String, String> getQueryParams() { return queryParams; }
    public String getBody() { return body; }

    public static Builder builder(String method, String url) {
        return new Builder(method, url);
    }

    public static class Builder {
        private final String method;
        private final String url;
        private final Map<String, List<String>> headers = new LinkedHashMap<>();
        private final Map<String, String> queryParams = new LinkedHashMap<>();
        private String body;

        private Builder(String method, String url) {
            this.method = method;
            this.url = url;
        }

        public Builder header(String name, String value) {
            headers.computeIfAbsent(name, k -> new ArrayList<>()).add(value);
            return this;
        }

        public Builder queryParam(String name, String value) {
            queryParams.put(name, value);
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public TestRequest build() {
            return new TestRequest(this);
        }
    }
}
