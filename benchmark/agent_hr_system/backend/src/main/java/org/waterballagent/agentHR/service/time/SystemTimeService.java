package org.waterballagent.agentHR.service.time;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class SystemTimeService implements TimeService {
    
    private static final ZoneId TAIWAN_ZONE = ZoneId.of("Asia/Taipei");
    
    @Override
    public LocalDateTime now() {
        return LocalDateTime.now(TAIWAN_ZONE);
    }
}

