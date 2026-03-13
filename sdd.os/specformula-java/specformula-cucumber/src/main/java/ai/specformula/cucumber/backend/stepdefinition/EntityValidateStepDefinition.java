package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.EntityValidate;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.datatable.DataTable;

/**
 * entity_validate 類型的 StepDefinition。 從 step 中擷取 entity 名稱，驗證該 entity
 * 是否存在於資料庫且欄位符合預期。
 */
public class EntityValidateStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<EntityValidate> entityValidateSupplier;

    public EntityValidateStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<EntityValidate> entityValidateSupplier) {
        super(instruction, resolver);
        this.entityValidateSupplier = entityValidateSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        // args: [entityName, ..., DataTable]
        String entityName = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        DataTable dataTable = extractDataTable(args);

        if (entityName == null || entityName.isBlank()) {
            throw new IllegalArgumentException(
                    "[EntityValidate] 缺少 entity 名稱。instruction=" + instruction.getName());
        }
        if (dataTable == null) {
            throw new IllegalArgumentException(
                    "[EntityValidate] 缺少 DataTable。instruction=" + instruction.getName());
        }

        EntityValidate entityValidate = entityValidateSupplier != null ? entityValidateSupplier.get() : null;
        if (entityValidate == null) {
            throw new IllegalStateException(
                    "[EntityValidate] EntityValidate 未初始化。請確認已設定 ConnectionSupplier。");
        }

        entityValidate.assertExists(entityName, dataTable);
    }

    private DataTable extractDataTable(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DataTable dt) ? dt : null;
    }
}
