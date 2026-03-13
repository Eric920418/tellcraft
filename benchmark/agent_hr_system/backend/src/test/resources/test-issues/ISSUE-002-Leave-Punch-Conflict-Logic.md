# ISSUE-002: 請假與打卡衝突檢查的業務邏輯不一致

## 問題描述

打卡服務（AttendanceService）和請假審核服務（LeaveRequestService）對於請假與打卡的衝突檢查邏輯不一致。

## 錯誤信息

```
[ERROR] 批准前需檢查請假時段內不能有打卡記錄.批准全日假時，該日有打卡記錄應失敗
org.opentest4j.AssertionFailedError: Expected HTTP status code to be 4xx (client error) but got 200
```

實際測試流程：
1. 提交請假申請（狀態：PENDING）✅
2. 嘗試打卡 ❌ **失敗：「該時段已有請假申請，無法打卡」**
3. （未執行）批准請假

## 根本原因

### AttendanceService.checkLeaveConflict() (第 237-263 行)

```java
// 只檢查 PENDING 或 APPROVED 的請假
if (leave.getStatus() == LeaveStatus.PENDING || leave.getStatus() == LeaveStatus.APPROVED) {
    if (leave.getDurationType() == DurationType.FULL_DAY) {
        throw new LeaveRequestConflictException("該時段已有請假申請，無法打卡");
    }
    // ...
}
```

**目前邏輯**：PENDING 或 APPROVED 的請假都會阻止打卡。

### 測試期望的業務邏輯

根據 feature file `主管審核下屬請假.feature` 第 127-137 行：

```gherkin
Example: 批准全日假時，該日有打卡記錄應失敗
  Given (UID="$Agent001.id") 提交請假申請, call table:
    | durationType |
    | FULL_DAY     |
  And (UID="$Agent001.id") 打卡, call table:  # 期望：打卡成功
    | punchType |
    | IN        |
  When (UID="$Manager001.id") 審核請假申請, call table:
    | action  |
    | APPROVE |
  Then 操作失敗  # 期望：批准失敗（因為有打卡記錄）
```

**測試期望的邏輯**：
- PENDING（待審核）的請假 → **不應該**阻止打卡
- 員工可以在請假未批准前正常上班打卡
- 主管批准請假時，如果發現該時段有打卡記錄，**應該拒絕批准**

## 業務邏輯衝突

存在兩種可能的業務邏輯設計：

### 方案 A：測試期望的邏輯（更靈活）
1. 員工提交請假（PENDING）
2. 員工仍可正常打卡（因為請假未批准）
3. 主管批准時檢查衝突
   - 有打卡 → 拒絕批准
   - 無打卡 → 允許批准

**優點**：員工可以先請假再觀察，如果臨時不需要請假可以正常上班
**缺點**：可能造成數據不一致（同時有打卡和請假）

### 方案 B：目前實現的邏輯（更嚴格）
1. 員工提交請假（PENDING）
2. 該時段立即被鎖定，不能打卡
3. 主管批准或拒絕

**優點**：數據一致性更好，避免同時有打卡和請假
**缺點**：不夠靈活，員工提交請假後無法反悔

## 影響範圍

- `批准前需檢查請假時段內不能有打卡記錄.批准全日假時，該日有打卡記錄應失敗`
- `批准前需檢查請假時段內不能有打卡記錄.批准時段假時，該時段內有打卡記錄應失敗`

## 建議

這是一個**業務邏輯設計決策**問題，需要產品經理或業務方確認：

### 選項 1：採用方案 A（修改 production code）

修改 `AttendanceService.checkLeaveConflict()`：

```java
// 只檢查 APPROVED 的請假（不檢查 PENDING）
if (leave.getStatus() == LeaveStatus.APPROVED) {
    if (leave.getDurationType() == DurationType.FULL_DAY) {
        throw new LeaveRequestConflictException("該時段已有請假申請，無法打卡");
    }
    // ...
}
```

### 選項 2：採用方案 B（修改 feature file 和測試）

1. 修改 feature file，移除這兩個測試案例
2. 或者調整測試順序：先打卡，再提交請假（應該失敗）

## 優先級

**High** - 這是核心業務邏輯的不一致，影響測試覆蓋率和業務正確性。

## 標籤

- `business-logic`
- `leave-management`
- `attendance`
- `conflict-detection`

## 建議決策

基於一般 HR 系統的實務，**建議採用方案 A**（測試期望的邏輯），理由：
1. 更符合實際使用場景（員工可能事先請假但臨時取消）
2. 審批流程應該是最終決策點
3. 更靈活，用戶體驗更好
