package ai.specformula.core.dialect;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.TableDefinition;

import java.util.List;

public class MysqlDialect implements DatabaseDialect {

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
                        "ALTER TABLE " + table.getTableName() + " AUTO_INCREMENT = 1");
            }
        }

        if (hasFk) {
            builder.addDisableFkSql("SET FOREIGN_KEY_CHECKS=0")
                   .addEnableFkSql("SET FOREIGN_KEY_CHECKS=1");
        }

        return builder.build();
    }
}
