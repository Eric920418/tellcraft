package tw.waterballsa.bddworkshop.stepdefs;

import io.cucumber.spring.CucumberContextConfiguration;
import tw.waterballsa.bddworkshop.Application;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

@CucumberContextConfiguration
@SpringBootTest(classes = Application.class)
@AutoConfigureMockMvc
public class CucumberSpringConfiguration {
    // This class configures the Spring context for Cucumber tests.
}



