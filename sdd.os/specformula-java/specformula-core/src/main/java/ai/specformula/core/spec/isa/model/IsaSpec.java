package ai.specformula.core.spec.isa.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IsaSpec {

    private IsaConfig config;
    private List<IsaInstruction> instructions;

    public IsaConfig getConfig() {
        return config;
    }

    public void setConfig(IsaConfig config) {
        this.config = config;
    }

    public List<IsaInstruction> getInstructions() {
        return instructions;
    }

    public void setInstructions(List<IsaInstruction> instructions) {
        this.instructions = instructions;
    }
}
