package ai.specformula.cucumber.backend;

import io.cucumber.core.backend.CucumberBackendException;
import io.cucumber.core.backend.CucumberInvocationTargetException;
import io.cucumber.core.backend.ParameterInfo;
import io.cucumber.core.backend.StepDefinition;

import java.lang.reflect.InvocationTargetException;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

public class SpecFormulaStepDefinition implements StepDefinition {

    private final String pattern;
    private final Consumer<Object[]> execution;
    private final String location;

    public SpecFormulaStepDefinition(String pattern,
                                     Consumer<Object[]> execution,
                                     String location) {
        this.pattern = pattern;
        this.execution = execution;
        this.location = location;
    }

    @Override
    public void execute(Object[] args)
            throws CucumberBackendException, CucumberInvocationTargetException {
        try {
            execution.accept(args);
        } catch (Exception e) {
            throw new CucumberInvocationTargetException(
                this, new InvocationTargetException(e));
        }
    }

    @Override
    public List<ParameterInfo> parameterInfos() {
        return Collections.emptyList();
    }

    @Override
    public String getPattern() {
        return pattern;
    }

    @Override
    public boolean isDefinedAt(StackTraceElement stackTraceElement) {
        return false;
    }

    @Override
    public String getLocation() {
        return location;
    }
}
