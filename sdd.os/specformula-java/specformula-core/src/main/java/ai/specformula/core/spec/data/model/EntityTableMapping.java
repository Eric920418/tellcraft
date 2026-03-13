package ai.specformula.core.spec.data.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EntityTableMapping {

    @JsonProperty("entity_to_table_mapping")
    private List<Map<String, String>> entityToTableMapping;

    public List<Map<String, String>> getEntityToTableMapping() { return entityToTableMapping; }
    public void setEntityToTableMapping(List<Map<String, String>> entityToTableMapping) {
        this.entityToTableMapping = entityToTableMapping;
    }

    public Map<String, String> asMap() {
        Map<String, String> result = new LinkedHashMap<>();
        if (entityToTableMapping != null) {
            for (Map<String, String> entry : entityToTableMapping) {
                result.putAll(entry);
            }
        }
        return result;
    }
}
