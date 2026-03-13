package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.ApiCall;
import ai.specformula.core.instruction.DataTableResponseValidate;
import ai.specformula.core.instruction.EntityNonExistenceValidate;
import ai.specformula.core.instruction.EntitySetup;
import ai.specformula.core.instruction.EntityValidate;
import ai.specformula.core.instruction.JsonResponseValidate;
import ai.specformula.core.instruction.TimeControl;
import ai.specformula.core.spec.isa.model.IsaInstruction;
import ai.specformula.spring.auth.Authenticator;

/**
 * 根據 IsaInstruction 的 instruction_type 和 data_format 產生對應的 StepDefinition。
 * <p>
 * 由 SpecFormulaBackend.loadGlue() 建立，負責將共用元件注入各 StepDefinition。
 * </p>
 */
public class StepDefinitionFactory {

    private static final System.Logger LOG = System.getLogger(StepDefinitionFactory.class.getName());

    private final ISAFeatureArgumentResolver resolver;
    private final Supplier<TimeControl> timeControlSupplier;
    private final Supplier<EntitySetup> entitySetupSupplier;
    private final Supplier<EntityValidate> entityValidateSupplier;
    private final Supplier<EntityNonExistenceValidate> entityNonExistenceValidateSupplier;
    private final Supplier<ApiCall> apiCallSupplier;
    private final Supplier<DataTableResponseValidate> dataTableResponseValidateSupplier;
    private final Supplier<JsonResponseValidate> jsonResponseValidateSupplier;
    private final Supplier<Authenticator> authenticatorSupplier;

    public StepDefinitionFactory(ISAFeatureArgumentResolver resolver,
            Supplier<TimeControl> timeControlSupplier,
            Supplier<EntitySetup> entitySetupSupplier,
            Supplier<EntityValidate> entityValidateSupplier,
            Supplier<EntityNonExistenceValidate> entityNonExistenceValidateSupplier,
            Supplier<ApiCall> apiCallSupplier,
            Supplier<DataTableResponseValidate> dataTableResponseValidateSupplier,
            Supplier<JsonResponseValidate> jsonResponseValidateSupplier,
            Supplier<Authenticator> authenticatorSupplier) {
        this.resolver = resolver;
        this.timeControlSupplier = timeControlSupplier;
        this.entitySetupSupplier = entitySetupSupplier;
        this.entityValidateSupplier = entityValidateSupplier;
        this.entityNonExistenceValidateSupplier = entityNonExistenceValidateSupplier;
        this.apiCallSupplier = apiCallSupplier;
        this.dataTableResponseValidateSupplier = dataTableResponseValidateSupplier;
        this.jsonResponseValidateSupplier = jsonResponseValidateSupplier;
        this.authenticatorSupplier = authenticatorSupplier;
    }

    public AbstractIsaStepDefinition create(IsaInstruction instruction) {
        String type = instruction.getInstructionType();
        String dataFormat = instruction.getDataFormat();

        AbstractIsaStepDefinition stepDef = switch (type) {
            case "time_control" ->
                new TimeControlStepDefinition(instruction, resolver, timeControlSupplier);
            case "entity_setup" ->
                new EntitySetupStepDefinition(instruction, resolver, entitySetupSupplier);
            case "entity_validate" ->
                new EntityValidateStepDefinition(instruction, resolver, entityValidateSupplier);
            case "entity_non_existence_validate" ->
                new EntityNonExistenceValidateStepDefinition(instruction, resolver, entityNonExistenceValidateSupplier);
            case "api_call" ->
                new ApiCallStepDefinition(instruction, resolver, apiCallSupplier, authenticatorSupplier);
            case "response_validate" ->
                createResponseValidateStep(instruction, dataFormat);
            default -> {
                LOG.log(System.Logger.Level.WARNING,
                        "Unknown instruction_type: {0}, skipping instruction: {1}",
                        type, instruction.getName());
                yield null;
            }
        };

        if (stepDef != null) {
            LOG.log(System.Logger.Level.INFO,
                    "Created StepDefinition: {0} -> {1}",
                    instruction.getName(), stepDef.getClass().getSimpleName());
        }

        return stepDef;
    }

    private AbstractIsaStepDefinition createResponseValidateStep(IsaInstruction instruction, String dataFormat) {
        if ("json".equals(dataFormat)) {
            return new JsonResponseValidateStepDefinition(instruction, resolver, jsonResponseValidateSupplier);
        }
        // 預設為 data_table
        return new DataTableResponseValidateStepDefinition(instruction, resolver, dataTableResponseValidateSupplier);
    }
}
