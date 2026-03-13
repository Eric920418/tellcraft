package org.waterballagent.agentHR.service.time;

import java.time.LocalDateTime;

/**
 * 所有類別要取得當下時間時，都必須透過這個介面來取得。
 */
public interface TimeService {
    LocalDateTime now();
}
