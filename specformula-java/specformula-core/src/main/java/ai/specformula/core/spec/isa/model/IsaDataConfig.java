package ai.specformula.core.spec.isa.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IsaDataConfig {

    @JsonProperty("permission")
    private String permission;

    @JsonProperty("reuse")
    private boolean reuse;

    @JsonProperty("source")
    private List<IsaDataSourceConfig> source;

    public boolean isReuse() {
        return reuse;
    }

    public void setReuse(boolean reuse) {
        this.reuse = reuse;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public List<IsaDataSourceConfig> getSource() {
        return source;
    }

    public void setSource(List<IsaDataSourceConfig> source) {
        this.source = source;
    }
}
