package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.instruction.EntitySetup;

/**
 * {@link EntitySetupInstruction} 的轉換層實作。
 * <p>
 * 將 {@code List<Map<String, String>>} 轉為 Cucumber DataTable 後委派給 {@link EntitySetup}。
 * </p>
 */
public class EntitySetupAdapter implements EntitySetupInstruction {

    private final Supplier<EntitySetup> delegate;

    public EntitySetupAdapter(Supplier<EntitySetup> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void setup(String entityName, List<Map<String, String>> dataTable) throws Exception {
        delegate.get().setup(entityName, DataTableConverter.toDataTable(dataTable));
    }
}
