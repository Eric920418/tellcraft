package com.example.todolist.config;

import ai.specformula.spring.auth.Authenticator;
import com.example.todolist.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

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
}
