Feature: 打卡記錄

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email               | password    | position | status |
      | <agentId     | Manager | manager@company.com | password123 | 主管     | ACTIVE |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email           | password    | position           | managerId      | status |
      | <agentId     | Alice | alice@test.com | password123 | 成長駭客：行銷特務 | $Manager001.id | ACTIVE |

  Rule: 特務必須先完成上一次的 Out 打卡，才能進行下一次的 In 打卡
    # Validated
    Example: 首次 In 打卡成功
      Given 現在的時間是 "@time(2025-11-04T08:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                       | dailyWorkHours | 
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T08:00:00") |            0.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                       | punch_date         |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T08:00:00") | &sameDay("2025-11-04") |
      
    # Validated
    Example: 完成一個完整的 In-Out 工作時段
      Given 現在的時間是 "@time(2025-11-04T10:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T10:00:00") |            2.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T10:00:00") | &sameDay("2025-11-04") |
    
    # Validated
    Example: 連續兩次 In 打卡應該失敗
      Given 現在的時間是 "@time(2025-11-04T09:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      Then 操作失敗
      
  Rule: 特務尚未進行 In 打卡就嘗試 Out 打卡應該失敗
    # Validated
    Example: 首次打卡就嘗試 Out 應該失敗
      Given 現在的時間是 "@time(2025-11-04T10:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00") |
      Then 操作失敗
    
    # Validated
    Example: Out 打卡後再次 Out 打卡應該失敗
      Given 現在的時間是 "@time(2025-11-04T11:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T11:00:00") |
      Then 操作失敗

  Rule: 特務可以在一天內進行多次 In/Out 打卡
  # Validated

    Example: 一天內進行第三次 In 打卡（已有兩次完整時段）
      Given 現在的時間是 "@time(2025-11-04T19:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T14:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T19:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T19:00:00") |            5.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T19:00:00") | &sameDay("2025-11-04") |

    Example: 完成第三次 Out 打卡（累計工時 8 小時）
      Given 現在的時間是 "@time(2025-11-04T22:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T14:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T19:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T22:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T22:00:00") |            8.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T22:00:00") | &sameDay("2025-11-04") |

  Rule: 每日工作時數上限為 8 小時，超過部分視為加班
    # Validated

    Example: 當日工時已達 9 小時時進行 In 打卡（已在加班時段）
      Given 現在的時間是 "@time(2025-11-04T18:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T18:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T18:00:00") |            9.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T18:00:00") | &sameDay("2025-11-04") |

    Example: 當日工時超過 8 小時後進行 Out 打卡（累計加班 3 小時）
      Given 現在的時間是 "@time(2025-11-04T20:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T18:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T20:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T20:00:00") |           11.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T20:00:00") | &sameDay("2025-11-04") |

  Rule: 每次打卡都需記錄準確的時間戳記
    # Validated
    Example: 驗證打卡時間記錄的準確性（含秒數）
      Given 現在的時間是 "@time(2025-11-04T08:31:45+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:30:45") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T08:30:45") |            0.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T08:30:45") | &sameDay("2025-11-04") |

  Rule: 打卡時間不能使用未來時間（允許補打卡）
    # Validated
    Example: 允許補打卡（早於當前時間的打卡）
      Given 現在的時間是 "@time(2025-11-04T15:00:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T10:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T12:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T13:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T13:00:00") |            2.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T13:00:00") | &sameDay("2025-11-04") |
    
    # Validated
    Example: 禁止未來時間打卡
      Given 現在的時間是 "@time(2025-11-04T08:01:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-05T08:00:00") |
      Then 操作失敗

  Rule: 打卡必須在同一日期內完成（禁止跨日打卡）
    # Validated
    Example: 午夜前完成 OUT 打卡應成功
      Given 現在的時間是 "@time(2025-11-04T23:59:59+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T23:30:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-04T23:59:59") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T23:59:59") | &between(0,1)  |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | OUT       | &sameTime("2025-11-04T23:59:59") | &sameDay("2025-11-04") |
    
    # Validated
    Example: 午夜後嘗試 OUT 打卡應該失敗
      Given 現在的時間是 "@time(2025-11-05T00:31:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T23:30:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | OUT       | @time("2025-11-05T00:30:00") |
      Then 操作失敗

  Rule: 打卡時段內不能有批准的請假（嚴格衝突檢測）
    # Validated
    Example: 請假時段內打卡應該失敗（全日假）
      Given 現在的時間是 "@time(2025-11-01T00:00:00+08:00)"
      When (UID="$Agent001.id") 提交請假申請, call table:
        | >requestId   | agentId      | leaveType     | startDate  | endDate    | durationType |
        | <requestId   | $Agent001.id | SPECIAL_LEAVE | 2025-11-04 | 2025-11-04 | FULL_DAY     |
      And (UID="$Manager001.id") 審核請假申請, call table:
        | requestId  | action  |
        | $requestId | APPROVE |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      Then 操作失敗

    # Validated
    Example: 請假時段內打卡應該失敗（時段假）
      Given 現在的時間是 "@time(2025-11-01T00:00:00+08:00)"
      When (UID="$Agent001.id") 提交請假申請, call table:
        | >requestId   | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                |
        | <requestId   | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-04") | @time("2025-11-04") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      And (UID="$Manager001.id") 審核請假申請, call table:
        | requestId  | action  |
        | $requestId | APPROVE |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T10:00:00") |
      Then 操作失敗
    
    # Validated
    Example: 請假時段外打卡應成功
      Given 現在的時間是 "@time(2025-11-04T13:01:00+08:00)"
      When (UID="$Agent001.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                |
        | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-04") | @time("2025-11-04") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                 |
        | $Agent001.id | IN        | @time("2025-11-04T13:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId      | punchType | punchTime                        | dailyWorkHours |
        | <recordId | $Agent001.id | IN        | &sameTime("2025-11-04T13:00:00") |            0.0 |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id      | punch_type | punch_time                        | punch_date              |
        | $recordId | $Agent001.id | IN        | &sameTime("2025-11-04T13:00:00") | &sameDay("2025-11-04") |
