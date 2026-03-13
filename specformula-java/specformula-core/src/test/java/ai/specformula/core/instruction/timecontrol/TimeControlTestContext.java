package ai.specformula.core.instruction.timecontrol;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;
import ai.specformula.core.instruction.TimeControl;

/**
 * PicoContainer 管理的共享測試狀態。
 * 所有 TimeControl 相關的 Step Definition 類別透過建構子注入此物件，
 * 以共享 ScenarioContext、Resolver、TimeControl 和例外狀態。
 */
public class TimeControlTestContext {

    private ScenarioContext scenarioContext;
    private ISAFeatureArgumentResolver resolver;
    private TimeControl timeControl;
    private Exception thrownException;

    public void init() {
        scenarioContext = new ScenarioContext();
        resolver = new ISAFeatureArgumentResolver(() -> scenarioContext);
        timeControl = new TimeControl(resolver);
        thrownException = null;
    }

    public ScenarioContext getScenarioContext() {
        return scenarioContext;
    }

    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public TimeControl getTimeControl() {
        return timeControl;
    }

    public Exception getThrownException() {
        return thrownException;
    }

    public void setThrownException(Exception thrownException) {
        this.thrownException = thrownException;
    }
}
