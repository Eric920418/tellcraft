package org.waterballagent.agentHR.stepdefs;

import io.cucumber.spring.CucumberContextConfiguration;
import org.waterballagent.agentHR.Application;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

@CucumberContextConfiguration
@SpringBootTest(classes = Application.class)
@AutoConfigureMockMvc
public class CucumberSpringConfiguration {
    // This class configures the Spring context for Cucumber tests.
    // Bean definitions are in StepDefsConfiguration.
} 