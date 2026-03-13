package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.instruction.EntityValidate;

/**
 * {@link EntityValidateInstruction} 的轉換層實作。
 * <p>
 * 將 {@code List<Map<String, String>>} 轉為 Cucumber DataTable 後委派給 {@link EntityValidate}。
 * </p>
 */
public class EntityValidateAdapter implements EntityValidateInstruction {

    private final Supplier<EntityValidate> delegate;

    public EntityValidateAdapter(Supplier<EntityValidate> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void assertExists(String entityName, List<Map<String, String>> dataTable) throws Exception {
        delegate.get().assertExists(entityName, DataTableConverter.toDataTable(dataTable));
    }
}
