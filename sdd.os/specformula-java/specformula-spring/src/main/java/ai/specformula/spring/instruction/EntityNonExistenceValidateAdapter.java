package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.instruction.EntityNonExistenceValidate;

/**
 * {@link EntityNonExistenceValidateInstruction} 的轉換層實作。
 * <p>
 * 將 {@code List<Map<String, String>>} 轉為 Cucumber DataTable 後委派給 {@link EntityNonExistenceValidate}。
 * </p>
 */
public class EntityNonExistenceValidateAdapter implements EntityNonExistenceValidateInstruction {

    private final Supplier<EntityNonExistenceValidate> delegate;

    public EntityNonExistenceValidateAdapter(Supplier<EntityNonExistenceValidate> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void assertNotExists(String entityName, List<Map<String, String>> dataTable) throws Exception {
        delegate.get().assertNotExists(entityName, DataTableConverter.toDataTable(dataTable));
    }
}
