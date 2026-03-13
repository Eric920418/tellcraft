package ai.specformula.spring;

import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.web.servlet.MockMvc;

import ai.specformula.core.context.ScenarioContextAccessor;
import ai.specformula.core.helper.FeatureArgumentResolver;
import ai.specformula.core.http.HttpClientAdapter;
import ai.specformula.spring.auth.Authenticator;
import ai.specformula.spring.http.MockMvcHttpClientAdapter;
import ai.specformula.spring.instruction.ApiCallAdapter;
import ai.specformula.spring.instruction.ApiCallInstruction;
import ai.specformula.spring.instruction.EntityNonExistenceValidateAdapter;
import ai.specformula.spring.instruction.EntityNonExistenceValidateInstruction;
import ai.specformula.spring.instruction.EntitySetupAdapter;
import ai.specformula.spring.instruction.EntitySetupInstruction;
import ai.specformula.spring.instruction.EntityValidateAdapter;
import ai.specformula.spring.instruction.EntityValidateInstruction;
import ai.specformula.spring.instruction.ResponseValidateAdapter;
import ai.specformula.spring.instruction.ResponseValidateInstruction;
import ai.specformula.spring.instruction.TimeControlAdapter;
import ai.specformula.spring.instruction.TimeControlInstruction;
import ai.specformula.spring.time.MockTime;

/**
 * Spring Configuration，自動將 DataSource 和 HttpClientAdapter 注入 SpecFormulaBridge。
 * <p>
 * 支援多 DataSource：Spring 自動注入 {@code Map<String, DataSource>}，key 為 bean
 * name，value 為 DataSource 實例。
 * </p>
 * <p>
 * HttpClientAdapter 自動偵測優先順序：
 * <ol>
 *   <li>使用者自訂的 {@link HttpClientAdapter} bean（最高優先）</li>
 *   <li>MockMvc（{@code @AutoConfigureMockMvc}）</li>
 *   <li>TestRestTemplate（{@code @SpringBootTest(webEnvironment=RANDOM_PORT)}）</li>
 * </ol>
 * </p>
 */
@Configuration
public class SpecFormulaSpringConfiguration {

    private static final System.Logger LOG = System.getLogger(SpecFormulaSpringConfiguration.class.getName());

    @Autowired
    public void setDataSources(Map<String, DataSource> dataSources) {
        for (var entry : dataSources.entrySet()) {
            SpecFormulaBridge.getInstance().setDataSource(entry.getKey(), entry.getValue());
        }
    }

    /**
     * 自動偵測可用的 HTTP 測試框架並注入對應的 HttpClientAdapter。
     * <p>
     * 偵測優先順序：
     * <ol>
     *   <li>使用者自訂 {@link HttpClientAdapter} bean</li>
     *   <li>MockMvc</li>
     *   <li>TestRestTemplate（透過 reflection，classpath 上沒有時自動跳過）</li>
     * </ol>
     * </p>
     */
    @Autowired
    public void autoDetectHttpClient(ApplicationContext ctx) {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();

        // Priority 1: 使用者自訂 HttpClientAdapter bean
        try {
            HttpClientAdapter httpClient = ctx.getBean(HttpClientAdapter.class);
            bridge.setHttpClient(httpClient);
            LOG.log(System.Logger.Level.INFO,
                    "[SpecFormula] 使用自訂 HttpClientAdapter bean: {0}", httpClient.getClass().getSimpleName());
            return;
        } catch (NoSuchBeanDefinitionException ignored) {
        }

        // Priority 2: MockMvc
        try {
            MockMvc mockMvc = ctx.getBean(MockMvc.class);
            bridge.setHttpClient(new MockMvcHttpClientAdapter(mockMvc));
            LOG.log(System.Logger.Level.INFO,
                    "[SpecFormula] 自動偵測到 MockMvc，使用 MockMvcHttpClientAdapter");
            return;
        } catch (NoSuchBeanDefinitionException ignored) {
        }

        // Priority 3: TestRestTemplate（classpath 上沒有時跳過）
        try {
            Class<?> trtClass = Class.forName("org.springframework.boot.test.web.client.TestRestTemplate");
            Object trt = ctx.getBean(trtClass);
            Class<?> adapterClass = Class.forName("ai.specformula.spring.http.TestRestTemplateHttpClientAdapter");
            HttpClientAdapter adapter = (HttpClientAdapter) adapterClass.getConstructors()[0].newInstance(trt);
            bridge.setHttpClient(adapter);
            LOG.log(System.Logger.Level.INFO,
                    "[SpecFormula] 自動偵測到 TestRestTemplate，使用 TestRestTemplateHttpClientAdapter");
            return;
        } catch (ClassNotFoundException | NoSuchBeanDefinitionException ignored) {
        } catch (ReflectiveOperationException e) {
            LOG.log(System.Logger.Level.WARNING,
                    "[SpecFormula] TestRestTemplate Adapter 建立失敗: {0}", e.getMessage());
        }

        LOG.log(System.Logger.Level.WARNING,
                "[SpecFormula] 未偵測到可用的 HTTP 測試框架（MockMvc / TestRestTemplate）。"
                + "ApiCall 指令將無法使用。");
    }

    @Autowired(required = false)
    public void setAuthenticator(Authenticator authenticator) {
        if (authenticator != null) {
            SpecFormulaBridge.getInstance().setAuthenticator(authenticator);
        }
    }

    @Bean
    public FeatureArgumentResolver featureArgumentResolver() {
        return SpecFormulaBridge.getInstance().getResolver();
    }

    @Bean
    public MockTime mockTime() {
        return SpecFormulaBridge.getInstance().getMockTime();
    }

    // ==================== Custom Step 開發支援 ====================

    @Bean
    public ScenarioContextAccessor scenarioContextAccessor() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new ScenarioContextAccessor() {
            @Override
            public void putObject(String key, Object value) {
                bridge.currentContext().putObject(key, value);
            }

            @Override
            public Object get(String key) {
                return bridge.currentContext().get(key);
            }
        };
    }

    @Bean
    public TimeControlInstruction timeControlInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new TimeControlAdapter(bridge::getTimeControl);
    }

    @Bean
    public EntitySetupInstruction entitySetupInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new EntitySetupAdapter(bridge::getEntitySetup);
    }

    @Bean
    public EntityValidateInstruction entityValidateInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new EntityValidateAdapter(bridge::getEntityValidate);
    }

    @Bean
    public EntityNonExistenceValidateInstruction entityNonExistenceValidateInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new EntityNonExistenceValidateAdapter(bridge::getEntityNonExistenceValidate);
    }

    @Bean
    public ApiCallInstruction apiCallInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new ApiCallAdapter(bridge::getApiCall);
    }

    @Bean
    public ResponseValidateInstruction responseValidateInstruction() {
        SpecFormulaBridge bridge = SpecFormulaBridge.getInstance();
        return new ResponseValidateAdapter(bridge::getDataTableResponseValidate);
    }
}
