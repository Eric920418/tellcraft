package ai.specformula.testcontainer;

import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SpecFormula Testcontainer 自動配置。
 * <p>
 * 透過 Spring Boot auto-configuration 機制自動載入。
 * 讀取 isa.yml 的 data.source 設定，自動建立 Testcontainers 和 DataSource beans。
 * </p>
 * <p>
 * 使用方式：在受測專案的 pom.xml 加入 {@code specformula-testcontainer} 依賴即可，
 * 不需手動撰寫 {@code @TestConfiguration} 配置。
 * </p>
 */
@Configuration
public class SpecFormulaTestcontainerAutoConfiguration {

    /**
     * 註冊 {@link TestcontainerDataSourceRegistrar} 作為 BeanDefinitionRegistryPostProcessor，
     * 確保在 Spring Context refresh 前完成 DataSource bean 的動態註冊。
     * <p>
     * 使用 {@code static} 方法確保此 PostProcessor 在任何其他 bean 之前初始化。
     * </p>
     */
    @Bean
    @SuppressWarnings("unused")
    static BeanDefinitionRegistryPostProcessor testcontainerDataSourceRegistrar() {
        return new TestcontainerDataSourceRegistrar();
    }
}
