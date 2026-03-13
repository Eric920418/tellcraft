package ai.specformula.spring.instruction;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import ai.specformula.core.instruction.ApiCall;

/**
 * {@link ApiCallInstruction} 的轉換層實作。
 * <p>
 * 將 {@code List<Map<String, String>>} 轉為 Cucumber DataTable 後委派給 {@link ApiCall}。
 * </p>
 */
public class ApiCallAdapter implements ApiCallInstruction {

    private final Supplier<ApiCall> delegate;

    public ApiCallAdapter(Supplier<ApiCall> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void invokeWithActor(String summary, String token,
                                List<Map<String, String>> dataTable) throws Exception {
        delegate.get().invokeWithActor(DataTableConverter.toDataTable(dataTable), summary, () -> token);
    }

    @Override
    public void invokeWithoutActor(String summary, List<Map<String, String>> dataTable) throws Exception {
        delegate.get().invokeWithoutActor(DataTableConverter.toDataTable(dataTable), summary);
    }
}
