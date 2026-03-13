Feature: 請假申請

  Background:
    Given 準備一個特務, with table:
      | >Agent001.id | name  | email              | password | position           | status |
      | <agentId     | Alice | alice@test.com    | password123 | 成長駭客：行銷特務 | ACTIVE |

  Rule: 特務可以提交年假申請（全日假）
    # Validated
    Example: 提交全日年假申請應成功
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate              | endDate                | durationType |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10")   | @time("2025-11-10")   | FULL_DAY     |
      Then 提交請假申請(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 請假申請已提交，待主管核准 |
      And 應該存在一個請假申請, with table:
        | request_id | agent_id      | leave_type     | start_date  | end_date    | duration_type | status  |
        | $requestId | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | FULL_DAY     | PENDING |

  Rule: 特務可以提交年假申請（時段假）
    # Validated
    Example: 提交時段年假申請應成功
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate              | endDate                | durationType | startTime              | endTime                |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10")   | @time("2025-11-10")   | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      Then 提交請假申請(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 請假申請已提交，待主管核准 |
      And 應該存在一個請假申請, with table:
        | request_id | agent_id      | leave_type     | start_date  | end_date    | duration_type | start_time              | end_time                | status  |
        | $requestId | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") | PENDING |

  Rule: 請假時段內不能有打卡紀錄（嚴格衝突檢測）
    # Validated

    Example: 請假時段內有打卡記錄時提交應失敗（全日假）
      Given 現在的時間是 "@time(2025-11-10T09:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-10T09:00:00")    |
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate              | endDate                | durationType |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10")   | @time("2025-11-10")   | FULL_DAY     |
      Then 操作失敗
    # Validated
    Example: 請假時段內有打卡記錄時提交應失敗（時段假）
      Given 現在的時間是 "@time(2025-11-10T09:31:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-10T09:30:00")    |
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate              | endDate                | durationType | startTime              | endTime                |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10")   | @time("2025-11-10")   | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      Then 操作失敗

    # Validated
    Example: 請假時段外有打卡不影響申請
      Given 現在的時間是 "@time(2025-11-10T08:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-10T08:00:00")    |
      Given 現在的時間是 "@time(2025-11-10T08:31:00+08:00)"
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | OUT       | @time("2025-11-10T08:30:00")    |
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate              | endDate                | durationType | startTime              | endTime                |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10")   | @time("2025-11-10")   | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      Then 提交請假申請(200)回應, with table:
        | >requestId | status  | message                    |
        | <requestId | PENDING | 請假申請已提交，待主管核准 |
      And 應該存在一個請假申請, with table:
        | request_id  | agent_id      | leave_type     | start_date  | end_date    | duration_type | start_time  | end_time   | status  |
        | $requestId | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | TIME_RANGE   | 09:00:00   | 12:00:00  | PENDING |
