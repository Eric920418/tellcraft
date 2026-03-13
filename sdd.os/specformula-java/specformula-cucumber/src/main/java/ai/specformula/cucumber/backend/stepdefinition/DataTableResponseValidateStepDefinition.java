package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.DataTableResponseValidate;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.datatable.DataTable;

/**
 * response_validate 類型且 data_format=data_table 的 StepDefinition。
 * <p>
 * 從 step 中擷取 summary、statusCode 和 DataTable， 委派
 * {@link DataTableResponseValidate} 進行回應驗證。
 * </p>
 */
public class DataTableResponseValidateStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<DataTableResponseValidate> dataTableResponseValidateSupplier;

    public DataTableResponseValidateStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<DataTableResponseValidate> dataTableResponseValidateSupplier) {
        super(instruction, resolver);
        this.dataTableResponseValidateSupplier = dataTableResponseValidateSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String summary = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        String statusCode = (args != null && args.length > 1) ? String.valueOf(args[1]) : null;
        DataTable dataTable = extractDataTable(args);
        dataTableResponseValidateSupplier.get().validate(summary, statusCode, dataTable);
    }

    private DataTable extractDataTable(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DataTable dt) ? dt : null;
    }
}
