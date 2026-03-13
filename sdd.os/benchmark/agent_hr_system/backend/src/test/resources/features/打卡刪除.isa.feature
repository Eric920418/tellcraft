Feature: 打卡刪除

  Background:
    Given 準備一個特務, with table:
      | >Agent001.id | name  | email          | password | position           | status |
      | <agentId     | Alice | alice@test.com | password123 | 成長駭客：行銷特務 | ACTIVE |

  Rule: 只能刪除未完成的打卡記錄（只有 IN 沒有 OUT）
    Example: 刪除未完成的 IN 打卡記錄應成功
      Given 現在的時間是 "@time(2025-11-04T09:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table: 
        | >recordId | agentId      | punchType | punchTime                     |
        | <recordId | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      When (UID="$Agent001.id") 刪除打卡記錄, call table:
        | recordId  |
        | $recordId |
      Then 刪除打卡記錄(200)回應, with table:
        | message        | deletedRecordIds[0] |
        | 打卡記錄已刪除 | $recordId    |
      And 應該不存在一個打卡記錄, with table:
        | record_id  |
        | $recordId |

    Example: 刪除 IN 時自動級聯刪除對應的 OUT
      Given 現在的時間是 "@time(2025-11-04T17:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | >inRecordId | agentId      | punchType | punchTime                     |
        | <recordId   | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | >outRecordId | agentId      | punchType | punchTime                     |
        | <recordId    | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 刪除打卡記錄, call table:
        | recordId    |
        | $inRecordId |
      Then 刪除打卡記錄(200)回應, with table:
        | message        | deletedRecordIds[0] | deletedRecordIds[1] |
        | 打卡記錄已刪除 | $inRecordId         | $outRecordId        |
      And 應該不存在一個打卡記錄, with table:
        | record_id    |
        | $inRecordId |
      And 應該不存在一個打卡記錄, with table:
        | record_id     |
        | $outRecordId |

  Rule: 不能刪除已完成的打卡記錄
    # Validated
    Example: 已完成的打卡（IN 和 OUT 都存在）應無法刪除
      Given 現在的時間是 "@time(2025-11-04T17:01:00+08:00)"
      When (UID="$Agent001.id") 打卡, call table:
        | >inRecordId | agentId      | punchType | punchTime                     |
        | <recordId   | $Agent001.id | IN        | @time("2025-11-04T09:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | >outRecordId | agentId      | punchType | punchTime                     |
        | <recordId    | $Agent001.id | OUT       | @time("2025-11-04T17:00:00") |
      When (UID="$Agent001.id") 刪除打卡記錄, call table:
        | recordId     |
        | $outRecordId |
      Then 操作失敗
      And 應該存在一個打卡記錄, with table:
        | record_id    | 
        | $inRecordId | 
      And 應該存在一個打卡記錄, with table:
        | record_id     |
        | $outRecordId |
