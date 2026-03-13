Feature: 主管審核下屬請假

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email               | position | status | password    |
      | <agentId       | Manager | manager@company.com | 主管     | ACTIVE | Password123 |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email             | position | managerId      | status | password    |
      | <agentId     | Alice | alice@company.com | 特務     | $Manager001.id | ACTIVE | Password123 |

  Rule: 主管可以批准直屬下屬的待審核請假申請

    Example: 批准下屬的全日假申請應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 請假申請已批准 |
      And 應該存在一個請假申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | APPROVED | $Manager001.id |

    Example: 批准下屬的時段假申請應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 請假申請已批准 |
      And 應該存在一個請假申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | APPROVED | $Manager001.id |

    Example: 批准時可以填寫備註
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  | notes    |
        | $Request001.id | APPROVE | 同意休假 |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 請假申請已批准 |
      And 應該存在一個請假申請, with table:
        | request_id      | status   | approved_by     | notes    |
        | $Request001.id | APPROVED | $Manager001.id | 同意休假 |

  Rule: 主管可以拒絕直屬下屬的待審核請假申請

    Example: 拒絕下屬的請假申請應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 請假申請已拒絕 |
      And 應該存在一個請假申請, with table:
        | request_id      | status   | approved_by     |
        | $Request001.id | REJECTED | $Manager001.id |

    Example: 拒絕時可以填寫拒絕原因
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action | notes        |
        | $Request001.id | REJECT | 當日人力不足 |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 請假申請已拒絕 |
      And 應該存在一個請假申請, with table:
        | request_id      | status   | approved_by     | notes        |
        | $Request001.id | REJECTED | $Manager001.id | 當日人力不足 |

  Rule: 只能審核直屬下屬的請假申請

    Example: 審核非直屬下屬的請假應失敗
      Given 準備一個特務, with table:
        | >Agent002.id | name | email           | position | status |
        | <agentId     | Bob  | bob@company.com | 特務     | ACTIVE |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

  Rule: 只能審核 PENDING 狀態的請假申請

    Example: 審核已批准的請假應失敗
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 操作失敗

    Example: 審核已拒絕的請假應失敗
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

  Rule: 批准前需檢查請假時段內不能有打卡記錄

    Example: 批准全日假時，該日有打卡記錄應失敗
      Given 現在的時間是 "@time(2025-11-10T09:01:00+08:00)"
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                          |
        | $Agent001.id | IN        | @time("2025-11-10T09:00:00+08:00") |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

    Example: 批准時段假時，該時段內有打卡記錄應失敗
      Given 現在的時間是 "@time(2025-11-10T10:01:00+08:00)"
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                          |
        | $Agent001.id | IN        | @time("2025-11-10T10:00:00+08:00") |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗

    Example: 批准時段假時,時段外有打卡記錄應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                          |
        | $Agent001.id | IN        | @time("2025-11-10T13:00:00+08:00") |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | APPROVED | 請假申請已批准 |

  Rule: 拒絕請假不需檢查打卡記錄

    Example: 拒絕請假時，即使有打卡記錄也應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 打卡, call table:
        | agentId      | punchType | punchTime                          |
        | $Agent001.id | IN        | @time("2025-11-10T09:00:00+08:00") |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action |
        | $Request001.id | REJECT |
      Then 審核請假申請(200)回應, with table:
        | requestId      | status   | message        |
        | $Request001.id | REJECTED | 請假申請已拒絕 |

  Rule: 審核記錄必須包含審核人和審核時間

    Example: 審核後應記錄審核人
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 應該存在一個請假申請, with table:
        | request_id      | approved_by     |
        | $Request001.id | $Manager001.id |

    Example: 審核後應更新 updatedAt 時間戳記
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And 應該存在一個請假申請, with table:
        | request_id      |
        | $Request001.id |
      When (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 應該存在一個請假申請, with table:
        | request_id      | updated_at |
        | $Request001.id | &isNotNull |

  Rule: 非主管身份不能審核請假

    Example: 一般特務嘗試審核請假應失敗
      Given 準備一個特務, with table:
        | >Agent002.id | name | email           | position | managerId      | status |
        | <agentId     | Bob  | bob@company.com | 特務     | $Manager001.id | ACTIVE |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Agent001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request001.id | APPROVE |
      Then 操作失敗
