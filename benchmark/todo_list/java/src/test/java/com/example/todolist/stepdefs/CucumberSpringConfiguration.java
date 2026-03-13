package com.example.todolist.stepdefs;

import com.example.todolist.Application;
import com.example.todolist.config.TestConfig;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@CucumberContextConfiguration
@SpringBootTest(classes = Application.class)
@AutoConfigureMockMvc
@Import({TestConfig.class})
public class CucumberSpringConfiguration {
}
