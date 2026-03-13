package ai.specformula.core.spec;

import ai.specformula.core.spec.isa.model.IsaApiConfig;
import ai.specformula.core.spec.isa.model.IsaConfig;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;

import java.util.ArrayList;
import java.util.List;

public class SpecReaderConfig {

    private String isaPath = "isa.yml";
    private IsaApiConfig apiConfig;
    private String timeFormat;
    private List<DataSourceEntry> dataSources = new ArrayList<>();

    public String getIsaPath() { return isaPath; }
    public void setIsaPath(String isaPath) { this.isaPath = isaPath; }

    public IsaApiConfig getApiConfig() {
        if (apiConfig != null) {
            return apiConfig;
        }
        IsaApiConfig defaultConfig = new IsaApiConfig();
        defaultConfig.setResourcePath("specs/api");
        return defaultConfig;
    }

    public void setApiConfig(IsaApiConfig apiConfig) { this.apiConfig = apiConfig; }

    public String getTimeFormat() { return timeFormat; }
    public void setTimeFormat(String timeFormat) { this.timeFormat = timeFormat; }

    public List<DataSourceEntry> getDataSources() { return dataSources; }

    /**
     * 從 isa.yml 的 config 區塊套用設定值。
     * isa.yml 的值具有最高優先權。
     */
    public void applyIsaConfig(IsaConfig isaConfig) {
        if (isaConfig == null) return;

        if (isaConfig.getApi() != null) {
            this.apiConfig = isaConfig.getApi();
            if (isaConfig.getApi().getTimeFormat() != null) {
                this.timeFormat = isaConfig.getApi().getTimeFormat();
            }
        }

        if (isaConfig.getData() != null && isaConfig.getData().getSource() != null) {
            this.dataSources = new ArrayList<>();
            for (IsaDataSourceConfig src : isaConfig.getData().getSource()) {
                DataSourceEntry entry = new DataSourceEntry();
                entry.name = src.getName();
                entry.resourcePath = src.getResourcePath();
                entry.projectPath = src.getProjectPath();
                entry.dbType = src.getDbType();
                this.dataSources.add(entry);
            }
        }
    }

    /**
     * 從系統屬性補充設定值。
     * 優先順序：isa.yml > System property > default。
     * <p>
     * 系統屬性僅在 isa.yml 未定義時才生效：
     * <ul>
     *   <li>{@code specformula.db_type} — 若 source 的 dbType 為 null 才用此值</li>
     *   <li>{@code specformula.data_path} — 若 dataSources 為空才用此值建立 default source</li>
     * </ul>
     * </p>
     */
    public void applySystemPropertyOverrides() {
        String sysPropDbType = System.getProperty("specformula.db_type");
        String sysPropDataPath = System.getProperty("specformula.data_path");

        // 若 isa.yml 未定義任何 source，使用系統屬性或預設值建立 default source
        if (dataSources.isEmpty()) {
            DataSourceEntry defaultEntry = new DataSourceEntry();
            defaultEntry.name = "default";
            defaultEntry.resourcePath = (sysPropDataPath != null && !sysPropDataPath.isBlank())
                    ? sysPropDataPath : "specs/data";
            defaultEntry.dbType = (sysPropDbType != null && !sysPropDbType.isBlank())
                    ? sysPropDbType : null;
            dataSources.add(defaultEntry);
        } else {
            // 系統屬性作為 fallback：僅補充 isa.yml 中未定義 dbType 的 source
            if (sysPropDbType != null && !sysPropDbType.isBlank()) {
                for (DataSourceEntry entry : dataSources) {
                    if (entry.dbType == null || entry.dbType.isBlank()) {
                        entry.dbType = sysPropDbType;
                    }
                }
            }
        }
    }

    /**
     * 單一 DataSource 的設定項目。
     */
    public static class DataSourceEntry {
        private String name;
        private String resourcePath;
        private String projectPath;
        private String dbType;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getResourcePath() { return resourcePath; }
        public void setResourcePath(String resourcePath) { this.resourcePath = resourcePath; }

        public String getProjectPath() { return projectPath; }
        public void setProjectPath(String projectPath) { this.projectPath = projectPath; }

        public String getDbType() { return dbType; }
        public void setDbType(String dbType) { this.dbType = dbType; }
    }
}
