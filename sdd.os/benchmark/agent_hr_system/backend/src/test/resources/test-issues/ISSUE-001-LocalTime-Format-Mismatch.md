# ISSUE-001: LocalTime 格式不匹配

## 問題描述

驗證步驟 `Then_應該存在一個請假申請_With_Table.java` 中的 LocalTime 格式驗證失敗。

## 錯誤信息

```
org.opentest4j.AssertionFailedError: 請假申請.startTime should match
==> expected: <09:00:00> but was: <09:00>
```

## 根本原因

在 `Then_應該存在一個請假申請_With_Table.java` 第 130 行：

```java
String actualStr = (v == null) ? null : String.valueOf(v);
assertEquals(resolved.toString(), actualStr, "請假申請.startTime should match");
```

Java 的 `LocalTime.toString()` 方法在秒數為 0 時會省略秒數部分：
- `LocalTime.of(9, 0, 0).toString()` 返回 `"09:00"` (不是 `"09:00:00"`)
- `LocalTime.of(9, 30, 15).toString()` 返回 `"09:30:15"`

這是 Java 的預設行為，符合 ISO-8601 標準（可以省略秒數如果為 0）。

## 影響範圍

- `特務可以提交年假申請（時段假）.提交時段年假申請應成功`
- `請假時段內不能有打卡紀錄（嚴格衝突檢測）.請假時段外有打卡不影響申請`
- `回應包含完整的請假記錄欄位.時段假記錄包含起迄時間`
- 以及其他 5 個相關測試

總共約 7-8 個測試受影響。

## 建議修復方案

### 方案 1：修改驗證邏輯（推薦）

在生成器中，當欄位類型是 `LocalTime` 時，應該使用格式化器來保證格式一致：

```java
// 修改前
String actualStr = (v == null) ? null : String.valueOf(v);

// 修改後
String actualStr;
if (v == null) {
    actualStr = null;
} else if (v instanceof java.time.LocalTime) {
    actualStr = ((java.time.LocalTime) v).format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
} else {
    actualStr = String.valueOf(v);
}
```

### 方案 2：調整測試期望值

在 feature file 中，接受 LocalTime 的標準格式（允許省略秒數）。但這需要調整測試數據生成邏輯。

### 方案 3：使用寬鬆比較

在生成器中生成比較邏輯時，對於 LocalTime 類型使用寬鬆的字串比較（忽略尾部的 `:00`）。

## 測試案例

```gherkin
And 應該存在一個請假申請, with table:
  | requestId  | startTime | endTime  |
  | $requestId | 09:00:00  | 12:00:00 |
```

當 startTime/endTime 的秒數為 00 時，Java LocalTime.toString() 會輸出 `09:00` 而不是 `09:00:00`。

## 優先級

**Medium** - 這不影響業務邏輯的正確性，只是測試驗證的格式問題。

## 標籤

- `test-codegen`
- `localtime`
- `format-mismatch`
