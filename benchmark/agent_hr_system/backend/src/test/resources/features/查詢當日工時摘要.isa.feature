Feature: 查詢當日工時摘要

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email               | password    | position | status |
      | <agentId     | Manager | manager@company.com | password123 | 主管     | ACTIVE |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email           | password    | position           | managerId      | status |
      | <agentId     | Alice | alice@test.com | password123 | 成長駭客：行銷特務 | $Manager001.id | ACTIVE |

  Rule: 查詢當日工時摘要應基於打卡記錄動態計算
    # Validated

    Example: 計算單一工作時段的工時
      Given 現在的時間是 "@time(2025-11-04T10:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00")     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | OUT       | @time("2025-11-04T10:00:00")     |
      When (UID="$Agent001.id") 查詢當日工時摘要, call table:
        | agentId      | date                    |
        | $Agent001.id | @time("2025-11-04")     |
      Then 查詢當日工時摘要(200)回應, with table:
        | >Agent001.id | date                    | totalWorkHours | overtimeHours |
        | <agentId     | &sameDay(2025-11-04) |            2.0 |           0.0 |
    # Validated

    Example: 計算多個工作時段的工時累計（4 小時 + 4 小時 = 8 小時）
      Given 現在的時間是 "@time(2025-11-04T17:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00")     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | OUT       | @time("2025-11-04T12:00:00")     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-04T13:00:00")     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00")     |
      When (UID="$Agent001.id") 查詢當日工時摘要, call table:
        | agentId      | date                    |
        | $Agent001.id | @time("2025-11-04")     |
      Then 查詢當日工時摘要(200)回應, with table:
        | >Agent001.id | date                    | totalWorkHours | overtimeHours |
        | <agentId     | &sameDay(2025-11-04) |            8.0 |           0.0 |
    # Validated
    Example: 計算超過 8 小時應產生加班時數（12 小時 - 8 小時 = 4 小時加班）
      Given 現在的時間是 "@time(2025-11-04T20:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | IN        | @time("2025-11-04T08:00:00")     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                        |
        | $Agent001.id | OUT       | @time("2025-11-04T20:00:00")     |
      When (UID="$Agent001.id") 查詢當日工時摘要, call table:
        | agentId      | date                    |
        | $Agent001.id | @time("2025-11-04")     |
      Then 查詢當日工時摘要(200)回應, with table:
        | >Agent001.id | date                    | totalWorkHours | overtimeHours |
        | <agentId     | &sameDay(2025-11-04) |           12.0 |           4.0 |
    # Validated
    Example: 沒有打卡記錄時工時為零
      When (UID="$Agent001.id") 查詢當日工時摘要, call table:
        | agentId      | date                    |
        | $Agent001.id | @time("2025-11-03")     |
      Then 查詢當日工時摘要(200)回應, with table:
        | >Agent001.id | date                    | totalWorkHours | overtimeHours |
        | <agentId     | &sameDay(2025-11-03) |            0.0 |           0.0 |
