package com.example.todolist.config;

import ai.specformula.spring.auth.Authenticator;
import ai.specformula.spring.time.MockTime;
import com.example.todolist.security.JwtUtil;
import com.example.todolist.service.time.TimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.ZoneId;

@TestConfiguration
public class TestConfig {

    @Autowired
    private JwtUtil jwtUtil;

    @Bean
    public Authenticator authenticator() {
        return actorId -> {
            if (actorId == null) return null;
            Long userId = actorId instanceof Long
                ? (Long) actorId
                : Long.parseLong(actorId.toString());
            return jwtUtil.generateToken(userId);
        };
    }

    @Bean
    @Primary
    public TimeService timeService(MockTime mockTime) {
        return () -> mockTime.now().withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }
}
