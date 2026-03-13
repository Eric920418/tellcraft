package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.JsonResponseValidate;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import io.cucumber.docstring.DocString;

/**
 * response_validate 類型且 data_format=json 的 StepDefinition。
 * <p>
 * 從 step 中擷取 summary、statusCode 和 DocString， 委派 {@link JsonResponseValidate} 進行
 * JSON 回應驗證。
 * </p>
 */
public class JsonResponseValidateStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<JsonResponseValidate> jsonResponseValidateSupplier;

    public JsonResponseValidateStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<JsonResponseValidate> jsonResponseValidateSupplier) {
        super(instruction, resolver);
        this.jsonResponseValidateSupplier = jsonResponseValidateSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String summary = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        String statusCode = (args != null && args.length > 1) ? String.valueOf(args[1]) : null;
        DocString docString = extractDocString(args);
        jsonResponseValidateSupplier.get().validate(summary, statusCode, docString);
    }

    private DocString extractDocString(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        Object last = args[args.length - 1];
        return (last instanceof DocString ds) ? ds : null;
    }
}
