package ai.specformula.core.instruction.apicall;

import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

/**
 * MockMvc 用的 Echo 控制器。
 * 捕獲請求的所有細節（path、method、headers、query params、body），
 * 並回傳預先設定的回應。
 */
@RestController
class EchoController {

    private static final AtomicReference<String> responseBody = new AtomicReference<>("{}");
    private static final AtomicInteger responseStatus = new AtomicInteger(200);
    private static final AtomicReference<RequestCapture> lastCapture = new AtomicReference<>();

    static void configureResponse(int status, String body) {
        responseStatus.set(status);
        responseBody.set(body);
    }

    static RequestCapture getLastCapture() {
        return lastCapture.get();
    }

    static void reset() {
        responseStatus.set(200);
        responseBody.set("{}");
        lastCapture.set(null);
    }

    @RequestMapping(value = "/**")
    public ResponseEntity<String> handle(
            HttpServletRequest request,
            @RequestParam(required = false) Map<String, String> queryParams,
            @RequestBody(required = false) String body) {

        Map<String, String> headers = new LinkedHashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            headers.put(name, request.getHeader(name));
        }

        if (queryParams == null) {
            queryParams = new LinkedHashMap<>();
        }

        lastCapture.set(new RequestCapture(
                request.getRequestURI(),
                headers,
                queryParams,
                body
        ));

        return ResponseEntity.status(responseStatus.get())
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .body(responseBody.get());
    }

    static class RequestCapture {

        final String path;
        final Map<String, String> headers;
        final Map<String, String> queryParams;
        final String body;

        RequestCapture(String path,
                Map<String, String> headers,
                Map<String, String> queryParams,
                String body) {
            this.path = path;
            this.headers = headers;
            this.queryParams = queryParams;
            this.body = body;
        }
    }
}
