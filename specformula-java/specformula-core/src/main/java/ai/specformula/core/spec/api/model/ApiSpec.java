package ai.specformula.core.spec.api.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ApiSpec {

    private String openapi;
    private ApiInfo info;
    private Map<String, ApiOperation> operationBySummary = new LinkedHashMap<>();

    public String getOpenapi() {
        return openapi;
    }

    public void setOpenapi(String openapi) {
        this.openapi = openapi;
    }

    public ApiInfo getInfo() {
        return info;
    }

    public void setInfo(ApiInfo info) {
        this.info = info;
    }

    public List<ApiOperation> getOperations() {
        return new ArrayList<>(operationBySummary.values());
    }

    public void setOperations(List<ApiOperation> operations) {
        this.operationBySummary = new LinkedHashMap<>();
        for (ApiOperation op : operations) {
            if (op.getSummary() != null) {
                if (this.operationBySummary.containsKey(op.getSummary())) {
                    throw new IllegalArgumentException(
                            "Duplicate API operation summary: " + op.getSummary());
                }
                this.operationBySummary.put(op.getSummary(), op);
            }
        }
    }

    public void addOperations(List<ApiOperation> operations) {
        for (ApiOperation op : operations) {
            if (op.getSummary() != null) {
                if (this.operationBySummary.containsKey(op.getSummary())) {
                    throw new IllegalArgumentException(
                            "Duplicate API operation summary: " + op.getSummary());
                }
                this.operationBySummary.put(op.getSummary(), op);
            }
        }
    }

    public ApiOperation findBySummary(String summary) {
        return operationBySummary.get(summary);
    }
}
