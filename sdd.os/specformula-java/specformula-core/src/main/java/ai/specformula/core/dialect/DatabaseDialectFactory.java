package ai.specformula.core.dialect;

public class DatabaseDialectFactory {

    public static DatabaseDialect create(String dbType) {
        if (dbType == null) return new H2Dialect();
        return switch (dbType.toLowerCase()) {
            case "mssql", "sqlserver" -> new MssqlDialect();
            case "postgresql", "postgres" -> new PostgresDialect();
            case "mysql", "mariadb" -> new MysqlDialect();
            default -> new H2Dialect();
        };
    }
}
