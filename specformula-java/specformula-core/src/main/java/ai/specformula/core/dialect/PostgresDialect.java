package ai.specformula.core.dialect;

import ai.specformula.core.spec.data.model.ColumnDefinition;
import ai.specformula.core.spec.data.model.TableDefinition;

import java.util.List;

public class PostgresDialect implements DatabaseDialect {

    @Override
    public CleanupPlan buildCleanupPlan(List<TableDefinition> tables) {
        CleanupPlan.Builder builder = CleanupPlan.builder();

        for (TableDefinition table : tables) {
            // TRUNCATE CASCADE 自動處理 FK 約束，不需要額外 disable/enable FK
            builder.addTableCleanup(table.getTableName(),
                    "TRUNCATE TABLE " + table.getTableName() + " CASCADE");
            // SERIAL 型別的慣例名稱為 {table}_{column}_seq
            for (ColumnDefinition col : table.getColumns()) {
                if (col.isAutoIncrement()) {
                    builder.addTableCleanup(table.getTableName(),
                            "ALTER SEQUENCE " + table.getTableName()
                            + "_" + col.getName() + "_seq RESTART WITH 1");
                }
            }
        }

        return builder.build();
    }
}
