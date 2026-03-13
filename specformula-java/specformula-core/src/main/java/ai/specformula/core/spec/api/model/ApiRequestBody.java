package ai.specformula.core.spec.api.model;

public class ApiRequestBody {

    private boolean required;
    private ApiSchema schema;

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public ApiSchema getSchema() {
        return schema;
    }

    public void setSchema(ApiSchema schema) {
        this.schema = schema;
    }
}
