package ai.specformula.core.spec.api.model;

import java.util.List;
import java.util.Map;

public class ApiSchema {

    private String type;
    private String format;
    private String description;
    private List<String> required;
    private Map<String, ApiSchema> properties;
    private ApiSchema items;
    private List<String> enumValues;
    private String example;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getRequired() {
        return required;
    }

    public void setRequired(List<String> required) {
        this.required = required;
    }

    public Map<String, ApiSchema> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, ApiSchema> properties) {
        this.properties = properties;
    }

    public ApiSchema getItems() {
        return items;
    }

    public void setItems(ApiSchema items) {
        this.items = items;
    }

    public List<String> getEnumValues() {
        return enumValues;
    }

    public void setEnumValues(List<String> enumValues) {
        this.enumValues = enumValues;
    }

    public String getExample() {
        return example;
    }

    public void setExample(String example) {
        this.example = example;
    }
}
