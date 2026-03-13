package ai.specformula.core.helper.resolver;

import ai.specformula.core.context.ScenarioContext;
import ai.specformula.core.helper.ISAFeatureArgumentResolver;

/**
 * PicoContainer 管理的共享測試狀態。
 * 所有 resolver 相關的 Step Definition 類別透過建構子注入此物件，
 * 以共享 ScenarioContext、Resolver 和當前實際值。
 */
public class ResolverTestContext {

    private ScenarioContext scenarioContext;
    private ISAFeatureArgumentResolver resolver;
    private Object actualValue;
    private Object resolveResult;
    private Exception thrownException;

    public void init() {
        scenarioContext = new ScenarioContext();
        resolver = new ISAFeatureArgumentResolver(() -> scenarioContext);
        actualValue = null;
        resolveResult = null;
        thrownException = null;
    }

    public ScenarioContext getScenarioContext() {
        return scenarioContext;
    }

    public ISAFeatureArgumentResolver getResolver() {
        return resolver;
    }

    public Object getActualValue() {
        return actualValue;
    }

    public void setActualValue(Object actualValue) {
        this.actualValue = actualValue;
    }

    public Object getResolveResult() {
        return resolveResult;
    }

    public void setResolveResult(Object resolveResult) {
        this.resolveResult = resolveResult;
    }

    public Exception getThrownException() {
        return thrownException;
    }

    public void setThrownException(Exception thrownException) {
        this.thrownException = thrownException;
    }
}
