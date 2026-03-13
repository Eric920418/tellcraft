package ai.specformula.spring;

import java.io.PrintWriter;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

/**
 * JDBC DataSource 追蹤代理，本身即為 {@link DataSource}。
 * <p>
 * 透過 JDK 動態代理攔截 {@code getConnection()} 回傳的 Connection / Statement， 解析 SQL 中的
 * {@code INSERT INTO} 並記錄被寫入的 table。 清理時只清理 dirty tables，大幅減少 disposeWorld 時間。
 * </p>
 * <p>
 * 由 {@code TestcontainerFactory} 建立時自動包裝；
 * {@link ai.specformula.spring.SpecFormulaBridge#setDataSource(String, DataSource)}
 * 會以 {@code instanceof TrackingDataSource} 判斷是否啟用 dirty table tracking。
 * </p>
 */
public class TrackingDataSource implements DataSource {

    private static final Pattern INSERT_PATTERN
            = Pattern.compile("(?i)INSERT\\s+INTO\\s+[\\[\"` ]?([\\w.]+)");

    private final DataSource original;
    private final DataSource proxy;
    private final Set<String> dirtyTables = ConcurrentHashMap.newKeySet();

    private TrackingDataSource(DataSource original) {
        this.original = original;
        this.proxy = createDataSourceProxy(original);
    }

    /**
     * 包裝 DataSource，回傳 TrackingDataSource 實例。
     */
    public static TrackingDataSource wrap(DataSource ds) {
        return new TrackingDataSource(ds);
    }

    /**
     * 取得原始 DataSource。
     */
    public DataSource getOriginal() {
        return original;
    }

    /**
     * 取得被 INSERT 過的 table 名稱集合。
     */
    public Set<String> getDirtyTables() {
        return dirtyTables;
    }

    /**
     * 清除 dirty table 記錄（每個 scenario 結束後呼叫）。
     */
    public void clearDirtyTables() {
        dirtyTables.clear();
    }

    // ==================== DataSource 介面實作（委派給 proxy） ====================
    @Override
    public Connection getConnection() throws SQLException {
        return proxy.getConnection();
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return proxy.getConnection(username, password);
    }

    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return original.getLogWriter();
    }

    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
        original.setLogWriter(out);
    }

    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
        original.setLoginTimeout(seconds);
    }

    @Override
    public int getLoginTimeout() throws SQLException {
        return original.getLoginTimeout();
    }

    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return original.getParentLogger();
    }

    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        if (iface.isInstance(this)) {
            return iface.cast(this);
        }
        return original.unwrap(iface);
    }

    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return iface.isInstance(this) || original.isWrapperFor(iface);
    }

    // ==================== Proxy 建立 ====================
    private DataSource createDataSourceProxy(DataSource ds) {
        return (DataSource) Proxy.newProxyInstance(
                ds.getClass().getClassLoader(),
                new Class<?>[]{DataSource.class},
                new DataSourceHandler(ds));
    }

    private Connection createConnectionProxy(Connection conn) {
        return (Connection) Proxy.newProxyInstance(
                conn.getClass().getClassLoader(),
                new Class<?>[]{Connection.class},
                new ConnectionHandler(conn));
    }

    private Statement createStatementProxy(Statement stmt) {
        return (Statement) Proxy.newProxyInstance(
                stmt.getClass().getClassLoader(),
                new Class<?>[]{Statement.class},
                new StatementHandler(stmt, null));
    }

    private PreparedStatement createPreparedStatementProxy(PreparedStatement ps, String sql) {
        return (PreparedStatement) Proxy.newProxyInstance(
                ps.getClass().getClassLoader(),
                new Class<?>[]{PreparedStatement.class},
                new StatementHandler(ps, sql));
    }

    // ==================== SQL 解析 ====================
    private void trackInsert(String sql) {
        if (sql == null) {
            return;
        }
        Matcher m = INSERT_PATTERN.matcher(sql);
        if (m.find()) {
            dirtyTables.add(m.group(1).toLowerCase());
        }
    }

    // ==================== InvocationHandlers ====================
    private class DataSourceHandler implements InvocationHandler {

        private final DataSource delegate;

        DataSourceHandler(DataSource delegate) {
            this.delegate = delegate;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            try {
                Object result = method.invoke(delegate, args);
                if (result instanceof Connection conn && method.getName().equals("getConnection")) {
                    return createConnectionProxy(conn);
                }
                return result;
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }
    }

    private class ConnectionHandler implements InvocationHandler {

        private final Connection delegate;

        ConnectionHandler(Connection delegate) {
            this.delegate = delegate;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            try {
                Object result = method.invoke(delegate, args);
                String name = method.getName();

                if (result instanceof PreparedStatement ps && name.startsWith("prepareStatement")) {
                    String sql = (args != null && args.length > 0 && args[0] instanceof String s) ? s : null;
                    return createPreparedStatementProxy(ps, sql);
                }
                if (result instanceof Statement stmt && name.equals("createStatement")) {
                    return createStatementProxy(stmt);
                }
                return result;
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }
    }

    private class StatementHandler implements InvocationHandler {

        private final Statement delegate;
        private final String preparedSql;

        StatementHandler(Statement delegate, String preparedSql) {
            this.delegate = delegate;
            this.preparedSql = preparedSql;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();

            if (preparedSql != null && isExecuteMethod(name) && (args == null || args.length == 0
                    || !(args[0] instanceof String))) {
                trackInsert(preparedSql);
            }

            if (args != null && args.length > 0 && args[0] instanceof String sql) {
                if (isExecuteMethod(name) || "addBatch".equals(name)) {
                    trackInsert(sql);
                }
            }

            try {
                return method.invoke(delegate, args);
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }

        private boolean isExecuteMethod(String name) {
            return "execute".equals(name)
                    || "executeUpdate".equals(name)
                    || "executeLargeUpdate".equals(name)
                    || "executeBatch".equals(name)
                    || "executeLargeBatch".equals(name);
        }
    }
}
