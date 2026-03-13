using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Tw.Sdd.Isa.TestLib.Context;

namespace Tw.Sdd.Isa.TestLib.Helper;

/// <summary>
/// ISA Feature Argument Resolver - 處理變數解析、時間表達式、約束評估
/// 支援 VAR-System、TIME-System、CAS (Constraint Assertion System)
/// </summary>
public class ISAFeatureArgumentResolver
{
    private readonly ScenarioContext _scenarioContext;

    // 約束處理器字典
    private readonly Dictionary<string, Func<object?, string[], bool>> _constraintHandlers;

    public ISAFeatureArgumentResolver(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext ?? throw new ArgumentNullException(nameof(scenarioContext));
        _constraintHandlers = InitializeConstraintHandlers();
    }

    #region VAR-System: Variable Management

    /// <summary>
    /// 解析 header 中的 context keys (>contextKey)
    /// </summary>
    public Dictionary<int, string> ParseContextKeys(List<string> headers)
    {
        var contextKeyMap = new Dictionary<int, string>();

        for (int i = 0; i < headers.Count; i++)
        {
            var header = headers[i];
            if (string.IsNullOrEmpty(header)) continue;

            if (header.StartsWith(">"))
            {
                string contextKey = header.Substring(1);

                // 檢查 context key 是否為空
                if (string.IsNullOrWhiteSpace(contextKey))
                {
                    throw new ArgumentException($"Context key at position {i} is empty");
                }

                // 檢查保留變數名稱
                if (contextKey == "now")
                {
                    throw new ArgumentException($"變數名稱 '{contextKey}' 是保留字，不能作為 context key 使用");
                }

                contextKeyMap[i] = contextKey;
            }
        }

        return contextKeyMap;
    }

    /// <summary>
    /// 從 execution variable 提取值並儲存到 scenario context
    /// </summary>
    public void ExtractAndStoreVariables(List<string> dataRow, Dictionary<int, string> contextKeyMap, object? executionVariable)
    {
        // 先檢查 data row 中的 <executionKey 是否都有對應的 >contextKey
        for (int i = 0; i < dataRow.Count; i++)
        {
            string cellValue = dataRow[i] ?? "";
            if (cellValue.StartsWith("<"))
            {
                // data row 有 <executionKey
                if (!contextKeyMap.ContainsKey(i))
                {
                    // 但 header 沒有對應的 >contextKey
                    throw new ArgumentException($"Data row position {i} has '<executionKey' but header does not have corresponding '>contextKey'. They must be paired.");
                }
            }
        }

        if (contextKeyMap.Count == 0) return;

        foreach (var kvp in contextKeyMap)
        {
            int columnIndex = kvp.Key;
            string contextKey = kvp.Value;

            if (columnIndex >= dataRow.Count) continue;

            string cellValue = dataRow[columnIndex] ?? "";

            // 檢查是否為 <executionKey 格式
            if (!cellValue.StartsWith("<"))
            {
                // ADR-0004: 當 >contextKey 沒有對應的 <executionKey 時：
                // - 如果值是 @time()/@date()/@localtime() 表達式，靜默跳過（這是不支援的用法但不報錯）
                // - 其他情況拋出異常（明顯的配對錯誤）
                if (cellValue.StartsWith("@time(", StringComparison.OrdinalIgnoreCase) ||
                    cellValue.StartsWith("@date(", StringComparison.OrdinalIgnoreCase) ||
                    cellValue.StartsWith("@localtime(", StringComparison.OrdinalIgnoreCase))
                {
                    // ADR-0004: TIME-System 表達式不應該與 >contextKey 混用，但不報錯
                    continue;
                }
                
                // 拋出例外：context key 存在但沒有對應的 execution key
                throw new ArgumentException($"Header position {columnIndex} has context key '>{contextKey}' but data row does not have corresponding '<executionKey'. They must be paired.");
            }

            string executionKey = cellValue.Substring(1);

            // 檢查 executionKey 是否為空
            if (string.IsNullOrWhiteSpace(executionKey))
            {
                throw new ArgumentException($"Execution key 名稱不能為空（位置 {columnIndex}）");
            }

            object? value = ExtractValueFromExecutionVariable(executionVariable, executionKey);

            _scenarioContext.PutObject(contextKey, value);
        }
    }

    /// <summary>
    /// 從 execution variable 提取值（支援 nested path）
    /// </summary>
    private object? ExtractValueFromExecutionVariable(object? executionVariable, string path)
    {
        if (executionVariable == null) return null;

        string[] parts = path.Split('.');
        object? current = executionVariable;

        foreach (string part in parts)
        {
            if (current == null) return null;

            // 嘗試 Dictionary/Map 存取
            if (current is IDictionary<string, object?> dict)
            {
                if (dict.TryGetValue(part, out var dictValue))
                {
                    current = dictValue;
                }
                else
                {
                    return null;
                }
            }
            // 嘗試 Property 存取（Java Bean style）
            else
            {
                var property = current.GetType().GetProperty(part,
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

                if (property != null)
                {
                    current = property.GetValue(current);
                }
                else
                {
                    return null;
                }
            }
        }

        return current;
    }

    /// <summary>
    /// 解析變數引用 ($variableName)
    /// </summary>
    public object? ResolveVariable(string? input)
    {
        if (input == null) return null;
        if (string.IsNullOrEmpty(input)) return input;

        // 移除引號（字串字面值）
        if ((input.StartsWith("\"") && input.EndsWith("\"")) ||
            (input.StartsWith("'") && input.EndsWith("'")))
        {
            return input.Substring(1, input.Length - 2);
        }

        // 變數引用：$variableName（完整字串以 $ 開頭）
        if (input.StartsWith("$") && !input.StartsWith("${"))
        {
            string varName = input.Substring(1);

            // 特殊處理 $now
            if (varName == "now")
            {
                // 先檢查 context 中是否有 now 變數
                var contextValue = _scenarioContext.Get("now");
                if (contextValue != null)
                {
                    return contextValue;
                }
                // 否則返回當前時間（可能是 mock 的時間）
                return GetNow();
            }

            var value = _scenarioContext.Get(varName);

            // 如果找不到，返回原始字串
            return value ?? input;
        }

        // 字串插值：包含 ${VAR} 語法
        if (input.Contains("${"))
        {
            return InterpolateString(input);
        }

        // TIME-System 表達式
        if (input.StartsWith("@time(", StringComparison.OrdinalIgnoreCase))
        {
            return ParseTimeExpression(input);
        }

        if (input.StartsWith("@date(", StringComparison.OrdinalIgnoreCase))
        {
            return ParseDateExpression(input);
        }

        if (input.StartsWith("@localtime(", StringComparison.OrdinalIgnoreCase))
        {
            return ParseLocalTimeExpression(input);
        }

        return input;
    }

    /// <summary>
    /// 處理字串插值 ${VAR} 語法
    /// </summary>
    private string InterpolateString(string input)
    {
        // 使用正則表達式匹配 ${...} 模式
        var pattern = @"\$\{([^}]*)\}";
        var result = Regex.Replace(input, pattern, match =>
        {
            var varName = match.Groups[1].Value;

            // 如果變數名為空，返回原樣
            if (string.IsNullOrWhiteSpace(varName))
            {
                return match.Value;
            }

            // 從 context 中取得變數值
            var value = _scenarioContext.Get(varName);

            // 如果找不到變數，返回原樣
            if (value == null)
            {
                return match.Value;
            }

            // 返回變數的字串表示
            return value.ToString() ?? match.Value;
        });

        return result;
    }

    #endregion

    #region TIME-System: Time Expression Parsing

    /// <summary>
    /// 設定當前時間（用於測試）
    /// </summary>
    public void SetNow(string timeString)
    {
        try
        {
            var parsedTime = ParseTimeString(timeString);
            _scenarioContext.PutObject("now", parsedTime);
        }
        catch (Exception ex)
        {
            throw new Exception($"無法解析時間字串: {timeString}", ex);
        }
    }

    /// <summary>
    /// 取得當前時間（可能是 mock 的時間）
    /// </summary>
    public DateTimeOffset GetNow()
    {
        var nowValue = _scenarioContext.Get("now");
        if (nowValue is DateTimeOffset dto)
        {
            return dto;
        }
        return DateTimeOffset.Now;
    }

    /// <summary>
    /// 解析 @time() 表達式
    /// </summary>
    private DateTimeOffset ParseTimeExpression(string expression)
    {
        string parameter = ExtractParameter(expression, "@time");

        if (parameter == "now")
        {
            return GetNow();
        }

        // 檢查是否為相對時間表達式（now+1d, now-1h, etc.）
        if (parameter.StartsWith("now"))
        {
            return ParseRelativeTimeExpression(parameter);
        }

        // 解析絕對時間
        return ParseTimeString(parameter);
    }

    /// <summary>
    /// 解析相對時間表達式（now-1d, now+1h, etc.）
    /// </summary>
    private DateTimeOffset ParseRelativeTimeExpression(string expression)
    {
        DateTimeOffset baseTime = GetNow();

        // 移除 "now" 前綴
        string remaining = expression.Substring(3);
        if (string.IsNullOrEmpty(remaining)) return baseTime;

        // 解析多個時間偏移（例如：-1M-1d-1h-1m-1s）
        // 支援 + 或 - 號，數字，以及單位（s=秒, m=分鐘, h=小時, d=天, M=月）
        var pattern = @"([+\-])(\d+)([smhdM])";
        var regex = new Regex(pattern);
        var matches = regex.Matches(remaining);

        // 如果沒有匹配到任何模式，返回當前時間
        if (matches.Count == 0)
        {
            return baseTime;
        }

        foreach (Match match in matches)
        {
            if (!match.Success) continue;

            string sign = match.Groups[1].Value;
            int value = int.Parse(match.Groups[2].Value);
            string unit = match.Groups[3].Value;

            // 根據符號調整數值
            if (sign == "-")
            {
                value = -value;
            }

            // 根據單位應用時間偏移
            baseTime = unit switch
            {
                "s" => baseTime.AddSeconds(value),
                "m" => baseTime.AddMinutes(value),
                "h" => baseTime.AddHours(value),
                "d" => baseTime.AddDays(value),
                "M" => baseTime.AddMonths(value),
                _ => baseTime
            };
        }

        return baseTime;
    }

    /// <summary>
    /// 解析時間字串（嚴格支援 ISO 8601 格式）
    /// </summary>
    private DateTimeOffset ParseTimeString(string timeString)
    {
        try
        {
            // 嚴格檢查格式：ISO 8601 使用 - 分隔，不使用 /
            if (timeString.Contains('/'))
            {
                throw new Exception($"無法解析時間格式: {timeString}");
            }

            // 嘗試解析 ISO 8601 格式
            if (DateTimeOffset.TryParse(timeString, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
            {
                return result;
            }

            // 嘗試解析只有日期的格式
            if (DateTime.TryParse(timeString, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateResult))
            {
                return new DateTimeOffset(dateResult);
            }

            throw new Exception($"無法解析時間格式: {timeString}");
        }
        catch (FormatException ex)
        {
            throw new Exception($"無法解析時間格式: {timeString}", ex);
        }
    }

    /// <summary>
    /// 解析 @date() 表達式
    /// </summary>
    private DateOnly ParseDateExpression(string expression)
    {
        try
        {
            string parameter = ExtractParameter(expression, "@date");

            if (parameter == "now")
            {
                var now = GetNow();
                return DateOnly.FromDateTime(now.DateTime);
            }

            // 解析日期
            if (DateOnly.TryParse(parameter, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
            {
                return result;
            }

            throw new Exception($"無法解析日期格式: {parameter}");
        }
        catch (FormatException ex)
        {
            throw new Exception($"無法解析日期格式", ex);
        }
    }

    /// <summary>
    /// 解析 @localtime() 表達式
    /// </summary>
    private TimeOnly ParseLocalTimeExpression(string expression)
    {
        string parameter = ExtractParameter(expression, "@localtime");

        if (parameter == "now")
        {
            var now = GetNow();
            return TimeOnly.FromDateTime(now.DateTime);
        }

        // 解析時間（支援帶毫秒）
        if (TimeOnly.TryParse(parameter, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
        {
            return result;
        }

        // 檢查是否為格式正確但值超出範圍（如 25:00:00）
        // 這種情況應該拋出 ArgumentException
        if (parameter.Contains(':') && parameter.Split(':').Length >= 2)
        {
            // 看起來像時間格式但解析失敗 = 超出範圍
            throw new ArgumentException($"無法解析時間格式: {parameter}");
        }

        // 完全無效的格式應該拋出 Exception
        throw new Exception($"無法解析時間格式: {parameter}");
    }

    /// <summary>
    /// 提取函數參數（移除引號）
    /// </summary>
    private string ExtractParameter(string expression, string functionName)
    {
        int startIndex = expression.IndexOf('(');
        int endIndex = expression.LastIndexOf(')');

        if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex)
        {
            throw new ArgumentException($"Invalid {functionName} expression: {expression}");
        }

        string parameter = expression.Substring(startIndex + 1, endIndex - startIndex - 1).Trim();

        // 移除引號
        if ((parameter.StartsWith("\"") && parameter.EndsWith("\"")) ||
            (parameter.StartsWith("'") && parameter.EndsWith("'")))
        {
            parameter = parameter.Substring(1, parameter.Length - 2);
        }

        return parameter;
    }

    #endregion

    #region CAS: Constraint Assertion System

    /// <summary>
    /// 評估約束條件
    /// </summary>
    public bool EvaluateConstraints(string? constraintExpression, object? actualValue)
    {
        if (string.IsNullOrEmpty(constraintExpression))
            return true;

        // 解析約束表達式
        var constraints = ParseConstraints(constraintExpression);

        foreach (var constraint in constraints)
        {
            if (!EvaluateSingleConstraint(constraint, actualValue))
            {
                // 構建包含約束條件和實際值的錯誤訊息
                string constraintStr = $"&{constraint.Name}({constraint.RawParams})";
                string actualValueStr = actualValue?.ToString() ?? "null";
                throw new Exception($"Constraint failed: {constraint.Name}. Expected constraint: {constraintStr}, but actual value was: {actualValueStr}");
            }
        }

        return true;
    }

    /// <summary>
    /// 解析約束表達式（支援多重約束）
    /// </summary>
    private List<Constraint> ParseConstraints(string expression)
    {
        var constraints = new List<Constraint>();

        int i = 0;
        while (i < expression.Length)
        {
            // 尋找下一個 &
            if (expression[i] != '&')
            {
                i++;
                continue;
            }

            // 跳過 &
            i++;

            // 讀取約束名稱
            int nameStart = i;
            while (i < expression.Length && char.IsLetterOrDigit(expression[i]))
            {
                i++;
            }
            string name = expression.Substring(nameStart, i - nameStart);

            // 檢查是否有參數（以 ( 開頭）
            string argsString = "";
            if (i < expression.Length && expression[i] == '(')
            {
                i++; // 跳過 (
                int argsStart = i;
                int depth = 1; // 括號深度

                // 讀取參數直到匹配的 )
                while (i < expression.Length && depth > 0)
                {
                    if (expression[i] == '(')
                    {
                        depth++;
                    }
                    else if (expression[i] == ')')
                    {
                        depth--;
                        if (depth == 0)
                        {
                            break; // 找到匹配的 )
                        }
                    }
                    else if (expression[i] == '\\' && i + 1 < expression.Length)
                    {
                        // 跳過轉義字符
                        i++;
                    }
                    i++;
                }

                argsString = expression.Substring(argsStart, i - argsStart);
                i++; // 跳過 )
            }

            var args = ParseConstraintArguments(argsString);

            constraints.Add(new Constraint
            {
                Name = name,
                Arguments = args,
                RawParams = argsString
            });
        }

        return constraints;
    }

    /// <summary>
    /// 解析約束參數
    /// </summary>
    private string[] ParseConstraintArguments(string argsString)
    {
        if (string.IsNullOrEmpty(argsString))
            return Array.Empty<string>();

        // 分割參數（處理引號內的逗號）
        var args = new List<string>();
        bool inQuotes = false;
        int startIndex = 0;

        for (int i = 0; i < argsString.Length; i++)
        {
            char c = argsString[i];

            if (c == '"' || c == '\'')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                string arg = argsString.Substring(startIndex, i - startIndex).Trim();
                args.Add(RemoveQuotes(arg));
                startIndex = i + 1;
            }
        }

        // 最後一個參數
        if (startIndex < argsString.Length)
        {
            string arg = argsString.Substring(startIndex).Trim();
            args.Add(RemoveQuotes(arg));
        }

        return args.ToArray();
    }

    /// <summary>
    /// 移除引號
    /// </summary>
    private string RemoveQuotes(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;

        if ((value.StartsWith("\"") && value.EndsWith("\"")) ||
            (value.StartsWith("'") && value.EndsWith("'")))
        {
            return value.Substring(1, value.Length - 2);
        }

        return value;
    }

    /// <summary>
    /// 評估單一約束
    /// </summary>
    private bool EvaluateSingleConstraint(Constraint constraint, object? actualValue)
    {
        if (_constraintHandlers.TryGetValue(constraint.Name, out var handler))
        {
            return handler(actualValue, constraint.Arguments);
        }

        throw new ArgumentException($"Unknown constraint: {constraint.Name}");
    }

    /// <summary>
    /// 初始化約束處理器
    /// </summary>
    private Dictionary<string, Func<object?, string[], bool>> InitializeConstraintHandlers()
    {
        return new Dictionary<string, Func<object?, string[], bool>>
        {
            // 數值比較（支援自動轉換 DateTime/DateTimeOffset 為 timestamp）
            ["eq"] = (actual, args) => EvaluateEqual(actual, ResolveArgument(args[0])),
            ["ne"] = (actual, args) => !EvaluateEqual(actual, ResolveArgument(args[0])),
            ["gt"] = (actual, args) => CompareNumbersWithTimeConversion(actual, ResolveArgument(args[0])) > 0,
            ["lt"] = (actual, args) => CompareNumbersWithTimeConversion(actual, ResolveArgument(args[0])) < 0,
            ["ge"] = (actual, args) => CompareNumbersWithTimeConversion(actual, ResolveArgument(args[0])) >= 0,
            ["le"] = (actual, args) => CompareNumbersWithTimeConversion(actual, ResolveArgument(args[0])) <= 0,

            // 類型檢查
            ["isNum"] = (actual, args) => IsNumber(actual),
            ["isStr"] = (actual, args) => actual is string,
            ["isBool"] = (actual, args) => actual is bool,
            ["isNull"] = (actual, args) => actual == null,
            ["isNotNull"] = (actual, args) => actual != null,
            ["isDef"] = (actual, args) => actual != null,

            // 字串操作
            ["contains"] = (actual, args) => actual is string str && str.Contains(args[0]),
            ["startsWith"] = (actual, args) => actual is string str && str.StartsWith(args[0]),
            ["endsWith"] = (actual, args) => actual is string str && str.EndsWith(args[0]),
            ["matches"] = (actual, args) => actual is string str && Regex.IsMatch(str, args[0]),
            ["length"] = (actual, args) => EvaluateLength(actual, args),

            // 集合/陣列
            ["hasItem"] = (actual, args) => HasItem(actual, ResolveArgument(args[0])),
            ["hasNoItem"] = (actual, args) => !HasItem(actual, ResolveArgument(args[0])),
            ["size"] = (actual, args) => GetCollectionSize(actual) == int.Parse(args[0]),
            ["isEmpty"] = (actual, args) => GetCollectionSize(actual) == 0,
            ["isNotEmpty"] = (actual, args) => GetCollectionSize(actual) > 0,

            // 存在性
            ["exists"] = (actual, args) => actual != null,
            ["notExists"] = (actual, args) => actual == null,
            ["hasField"] = (actual, args) => HasField(actual, args[0]),
            ["noField"] = (actual, args) => !HasField(actual, args[0]),

            // 範圍檢查
            ["between"] = (actual, args) => EvaluateBetween(actual, args),
            ["notBetween"] = (actual, args) => !EvaluateBetween(actual, args),
            ["oneOf"] = (actual, args) => args.Any(arg => EvaluateEqual(actual, ResolveArgument(arg))),
            ["noneOf"] = (actual, args) => !args.Any(arg => EvaluateEqual(actual, ResolveArgument(arg))),

            // 時間相關
            ["before"] = (actual, args) => EvaluateBefore(actual, ResolveArgumentToString(args[0])),
            ["after"] = (actual, args) => EvaluateAfter(actual, ResolveArgumentToString(args[0])),
            ["sameDay"] = (actual, args) => EvaluateSameDay(actual, ResolveArgumentToString(args[0])),
            ["withinDays"] = (actual, args) => EvaluateWithinDays(actual, ResolveArgumentToString(args[0])),
            ["sameTime"] = (actual, args) => EvaluateSameTime(actual, ResolveArgumentToString(args[0])),
            ["timeRange"] = (actual, args) => EvaluateTimeRange(actual, ResolveArgumentToString(args[0]), ResolveArgumentToString(args[1]))
        };
    }

    /// <summary>
    /// 解析參數（可能是變數引用）
    /// </summary>
    private object? ResolveArgument(string arg)
    {
        if (arg.StartsWith("$"))
        {
            string varName = arg.Substring(1);
            return _scenarioContext.Get(varName);
        }
        return arg;
    }

    /// <summary>
    /// 解析參數並轉換為字串（用於時間約束）
    /// </summary>
    private string ResolveArgumentToString(string arg)
    {
        var resolved = ResolveArgument(arg);

        // 如果解析結果是 timestamp (long)，轉換為 ISO 8601 字串
        if (resolved is long timestamp)
        {
            var dto = DateTimeOffset.FromUnixTimeMilliseconds(timestamp);
            return dto.ToString("o");
        }

        // 如果是 DateTime 或 DateTimeOffset，轉換為 ISO 8601 字串
        if (resolved is DateTime dt)
        {
            return new DateTimeOffset(dt).ToString("o");
        }

        if (resolved is DateTimeOffset dateTimeOffset)
        {
            return dateTimeOffset.ToString("o");
        }

        return resolved?.ToString() ?? arg;
    }

    #region Constraint Evaluators

    private bool EvaluateEqual(object? actual, object? expected)
    {
        if (actual == null && expected == null) return true;
        if (actual == null || expected == null) return false;

        // 嘗試數值比較
        if (IsNumber(actual) && IsNumber(expected))
        {
            return CompareNumbers(actual, expected) == 0;
        }

        // 字串比較
        return actual.ToString() == expected?.ToString();
    }

    private bool IsNumber(object? value)
    {
        return value is int || value is long || value is float || value is double || value is decimal;
    }

    private int CompareNumbers(object? actual, object? expected)
    {
        if (!IsNumber(actual)) throw new Exception($"Expected number, got {actual?.GetType().Name}");

        double actualNum = Convert.ToDouble(actual);
        double expectedNum = Convert.ToDouble(expected);

        return actualNum.CompareTo(expectedNum);
    }

    /// <summary>
    /// 比較數值（支援 DateTime/DateTimeOffset/DateOnly 自動轉換為 timestamp）
    /// </summary>
    private int CompareNumbersWithTimeConversion(object? actual, object? expected)
    {
        // 自動轉換 DateTime/DateTimeOffset/DateOnly 為 timestamp
        var actualConverted = ConvertToTimestampIfDateTime(actual);
        var expectedConverted = ConvertToTimestampIfDateTime(expected);

        // 如果任一值不是數字，拋出異常
        if (!IsNumber(actualConverted))
            throw new ArgumentException($"Expected number, got {actual?.GetType().Name}");

        double actualNum = Convert.ToDouble(actualConverted);
        double expectedNum = Convert.ToDouble(expectedConverted);

        return actualNum.CompareTo(expectedNum);
    }

    /// <summary>
    /// 如果是日期時間類型，轉換為 timestamp（毫秒）
    /// </summary>
    private object? ConvertToTimestampIfDateTime(object? value)
    {
        if (value == null) return value;

        if (value is DateTimeOffset dto)
            return dto.ToUnixTimeMilliseconds();

        if (value is DateTime dt)
            return new DateTimeOffset(dt).ToUnixTimeMilliseconds();

        if (value is DateOnly dateOnly)
        {
            var dateTime = dateOnly.ToDateTime(TimeOnly.MinValue, DateTimeKind.Local);
            return new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();
        }

        return value;
    }

    private bool EvaluateLength(object? actual, string[] args)
    {
        if (actual is not string str) throw new Exception("Expected string for length check");

        int minLength = int.Parse(args[0]);
        int maxLength = int.Parse(args[1]);

        return str.Length >= minLength && str.Length <= maxLength;
    }

    private bool HasItem(object? actual, object? item)
    {
        if (actual is IEnumerable enumerable)
        {
            foreach (var element in enumerable)
            {
                if (EvaluateEqual(element, item))
                    return true;
            }
        }
        return false;
    }

    private int GetCollectionSize(object? actual)
    {
        if (actual is ICollection collection)
            return collection.Count;

        if (actual is IEnumerable enumerable)
        {
            int count = 0;
            foreach (var _ in enumerable) count++;
            return count;
        }

        throw new Exception("Expected collection");
    }

    private bool HasField(object? actual, string fieldName)
    {
        if (actual is IDictionary<string, object> dict)
            return dict.ContainsKey(fieldName);

        return false;
    }

    private bool EvaluateBetween(object? actual, string[] args)
    {
        if (args.Length < 2)
        {
            throw new ArgumentException("&between constraint requires 2 arguments (min, max)");
        }

        // 解析並轉換參數
        var minArg = ResolveArgument(args[0]);
        var maxArg = ResolveArgument(args[1]);

        // 如果 min 或 max 是 DateTime，轉換為 timestamp
        var minConverted = ConvertToTimestampIfDateTime(minArg);
        var maxConverted = ConvertToTimestampIfDateTime(maxArg);
        var actualConverted = ConvertToTimestampIfDateTime(actual);

        try
        {
            double actualNum = Convert.ToDouble(actualConverted);
            double min = Convert.ToDouble(minConverted);
            double max = Convert.ToDouble(maxConverted);

            return actualNum >= min && actualNum <= max;
        }
        catch (InvalidCastException ex)
        {
            throw new ArgumentException($"Cannot convert values to numbers for &between comparison", ex);
        }
    }

    #region Time Constraint Evaluators

    private bool EvaluateBefore(object? actual, string expectedStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        var expectedTime = ParseTimeString(expectedStr);

        return actualTime < expectedTime;
    }

    private bool EvaluateAfter(object? actual, string expectedStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        var expectedTime = ParseTimeString(expectedStr);

        return actualTime > expectedTime;
    }

    private bool EvaluateSameDay(object? actual, string expectedStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        var expectedDate = DateOnly.Parse(expectedStr);
        var actualDate = DateOnly.FromDateTime(actualTime.DateTime);

        return actualDate == expectedDate;
    }

    private bool EvaluateWithinDays(object? actual, string daysStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        int days = int.Parse(daysStr);
        var now = DateTimeOffset.Now;

        // 比較日期（不考慮時間）
        var actualDate = DateOnly.FromDateTime(actualTime.DateTime);
        var nowDate = DateOnly.FromDateTime(now.DateTime);

        var diff = Math.Abs(actualDate.DayNumber - nowDate.DayNumber);
        return diff <= days;
    }

    private bool EvaluateSameTime(object? actual, string expectedStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        var expectedTime = ParseTimeString(expectedStr);

        // 忽略毫秒差異，只比較到秒
        var actualTruncated = new DateTimeOffset(
            actualTime.Year, actualTime.Month, actualTime.Day,
            actualTime.Hour, actualTime.Minute, actualTime.Second,
            actualTime.Offset);

        var expectedTruncated = new DateTimeOffset(
            expectedTime.Year, expectedTime.Month, expectedTime.Day,
            expectedTime.Hour, expectedTime.Minute, expectedTime.Second,
            expectedTime.Offset);

        // 比較 UTC 時間（處理時區差異）
        return actualTruncated.ToUniversalTime() == expectedTruncated.ToUniversalTime();
    }

    private bool EvaluateTimeRange(object? actual, string startTimeStr, string endTimeStr)
    {
        var actualTime = ConvertToDateTimeOffset(actual);
        var startTime = TimeOnly.Parse(startTimeStr);
        var endTime = TimeOnly.Parse(endTimeStr);
        var actualTimeOnly = TimeOnly.FromDateTime(actualTime.DateTime);

        return actualTimeOnly >= startTime && actualTimeOnly <= endTime;
    }

    /// <summary>
    /// 轉換各種類型到 DateTimeOffset
    /// </summary>
    private DateTimeOffset ConvertToDateTimeOffset(object? value)
    {
        if (value is DateTimeOffset dto)
            return dto;

        if (value is DateTime dt)
            return new DateTimeOffset(dt);

        if (value is DateOnly dateOnly)
            return new DateTimeOffset(dateOnly.ToDateTime(TimeOnly.MinValue));

        if (value is string str)
            return ParseTimeString(str);

        // 嘗試解析為 timestamp (milliseconds)
        if (IsNumber(value))
        {
            long timestamp = Convert.ToInt64(value);
            // 使用本地時區來保持一致性
            return DateTimeOffset.FromUnixTimeMilliseconds(timestamp).ToLocalTime();
        }

        throw new ArgumentException($"Cannot convert {value?.GetType().Name} to DateTimeOffset");
    }

    #endregion

    #endregion

    #endregion

    #region ResolveAndValidate: Combined Resolution and Validation

    /// <summary>
    /// 解析並驗證值
    /// 支援：約束表達式、變數引用、類型自動轉換
    /// </summary>
    /// <param name="expectedValue">預期值（可能是變數引用、約束表達式等）</param>
    /// <param name="actualValue">實際值</param>
    /// <param name="fieldName">欄位名稱（用於錯誤訊息）</param>
    /// <param name="entityName">實體名稱（用於錯誤訊息）</param>
    /// <returns>如果驗證通過返回 null，否則拋出例外</returns>
    public object? ResolveAndValidate(string expectedValue, object? actualValue, string fieldName, string entityName)
    {
        // 1. 處理約束表達式（&constraint）
        if (expectedValue.StartsWith("&"))
        {
            EvaluateConstraints(expectedValue, actualValue);
            return null;
        }

        // 2. 處理特殊變數 $notnull
        if (expectedValue == "$notnull")
        {
            if (actualValue == null)
            {
                throw new Exception($"Field '{fieldName}' in '{entityName}' should not be null");
            }
            return null;
        }

        // 3. 處理變數引用（$variableName）
        if (expectedValue.StartsWith("$"))
        {
            var resolvedExpected = ResolveVariable(expectedValue);

            // 比較值（支援類型自動轉換）
            if (!AreValuesEqual(resolvedExpected, actualValue))
            {
                throw new Exception($"Field '{fieldName}' in '{entityName}' mismatch: expected {resolvedExpected}, but was {actualValue}");
            }
            return null;
        }

        // 4. 直接比較
        if (!AreValuesEqual(expectedValue, actualValue))
        {
            throw new Exception($"Field '{fieldName}' in '{entityName}' mismatch: expected {expectedValue}, but was {actualValue}");
        }

        return null;
    }

    /// <summary>
    /// 比較兩個值是否相等（支援類型自動轉換）
    /// </summary>
    private bool AreValuesEqual(object? expected, object? actual)
    {
        if (expected == null && actual == null) return true;
        if (expected == null || actual == null) return false;

        // 數值類型比較（支援 int, long, double 等）
        if (IsNumber(expected) && IsNumber(actual))
        {
            return CompareNumbers(expected, actual) == 0;
        }

        // DateTime/DateTimeOffset vs timestamp (long) 比較
        if (IsTimestamp(expected) && IsDateTime(actual))
        {
            var expectedTime = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(expected)).ToLocalTime();
            var actualTime = ConvertToDateTimeOffset(actual);

            // 忽略毫秒差異
            return TruncateToSeconds(expectedTime) == TruncateToSeconds(actualTime);
        }

        if (IsDateTime(expected) && IsTimestamp(actual))
        {
            var expectedTime = ConvertToDateTimeOffset(expected);
            var actualTime = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(actual)).ToLocalTime();

            // 忽略毫秒差異
            return TruncateToSeconds(expectedTime) == TruncateToSeconds(actualTime);
        }

        // DateOnly vs timestamp 比較
        if (IsTimestamp(expected) && actual is DateOnly actualDateOnly)
        {
            var expectedTimeStamp = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(expected)).ToLocalTime();
            var expectedDateOnly = DateOnly.FromDateTime(expectedTimeStamp.DateTime);
            return expectedDateOnly == actualDateOnly;
        }

        if (expected is DateOnly expectedDateOnly2 && IsTimestamp(actual))
        {
            var actualTimeStamp = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(actual)).ToLocalTime();
            var actualDateOnly2 = DateOnly.FromDateTime(actualTimeStamp.DateTime);
            return expectedDateOnly2 == actualDateOnly2;
        }

        // DateTime vs DateTimeOffset 比較
        if (IsDateTime(expected) && IsDateTime(actual))
        {
            var expectedTime = ConvertToDateTimeOffset(expected);
            var actualTime = ConvertToDateTimeOffset(actual);

            // 忽略毫秒差異
            return TruncateToSeconds(expectedTime) == TruncateToSeconds(actualTime);
        }

        // 字串比較
        return expected.ToString() == actual.ToString();
    }

    /// <summary>
    /// 檢查是否為 timestamp（長整數）
    /// </summary>
    private bool IsTimestamp(object? value)
    {
        if (value is long l && l > 1000000000000L) // 看起來像是 milliseconds timestamp
            return true;

        return false;
    }

    /// <summary>
    /// 檢查是否為日期時間類型
    /// </summary>
    private bool IsDateTime(object? value)
    {
        return value is DateTime || value is DateTimeOffset;
    }

    /// <summary>
    /// 截斷到秒（忽略毫秒）
    /// </summary>
    private DateTimeOffset TruncateToSeconds(DateTimeOffset dt)
    {
        return new DateTimeOffset(
            dt.Year, dt.Month, dt.Day,
            dt.Hour, dt.Minute, dt.Second,
            dt.Offset);
    }

    #endregion

    /// <summary>
    /// 約束資料結構
    /// </summary>
    private class Constraint
    {
        public string Name { get; set; } = "";
        public string[] Arguments { get; set; } = Array.Empty<string>();
        public string RawParams { get; set; } = "";

        public string GetParams()
        {
            return RawParams;
        }
    }
}
