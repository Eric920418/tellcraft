package ai.specformula.core.dialect;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.TableDefinition;

import java.util.List;

public class MssqlDialect implements DatabaseDialect {

    @Override
    public CleanupPlan buildCleanupPlan(List<TableDefinition> tables) {
        CleanupPlan.Builder builder = CleanupPlan.builder();

        boolean hasFk = false;
        for (TableDefinition table : tables) {
            builder.addTableCleanup(table.getTableName(),
                    "DELETE FROM " + table.getTableName());
            boolean hasAutoInc = false;
            for (ColumnDefinition col : table.getColumns()) {
                if (!hasAutoInc && col.isAutoIncrement()) {
                    hasAutoInc = true;
                }
                if (!hasFk && col.getForeignKey() != null && !col.getForeignKey().isEmpty()) {
                    hasFk = true;
                }
            }
            if (hasAutoInc) {
                builder.addTableCleanup(table.getTableName(),
                        "DBCC CHECKIDENT('" + table.getTableName() + "', RESEED, 0)");
            }
        }

        if (hasFk) {
            for (TableDefinition table : tables) {
                String tableName = table.getTableName();
                builder.addDisableFkSql("ALTER TABLE " + tableName + " NOCHECK CONSTRAINT ALL");
                builder.addEnableFkSql("ALTER TABLE " + tableName + " WITH CHECK CHECK CONSTRAINT ALL");
            }
        }

        return builder.build();
    }
}
