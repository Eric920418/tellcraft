using System.Text.Json;
using System.Text.RegularExpressions;
using Reqnroll;

namespace GuessingGame.Tests;

/// <summary>
/// ISA Feature Argument Resolver
///
/// 整合了三個系統：
/// 1. VAR-System (Variable System) - 變數符號系統
///    - >contextKey: 定義要存入 scenario context 的變數名稱（header row）
///    - &lt;executionKey: 從 execution variable 取哪個欄位的值（data row）
///    - $variableName: 引用 Context 中的值
///
/// 2. CAS (Constraint Assertion System) - 約束斷言系統
///    - &amp;constraint(params): 約束斷言格式
///
/// 3. TIME-System (Time Expression System) - 時間轉換系統
///    - @time(...): 時間表達式轉換為 timestamp (Long)
///    - @localTime(...): 時間表達式轉換為 LocalTime
///
/// 範例：
/// - VAR-System:
///   | >gameId | playerName |
///   | &lt;id     | Johnny |
///   | $gameId | Johnny |
///
/// - CAS:
///   | id      | playerName |
///   | &amp;gt(0)  | &amp;contains("John") |
///
/// - TIME-System:
///   | createdTime                      |
///   | @time("2025-11-04T08:00:00")     |
/// </summary>
public class FeatureArgumentResolver
{
    private readonly ScenarioContext _scenarioContext;

    public FeatureArgumentResolver(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext;
    }

    // ========== VAR-System: 處理變數儲存 ==========

    /// <summary>
    /// 處理 DataTable 的 header row，識別 >contextKey 並建立對應關係
    /// </summary>
    /// <param name="headers">DataTable 的 header row</param>
    /// <returns>Dictionary&lt;columnIndex, contextKey&gt; - 欄位索引對應到 context key 名稱</returns>
    public Dictionary<int, string> ParseContextKeys(List<string> headers)
    {
        var contextKeyMap = new Dictionary<int, string>();

        for (int i = 0; i < headers.Count; i++)
        {
            var header = headers[i];
            if (!string.IsNullOrEmpty(header) && header.StartsWith(">"))
            {
                var contextKey = header[1..]; // 移除 > 符號
                contextKeyMap[i] = contextKey;
            }
        }

        return contextKeyMap;
    }

    /// <summary>
    /// 處理 DataTable 的 data row，識別 &lt;executionKey 並從 execution variable 取值存入 context
    /// </summary>
    /// <param name="row">DataTable 的 data row</param>
    /// <param name="contextKeyMap">從 ParseContextKeys 得到的對應關係</param>
    /// <param name="executionVariable">執行結果（通常是 Dictionary 或物件）</param>
    public void ExtractAndStoreVariables(List<string> row, Dictionary<int, string> contextKeyMap, object? executionVariable)
    {
        if (executionVariable == null)
        {
            return;
        }

        // 將 execution variable 轉換為 Dictionary
        var executionMap = ToMap(executionVariable);

        foreach (var entry in contextKeyMap)
        {
            var columnIndex = entry.Key;
            var contextKey = entry.Value;

            if (columnIndex < row.Count)
            {
                var executionKey = row[columnIndex];

                // 檢查是否有 <executionKey 格式
                if (!string.IsNullOrEmpty(executionKey) && executionKey.StartsWith("<"))
                {
                    var executionKeyName = executionKey[1..]; // 移除 < 符號

                    // 從 execution variable 取值
                    if (executionMap.TryGetValue(executionKeyName, out var value) && value != null)
                    {
                        // 存入 scenario context（保留原始類型）
                        _scenarioContext[contextKey] = value;
                    }
                }
            }
        }
    }

    /// <summary>
    /// 將 execution variable 轉換為 Dictionary
    /// </summary>
    private Dictionary<string, object?> ToMap(object executionVariable)
    {
        if (executionVariable is Dictionary<string, object?> dict)
        {
            return dict;
        }

        if (executionVariable is IDictionary<string, object> genericDict)
        {
            return genericDict.ToDictionary(kvp => kvp.Key, kvp => (object?)kvp.Value);
        }

        // 如果是 JsonElement，轉換為 Dictionary
        if (executionVariable is JsonElement jsonElement)
        {
            return JsonElementToMap(jsonElement);
        }

        // 如果是其他類型，嘗試使用反射轉換為 Dictionary
        var result = new Dictionary<string, object?>();

        try
        {
            var properties = executionVariable.GetType().GetProperties();
            foreach (var property in properties)
            {
                var value = property.GetValue(executionVariable);
                result[property.Name] = value;
            }
        }
        catch
        {
            // 如果反射失敗，至少把 ToString() 結果存起來
            result["value"] = executionVariable;
        }

        return result;
    }

    private Dictionary<string, object?> JsonElementToMap(JsonElement element)
    {
        var result = new Dictionary<string, object?>();

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                result[property.Name] = JsonElementToValue(property.Value);
            }
        }

        return result;
    }

    private object? JsonElementToValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            JsonValueKind.Object => JsonElementToMap(element),
            JsonValueKind.Array => element.EnumerateArray().Select(JsonElementToValue).ToList(),
            _ => element.ToString()
        };
    }

    // ========== VAR-System: 處理變數引用 ==========

    /// <summary>
    /// 解析值字串，處理變數引用（$variableName）
    /// 這是公開方法，供外部調用以解析任何包含變數引用的字串
    /// </summary>
    /// <param name="value">可能包含 $variableName 的字串</param>
    /// <returns>解析後的值（如果是變數引用則從 context 取值，否則返回原始值）</returns>
    public object? ResolveVariable(string? value)
    {
        return ResolveValue(value);
    }

    /// <summary>
    /// 解析並驗證欄位值
    /// 支援 VAR-System ($variable) 和 CAS (&amp;constraint)
    /// </summary>
    /// <param name="expectedValue">期望值（可能包含 $variable 或 &amp;constraint）</param>
    /// <param name="actualValue">實際值</param>
    /// <param name="fieldName">欄位名稱（用於錯誤訊息）</param>
    /// <param name="entityName">實體名稱（用於錯誤訊息）</param>
    /// <returns>解析後的期望值；如果已用 CAS 驗證則返回 null</returns>
    public object? ResolveAndValidate(string? expectedValue, object? actualValue, string fieldName, string entityName)
    {
        // 1. 處理特殊值 $notnull
        if (expectedValue == "$notnull")
        {
            if (actualValue == null)
            {
                throw new AssertionException($"{entityName}.{fieldName} 應該不為 null");
            }
            return null; // 驗證通過，返回 null
        }

        // 2. 解析變數 ($variable)
        var resolved = ResolveVariable(expectedValue);
        var resolvedStr = resolved?.ToString() ?? "";

        // 3. 如果包含 &，使用 CAS 驗證
        if (resolvedStr.Contains('&'))
        {
            EvaluateConstraints(resolvedStr, actualValue);
            return null; // 驗證通過，不需要返回值
        }

        // 4. TIME-System 自動轉換：如果 expected 是 timestamp (long) 而 actual 是 DateTime
        if (resolved is long timestamp && actualValue is DateTime actualDateTime)
        {
            var expectedDateTime = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).LocalDateTime;

            // 截斷到秒級別進行比對
            var expectedTruncated = new DateTime(expectedDateTime.Year, expectedDateTime.Month, expectedDateTime.Day,
                expectedDateTime.Hour, expectedDateTime.Minute, expectedDateTime.Second);
            var actualTruncated = new DateTime(actualDateTime.Year, actualDateTime.Month, actualDateTime.Day,
                actualDateTime.Hour, actualDateTime.Minute, actualDateTime.Second);

            if (expectedTruncated != actualTruncated)
            {
                throw new AssertionException(
                    $"{entityName}.{fieldName} 時間不匹配。\n  預期: {expectedDateTime} (timestamp: {timestamp})\n  實際: {actualDateTime}");
            }
            return null; // 已驗證，返回 null
        }

        // 5. TIME-System 自動轉換：如果 expected 是 timestamp (long) 而 actual 是 DateOnly
        if (resolved is long dateTimestamp && actualValue is DateOnly actualDate)
        {
            var expectedDate = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeMilliseconds(dateTimestamp).LocalDateTime);

            if (expectedDate != actualDate)
            {
                throw new AssertionException(
                    $"{entityName}.{fieldName} 日期不匹配。\n  預期: {expectedDate} (timestamp: {dateTimestamp})\n  實際: {actualDate}");
            }
            return null; // 已驗證，返回 null
        }

        // 6. 數值類型自動轉換：如果 expected 和 actual 都是數值類型
        if (IsNumeric(resolved) && IsNumeric(actualValue))
        {
            var expectedNum = Convert.ToDouble(resolved);
            var actualNum = Convert.ToDouble(actualValue);

            if (Math.Abs(expectedNum - actualNum) > 0.0001)
            {
                throw new AssertionException(
                    $"{entityName}.{fieldName} 數值不匹配。\n  預期: {resolved} ({resolved?.GetType().Name})\n  實際: {actualValue} ({actualValue?.GetType().Name})");
            }
            return null; // 已驗證，返回 null
        }

        // 7. 否則返回解析後的值，供傳統驗證使用
        return resolved;
    }

    private bool IsNumeric(object? value)
    {
        return value is byte or sbyte or short or ushort or int or uint or long or ulong or float or double or decimal;
    }

    /// <summary>
    /// 解析值字串，處理變數引用（$variableName）或返回原始值
    /// 支援：
    /// - @time(...) - TIME-System 時間轉換
    /// - $variableName - 從 ScenarioContext 解析變數
    /// - "string" 或 'string' - 字串字面值（會移除引號）
    /// - now - 當前時間
    /// </summary>
    private object? ResolveValue(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        var trimmed = value.Trim();

        // TIME-System: 處理 @time(...) 格式
        if (trimmed.StartsWith("@time(") && trimmed.EndsWith(")"))
        {
            var timeExpr = trimmed[6..^1];
            return ParseTimeExpression(timeExpr);
        }

        // TIME-System: 處理 @localTime(...) 格式
        if (trimmed.StartsWith("@localTime(") && trimmed.EndsWith(")"))
        {
            var timeExpr = trimmed[11..^1];
            return ParseLocalTimeExpression(timeExpr);
        }

        // 移除引號
        var isQuoted = false;
        if ((trimmed.StartsWith('"') && trimmed.EndsWith('"')) ||
            (trimmed.StartsWith('\'') && trimmed.EndsWith('\'')))
        {
            trimmed = trimmed[1..^1];
            isQuoted = true;
        }

        // 處理變數引用（只有在沒有引號的情況下才解析為變數）
        if (!isQuoted && trimmed.StartsWith('$'))
        {
            var varName = trimmed[1..];
            if (_scenarioContext.TryGetValue(varName, out var resolved))
            {
                return resolved;
            }
            // 如果變數不存在，返回原始值（可能用於錯誤訊息）
            return value;
        }

        // 處理特殊值
        if (trimmed.Equals("now", StringComparison.OrdinalIgnoreCase))
        {
            return DateTime.Now;
        }

        return trimmed;
    }

    // ========== TIME-System: 時間轉換系統 ==========

    /// <summary>
    /// 解析時間表達式，轉換為 long (timestamp in milliseconds)
    /// 支援格式：
    /// - ISO 8601: "2025-11-04T08:00:00"
    /// - 帶時區: "2025-11-04T08:00:00+08:00"
    /// - 只有日期: "2025-11-04"
    /// - 相對時間: "now", "now-1d", "now+2h"
    /// </summary>
    /// <param name="expr">時間表達式（可能包含引號）</param>
    /// <returns>long (timestamp in milliseconds)</returns>
    private long ParseTimeExpression(string expr)
    {
        // 移除引號
        var cleaned = expr.Trim().Trim('"');

        // 處理相對時間表達式
        if (cleaned == "now")
        {
            return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        if (cleaned.StartsWith("now"))
        {
            return ParseRelativeTime(cleaned);
        }

        // 處理 ISO 8601 格式
        try
        {
            // 嘗試解析完整 datetime（可能帶時區）
            if (cleaned.Contains('T'))
            {
                return ParseISODateTime(cleaned);
            }

            // 嘗試解析只有日期
            var date = DateOnly.Parse(cleaned);
            return new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeZoneInfo.Local.GetUtcOffset(DateTime.Now))
                .ToUnixTimeMilliseconds();
        }
        catch (FormatException e)
        {
            throw new ArgumentException(
                $"無法解析時間表達式: @time(\"{cleaned}\")。支援格式：ISO 8601 (2025-11-04T08:00:00)、日期 (2025-11-04)、相對時間 (now, now-1d)", e);
        }
    }

    /// <summary>
    /// 解析 LocalTime 表達式，轉換為 TimeOnly 物件
    /// 支援格式：
    /// - "09:00:00" - 標準時間格式（HH:mm:ss）
    /// - "09:00:00.123" - 帶毫秒
    /// </summary>
    /// <param name="expr">時間表達式（可能包含引號）</param>
    /// <returns>TimeOnly 物件</returns>
    private TimeOnly ParseLocalTimeExpression(string expr)
    {
        // 移除引號
        var cleaned = expr.Trim().Trim('"');

        try
        {
            return TimeOnly.Parse(cleaned);
        }
        catch (FormatException e)
        {
            throw new ArgumentException(
                $"無法解析 LocalTime 表達式: @localTime(\"{cleaned}\")。支援格式：HH:mm:ss (09:00:00)、HH:mm:ss.fff (09:00:00.123)", e);
        }
    }

    /// <summary>
    /// 解析 ISO 8601 日期時間格式
    /// </summary>
    private long ParseISODateTime(string datetimeStr)
    {
        try
        {
            // 嘗試解析帶時區的格式
            if (datetimeStr.Contains('+') || datetimeStr.EndsWith('Z'))
            {
                var zonedDateTime = DateTimeOffset.Parse(datetimeStr);
                return zonedDateTime.ToUnixTimeMilliseconds();
            }

            // 解析不帶時區的格式（使用系統時區）
            var localDateTime = DateTime.Parse(datetimeStr);
            return new DateTimeOffset(localDateTime, TimeZoneInfo.Local.GetUtcOffset(localDateTime))
                .ToUnixTimeMilliseconds();
        }
        catch (FormatException e)
        {
            throw new ArgumentException($"無法解析 ISO 8601 日期時間: {datetimeStr}", e);
        }
    }

    /// <summary>
    /// 解析相對時間表達式（如 now-1d, now+2h）
    /// </summary>
    private long ParseRelativeTime(string expr)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        if (expr == "now")
        {
            return now;
        }

        // 解析 now±Nd, now±Nh, now±Nm 格式
        var pattern = expr[3..]; // 移除 "now"
        long offset = 0;

        // 解析天數 (d)
        var dayMatches = Regex.Matches(pattern, @"([+-]?\d+)d");
        foreach (Match match in dayMatches)
        {
            var days = int.Parse(match.Groups[1].Value);
            offset += days * 24L * 60 * 60 * 1000;
        }

        // 解析小時 (h)
        var hourMatches = Regex.Matches(pattern, @"([+-]?\d+)h");
        foreach (Match match in hourMatches)
        {
            var hours = int.Parse(match.Groups[1].Value);
            offset += hours * 60L * 60 * 1000;
        }

        // 解析分鐘 (m)
        var minuteMatches = Regex.Matches(pattern, @"([+-]?\d+)m");
        foreach (Match match in minuteMatches)
        {
            var minutes = int.Parse(match.Groups[1].Value);
            offset += minutes * 60L * 1000;
        }

        return now + offset;
    }

    /// <summary>
    /// 解析為字串
    /// </summary>
    private string ResolveString(string? value)
    {
        var resolved = ResolveValue(value);
        return resolved?.ToString() ?? "";
    }

    // ========== CAS: 約束斷言系統 ==========

    /// <summary>
    /// 評估約束條件
    /// </summary>
    /// <param name="constraintString">約束條件字串</param>
    /// <param name="actualValue">實際值</param>
    /// <returns>是否通過驗證</returns>
    public bool EvaluateConstraints(string? constraintString, object? actualValue)
    {
        if (string.IsNullOrWhiteSpace(constraintString))
        {
            return true;
        }

        var constraints = ParseConstraints(constraintString);

        foreach (var constraint in constraints)
        {
            if (!EvaluateConstraint(constraint, actualValue))
            {
                var constraintDesc = constraint.Params != null
                    ? $"&{constraint.Name}({constraint.Params})"
                    : $"&{constraint.Name}";
                throw new AssertionException(
                    $"約束條件 '{constraintDesc}' 驗證失敗。\n  預期: {constraintDesc}\n  實際: {actualValue}");
            }
        }

        return true;
    }

    private List<Constraint> ParseConstraints(string constraintString)
    {
        var constraints = new List<Constraint>();
        var pattern = new Regex(@"&(\w+)(?:\(([^)]*)\))?");
        var matches = pattern.Matches(constraintString);

        foreach (Match match in matches)
        {
            var constraintName = match.Groups[1].Value;
            var param = match.Groups[2].Success ? match.Groups[2].Value : null;
            constraints.Add(new Constraint(constraintName, param));
        }

        return constraints;
    }

    private bool EvaluateConstraint(Constraint constraint, object? actualValue)
    {
        var name = constraint.Name;
        var param = constraint.Params;

        try
        {
            return name switch
            {
                "eq" => EvaluateEq(actualValue, param),
                "ne" => EvaluateNe(actualValue, param),
                "gt" => EvaluateGt(actualValue, param),
                "lt" => EvaluateLt(actualValue, param),
                "ge" => EvaluateGe(actualValue, param),
                "le" => EvaluateLe(actualValue, param),
                "isNum" => IsNumeric(actualValue),
                "isStr" => actualValue is string,
                "isBool" => actualValue is bool,
                "isNull" => actualValue == null,
                "isNotNull" => actualValue != null,
                "contains" => EvaluateContains(actualValue, param),
                "startsWith" => EvaluateStartsWith(actualValue, param),
                "endsWith" => EvaluateEndsWith(actualValue, param),
                "matches" => EvaluateMatches(actualValue, param),
                "length" => EvaluateLength(actualValue, param),
                "between" => EvaluateBetween(actualValue, param),
                "oneOf" => EvaluateOneOf(actualValue, param),
                _ => throw new ArgumentException($"未知的約束條件: &{name}")
            };
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new AssertionException(
                $"評估約束條件 '&{name}({param ?? ""})' 時發生錯誤: {e.Message}", e);
        }
    }

    // CAS 斷言實作方法
    private bool EvaluateEq(object? actualValue, string? param)
    {
        var expectedValue = ResolveValue(param);
        return Equals(actualValue, expectedValue) ||
               string.Equals(actualValue?.ToString(), expectedValue?.ToString());
    }

    private bool EvaluateNe(object? actualValue, string? param)
    {
        return !EvaluateEq(actualValue, param);
    }

    private bool EvaluateGt(object? actualValue, string? param)
    {
        var actual = ToDouble(actualValue);
        var expected = ToDouble(ResolveValue(param));
        return actual > expected;
    }

    private bool EvaluateLt(object? actualValue, string? param)
    {
        var actual = ToDouble(actualValue);
        var expected = ToDouble(ResolveValue(param));
        return actual < expected;
    }

    private bool EvaluateGe(object? actualValue, string? param)
    {
        var actual = ToDouble(actualValue);
        var expected = ToDouble(ResolveValue(param));
        return actual >= expected;
    }

    private bool EvaluateLe(object? actualValue, string? param)
    {
        var actual = ToDouble(actualValue);
        var expected = ToDouble(ResolveValue(param));
        return actual <= expected;
    }

    private bool EvaluateContains(object? actualValue, string? param)
    {
        if (actualValue is not string str)
        {
            return false;
        }
        var substring = ResolveString(param);
        return str.Contains(substring);
    }

    private bool EvaluateStartsWith(object? actualValue, string? param)
    {
        if (actualValue is not string str)
        {
            return false;
        }
        var prefix = ResolveString(param);
        return str.StartsWith(prefix);
    }

    private bool EvaluateEndsWith(object? actualValue, string? param)
    {
        if (actualValue is not string str)
        {
            return false;
        }
        var suffix = ResolveString(param);
        return str.EndsWith(suffix);
    }

    private bool EvaluateMatches(object? actualValue, string? param)
    {
        if (actualValue is not string str)
        {
            return false;
        }
        var regex = ResolveString(param);
        return Regex.IsMatch(str, regex);
    }

    private bool EvaluateLength(object? actualValue, string? param)
    {
        if (actualValue is not string str)
        {
            return false;
        }
        var parts = param?.Split(',');
        if (parts?.Length != 2)
        {
            throw new ArgumentException("&length 需要兩個參數: min,max");
        }
        var min = int.Parse(parts[0].Trim());
        var max = int.Parse(parts[1].Trim());
        var length = str.Length;
        return length >= min && length <= max;
    }

    private bool EvaluateBetween(object? actualValue, string? param)
    {
        var parts = param?.Split(',');
        if (parts?.Length != 2)
        {
            throw new ArgumentException("&between 需要兩個參數: min,max");
        }
        var actual = ToDouble(actualValue);
        var min = ToDouble(ResolveValue(parts[0].Trim()));
        var max = ToDouble(ResolveValue(parts[1].Trim()));
        return actual >= min && actual <= max;
    }

    private bool EvaluateOneOf(object? actualValue, string? param)
    {
        var parts = param?.Split(',');
        if (parts == null)
        {
            return false;
        }
        foreach (var part in parts)
        {
            var expected = ResolveValue(part.Trim());
            if (Equals(actualValue, expected) ||
                string.Equals(actualValue?.ToString(), expected?.ToString()))
            {
                return true;
            }
        }
        return false;
    }

    // ========== 輔助方法 ==========

    private double ToDouble(object? value)
    {
        if (value == null)
        {
            throw new ArgumentException("無法將 null 轉換為數字");
        }

        if (value is double d)
        {
            return d;
        }

        if (IsNumeric(value))
        {
            return Convert.ToDouble(value);
        }

        if (double.TryParse(value.ToString(), out var result))
        {
            return result;
        }

        throw new ArgumentException($"無法將值轉換為數字: {value}");
    }

    private DateTime? ParseDateTime(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is DateTime dt)
        {
            return dt;
        }

        if (value is long millis)
        {
            return DateTimeOffset.FromUnixTimeMilliseconds(millis).LocalDateTime;
        }

        var str = value.ToString();
        if (str == null)
        {
            return null;
        }

        string[] formats =
        {
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd"
        };

        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(str, format, null, System.Globalization.DateTimeStyles.None, out var parsed))
            {
                return parsed;
            }
        }

        if (DateTime.TryParse(str, out var result))
        {
            return result;
        }

        return null;
    }

    private DateOnly? ParseDate(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is DateOnly dateOnly)
        {
            return dateOnly;
        }

        if (value is DateTime dt)
        {
            return DateOnly.FromDateTime(dt);
        }

        if (value is long millis)
        {
            return DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeMilliseconds(millis).LocalDateTime);
        }

        var str = value.ToString();
        if (str == null)
        {
            return null;
        }

        if (DateOnly.TryParse(str, out var result))
        {
            return result;
        }

        return null;
    }

    // ========== 內部類別 ==========

    /// <summary>
    /// 欄位資訊封裝類別
    /// </summary>
    public class ColumnInfo
    {
        public string Prefix { get; }
        public string Name { get; }

        public ColumnInfo(string? prefix, string? name)
        {
            Prefix = prefix ?? "";
            Name = name ?? "";
        }
    }

    /// <summary>
    /// 解析欄位前綴（P:/Q:/H:）
    /// </summary>
    /// <param name="columnHeader">欄位標題，例如 "P:id", "Q:date", "agentId"</param>
    /// <returns>ColumnInfo 包含 Prefix 和 Name</returns>
    public ColumnInfo ParseColumnPrefix(string? columnHeader)
    {
        if (string.IsNullOrEmpty(columnHeader))
        {
            return new ColumnInfo("", "");
        }

        var trimmed = columnHeader.Trim();

        // 檢查是否有前綴（格式：P:name, Q:name, H:name）
        var colonIndex = trimmed.IndexOf(':');
        if (colonIndex > 0 && colonIndex < trimmed.Length - 1)
        {
            var prefix = trimmed[..colonIndex].ToUpper();
            var name = trimmed[(colonIndex + 1)..];

            // 驗證前綴是否有效
            if (prefix == "P" || prefix == "Q" || prefix == "H")
            {
                return new ColumnInfo(prefix, name);
            }
        }

        // 沒有前綴，返回空前綴和完整名稱
        return new ColumnInfo("", trimmed);
    }

    private class Constraint
    {
        public string Name { get; }
        public string? Params { get; }

        public Constraint(string name, string? param)
        {
            Name = name;
            Params = param;
        }
    }
}

/// <summary>
/// 自訂斷言例外
/// </summary>
public class AssertionException : Exception
{
    public AssertionException(string message) : base(message)
    {
    }

    public AssertionException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
