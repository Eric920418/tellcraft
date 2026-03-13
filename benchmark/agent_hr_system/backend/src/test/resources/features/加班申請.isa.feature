Feature: 加班申請

  Background:
    Given 準備一個特務, with table:
      | >Agent001.id | name  | email              | password    | position           | status |
      | <agentId     | Alice | alice@test.com    | password123 | 成長駭客：行銷特務 | ACTIVE |

  Rule: 特務可以提交平日加班申請
    Example: 提交平日加班申請應成功
      When (UID="$Agent001.id") 申請加班, call table:
        | agentId      | overtimeType      | overtimeDate           | startTime              | endTime                | reason   |
        | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10")   | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      Then 申請加班(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 加班申請已提交，待主管核准 |
      And 應該存在一個加班申請, with table:
        | request_id  | agent_id      | overtime_type      | overtime_date | start_time              | end_time                | reason   | status  |
        | $requestId | $Agent001.id | WEEKDAY_OVERTIME | 2025-11-10  | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 | PENDING |

  Rule: 特務可以提交休息日加班申請
    Example: 提交休息日加班申請應成功
      When (UID="$Agent001.id") 申請加班, call table:
        | agentId      | overtimeType       | overtimeDate           | startTime              | endTime                | reason   |
        | $Agent001.id | REST_DAY_OVERTIME | @time("2025-11-15")   | @localTime("09:00:00") | @localTime("17:00:00") | 專案趕工 |
      Then 申請加班(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 加班申請已提交，待主管核准 |
      And 應該存在一個加班申請, with table:
        | request_id  | agent_id      | overtime_type       | overtime_date | start_time              | end_time                | reason   | status  |
        | $requestId | $Agent001.id | REST_DAY_OVERTIME | 2025-11-15  | @localTime("09:00:00") | @localTime("17:00:00") | 專案趕工 | PENDING |

  Rule: 特務可以提交例假日加班申請
    Example: 提交例假日加班申請應成功
      When (UID="$Agent001.id") 申請加班, call table:
        | agentId      | overtimeType             | overtimeDate           | startTime              | endTime                | reason   |
        | $Agent001.id | LEGAL_HOLIDAY_OVERTIME  | @time("2025-11-16")   | @localTime("09:00:00") | @localTime("17:00:00") | 緊急事件 |
      Then 申請加班(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 加班申請已提交，待主管核准 |
      And 應該存在一個加班申請, with table:
        | request_id  | agent_id      | overtime_type            | overtime_date | start_time              | end_time                | reason   | status  |
        | $requestId | $Agent001.id | LEGAL_HOLIDAY_OVERTIME | 2025-11-16  | @localTime("09:00:00") | @localTime("17:00:00") | 緊急事件 | PENDING |

  Rule: 加班申請不檢查打卡衝突（審核通過後會自動新增打卡記錄）
    Example: 加班時段內有打卡記錄仍可申請
      Given 現在的時間是 "@time(2025-11-10T18:01:00+08:00)"
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-10T18:00:00")    |
      When (UID="$Agent001.id") 申請加班, call table:
        | agentId      | overtimeType      | overtimeDate           | startTime              | endTime                | reason   |
        | $Agent001.id | WEEKDAY_OVERTIME | @time("2025-11-10")   | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 |
      Then 申請加班(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 加班申請已提交，待主管核准 |
      And 應該存在一個加班申請, with table:
        | request_id  | agent_id      | overtime_type      | overtime_date | start_time              | end_time                | reason   | status  |
        | $requestId | $Agent001.id | WEEKDAY_OVERTIME | 2025-11-10  | @localTime("18:00:00") | @localTime("20:00:00") | 專案趕工 | PENDING |

