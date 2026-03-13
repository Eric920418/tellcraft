package ai.specformula.core.dialect;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.TableDefinition;

import java.util.List;

public class H2Dialect implements DatabaseDialect {

    @Override
    public CleanupPlan buildCleanupPlan(List<TableDefinition> tables) {
        CleanupPlan.Builder builder = CleanupPlan.builder();

        boolean hasFk = false;
        for (TableDefinition table : tables) {
            builder.addTableCleanup(table.getTableName(),
                    "DELETE FROM " + table.getTableName());
            for (ColumnDefinition col : table.getColumns()) {
                if (col.isAutoIncrement()) {
                    builder.addTableCleanup(table.getTableName(),
                            "ALTER TABLE " + table.getTableName()
                            + " ALTER COLUMN " + col.getName() + " RESTART WITH 1");
                }
                if (!hasFk && col.getForeignKey() != null && !col.getForeignKey().isEmpty()) {
                    hasFk = true;
                }
            }
        }

        if (hasFk) {
            builder.addDisableFkSql("SET REFERENTIAL_INTEGRITY FALSE")
                   .addEnableFkSql("SET REFERENTIAL_INTEGRITY TRUE");
        }

        return builder.build();
    }
}
