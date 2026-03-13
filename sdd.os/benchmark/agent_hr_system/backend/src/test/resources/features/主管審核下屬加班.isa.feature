Feature: 主管審核下屬加班

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email               | position | status | password    |
      | <agentId       | Manager | manager@company.com | 主管     | ACTIVE | Password123 |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email             | position | managerId      | status | password    |
      | <agentId     | Alice | alice@company.com | 特務     | $Manager001.id | ACTIVE | Password123 |

  Rule: 主管可以批准直屬下屬的待審核加班申請

    Example: 批准下屬的平日加班申請應成功
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 加班申請已批准 |
      And 應該存在一個加班申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | APPROVED | $Manager001.id |

    Example: 批准下屬的休息日加班申請應成功
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType      | overtimeDate        | startTime              | endTime                | reason |
        | <requestId     | $Agent001.id | REST_DAY_OVERTIME | @time("2025-11-15") | @localTime("09:00:00") | @localTime("17:00:00") | 趕進度 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 加班申請已批准 |
      And 應該存在一個加班申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | APPROVED | $Manager001.id |

    Example: 批准時可以填寫備註
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  | notes    |
        | $Request001.id | APPROVE | 同意加班 |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 加班申請已批准 |
      And 應該存在一個加班申請, with table:
        | request_id      | status   | approved_by     | notes    |
        | $Request001.id | APPROVED | $Manager001.id | 同意加班 |

  Rule: 主管可以拒絕直屬下屬的待審核加班申請

    Example: 拒絕下屬的加班申請應成功
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 加班申請已拒絕 |
      And 應該存在一個加班申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | REJECTED | $Manager001.id |

    Example: 拒絕時可以填寫拒絕原因
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action | notes        |
        | $Request001.id | REJECT | 當日人力充足 |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 加班申請已拒絕 |
      And 應該存在一個加班申請, with table:
        | request_id      | status   | approved_by     | notes        |
        | $Request001.id | REJECTED | $Manager001.id | 當日人力充足 |

  Rule: 只能審核直屬下屬的加班申請

    Example: 審核非直屬下屬的加班應失敗
      Given 準備一個特務, with table:
        | >Agent002.id | name | email           | position | status |
        | <agentId     | Bob  | bob@company.com | 特務     | ACTIVE |
      And (UID="$Agent002.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent002.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

  Rule: 只能審核 PENDING 狀態的加班申請

    Example: 審核已批准的加班應失敗
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      And (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 操作失敗

    Example: 審核已拒絕的加班應失敗
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      And (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

  Rule: 審核通過後自動新增打卡記錄

    Example: 批准平日加班後應自動新增對應打卡記錄
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 加班申請已批准 |
      And 應該存在一個打卡記錄, with table:
        | agent_id      | punch_type | punch_time                          |
        | $Agent001.id | IN        | @time("2025-11-10T18:00:00+08:00") |
      And 應該存在一個打卡記錄, with table:
        | agent_id      | punch_type | punch_time                          |
        | $Agent001.id | OUT       | @time("2025-11-10T20:00:00+08:00") |

    Example: 批准休息日加班後應自動新增對應打卡記錄
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType      | overtimeDate        | startTime              | endTime                | reason |
        | <requestId     | $Agent001.id | REST_DAY_OVERTIME | @time("2025-11-15") | @localTime("09:00:00") | @localTime("17:00:00") | 趕進度 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 加班申請已批准 |
      And 應該存在一個打卡記錄, with table:
        | agent_id      | punch_type | punch_time                          |
        | $Agent001.id | IN        | @time("2025-11-15T09:00:00+08:00") |
      And 應該存在一個打卡記錄, with table:
        | agent_id      | punch_type | punch_time                          |
        | $Agent001.id | OUT       | @time("2025-11-15T17:00:00+08:00") |

  Rule: 拒絕加班不新增打卡記錄

    Example: 拒絕加班後不應新增打卡記錄
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 審核加班申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 加班申請已拒絕 |

  Rule: 審核記錄必須包含審核人和審核時間

    Example: 審核後應記錄審核人
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 應該存在一個加班申請, with table:
        | request_id      | approved_by     |
        | $Request001.id | $Manager001.id |

    Example: 審核後應更新 updatedAt 時間戳記
      Given (UID="$Agent001.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      And 應該存在一個加班申請, with table:
        | request_id      |
        | $Request001.id |
      When (UID="$Manager001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 應該存在一個加班申請, with table:
        | request_id      | updated_at |
        | $Request001.id | &isNotNull |

  Rule: 非主管身份不能審核加班

    Example: 一般特務嘗試審核加班應失敗
      Given 準備一個特務, with table:
        | >Agent002.id | name | email           | position | managerId      | status |
        | <agentId     | Bob  | bob@company.com | 特務     | $Manager001.id | ACTIVE |
      And (UID="$Agent002.id") 申請加班, call table:
        | >Request001.id | agentId      | overtimeType     | overtimeDate        | startTime              | endTime                | reason   |
        | <requestId     | $Agent002.id | WEEKDAY_OVERTIME | @time("2025-11-10") | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      When (UID="$Agent001.id") 審核加班申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗
