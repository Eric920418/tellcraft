package ai.specformula.spring.instruction;

import java.util.function.Supplier;

import ai.specformula.core.instruction.TimeControl;

/**
 * {@link TimeControlInstruction} 的轉換層實作。
 * <p>
 * 直接委派給 {@link TimeControl}（無 DataTable 轉換）。
 * </p>
 */
public class TimeControlAdapter implements TimeControlInstruction {

    private final Supplier<TimeControl> delegate;

    public TimeControlAdapter(Supplier<TimeControl> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void setTime(String timeString) {
        delegate.get().setTime(timeString);
    }
}
