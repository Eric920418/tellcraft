using Reqnroll;
using Reqnroll.BoDi;

namespace GuessingGame.Tests.Hooks;

[Binding]
public class ScenarioHooks
{
    private readonly IObjectContainer _objectContainer;

    public ScenarioHooks(IObjectContainer objectContainer)
    {
        _objectContainer = objectContainer;
    }

    [BeforeScenario]
    public void BeforeScenario()
    {
        // 為每個場景創建新的 WebApplicationFactory
        var factory = new CustomWebApplicationFactory();
        _objectContainer.RegisterInstanceAs(factory);

        // 從工廠創建 HttpClient
        var httpClient = factory.CreateClient();
        _objectContainer.RegisterInstanceAs(httpClient);

        // 註冊 ScenarioContext
        var scenarioContext = new ScenarioContext();
        _objectContainer.RegisterInstanceAs(scenarioContext);

        // 註冊 Authenticator
        var authenticator = new Authenticator();
        _objectContainer.RegisterInstanceAs(authenticator);

        // 註冊 FeatureArgumentResolver
        var resolver = new FeatureArgumentResolver(scenarioContext);
        _objectContainer.RegisterInstanceAs(resolver);
    }

    [AfterScenario]
    public void AfterScenario()
    {
        var factory = _objectContainer.Resolve<CustomWebApplicationFactory>();
        factory?.Dispose();
    }
}
