package ai.specformula.cucumber.backend.stepdefinition;

import java.util.function.Supplier;

import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.TimeControl;
import ai.specformula.core.spec.isa.model.IsaInstruction;

/**
 * time_control 類型的 StepDefinition。 從 step 中擷取時間參數字串，委派 {@link TimeControl}
 * 設定測試情境的當前時間。
 */
public class TimeControlStepDefinition extends AbstractIsaStepDefinition {

    private final Supplier<TimeControl> timeControlSupplier;

    public TimeControlStepDefinition(IsaInstruction instruction, ISAFeatureArgumentResolver resolver,
            Supplier<TimeControl> timeControlSupplier) {
        super(instruction, resolver);
        this.timeControlSupplier = timeControlSupplier;
    }

    @Override
    protected void doExecute(Object[] args) throws Exception {
        String timeString = (args != null && args.length > 0) ? String.valueOf(args[0]) : null;
        timeControlSupplier.get().setTime(timeString);
    }
}
