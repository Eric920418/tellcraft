package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.ApiCall;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import ai.specformula.spring.auth.Authenticator;
import io.cucumber.datatable.DataTable;

/**
 * api_call 類型的 StepDefinition。
 * <p>
 * 從 step 中擷取 userId 和 summary，委派 {@link ApiCall} 執行 HTTP 請求。
 * </p>
 */
public class ApiCallStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<ApiCall> apiCallSupplier;
    private final Supplier<Authenticator> authenticatorSupplier;

    public ApiCallStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<ApiCall> apiCallSupplier,
            Supplier<Authenticator> authenticatorSupplier) {
        super(instruction, resolver);
        this.apiCallSupplier = apiCallSupplier;
        this.authenticatorSupplier = authenticatorSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String userId = (args != null && args.length > 0) ? asString(args[0]) : null;
        String summary = (args != null && args.length > 1) ? asString(args[1]) : null;
        DataTable dataTable = extractDataTable(args);

        ApiCall apiCall = apiCallSupplier != null ? apiCallSupplier.get() : null;
        if (apiCall == null) {
            throw new IllegalStateException(
                    "[ApiCall] ApiCall 未初始化。請確認已設定 MockMvc 或自訂的 HttpClientAdapter bean。");
        }

        if (userId == null) {
            apiCall.invokeWithoutActor(dataTable, summary);
        } else {
            Object resolvedActorId = resolver.resolveVariable(userId);
            Authenticator authenticator = authenticatorSupplier.get();
            apiCall.invokeWithActor(dataTable, summary,
                    () -> authenticator.getToken(resolvedActorId));
        }
    }

    private String asString(Object arg) {
        if (arg == null) {
            return null;
        }
        String s = String.valueOf(arg);
        return "null".equals(s) ? null : s;
    }

    private DataTable extractDataTable(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DataTable dt) ? dt : null;
    }
}
