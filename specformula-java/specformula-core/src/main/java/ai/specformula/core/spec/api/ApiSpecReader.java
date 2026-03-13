package ai.specformula.core.spec.api;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import ai.specformula.core.spec.api.model.ApiInfo;
import ai.specformula.core.spec.api.model.ApiOperation;
import ai.specformula.core.spec.api.model.ApiParameter;
import ai.specformula.core.spec.api.model.ApiRequestBody;
import ai.specformula.core.spec.api.model.ApiResponse;
import ai.specformula.core.spec.api.model.ApiSchema;
import ai.specformula.core.spec.api.model.ApiSpec;
import ai.specformula.core.spec.isa.model.IsaApiConfig;

public class ApiSpecReader {

    private static final System.Logger LOG = System.getLogger(ApiSpecReader.class.getName());
    private static final Set<String> HTTP_METHODS = Set.of("get", "post", "put", "delete", "patch");

    private final String resourcePath;
    private final ObjectMapper mapper;

    public ApiSpecReader(IsaApiConfig apiConfig) {
        this.resourcePath = apiConfig.getResourcePath();
        this.mapper = new ObjectMapper(new YAMLFactory());
    }

    public ApiSpec read() {
        // 優先使用 classpath
        ApiSpec result = null;
        try {
            ClassLoader cl = Thread.currentThread().getContextClassLoader();
            Enumeration<URL> resources = cl.getResources(resourcePath);
            while (resources.hasMoreElements()) {
                URL dirUrl = resources.nextElement();
                Path cpDirPath = Path.of(dirUrl.toURI());
                if (Files.isDirectory(cpDirPath)) {
                    result = scanDirectory(cpDirPath);
                }
            }
        } catch (IOException | URISyntaxException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "Failed to scan API spec files from classpath: " + resourcePath, e);
        }
        if (result != null) {
            return result;
        }

        // 退回使用 filesystem 路徑
        Path dirPath = Path.of(resourcePath);
        if (Files.isDirectory(dirPath)) {
            try {
                result = scanDirectory(dirPath);
                if (result == null) {
                    throw new IllegalArgumentException(
                            "No API spec files found in: " + resourcePath);
                }
                return result;
            } catch (IOException e) {
                throw new IllegalArgumentException(
                        "Failed to read API specs from: " + resourcePath, e);
            }
        }

        return result;
    }

    private ApiSpec scanDirectory(Path dirPath) throws IOException {
        try (Stream<Path> walk = Files.walk(dirPath)) {
            List<Path> ymlFiles = walk
                    .filter(p -> !Files.isDirectory(p))
                    .filter(p -> p.toString().endsWith(".yml"))
                    .sorted()
                    .toList();

            if (ymlFiles.isEmpty()) {
                return null;
            }

            // Phase 1: Load all YAML roots
            Map<String, JsonNode> allRoots = new LinkedHashMap<>();
            for (Path file : ymlFiles) {
                try (InputStream is = Files.newInputStream(file)) {
                    allRoots.put(file.getFileName().toString(), mapper.readTree(is));
                }
            }

            // Phase 2: Parse first spec as base, merge subsequent operations
            ApiSpec merged = null;
            for (Map.Entry<String, JsonNode> entry : allRoots.entrySet()) {
                ApiSpec spec = parseSpec(entry.getValue(), allRoots);
                if (merged == null) {
                    merged = spec;
                } else {
                    merged.addOperations(spec.getOperations());
                }
            }

            return merged;
        }
    }

    public ApiSpec readFromStream(InputStream is) throws IOException {
        JsonNode root = mapper.readTree(is);
        return parseSpec(root, Map.of());
    }

    private ApiSpec parseSpec(JsonNode root, Map<String, JsonNode> allRoots) {
        ApiSpec spec = new ApiSpec();
        spec.setOpenapi(textOrNull(root, "openapi"));

        JsonNode infoNode = root.get("info");
        if (infoNode != null) {
            ApiInfo info = new ApiInfo();
            info.setTitle(textOrNull(infoNode, "title"));
            info.setVersion(textOrNull(infoNode, "version"));
            info.setDescription(textOrNull(infoNode, "description"));
            spec.setInfo(info);
        }

        List<ApiOperation> operations = new ArrayList<>();
        JsonNode pathsNode = root.get("paths");
        if (pathsNode != null) {
            Iterator<Map.Entry<String, JsonNode>> pathEntries = pathsNode.fields();
            while (pathEntries.hasNext()) {
                Map.Entry<String, JsonNode> pathEntry = pathEntries.next();
                String pathUrl = pathEntry.getKey();
                JsonNode pathNode = pathEntry.getValue();

                Iterator<Map.Entry<String, JsonNode>> methodEntries = pathNode.fields();
                while (methodEntries.hasNext()) {
                    Map.Entry<String, JsonNode> methodEntry = methodEntries.next();
                    String method = methodEntry.getKey().toLowerCase();
                    if (!HTTP_METHODS.contains(method)) {
                        continue;
                    }

                    JsonNode opNode = methodEntry.getValue();
                    ApiOperation op = parseOperation(pathUrl, method, opNode, root, allRoots);
                    operations.add(op);
                }
            }
        }
        spec.setOperations(operations);

        return spec;
    }

    private ApiOperation parseOperation(String pathUrl, String method, JsonNode opNode,
            JsonNode root, Map<String, JsonNode> allRoots) {
        ApiOperation op = new ApiOperation();
        op.setPath(pathUrl);
        op.setMethod(method);
        op.setSummary(textOrNull(opNode, "summary"));
        op.setDescription(textOrNull(opNode, "description"));
        op.setOperationId(textOrNull(opNode, "operationId"));

        // Tags
        JsonNode tagsNode = opNode.get("tags");
        if (tagsNode != null && tagsNode.isArray()) {
            List<String> tags = new ArrayList<>();
            for (JsonNode tag : tagsNode) {
                tags.add(tag.asText());
            }
            op.setTags(tags);
        }

        // Parameters
        JsonNode paramsNode = opNode.get("parameters");
        if (paramsNode != null && paramsNode.isArray()) {
            List<ApiParameter> params = new ArrayList<>();
            for (JsonNode paramNode : paramsNode) {
                JsonNode resolved = resolveRef(paramNode, root, allRoots);
                ApiParameter param = new ApiParameter();
                param.setName(textOrNull(resolved, "name"));
                param.setIn(textOrNull(resolved, "in"));
                param.setRequired(resolved.has("required") && resolved.get("required").asBoolean());
                param.setDescription(textOrNull(resolved, "description"));
                JsonNode schemaNode = resolved.get("schema");
                if (schemaNode != null) {
                    param.setSchema(parseSchema(schemaNode, root, allRoots));
                }
                params.add(param);
            }
            op.setParameters(params);
        }

        // RequestBody
        JsonNode reqBodyNode = opNode.get("requestBody");
        if (reqBodyNode != null) {
            ApiRequestBody reqBody = new ApiRequestBody();
            reqBody.setRequired(reqBodyNode.has("required") && reqBodyNode.get("required").asBoolean());
            JsonNode contentSchema = extractJsonSchema(reqBodyNode);
            if (contentSchema != null) {
                contentSchema = resolveRef(contentSchema, root, allRoots);
                reqBody.setSchema(parseSchema(contentSchema, root, allRoots));
            }
            op.setRequestBody(reqBody);
        }

        // Responses
        JsonNode responsesNode = opNode.get("responses");
        if (responsesNode != null) {
            Map<String, ApiResponse> responses = new LinkedHashMap<>();
            Iterator<Map.Entry<String, JsonNode>> respEntries = responsesNode.fields();
            while (respEntries.hasNext()) {
                Map.Entry<String, JsonNode> respEntry = respEntries.next();
                String statusCode = respEntry.getKey();
                JsonNode respNode = respEntry.getValue();

                ApiResponse resp = new ApiResponse();
                resp.setStatusCode(statusCode);
                resp.setDescription(textOrNull(respNode, "description"));
                JsonNode contentSchema = extractJsonSchema(respNode);
                if (contentSchema != null) {
                    contentSchema = resolveRef(contentSchema, root, allRoots);
                    resp.setSchema(parseSchema(contentSchema, root, allRoots));
                }
                responses.put(statusCode, resp);
            }
            op.setResponses(responses);
        }

        return op;
    }

    private ApiSchema parseSchema(JsonNode schemaNode, JsonNode root, Map<String, JsonNode> allRoots) {
        if (schemaNode == null || schemaNode.isMissingNode()) {
            return null;
        }

        schemaNode = resolveRef(schemaNode, root, allRoots);

        ApiSchema schema = new ApiSchema();
        schema.setType(textOrNull(schemaNode, "type"));
        schema.setFormat(textOrNull(schemaNode, "format"));
        schema.setDescription(textOrNull(schemaNode, "description"));

        // Example (store as string)
        JsonNode exampleNode = schemaNode.get("example");
        if (exampleNode != null) {
            schema.setExample(exampleNode.isTextual() ? exampleNode.asText() : exampleNode.toString());
        }

        // Required
        JsonNode requiredNode = schemaNode.get("required");
        if (requiredNode != null && requiredNode.isArray()) {
            List<String> required = new ArrayList<>();
            for (JsonNode r : requiredNode) {
                required.add(r.asText());
            }
            schema.setRequired(required);
        }

        // Enum
        JsonNode enumNode = schemaNode.get("enum");
        if (enumNode != null && enumNode.isArray()) {
            List<String> enumValues = new ArrayList<>();
            for (JsonNode e : enumNode) {
                enumValues.add(e.asText());
            }
            schema.setEnumValues(enumValues);
        }

        // Properties (recursive)
        JsonNode propertiesNode = schemaNode.get("properties");
        if (propertiesNode != null) {
            Map<String, ApiSchema> properties = new LinkedHashMap<>();
            Iterator<Map.Entry<String, JsonNode>> propEntries = propertiesNode.fields();
            while (propEntries.hasNext()) {
                Map.Entry<String, JsonNode> propEntry = propEntries.next();
                properties.put(propEntry.getKey(), parseSchema(propEntry.getValue(), root, allRoots));
            }
            schema.setProperties(properties);
        }

        // Items (recursive, for arrays)
        JsonNode itemsNode = schemaNode.get("items");
        if (itemsNode != null) {
            schema.setItems(parseSchema(itemsNode, root, allRoots));
        }

        return schema;
    }

    private JsonNode extractJsonSchema(JsonNode parentNode) {
        // Navigate: content -> application/json -> schema
        JsonNode contentNode = parentNode.get("content");
        if (contentNode == null) {
            return null;
        }
        JsonNode jsonContent = contentNode.get("application/json");
        if (jsonContent == null) {
            return null;
        }
        return jsonContent.get("schema");
    }

    /**
     * 解析 $ref 參照。支援本地參照（#/components/...）與跨檔案參照（file.yml#/components/...）。
     * 若節點不含 $ref 或無法解析，回傳原始節點。
     */
    private JsonNode resolveRef(JsonNode node, JsonNode root, Map<String, JsonNode> allRoots) {
        JsonNode refNode = node.get("$ref");
        if (refNode == null || !refNode.isTextual()) {
            return node;
        }
        String ref = refNode.asText();
        if (ref.startsWith("#/")) {
            String[] segments = ref.substring(2).split("/");
            JsonNode current = root;
            for (String segment : segments) {
                if (current == null) {
                    return node;
                }
                current = current.get(segment);
            }
            return current != null ? current : node;
        } else if (ref.contains("#/")) {
            int hashIndex = ref.indexOf("#/");
            String fileName = ref.substring(0, hashIndex);
            String pointer = ref.substring(hashIndex + 2);
            JsonNode otherRoot = allRoots.get(fileName);
            if (otherRoot == null) {
                return node;
            }
            String[] segments = pointer.split("/");
            JsonNode current = otherRoot;
            for (String segment : segments) {
                if (current == null) {
                    return node;
                }
                current = current.get(segment);
            }
            return current != null ? current : node;
        }
        return node;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode child = node.get(field);
        return (child != null && child.isTextual()) ? child.asText() : null;
    }
}
