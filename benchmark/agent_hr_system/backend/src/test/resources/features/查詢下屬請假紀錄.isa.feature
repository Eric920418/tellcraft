Feature: 查詢下屬請假紀錄

  Background:
    Given 準備一個特務, with table:
      | >Manager001.id | name    | email                 | position | status |password |
      | <agentId     | Manager | manager@company.com   | 主管     | ACTIVE |password123 |
    And 準備一個特務, with table:
      | >Agent001.id | name  | email             | position | managerId      | status |password |
      | <agentId    | Alice | alice@company.com | 特務     | $Manager001.id | ACTIVE |password123 |
    And 準備一個特務, with table:
      | >Agent002.id | name | email            | position | managerId      | status |password |
      | <agentId    | Bob  | bob@company.com  | 特務     | $Manager001.id | ACTIVE |password123 |

  Rule: 主管可以查詢所有直屬下屬的請假記錄

    Example: 查詢所有下屬的請假記錄應成功
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SICK_LEAVE | @time("2025-11-08") | @time("2025-11-08") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      |
        | $Manager001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent002.id",
              "agentName": "Bob",
              "agentEmail": "bob@company.com",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-08)",
              "endDate": "&sameDay(2025-11-08)",
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
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SICK_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request003.id | agentId       | leaveType      | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | PERSONAL_LEAVE | @time("2025-11-08") | @time("2025-11-08") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      |
        | $Manager001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent002.id",
              "agentName": "Bob",
              "agentEmail": "bob@company.com",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request003.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
              "leaveType": "PERSONAL_LEAVE",
              "startDate": "&sameDay(2025-11-08)",
              "endDate": "&sameDay(2025-11-08)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
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

  Rule: 無下屬或無記錄時應返回空陣列

    Example: 主管無下屬時應返回空陣列
      Given 準備一個特務, with table:
        | >Manager002.id | name     | email                  | position | status |password|
        | <agentId    | Manager2 | manager2@company.com   | 主管     | ACTIVE |password123|
      When (UID="$Manager002.id") 查詢下屬請假記錄, call table:
        | managerId       |
        | $Manager002.id  |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [],
          "total": 0,
          "page": 1,
          "pageSize": 20
        }
        ```

    Example: 下屬無請假記錄時應返回空陣列
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      |
        | $Manager001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [],
          "total": 0,
          "page": 1,
          "pageSize": 20
        }
        ```

  Rule: 支援按特定下屬篩選

    Example: 篩選特定下屬的請假記錄
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SICK_LEAVE | @time("2025-11-08") | @time("2025-11-08") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      | agentId      |
        | $Manager001.id | $Agent001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
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

  Rule: 支援按狀態篩選

    Example: 篩選 PENDING 狀態的記錄
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SICK_LEAVE | @time("2025-11-08") | @time("2025-11-08") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      | status  |
        | $Manager001.id | PENDING |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
              "leaveType": "SPECIAL_LEAVE",
              "startDate": "&sameDay(2025-11-10)",
              "endDate": "&sameDay(2025-11-10)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent002.id",
              "agentName": "Bob",
              "agentEmail": "bob@company.com",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-08)",
              "endDate": "&sameDay(2025-11-08)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            }
          ],
          "total": 2
        }
        ```

  Rule: 支援分頁查詢

    Example: 查詢第 2 頁，每頁 2 筆
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-01") | @time("2025-11-01") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request002.id | agentId      | leaveType  | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SICK_LEAVE | @time("2025-11-05") | @time("2025-11-05") | FULL_DAY     |
      And (UID="$Agent001.id") 提交請假申請, call table:
        | >Request003.id | agentId       | leaveType      | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | PERSONAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      And (UID="$Agent002.id") 提交請假申請, call table:
        | >Request004.id | agentId      | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent002.id | SPECIAL_LEAVE | @time("2025-11-15") | @time("2025-11-15") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      | page | pageSize |
        | $Manager001.id | 2    | 2        |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request002.id",
              "agentId": "$Agent002.id",
              "agentName": "Bob",
              "agentEmail": "bob@company.com",
              "leaveType": "SICK_LEAVE",
              "startDate": "&sameDay(2025-11-05)",
              "endDate": "&sameDay(2025-11-05)",
              "durationType": "FULL_DAY",
              "status": "PENDING"
            },
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
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

  Rule: 僅能查詢直屬下屬的記錄，不能查詢非下屬的記錄

    Example: 嘗試查詢非下屬記錄應返回空結果
      Given 準備一個特務, with table:
        | >Agent003.id | name    | email              | position | status |password |
        | <agentId    | Charlie | charlie@company.com| 特務     | ACTIVE |password123 |
      And (UID="$Agent003.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate           | endDate             | durationType |
        | $Agent003.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      |
        | $Manager001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [],
          "total": 0
        }
        ```

  Rule: 非主管身份不能使用此功能

    Example: 一般特務嘗試查詢下屬記錄應失敗
      Given (UID="$Agent002.id") 提交請假申請, call table:
        | agentId      | leaveType     | startDate           | endDate             | durationType |
        | $Agent002.id | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Agent001.id") 查詢下屬請假記錄, call table:
        | managerId    |
        | $Agent001.id |
      Then 操作失敗

  Rule: 回應包含下屬基本資訊

    Example: 每筆記錄包含下屬的 agentId、name、email
      Given (UID="$Agent001.id") 提交請假申請, call table:
        | >Request001.id | agentId       | leaveType     | startDate           | endDate             | durationType |
        | <requestId     | $Agent001.id  | SPECIAL_LEAVE | @time("2025-11-10") | @time("2025-11-10") | FULL_DAY     |
      When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
        | managerId      |
        | $Manager001.id |
      Then 查詢下屬請假記錄(200)回應為, with JSON:
        ```json
        {
          "leaveRequests": [
            {
              "requestId": "$Request001.id",
              "agentId": "$Agent001.id",
              "agentName": "Alice",
              "agentEmail": "alice@company.com",
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
      And 應該存在一個請假申請, with table:
        | request_id        | agent_id      | leave_type     | start_date  | end_date    | duration_type | status  |
        | $Request001.id   | $Agent001.id | SPECIAL_LEAVE | 2025-11-10 | 2025-11-10 | FULL_DAY     | PENDING |
      And 應該存在一個特務, with table:
        | agent_id      | name  | email             |
        | $Agent001.id | Alice | alice@company.com |
