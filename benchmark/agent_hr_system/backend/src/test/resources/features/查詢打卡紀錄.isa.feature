Feature: 查詢打卡紀錄

  Background:
    Given 準備一個特務, with table:
      | >Agent001.id | name  | email              | password | position           | status |
      | <agentId     | Alice | alice@test.com    | password123 | 成長駭客：行銷特務 | ACTIVE |

  Rule: 查詢某一天的打卡記錄應返回所有打卡紀錄
  # Validated

    Example: 查詢有打卡記錄的日期
      Given 現在的時間是 "@time(2025-11-04T17:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 查詢打卡紀錄, call table:
        | agentId      | date                  |
        | $Agent001.id | @time("2025-11-04")  |
      Then 查詢打卡紀錄(200)回應為, with JSON:
        ```json
        {
          "agentId": "$Agent001.id",
          "date": "&sameDay(2025-11-04)",
          "punchRecords": [
            {
              "recordId": "&gt(0)",
              "punchType": "IN",
              "punchTime": "&sameTime(2025-11-04T09:00:00)"
            },
            {
              "recordId": "&gt(0)",
              "punchType": "OUT",
              "punchTime": "&sameTime(2025-11-04T17:00:00)"
            }
          ]
        }
        ```

    Example: 查詢沒有打卡記錄的日期應返回空結果
      When (UID="$Agent001.id") 查詢打卡紀錄, call table:
        | agentId      | date                  |
        | $Agent001.id | @time("2025-11-05")  |
      Then 查詢打卡紀錄(200)回應為, with JSON:
        ```json
        {
          "agentId": "$Agent001.id",
          "date": "&sameDay(2025-11-05)",
          "punchRecords": []
        }
        ```

    Example: 查詢多個打卡時段的紀錄
      Given 現在的時間是 "@time(2025-11-04T17:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | OUT       | @time("2025-11-04T12:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | IN        | @time("2025-11-04T13:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                     |
        | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 查詢打卡紀錄, call table:
        | agentId      | date                  |
        | $Agent001.id | @time("2025-11-04")  |
      Then 查詢打卡紀錄(200)回應為, with JSON:
        ```json
        {
          "agentId": "$Agent001.id",
          "date": "&sameDay(2025-11-04)",
          "punchRecords": [
            {
              "recordId": "&gt(0)",
              "punchType": "IN",
              "punchTime": "&sameTime(2025-11-04T09:00:00)"
            },
            {
              "recordId": "&gt(0)",
              "punchType": "OUT",
              "punchTime": "&sameTime(2025-11-04T12:00:00)"
            },
            {
              "recordId": "&gt(0)",
              "punchType": "IN",
              "punchTime": "&sameTime(2025-11-04T13:00:00)"
            },
            {
              "recordId": "&gt(0)",
              "punchType": "OUT",
              "punchTime": "&sameTime(2025-11-04T17:00:00)"
            }
          ]
        }
        ```
