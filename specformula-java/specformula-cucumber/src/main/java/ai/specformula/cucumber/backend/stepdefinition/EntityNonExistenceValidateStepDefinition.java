package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.EntityNonExistenceValidate;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.datatable.DataTable;

/**
 * entity_non_existence_validate 類型的 StepDefinition。 從 step 中擷取 entity 名稱，驗證該
 * entity 不存在於資料庫。
 */
public class EntityNonExistenceValidateStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<EntityNonExistenceValidate> entityNonExistenceValidateSupplier;

    public EntityNonExistenceValidateStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<EntityNonExistenceValidate> entityNonExistenceValidateSupplier) {
        super(instruction, resolver);
        this.entityNonExistenceValidateSupplier = entityNonExistenceValidateSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String entityName = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        DataTable dataTable = extractDataTable(args);

        if (entityName == null || entityName.isBlank()) {
            throw new IllegalArgumentException(
                    "[EntityNonExistenceValidate] 缺少 entity 名稱。instruction=" + instruction.getName());
        }
        if (dataTable == null) {
            throw new IllegalArgumentException(
                    "[EntityNonExistenceValidate] 缺少 DataTable。instruction=" + instruction.getName());
        }

        EntityNonExistenceValidate entityNonExistenceValidate = entityNonExistenceValidateSupplier != null ? entityNonExistenceValidateSupplier.get() : null;
        if (entityNonExistenceValidate == null) {
            throw new IllegalStateException(
                    "[EntityNonExistenceValidate] EntityNonExistenceValidate 未初始化。請確認已設定 ConnectionSupplier。");
        }

        entityNonExistenceValidate.assertNotExists(entityName, dataTable);
    }

    private DataTable extractDataTable(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DataTable dt) ? dt : null;
    }
}
