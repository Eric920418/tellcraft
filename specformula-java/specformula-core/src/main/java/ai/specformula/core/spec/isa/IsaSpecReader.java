package ai.specformula.core.spec.isa;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import ai.specformula.core.spec.isa.model.IsaApiConfig;
import ai.specformula.core.spec.isa.model.IsaConfig;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import ai.specformula.core.spec.isa.model.IsaSpec;

public class IsaSpecReader {

    private final String resourcePath;
    private final ObjectMapper mapper;

    public IsaSpecReader() {
        this("isa.yml");
    }

    public IsaSpecReader(String resourcePath) {
        this.resourcePath = resourcePath;
        this.mapper = new ObjectMapper(new YAMLFactory());
        this.mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public IsaSpec read() {
        try (InputStream is = openResource()) {
            return readFromStream(is);
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read ISA spec from: " + resourcePath, e);
        }
    }

    private InputStream openResource() throws IOException {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        InputStream is = cl.getResourceAsStream(resourcePath);
        if (is != null) {
            return is;
        }
        Path path = Path.of(resourcePath);
        if (Files.exists(path)) {
            return Files.newInputStream(path);
        }
        throw new IllegalArgumentException("isa.yml not found at: " + resourcePath);
    }

    private  IsaSpec readFromStream(InputStream is) throws IOException {
        IsaSpec spec = mapper.readValue(is, IsaSpec.class);
        applyDefaults(spec);
        validate(spec);
        return spec;
    }

    private static final Set<String> VALID_TIME_FORMATS = Set.of(
            "iso", "timestamp", "epoch", "date_only", "time_only");

    private static final Set<String> VALID_DB_TYPES = Set.of(
            "h2", "postgresql", "mssql", "mysql");

    private static final Set<String> VALID_PERMISSIONS = Set.of(
            "isolated", "shared");

    private static final Set<String> VALID_INSTRUCTION_TYPES = Set.of(
            "time_control", "entity_setup", "api_call", "response_validate",
            "entity_validate", "entity_non_existence_validate", "custom");

    private static final Set<String> ENTITY_INSTRUCTION_TYPES = Set.of(
            "entity_setup", "entity_validate", "entity_non_existence_validate");

    private static final Set<String> API_INSTRUCTION_TYPES = Set.of(
            "api_call", "response_validate");

    private static final Set<String> VALID_DATA_FORMATS = Set.of(
            "data_table", "json");

    private void applyDefaults(IsaSpec spec) {
        IsaConfig config = spec.getConfig();
        if (config == null) {
            return;
        }
        IsaApiConfig api = config.getApi();
        if (api != null && api.getTimeFormat() == null) {
            api.setTimeFormat("iso");
        }
        if (config.getData() != null) {
            if (config.getData().getPermission() == null) {
                config.getData().setPermission("isolated");
            }
            if (config.getData().getSource() != null) {
                for (IsaDataSourceConfig source : config.getData().getSource()) {
                    if (source.getDbType() == null) {
                        source.setDbType("h2");
                    }
                }
            }
        }
    }

    private void validate(IsaSpec spec) {
        IsaConfig config = spec.getConfig();
        if (config == null) {
            throw new IllegalArgumentException("isa.yml must contain a 'config' section");
        }
        if (config.getApi() == null) {
            throw new IllegalArgumentException("config must contain 'api'");
        }
        if (isBlank(config.getApi().getResourcePath())) {
            throw new IllegalArgumentException("config.api.resource_path is required");
        }
        if (isBlank(config.getApi().getProjectPath())) {
            throw new IllegalArgumentException("config.api.project_path is required");
        }
        if (!VALID_TIME_FORMATS.contains(config.getApi().getTimeFormat())) {
            throw new IllegalArgumentException(
                    "config.api.time_format must be one of " + new TreeSet<>(VALID_TIME_FORMATS)
                            + " but got: " + config.getApi().getTimeFormat());
        }
        if (config.getData() == null) {
            throw new IllegalArgumentException("config must contain 'data'");
        }
        if (!VALID_PERMISSIONS.contains(config.getData().getPermission())) {
            throw new IllegalArgumentException(
                    "config.data.permission must be one of " + new TreeSet<>(VALID_PERMISSIONS)
                            + " but got: " + config.getData().getPermission());
        }
        if (config.getData().getSource() == null || config.getData().getSource().isEmpty()) {
            throw new IllegalArgumentException("config.data.source must not be empty");
        }
        Set<String> seenNames = new HashSet<>();
        for (IsaDataSourceConfig source : config.getData().getSource()) {
            if (isBlank(source.getName())) {
                throw new IllegalArgumentException("config.data.source[].name is required");
            }
            if (!seenNames.add(source.getName())) {
                throw new IllegalArgumentException(
                        "config.data.source[].name must be unique, duplicate: " + source.getName());
            }
            if (isBlank(source.getResourcePath())) {
                throw new IllegalArgumentException(
                        "config.data.source['" + source.getName() + "'].resource_path is required");
            }
            if (isBlank(source.getProjectPath())) {
                throw new IllegalArgumentException(
                        "config.data.source['" + source.getName() + "'].project_path is required");
            }
            if (!VALID_DB_TYPES.contains(source.getDbType())) {
                throw new IllegalArgumentException(
                        "config.data.source['" + source.getName() + "'].db_type must be one of "
                                + new TreeSet<>(VALID_DB_TYPES) + " but got: " + source.getDbType());
            }
        }

        List<IsaInstruction> instructions = spec.getInstructions();
        if (instructions == null) {
            return;
        }
        for (IsaInstruction instruction : instructions) {
            String type = instruction.getInstructionType();
            if (type == null || !VALID_INSTRUCTION_TYPES.contains(type)) {
                throw new IllegalArgumentException(
                        "Unknown instruction_type: " + type
                                + " in instruction: " + instruction.getName());
            }
            if (ENTITY_INSTRUCTION_TYPES.contains(type)
                    && (instruction.getFormat() == null
                            || !instruction.getFormat().contains("(?P<entity>"))) {
                throw new IllegalArgumentException(
                        "instruction_type '" + type
                                + "' requires (?P<entity>...) in format, but instruction '"
                                + instruction.getName() + "' is missing it");
            }
            if (API_INSTRUCTION_TYPES.contains(type)
                    && (instruction.getFormat() == null
                            || !instruction.getFormat().contains("(?P<summary>"))) {
                throw new IllegalArgumentException(
                        "instruction_type '" + type
                                + "' requires (?P<summary>...) in format, but instruction '"
                                + instruction.getName() + "' is missing it");
            }
            if ("response_validate".equals(type)) {
                if (instruction.getFormat() != null
                        && !instruction.getFormat().contains("(?P<status_code>")) {
                    throw new IllegalArgumentException(
                            "instruction_type 'response_validate'"
                                    + " requires (?P<status_code>...) in format, but instruction '"
                                    + instruction.getName() + "' is missing it");
                }
                if (instruction.getDataFormat() == null
                        || !VALID_DATA_FORMATS.contains(instruction.getDataFormat())) {
                    throw new IllegalArgumentException(
                            "instruction_type 'response_validate' requires data_format to be one of "
                                    + new TreeSet<>(VALID_DATA_FORMATS) + " but instruction '"
                                    + instruction.getName() + "' has: " + instruction.getDataFormat());
                }
            }
            if ("custom".equals(type)) {
                if (instruction.getDataFormat() != null
                        && !VALID_DATA_FORMATS.contains(instruction.getDataFormat())) {
                    throw new IllegalArgumentException(
                            "instruction_type 'custom' requires data_format to be one of "
                                    + new TreeSet<>(VALID_DATA_FORMATS) + " but instruction '"
                                    + instruction.getName() + "' has: " + instruction.getDataFormat());
                }
            }
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
