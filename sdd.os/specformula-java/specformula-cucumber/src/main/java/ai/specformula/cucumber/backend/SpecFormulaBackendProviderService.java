package ai.specformula.cucumber.backend;

import java.util.function.Supplier;

import ai.specformula.spring.SpecFormulaBridge;
import io.cucumber.core.backend.Backend;
import io.cucumber.core.backend.BackendProviderService;
import io.cucumber.core.backend.Container;
import io.cucumber.core.backend.Lookup;

public class SpecFormulaBackendProviderService implements BackendProviderService {

    @Override
    public Backend create(Lookup lookup, Container container,
                          Supplier<ClassLoader> classLoaderSupplier) {
        SpecFormulaBridge bridge = new SpecFormulaBridge();
        SpecFormulaBridge.setInstance(bridge);
        return new SpecFormulaBackend(bridge);
    }
}
