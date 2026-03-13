package org.waterballagent.agentHR.stepdefs;

import ai.specformula.spring.SpecFormulaBridge;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.waterballagent.agentHR.service.time.TimeService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@Primary
public class TestableTimeService implements TimeService {

    private static final ZoneId TAIWAN_ZONE = ZoneId.of("Asia/Taipei");

    @Override
    public LocalDateTime now() {
        Object now = SpecFormulaBridge.getInstance().currentContext().get("now");
        if (now instanceof ZonedDateTime zonedDateTime) {
            return zonedDateTime.withZoneSameInstant(TAIWAN_ZONE).toLocalDateTime();
        }
        return LocalDateTime.now(TAIWAN_ZONE);
    }
}
