package ai.specformula.core.spec.api.model;

public class ApiResponse {

    private String statusCode;
    private String description;
    private ApiSchema schema;

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ApiSchema getSchema() {
        return schema;
    }

    public void setSchema(ApiSchema schema) {
        this.schema = schema;
    }
}
