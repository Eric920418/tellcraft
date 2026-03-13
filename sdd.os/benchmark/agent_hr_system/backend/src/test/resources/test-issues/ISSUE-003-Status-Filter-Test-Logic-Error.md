# ISSUE-003: 狀態篩選測試的期望值錯誤

## 問題描述

多個查詢篩選測試案例的期望值與測試數據不一致。

## 錯誤測試案例

### 1. 查詢下屬請假紀錄.isa.feature（第 88-100 行）

```gherkin
Example: 篩選 PENDING 狀態的記錄
  Given (UID="$Agent001.id") 提交請假申請, call table:
    | >Request001.id | agentId       | status  |
    | <requestId     | $Agent001.id  | PENDING |   # ← PENDING
  And (UID="$Agent002.id") 提交請假申請, call table:
    | >Request002.id | agentId      | status  |
    | <requestId     | $Agent002.id | PENDING |   # ← PENDING
  When (UID="$Manager001.id") 查詢下屬請假記錄, call table:
    | managerId      | status  |
    | $Manager001.id | PENDING |
  Then 回應, with table:
    | leaveRequests[0] | total |
    | $Request001.id   | 1     |   # ← 期望 1，但實際應該是 2
```

**實際結果**：`total=2, leaveRequests=[1, 2]`
**測試期望**：`total=1, leaveRequests[0]=1`

### 2. 查詢請假紀錄.isa.feature（第 55-67 行）

```gherkin
Example: 篩選 PENDING 狀態的記錄
  Given (UID="$Agent001.id") 提交請假申請, call table:
    | >Request001.id | agentId      | status  |
    | <requestId     | $Agent001.id | PENDING |   # ← PENDING
  And (UID="$Agent001.id") 提交請假申請, call table:
    | >Request002.id | agentId      | status  |
    | <requestId     | $Agent001.id | PENDING |   # ← PENDING
  When (UID="$Agent001.id") 查詢請假記錄, call table:
    | agentId      | status  |
    | $Agent001.id | PENDING |
  Then 回應, with table:
    | leaveRequests[0] | total |
    | $Request001.id   | 1     |   # ← 期望 1，但實際應該是 2
```

**實際結果**：`total=2, leaveRequests=[1, 2]`
**測試期望**：`total=1, leaveRequests[0]=1`

### 3. 其他類似問題

- `支援按假別類型篩選請假記錄.篩選 SPECIAL_LEAVE 類型的記錄`
- `支援按日期範圍篩選請假記錄.篩選指定日期範圍內的記錄`

都有類似的邏輯錯誤：創建 2 筆符合條件的記錄，但期望只返回 1 筆。

## 根本原因

測試數據和期望值不一致：
- **Given**: 創建了 2 個 PENDING 狀態的請假記錄
- **When**: 篩選條件為 `status=PENDING`
- **Then**: 期望返回 `total=1`（只有 1 筆）

按照正常邏輯，篩選 PENDING 應該返回所有 PENDING 的記錄，即 2 筆。

## Production Code 行為

Production code 的實現是**正確的**：

```java
// LeaveRequestService.java 第 267-269 行
if (status != null) {
    result = leaveRequestRepository.findByAgentIdInAndStatusOrderByStartDateDesc(
            subordinateIds, LeaveStatus.valueOf(status), pageable);
}
```

查詢正確地篩選了所有符合 status 條件的記錄。

## 可能的原因分析

### 假設 1：測試想驗證只返回第一筆

如果測試的意圖是「返回符合條件的記錄，但只檢查第一筆」，那麼：
- `leaveRequests[0]=$Request001.id` 是合理的（檢查第一筆）
- 但 `total=1` 就不對了，應該是 `total=2`

### 假設 2：測試數據寫錯了

測試可能原本想要：
```gherkin
Given Request001 (PENDING)
And Request002 (APPROVED)   # ← 應該是不同狀態
When 篩選 PENDING
Then 期望 total=1  # 只有 Request001 符合
```

### 假設 3：生成器的排序邏輯問題

可能生成器假設結果會按某種順序排列，只取第一筆？但這不應該影響 `total` 的值。

## 建議修復

有兩種修復方向：

### 選項 A：修改測試數據（推薦）

```gherkin
Example: 篩選 PENDING 狀態的記錄
  Given 提交請假申請 Request001 (PENDING)
  And 提交請假申請 Request002 (APPROVED)   # ← 改為不同狀態
  When 查詢請假記錄 status=PENDING
  Then 回應, with table:
    | leaveRequests[0] | total |
    | $Request001.id   | 1     |
```

### 選項 B：修改期望值

```gherkin
Example: 篩選 PENDING 狀態的記錄
  Given 提交請假申請 Request001 (PENDING)
  And 提交請假申請 Request002 (PENDING)
  When 查詢請假記錄 status=PENDING
  Then 回應, with table:
    | leaveRequests[0] | leaveRequests[1] | total |
    | $Request001.id   | $Request002.id   | 2     |   # ← 改為 2
```

## 影響範圍

此問題影響 4 個測試案例：
1. `查詢下屬請假紀錄.isa.feature` - 支援按狀態篩選.篩選 PENDING 狀態的記錄
2. `查詢請假紀錄.isa.feature` - 支援按狀態篩選請假記錄.篩選 PENDING 狀態的記錄
3. `查詢請假紀錄.isa.feature` - 支援按假別類型篩選請假記錄.篩選 SPECIAL_LEAVE 類型的記錄
4. `查詢請假紀錄.isa.feature` - 支援按日期範圍篩選請假記錄.篩選指定日期範圍內的記錄

## 優先級

**High** - 這是測試邏輯錯誤，導致無法正確驗證篩選功能。

## 標籤

- `test-logic-error`
- `feature-file`
- `query-filter`
- `test-data`

## 建議

**強烈建議使用選項 A（修改測試數據）**，因為：
1. 更符合測試的語義（測試狀態篩選，應該有不同狀態做對比）
2. 能真正驗證篩選功能的正確性
3. 測試覆蓋更全面
