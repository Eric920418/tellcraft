Feature: 查詢請假紀錄

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email               | password    | position | status |
      | <agentId     | Manager | manager@company.com | password123 | 主管     | ACTIVE |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email           | password    | position           | managerId      | status |
      | <agentId     | Alice | alice@test.com | password123 | 成長駭客：行銷特務 | $Manager001.id | ACTIVE |

  Rule: 特務可以查詢自己的所有請假記錄

    Example: 查詢本人的請假記錄應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      |
        | $Agent001.id |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent001.id",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-05)",
              "endDate": "&sameDay(2025-11-05)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 2,
          "page": 1,
          "pageSize": 20
        }
        ```

  Rule: 查詢結果依請假日期降序排列（最近的在前）

    Example: 多筆記錄應依 startDate 降序排列
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request003.id | agentId      | leaveType       | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | PERSONAL_LEAVE  | @time("2025-11-08") | @time("2025-11-08") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      |
        | $Agent001.id |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent001.id",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request003.id",
              "agentId": "$Agent001.id",
              "leaveType": "PERSONAL_LEAVE",
              "startDate": "&sameDay(2025-11-08)",
              "endDate": "&sameDay(2025-11-08)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-05)",
              "endDate": "&sameDay(2025-11-05)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 3
        }
        ```

  Rule: 查詢無記錄時應返回空陣列

    Example: 無任何請假記錄時應返回空陣列
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      |
        | $Agent001.id |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [],
          "total": 0,
          "page": 1,
          "pageSize": 20
        }
        ```

  Rule: 支援按狀態篩選請假記錄

    Example: 篩選 PENDING 狀態的記錄
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Manager001.id") 審核請假申請, call table:
        | requestId      | action  |
        | $Request002.id | APPROVE |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      | status  |
        | $Agent001.id | PENDING |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 1
        }
        ```

  Rule: 支援按假別類型篩選請假記錄

    Example: 篩選 SPECIAL_LEAVE 類型的記錄
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      | leaveType     |
        | $Agent001.id | SPECIAL_LEAVE |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 1
        }
        ```

  Rule: 支援按日期範圍篩選請假記錄

    Example: 篩選指定日期範圍內的記錄
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-15") | @time("2025-11-15") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request003.id | agentId      | leaveType      | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | PERSONAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      | startDate           | endDate             |
        | $Agent001.id | @time("2025-11-08") | @time("2025-11-12") |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request003.id",
              "agentId": "$Agent001.id",
              "leaveType": "PERSONAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 1
        }
        ```

  Rule: 支援分頁查詢

    Example: 查詢第 2 頁，每頁 2 筆
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-01") | @time("2025-11-01") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SICK_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request003.id | agentId      | leaveType      | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | PERSONAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request004.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-15") | @time("2025-11-15") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      | page | pageSize |
        | $Agent001.id | 2    | 2        |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent001.id",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-05)",
              "endDate": "&sameDay(2025-11-05)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-01)",
              "endDate": "&sameDay(2025-11-01)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 4,
          "page": 2,
          "pageSize": 2
        }
        ```

  Rule: 僅能查詢本人記錄，不能查詢其他特務的記錄

    Example: 嘗試查詢其他特務記錄應失敗
      Given 準備一個特務, with table:
        | >Agent002.id | name | email            | position | status |password |
        | <agentId    | Bob  | bob@company.com  | 特務     | ACTIVE |password123 |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate           | endDate             | durationType |
        | $Agent002.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId   |
        | $Agent002.id |
      Then 操作失敗

  Rule: 回應包含完整的請假記錄欄位

    Example: 全日假記錄包含所有欄位
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType | reason   |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     | 年假休息 |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      |
        | $Agent001.id |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "reason": "年假休息",
              "status": "PENDING"
            }
          ],
          "total": 1
        }
        ```
      And 應該存在一個請假申請, with table:
        | request_id        | agent_id      | leave_type     | start_date  | end_date    | duration_type | reason   | status  |
        | $Request001.id   | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | FULL_DAY     | 年假休息 | PENDING |

    Example: 時段假記錄包含起迄時間
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId      | leaveType     | startDate           | endDate             | durationType | startTime              | endTime                | reason   |
        | <requestId     | $Agent001.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") | 半日休假 |
      When (UID="$Agent001.id") 查詢請假記錄, call table:
        | agentId      |
        | $Agent001.id |
      Then 查詢請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "TIME_RANGE",
              "startTime": "09:00:00",
              "endTime": "12:00:00",
              "reason": "半日休假",
              "status": "PENDING"
            }
          ],
          "total": 1
        }
        ```
      And 應該存在一個請假申請, with table:
        | request_id        | agent_id      | leave_type     | start_date  | end_date    | duration_type | start_time              | end_time                | reason   | status  |
        | $Request001.id   | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | TIME_RANGE   | @localTime("09:00:00") | @localTime("12:00:00") | 半日休假 | PENDING |
