package org.waterballagent.agentHR.stepdefs;

import ai.specformula.spring.auth.Authenticator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.waterballagent.agentHR.security.JwtUtil;

@Component
public class JwtAdapter implements Authenticator {

    private final JwtUtil jwtUtil;

    @Autowired
    public JwtAdapter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public String getToken(Object actorId) {
        if (actorId == null) {
            throw new IllegalArgumentException("Actor ID 不能為 null");
        }
        Long agentId = convertToLong(actorId);
        return jwtUtil.generateToken(agentId);
    }

    private Long convertToLong(Object value) {
        if (value instanceof Long l) {
            return l;
        } else if (value instanceof Integer i) {
            return i.longValue();
        } else if (value instanceof String s) {
            return Long.parseLong(s);
        } else if (value instanceof Number n) {
            return n.longValue();
        }
        throw new IllegalArgumentException(
            "Actor ID 類型不支援: " + value.getClass().getName());
    }
}
