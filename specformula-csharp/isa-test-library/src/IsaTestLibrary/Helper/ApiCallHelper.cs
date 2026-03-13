using System.Net.Http;
using System.Text;
using System.Text.Json;
using Reqnroll;

namespace Tw.Sdd.Isa.TestLib.Helper;

/// <summary>
/// API 呼叫輔助類別
/// 對應 Java 的 tw.sdd.isa.testlib.helper.ApiCallHelper
/// </summary>
public class ApiCallHelper
{
    private readonly HttpClient _httpClient;
    private readonly Context.ScenarioContext _scenarioContext;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly ISAFeatureArgumentResolver _resolver;

    private static readonly HashSet<string> SupportedTimeFormats = new()
    {
        "ISO", "TIMESTAMP", "EPOCH", "DATE_ONLY", "TIME_ONLY"
    };

    public ApiCallHelper(
        HttpClient httpClient,
        Context.ScenarioContext scenarioContext,
        JsonSerializerOptions jsonOptions,
        ISAFeatureArgumentResolver resolver)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _scenarioContext = scenarioContext ?? throw new ArgumentNullException(nameof(scenarioContext));
        _jsonOptions = jsonOptions ?? throw new ArgumentNullException(nameof(jsonOptions));
        _resolver = resolver ?? throw new ArgumentNullException(nameof(resolver));
    }

    /// <summary>
    /// 使用 Actor（帶 Token）呼叫 API
    /// </summary>
    public async Task InvokeWithActorAsync(
        DataTable dataTable,
        string urlTemplate,
        HttpMethod method,
        HashSet<string> pathParamNames,
        HashSet<string> queryParamNames,
        HashSet<string> headerParamNames,
        Func<string> tokenProvider,
        string? timeFormat = null)
    {
        await InvokeInternalAsync(dataTable, urlTemplate, method, pathParamNames, queryParamNames, headerParamNames, tokenProvider, timeFormat);
    }

    /// <summary>
    /// 不使用 Actor 呼叫 API
    /// </summary>
    public async Task InvokeWithoutActorAsync(
        DataTable dataTable,
        string urlTemplate,
        HttpMethod method,
        HashSet<string> pathParamNames,
        HashSet<string> queryParamNames,
        HashSet<string> headerParamNames,
        string? timeFormat = null)
    {
        await InvokeInternalAsync(dataTable, urlTemplate, method, pathParamNames, queryParamNames, headerParamNames, null, timeFormat);
    }

    private async Task InvokeInternalAsync(
        DataTable dataTable,
        string urlTemplate,
        HttpMethod method,
        HashSet<string> pathParamNames,
        HashSet<string> queryParamNames,
        HashSet<string> headerParamNames,
        Func<string>? tokenProvider,
        string? timeFormat)
    {
        ValidateTimeFormat(timeFormat);

        var headers = dataTable.Header.ToList();
        var dataRow = dataTable.Rows.FirstOrDefault()?.Values.ToList() ?? new List<string>();

        // Parse context keys (>contextKey) for variable extraction
        var contextKeyMap = _resolver.ParseContextKeys(headers);

        // Build parameters
        var parsedParams = ParseParameters(headers, dataRow, pathParamNames, queryParamNames, headerParamNames, timeFormat);

        // Build URL with path and query parameters
        var url = BuildUrl(urlTemplate, parsedParams.PathParams, parsedParams.QueryParams);

        // Create request
        var request = new HttpRequestMessage(method, url);

        // Add headers
        foreach (var header in parsedParams.HeaderParams)
        {
            request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        // Add Authorization header if token provider is present
        if (tokenProvider != null)
        {
            var token = tokenProvider();
            var resolvedToken = _resolver.ResolveVariable(token)?.ToString() ?? token;
            request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {resolvedToken}");
        }

        // Add body if there are body parameters
        if (parsedParams.BodyParams.Count > 0)
        {
            var bodyJson = JsonSerializer.Serialize(parsedParams.BodyParams, _jsonOptions);
            request.Content = new StringContent(bodyJson, Encoding.UTF8, "application/json");
        }

        // Send request
        var response = await _httpClient.SendAsync(request);
        _scenarioContext.LastResponse = response;

        // Extract variables from response
        if (contextKeyMap.Count > 0)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var responseObject = JsonSerializer.Deserialize<Dictionary<string, object?>>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (responseObject != null)
            {
                // Convert JsonElement values to proper types
                var convertedResponse = ConvertJsonElements(responseObject);
                _resolver.ExtractAndStoreVariables(dataRow, contextKeyMap, convertedResponse);
            }
        }
    }

    private void ValidateTimeFormat(string? timeFormat)
    {
        if (timeFormat != null && !SupportedTimeFormats.Contains(timeFormat))
        {
            throw new ArgumentException($"不支援的時間格式: {timeFormat}。支援的格式: {string.Join(", ", SupportedTimeFormats)}");
        }
    }

    private ParsedParameters ParseParameters(
        List<string> headers,
        List<string> dataRow,
        HashSet<string> pathParamNames,
        HashSet<string> queryParamNames,
        HashSet<string> headerParamNames,
        string? timeFormat)
    {
        var pathParams = new Dictionary<string, string>();
        var queryParams = new Dictionary<string, string>();
        var headerParams = new Dictionary<string, string>();
        var bodyParams = new Dictionary<string, object?>();

        // Track explicit prefixes to exclude from body
        var explicitPathParams = new HashSet<string>();
        var explicitQueryParams = new HashSet<string>();
        var explicitHeaderParams = new HashSet<string>();

        for (int i = 0; i < headers.Count; i++)
        {
            var header = headers[i];
            if (string.IsNullOrEmpty(header)) continue;

            var value = i < dataRow.Count ? dataRow[i] : "";

            // Skip context keys (>contextKey)
            if (header.StartsWith(">")) continue;

            // Parse prefix
            var (prefix, paramName) = ParsePrefix(header);

            // Resolve variable and time expressions
            var resolved = _resolver.ResolveVariable(value);
            var formattedValue = FormatTimeValue(resolved, timeFormat);
            var stringValue = formattedValue?.ToString() ?? "";

            switch (prefix)
            {
                case "P":
                    pathParams[paramName] = stringValue;
                    explicitPathParams.Add(paramName);
                    break;
                case "Q":
                    queryParams[paramName] = stringValue;
                    explicitQueryParams.Add(paramName);
                    break;
                case "H":
                    headerParams[paramName] = stringValue;
                    explicitHeaderParams.Add(paramName);
                    break;
                default:
                    // No prefix - auto-fill to path/query/header if in param names, and always to body
                    if (pathParamNames.Contains(paramName) && !pathParams.ContainsKey(paramName))
                    {
                        pathParams[paramName] = stringValue;
                    }
                    if (queryParamNames.Contains(paramName) && !queryParams.ContainsKey(paramName))
                    {
                        queryParams[paramName] = stringValue;
                    }
                    if (headerParamNames.Contains(paramName) && !headerParams.ContainsKey(paramName))
                    {
                        headerParams[paramName] = stringValue;
                    }

                    // Add to body (with nested path support)
                    AddToBody(bodyParams, paramName, formattedValue);
                    break;
            }
        }

        return new ParsedParameters(pathParams, queryParams, headerParams, bodyParams);
    }

    private static (string? Prefix, string ParamName) ParsePrefix(string header)
    {
        if (header.StartsWith("P:"))
            return ("P", header.Substring(2));
        if (header.StartsWith("Q:"))
            return ("Q", header.Substring(2));
        if (header.StartsWith("H:"))
            return ("H", header.Substring(2));
        return (null, header);
    }

    private object? FormatTimeValue(object? value, string? timeFormat)
    {
        if (value == null) return null;

        // If it's a time type, format according to timeFormat
        if (value is DateTimeOffset dto)
        {
            return FormatDateTimeOffset(dto, timeFormat);
        }
        if (value is DateOnly dateOnly)
        {
            return FormatDateOnly(dateOnly, timeFormat);
        }
        if (value is TimeOnly timeOnly)
        {
            return FormatTimeOnly(timeOnly, timeFormat);
        }

        return value;
    }

    private string FormatDateTimeOffset(DateTimeOffset dto, string? timeFormat)
    {
        return timeFormat switch
        {
            "TIMESTAMP" => dto.ToUnixTimeMilliseconds().ToString(),
            "EPOCH" => dto.ToUnixTimeSeconds().ToString(),
            "DATE_ONLY" => dto.ToString("yyyy-MM-dd"),
            "TIME_ONLY" => dto.ToString("HH:mm:ss"),
            _ => dto.ToString("yyyy-MM-ddTHH:mm:sszzz") // ISO format
        };
    }

    private string FormatDateOnly(DateOnly dateOnly, string? timeFormat)
    {
        return timeFormat switch
        {
            "TIMESTAMP" => new DateTimeOffset(dateOnly.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).ToUnixTimeMilliseconds().ToString(),
            "EPOCH" => new DateTimeOffset(dateOnly.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).ToUnixTimeSeconds().ToString(),
            _ => dateOnly.ToString("yyyy-MM-dd")
        };
    }

    private string FormatTimeOnly(TimeOnly timeOnly, string? timeFormat)
    {
        return timeOnly.ToString("HH:mm:ss");
    }

    private void AddToBody(Dictionary<string, object?> body, string path, object? value)
    {
        // Handle nested paths like "a.b[0].c"
        var parts = ParsePath(path);
        SetNestedValue(body, parts, value);
    }

    private List<PathPart> ParsePath(string path)
    {
        var parts = new List<PathPart>();
        var segments = path.Split('.');

        foreach (var segment in segments)
        {
            // Check for array index like "b[0]"
            var bracketIndex = segment.IndexOf('[');
            if (bracketIndex >= 0)
            {
                var key = segment.Substring(0, bracketIndex);
                var indexStr = segment.Substring(bracketIndex + 1, segment.Length - bracketIndex - 2);
                var index = int.Parse(indexStr);
                parts.Add(new PathPart(key, index));
            }
            else
            {
                parts.Add(new PathPart(segment, null));
            }
        }

        return parts;
    }

    private void SetNestedValue(Dictionary<string, object?> root, List<PathPart> parts, object? value)
    {
        object? current = root;

        for (int i = 0; i < parts.Count; i++)
        {
            var part = parts[i];
            var isLast = i == parts.Count - 1;

            if (current is Dictionary<string, object?> dict)
            {
                if (part.ArrayIndex.HasValue)
                {
                    // Need to get or create an array
                    if (!dict.TryGetValue(part.Key, out var arrayObj) || arrayObj is not List<object?>)
                    {
                        arrayObj = new List<object?>();
                        dict[part.Key] = arrayObj;
                    }

                    var array = (List<object?>)arrayObj!;

                    // Ensure array has enough elements
                    while (array.Count <= part.ArrayIndex.Value)
                    {
                        array.Add(null);
                    }

                    if (isLast)
                    {
                        // If the last part is an object key within the array element
                        array[part.ArrayIndex.Value] = value;
                    }
                    else
                    {
                        // Create nested object if needed
                        if (array[part.ArrayIndex.Value] is not Dictionary<string, object?>)
                        {
                            array[part.ArrayIndex.Value] = new Dictionary<string, object?>();
                        }
                        current = array[part.ArrayIndex.Value];
                    }
                }
                else
                {
                    if (isLast)
                    {
                        dict[part.Key] = TryParseJsonValue(value);
                    }
                    else
                    {
                        if (!dict.TryGetValue(part.Key, out var nextObj) || nextObj is not Dictionary<string, object?>)
                        {
                            nextObj = new Dictionary<string, object?>();
                            dict[part.Key] = nextObj;
                        }
                        current = nextObj;
                    }
                }
            }
        }
    }

    private object? TryParseJsonValue(object? value)
    {
        if (value is not string strValue) return value;

        // Try to parse as JSON array or object
        var trimmed = strValue.Trim();
        if (trimmed.StartsWith("[") || trimmed.StartsWith("{"))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<object>(trimmed);
                if (parsed is JsonElement element)
                {
                    return ConvertJsonElement(element);
                }
                return parsed;
            }
            catch
            {
                // If parsing fails, return as plain string
                return strValue;
            }
        }

        return strValue;
    }

    private string BuildUrl(string urlTemplate, Dictionary<string, string> pathParams, Dictionary<string, string> queryParams)
    {
        var url = urlTemplate;

        // Replace path parameters
        foreach (var param in pathParams)
        {
            url = url.Replace($"{{{param.Key}}}", Uri.EscapeDataString(param.Value));
        }

        // Add query parameters
        if (queryParams.Count > 0)
        {
            var queryString = string.Join("&", queryParams.Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));
            url = url.Contains("?") ? $"{url}&{queryString}" : $"{url}?{queryString}";
        }

        return url;
    }

    private Dictionary<string, object?> ConvertJsonElements(Dictionary<string, object?> dict)
    {
        var result = new Dictionary<string, object?>();
        foreach (var kvp in dict)
        {
            result[kvp.Key] = kvp.Value is JsonElement element ? ConvertJsonElement(element) : kvp.Value;
        }
        return result;
    }

    private object? ConvertJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Object => element.EnumerateObject()
                .ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
            JsonValueKind.Array => element.EnumerateArray()
                .Select(e => ConvertJsonElement(e))
                .ToList(),
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number when element.TryGetInt32(out var intVal) => intVal,
            JsonValueKind.Number when element.TryGetInt64(out var longVal) => longVal,
            JsonValueKind.Number => element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => element.ToString()
        };
    }

    private record ParsedParameters(
        Dictionary<string, string> PathParams,
        Dictionary<string, string> QueryParams,
        Dictionary<string, string> HeaderParams,
        Dictionary<string, object?> BodyParams);

    private record PathPart(string Key, int? ArrayIndex);
}
