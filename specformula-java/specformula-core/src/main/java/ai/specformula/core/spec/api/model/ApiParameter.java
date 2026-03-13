package ai.specformula.core.spec.api.model;

public class ApiParameter {

    private String name;
    private String in;
    private boolean required;
    private ApiSchema schema;
    private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIn() {
        return in;
    }

    public void setIn(String in) {
        this.in = in;
    }

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
