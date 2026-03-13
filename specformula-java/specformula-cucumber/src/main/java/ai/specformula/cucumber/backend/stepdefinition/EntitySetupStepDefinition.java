package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.EntitySetup;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.datatable.DataTable;

/**
 * entity_setup 類型的 StepDefinition。
 * <p>
 * 從 step 中擷取 entity 名稱與 DataTable，委派 {@link EntitySetup} 準備測試資料。
 * </p>
 */
public class EntitySetupStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<EntitySetup> entitySetupSupplier;

    public EntitySetupStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<EntitySetup> entitySetupSupplier) {
        super(instruction, resolver);
        this.entitySetupSupplier = entitySetupSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String entityName = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        DataTable dataTable = extractDataTable(args);
        entitySetupSupplier.get().setup(entityName, dataTable);
    }

    private DataTable extractDataTable(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DataTable dt) ? dt : null;
    }
}
