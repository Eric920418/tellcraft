package ai.specformula.core.spec.data;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.DatabaseSchema;
import ai.specformula.core.spec.data.model.EntityTableMapping;
import ai.specformula.core.spec.data.model.TableDefinition;
import ai.specformula.core.spec.isa.model.IsaDataSourceConfig;

public class EntityDdlReader {

    private static final System.Logger LOG = System.getLogger(EntityDdlReader.class.getName());

    private static final Pattern CREATE_TABLE_PATTERN
            = Pattern.compile("CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(\\w+)\\s*\\(", Pattern.CASE_INSENSITIVE);

    private static final Pattern TABLE_COMMENT_PATTERN
            = Pattern.compile("\\)\\s*COMMENT\\s+'([^']*)'", Pattern.CASE_INSENSITIVE);

    private static final Pattern COLUMN_COMMENT_PATTERN
            = Pattern.compile("COMMENT\\s+'([^']*)'", Pattern.CASE_INSENSITIVE);

    private static final Pattern DEFAULT_PATTERN
            = Pattern.compile("DEFAULT\\s+(\\S+)", Pattern.CASE_INSENSITIVE);

    private static final Pattern CHECK_PATTERN
            = Pattern.compile("CHECK\\s*\\((.+)\\)", Pattern.CASE_INSENSITIVE);

    private static final Pattern COMPOSITE_PK_PATTERN
            = Pattern.compile("PRIMARY\\s+KEY\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);

    private static final Pattern FOREIGN_KEY_PATTERN
            = Pattern.compile("FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s*REFERENCES\\s+(\\w+)\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);

    private final String resourcePath;
    private final String dataSourceName;
    private final String dbType;

    public EntityDdlReader(IsaDataSourceConfig dataSourceConfig) {
        this.resourcePath = dataSourceConfig.getResourcePath();
        this.dataSourceName = dataSourceConfig.getName() != null ? dataSourceConfig.getName() : "default";
        this.dbType = dataSourceConfig.getDbType();
    }

    public DatabaseSchema read() {
        DatabaseSchema schema = new DatabaseSchema();
        schema.setDataSourceName(dataSourceName);
        schema.setDbType(dbType);

        // 優先使用 classpath
        try {
            ClassLoader cl = Thread.currentThread().getContextClassLoader();
            Enumeration<URL> resources = cl.getResources(resourcePath);
            while (resources.hasMoreElements()) {
                URL dirUrl = resources.nextElement();
                Path dirPath = Path.of(dirUrl.toURI());
                if (Files.isDirectory(dirPath)) {
                    scanDirectory(dirPath, schema);
                    return schema;
                }
            }
        } catch (IOException | URISyntaxException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "Failed to scan DDL files from classpath: " + resourcePath, e);
        }

        // 退回使用 filesystem 路徑
        Path dirPath = Path.of(resourcePath);
        if (Files.isDirectory(dirPath)) {
            try {
                scanDirectory(dirPath, schema);
            } catch (IOException e) {
                throw new IllegalArgumentException(
                        "Failed to read DDL files from: " + resourcePath, e);
            }
        }

        return schema;
    }

    private void scanDirectory(Path dirPath, DatabaseSchema schema) throws IOException {
        // Validate entity_to_table_mapping.yml exists
        Path mappingFile = dirPath.resolve("entity_to_table_mapping.yml");
        if (!Files.exists(mappingFile)) {
            throw new IllegalArgumentException(
                    "entity_to_table_mapping.yml not found in: " + dirPath);
        }

        // Read SQL files (single-level only), sorted by filename for deterministic order
        List<Path> sqlFiles = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dirPath, "*.sql")) {
            for (Path file : stream) {
                sqlFiles.add(file);
            }
        }
        if (sqlFiles.isEmpty()) {
            throw new IllegalArgumentException(
                    "No .sql files found in: " + dirPath);
        }
        sqlFiles.sort((a, b) -> a.getFileName().toString().compareTo(b.getFileName().toString()));
        for (Path file : sqlFiles) {
            String sql = Files.readString(file, StandardCharsets.UTF_8);
            List<TableDefinition> parsed = parseDdl(sql);
            parsed.forEach(t -> t.setDbType(dbType));
            schema.getTables().addAll(parsed);
        }

        // Check duplicate table names
        Set<String> seenTableNames = new HashSet<>();
        for (TableDefinition table : schema.getTables()) {
            if (!seenTableNames.add(table.getTableName())) {
                throw new IllegalArgumentException(
                        "Duplicate table name: " + table.getTableName());
            }
        }

        // Read entity_to_table_mapping.yml
        try (InputStream is = Files.newInputStream(mappingFile)) {
            schema.setEntityTableMapping(readMapping(is));
        }

        // Validate entity_to_table_mapping against SQL table names
        Set<String> sqlTableNames = new HashSet<>(seenTableNames);
        Map<String, String> mapping = schema.getEntityTableMapping().asMap();
        for (Map.Entry<String, String> entry : mapping.entrySet()) {
            if (!sqlTableNames.contains(entry.getValue())) {
                throw new IllegalArgumentException(
                        "entity_to_table_mapping 中的 table '" + entry.getValue()
                                + "' (entity: " + entry.getKey() + ") 不存在於 SQL 定義中");
            }
        }
    }

    public List<TableDefinition> parseDdl(String sql) {
        List<TableDefinition> tables = new ArrayList<>();
        Matcher tableMatcher = CREATE_TABLE_PATTERN.matcher(sql);

        while (tableMatcher.find()) {
            String tableName = tableMatcher.group(1);
            int bodyStart = tableMatcher.end(); // position right after '('

            // Find the matching closing ')' using depth counter
            int bodyEnd = findMatchingParen(sql, bodyStart - 1);
            if (bodyEnd < 0) {
                continue;
            }

            String body = sql.substring(bodyStart, bodyEnd);

            TableDefinition table = new TableDefinition(tableName);

            // Parse table-level COMMENT after the closing ')'
            String afterBody = sql.substring(bodyEnd, Math.min(bodyEnd + 200, sql.length()));
            Matcher tableCommentMatcher = TABLE_COMMENT_PATTERN.matcher(")" + afterBody);
            if (tableCommentMatcher.find()) {
                table.setComment(tableCommentMatcher.group(1));
            }

            // Split body into segments by top-level commas
            List<String> segments = splitByTopLevelComma(body);
            for (String segment : segments) {
                String trimmed = segment.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }

                // 移除行內註解（-- ...）再判斷約束類型
                String cleaned = trimmed.replaceAll("(?m)--.*$", "").trim();
                if (cleaned.isEmpty()) {
                    continue;
                }

                // Skip constraint lines (handle PRIMARY KEY / FOREIGN KEY specially)
                String upper = cleaned.toUpperCase();
                if (upper.startsWith("INDEX")
                        || upper.startsWith("UNIQUE")
                        || upper.startsWith("CHECK")) {
                    continue;
                }
                if (upper.startsWith("FOREIGN KEY")
                        || (upper.startsWith("CONSTRAINT") && upper.contains("FOREIGN KEY"))) {
                    applyForeignKey(cleaned, table);
                    continue;
                }
                if (upper.startsWith("PRIMARY KEY")
                        || (upper.startsWith("CONSTRAINT") && upper.contains("PRIMARY KEY"))) {
                    applyCompositePrimaryKey(cleaned, table);
                    continue;
                }

                ColumnDefinition col = parseColumn(trimmed);
                if (col != null) {
                    table.getColumns().add(col);
                }
            }

            // Collect pkColumns from inline PRIMARY KEY columns
            for (ColumnDefinition col : table.getColumns()) {
                if (col.isPrimaryKey()) {
                    table.getPkColumns().add(col.getName());
                }
            }

            // Set queryColumns: non-PK columns excluding high-precision types
            List<String> queryColumns = new ArrayList<>();
            for (ColumnDefinition col : table.getColumns()) {
                if (!col.isPrimaryKey() && !isHighPrecisionType(col.getType())) {
                    queryColumns.add(col.getName());
                }
            }
            table.setQueryColumns(queryColumns);

            tables.add(table);
        }
        return tables;
    }

    public EntityTableMapping readMapping(InputStream is) throws IOException {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        return mapper.readValue(is, EntityTableMapping.class);
    }

    private ColumnDefinition parseColumn(String line) {
        // Remove inline comment (-- ...) — (?m) enables MULTILINE so $ matches each line end
        String cleaned = line.replaceAll("(?m)--.*$", "").trim();
        if (cleaned.isEmpty()) {
            return null;
        }

        // Extract and remove COMMENT 'xxx' first to avoid interference
        String comment = null;
        Matcher commentMatcher = COLUMN_COMMENT_PATTERN.matcher(cleaned);
        if (commentMatcher.find()) {
            comment = commentMatcher.group(1);
            cleaned = commentMatcher.replaceFirst("").trim();
        }

        // Extract column name and type
        // Pattern: <name> <type>[(size)] [constraints...]
        // Name is the first word, type is the second word possibly followed by (...)
        String[] tokens = cleaned.split("\\s+", 3);
        if (tokens.length < 2) {
            return null;
        }

        String name = tokens[0];
        // Skip if name looks like a keyword (safety check)
        if (name.equalsIgnoreCase("CONSTRAINT")) {
            return null;
        }

        // Build type: second token, possibly with parenthesized size
        String rest = cleaned.substring(name.length()).trim();
        String type = extractType(rest);
        String constraints = rest.substring(type.length()).trim();

        ColumnDefinition col = new ColumnDefinition(name, type);
        col.setComment(comment);

        // Parse constraints
        String upperConstraints = constraints.toUpperCase();
        col.setNotNull(upperConstraints.contains("NOT NULL"));
        col.setPrimaryKey(upperConstraints.contains("PRIMARY KEY") || type.toUpperCase().endsWith("SERIAL"));
        col.setUnique(upperConstraints.contains("UNIQUE"));

        // Detect auto-increment: MSSQL IDENTITY(...) or PostgreSQL SERIAL/BIGSERIAL/SMALLSERIAL
        col.setAutoIncrement(upperConstraints.contains("IDENTITY") || type.toUpperCase().endsWith("SERIAL"));

        Matcher defaultMatcher = DEFAULT_PATTERN.matcher(constraints);
        if (defaultMatcher.find()) {
            String defaultValue = defaultMatcher.group(1);
            // Remove surrounding single quotes if present
            if (defaultValue.startsWith("'") && defaultValue.endsWith("'") && defaultValue.length() >= 2) {
                defaultValue = defaultValue.substring(1, defaultValue.length() - 1);
            }
            col.setDefaultValue(defaultValue);
        }

        Matcher checkMatcher = CHECK_PATTERN.matcher(constraints);
        if (checkMatcher.find()) {
            col.setCheckConstraint(checkMatcher.group(1));
        }

        return col;
    }

    private void applyCompositePrimaryKey(String segment, TableDefinition table) {
        Matcher m = COMPOSITE_PK_PATTERN.matcher(segment);
        if (!m.find()) {
            return;
        }
        String[] pkColNames = m.group(1).split(",");
        for (String pkColName : pkColNames) {
            String name = pkColName.trim();
            table.getPkColumns().add(name);
            for (ColumnDefinition col : table.getColumns()) {
                if (col.getName().equalsIgnoreCase(name)) {
                    col.setPrimaryKey(true);
                }
            }
        }
    }

    private void applyForeignKey(String segment, TableDefinition table) {
        Matcher m = FOREIGN_KEY_PATTERN.matcher(segment);
        if (!m.find()) {
            return;
        }
        String fkColName = m.group(1).trim();
        String refTable = m.group(2).trim();
        String refCol = m.group(3).trim();
        for (ColumnDefinition col : table.getColumns()) {
            if (col.getName().equalsIgnoreCase(fkColName)) {
                col.setForeignKey(refTable + "." + refCol);
            }
        }
    }

    private String extractType(String rest) {
        // Match type name, optionally followed by (...) for size/precision
        // e.g. "VARCHAR(100)", "DECIMAL(5, 2)", "SERIAL", "INT", "TIMESTAMP", "DATE", "TEXT"
        Pattern typePattern = Pattern.compile("^(\\w+(?:\\s*\\([^)]*\\))?)");
        Matcher m = typePattern.matcher(rest);
        if (m.find()) {
            return m.group(1);
        }
        // Fallback: just the first word
        return rest.split("\\s+")[0];
    }

    private boolean isHighPrecisionType(String type) {
        String upper = type.toUpperCase();
        return upper.startsWith("TIMESTAMP")
                || upper.startsWith("DATETIME")
                || upper.startsWith("DATE")
                || upper.startsWith("TIME")
                || upper.startsWith("INTERVAL");
    }

    private int findMatchingParen(String sql, int openParenIndex) {
        int depth = 0;
        boolean inSingleQuote = false;
        for (int i = openParenIndex; i < sql.length(); i++) {
            char c = sql.charAt(i);
            if (c == '\'' && !inSingleQuote) {
                inSingleQuote = true;
            } else if (c == '\'' && inSingleQuote) {
                inSingleQuote = false;
            } else if (!inSingleQuote) {
                if (c == '(') {
                    depth++; 
                }else if (c == ')') {
                    depth--;
                    if (depth == 0) {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    private List<String> splitByTopLevelComma(String body) {
        List<String> segments = new ArrayList<>();
        int depth = 0;
        boolean inSingleQuote = false;
        boolean inLineComment = false;
        int start = 0;

        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);

            // Handle line comment: skip until end of line
            if (inLineComment) {
                if (c == '\n' || c == '\r') {
                    inLineComment = false;
                }
                continue;
            }

            // Detect start of line comment (--)
            if (c == '-' && i + 1 < body.length() && body.charAt(i + 1) == '-' && !inSingleQuote) {
                inLineComment = true;
                continue;
            }

            if (c == '\'' && !inSingleQuote) {
                inSingleQuote = true;
            } else if (c == '\'' && inSingleQuote) {
                inSingleQuote = false;
            } else if (!inSingleQuote) {
                if (c == '(') {
                    depth++;
                }else if (c == ')') {
                    depth--;
                }else if (c == ',' && depth == 0) {
                    segments.add(body.substring(start, i));
                    start = i + 1;
                }
            }
        }
        if (start < body.length()) {
            segments.add(body.substring(start));
        }
        return segments;
    }
}
