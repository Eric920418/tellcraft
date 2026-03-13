package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.instruction.DataTableResponseValidate;

/**
 * {@link ResponseValidateInstruction} 的轉換層實作。
 * <p>
 * 將 {@code List<Map<String, String>>} 轉為 Cucumber DataTable 後委派給 {@link DataTableResponseValidate}。
 * </p>
 */
public class ResponseValidateAdapter implements ResponseValidateInstruction {

    private final Supplier<DataTableResponseValidate> delegate;

    public ResponseValidateAdapter(Supplier<DataTableResponseValidate> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void validate(String summary, String statusCode, List<Map<String, String>> dataTable) throws Exception {
        delegate.get().validate(summary, statusCode,
                dataTable != null ? DataTableConverter.toDataTable(dataTable) : null);
    }
}
