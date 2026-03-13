package org.waterballagent.agentHR.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for testing
            .authorizeHttpRequests(
                auth ->
                    auth
                        .requestMatchers("/login", "/auth/login", "/auth/**")
                        .permitAll() // Allow auth endpoints
                        .requestMatchers("/h2-console/**")
                        .permitAll() // Allow H2 console for development
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**")
                        .permitAll() // Allow Swagger UI
                        .requestMatchers("/api-spec.yml", "/api-spec.json")
                        .permitAll() // Allow static OpenAPI spec files
                        .requestMatchers("/attendance/**")
                        .permitAll() // Allow attendance endpoints (punch, overtime, etc.) - JWT validation in Controller
                        .requestMatchers("/leave-requests/**")
                        .permitAll() // Temporarily allow for testing (JWT validation in Controller)
                        .requestMatchers("/overtime-requests/**")
                        .permitAll() // Allow overtime-requests endpoints (JWT validation in Controller)
                        .requestMatchers("/agents/**")
                        .permitAll() // Allow agents endpoints (JWT validation in Controller)
                        .requestMatchers("/managers/**")
                        .permitAll() // Allow managers endpoints (JWT validation in Controller)
                        .anyRequest()
                        .authenticated() // All other requests require authentication
            )
            .headers(
                headers -> headers.frameOptions(frame -> frame.sameOrigin()) // Allow H2 console iframe
            );

        return http.build();
    }
}
