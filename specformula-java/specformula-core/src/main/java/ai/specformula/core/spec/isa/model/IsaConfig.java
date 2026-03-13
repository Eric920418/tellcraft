package ai.specformula.core.spec.isa.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IsaConfig {

    private IsaApiConfig api;
    private IsaDataConfig data;

    public IsaApiConfig getApi() {
        return api;
    }

    public void setApi(IsaApiConfig api) {
        this.api = api;
    }

    public IsaDataConfig getData() {
        return data;
    }

    public void setData(IsaDataConfig data) {
        this.data = data;
    }
}
