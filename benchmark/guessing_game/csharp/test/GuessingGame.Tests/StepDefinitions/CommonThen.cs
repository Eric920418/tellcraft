using Reqnroll;
using System.Text.Json;

namespace GuessingGame.Tests.StepDefinitions;

[Binding]
public class CommonThen
{
    private readonly ScenarioContext _scenarioContext;

    public CommonThen(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext;
    }

    /// <summary>
    /// Verify that the operation failed (HTTP 4xx status code)
    /// </summary>
    [Then("操作失敗")]
    public void ThenTheOperationFails()
    {
        var response = _scenarioContext.LastResponse;
        Assert.NotNull(response);

        var statusCode = (int)response.StatusCode;
        Assert.True(statusCode >= 400 && statusCode < 500,
            $"Expected HTTP status code to be 4xx (client error) but got {statusCode}");
    }

    /// <summary>
    /// Verify that the operation succeeded (HTTP 2xx status code)
    /// </summary>
    [Then("操作成功")]
    public void ThenTheOperationSucceeds()
    {
        var response = _scenarioContext.LastResponse;
        Assert.NotNull(response);

        var statusCode = (int)response.StatusCode;
        Assert.True(statusCode >= 200 && statusCode < 300,
            $"Expected HTTP status code to be 2xx (success) but got {statusCode}");
    }

    /// <summary>
    /// Verify the response content with a data table, including API summary and status code verification
    /// </summary>
    /// <param name="apiSummary">The API operation summary (e.g., "玩家加入遊戲")</param>
    /// <param name="expectedStatusCode">The expected HTTP status code (e.g., 200)</param>
    /// <param name="table">The data table with expected values</param>
    [Then(@"(.+?)\((\d+)\)回應, with table:")]
    public async Task ThenResponseWithApiSummaryAndStatusCode(string apiSummary, int expectedStatusCode, Table table)
    {
        var response = _scenarioContext.LastResponse;
        Assert.NotNull(response);

        var responseBody = await response.Content.ReadAsStringAsync();
        var actualStatusCode = (int)response.StatusCode;

        // DEBUG logging (before assertion)
        Console.WriteLine("========== DEBUG: ThenResponseWithApiSummaryAndStatusCode ==========");
        Console.WriteLine($"API Summary: {apiSummary}");
        Console.WriteLine($"Expected Status Code: {expectedStatusCode}");
        Console.WriteLine($"Actual Status Code: {actualStatusCode}");
        Console.WriteLine($"Response Body: [{responseBody}]");
        Console.WriteLine($"Response Body Length: {(responseBody?.Length ?? 0)}");
        Console.WriteLine("====================================================================");

        // Verify HTTP status code matches expected
        if (expectedStatusCode != actualStatusCode)
        {
            throw new Exception($"Status code mismatch. Expected: {expectedStatusCode}, Actual: {actualStatusCode}, Response: {responseBody}");
        }

        // If response body is empty, use empty JSON object
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            responseBody = "{}";
        }

        using var jsonResponse = JsonDocument.Parse(responseBody);
        var rootElement = jsonResponse.RootElement;

        // Verify each row in the table
        foreach (var row in table.Rows)
        {
            foreach (var entry in row)
            {
                var header = entry.Key;
                var expectedValue = entry.Value;

                // Skip VAR-System context keys (starting with >)
                if (header.StartsWith(">"))
                {
                    continue;
                }

                // Skip execution keys (starting with <)
                if (header.StartsWith("<"))
                {
                    continue;
                }

                // Skip verification if expected value is empty
                if (string.IsNullOrWhiteSpace(expectedValue))
                {
                    continue;
                }

                // Get the actual value from JSON response
                var actualValue = GetJsonValue(rootElement, header);

                // Handle special values
                if (expectedValue == "$notnull")
                {
                    Assert.NotNull(actualValue);
                    continue;
                }

                if (actualValue == null)
                {
                    if (expectedValue == "null")
                    {
                        continue;
                    }

                    Assert.Fail(
                        $"JSON path '{header}' is null but expected: {expectedValue}");
                }

                var actualValueStr = actualValue.ToString() ?? "";

                // Boolean comparison
                if (expectedValue == "true" || expectedValue == "false")
                {
                    var expected = bool.Parse(expectedValue);
                    var actual = bool.Parse(actualValueStr);
                    Assert.Equal(expected, actual);
                }
                // Integer comparison
                else if (long.TryParse(expectedValue, out var expectedLong))
                {
                    var parsed = long.TryParse(actualValueStr, out var parsedLong)
                        ? parsedLong
                        : throw new InvalidOperationException(
                            $"JSON path '{header}' cannot be converted to number. Expected: {expectedLong}, Actual: {actualValueStr}");

                    Assert.Equal(expectedLong, parsed);
                }
                // Floating point comparison
                else if (double.TryParse(expectedValue, out var expectedDouble))
                {
                    var parsed = double.TryParse(actualValueStr, out var parsedDouble)
                        ? parsedDouble
                        : throw new InvalidOperationException(
                            $"JSON path '{header}' cannot be converted to number. Expected: {expectedDouble}, Actual: {actualValueStr}");

                    Assert.Equal(expectedDouble, parsed, 3);
                }
                // String comparison
                else
                {
                    Assert.Equal(expectedValue, actualValueStr);
                }
            }
        }
    }

    #region Helper Methods

    /// <summary>
    /// Get JSON value by property name (supports simple paths like "gameId" or nested paths like "game.id")
    /// </summary>
    private static object? GetJsonValue(JsonElement element, string propertyPath)
    {
        // Remove $. prefix if present
        var path = propertyPath.StartsWith("$.") ? propertyPath[2..] : propertyPath;

        // Split path by dots for nested properties
        var parts = path.Split('.');

        var current = element;
        foreach (var part in parts)
        {
            if (current.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (!current.TryGetProperty(part, out current))
            {
                return null;
            }
        }

        // Convert JsonElement to appropriate type
        return current.ValueKind switch
        {
            JsonValueKind.String => current.GetString(),
            JsonValueKind.Number => current.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => current.GetRawText()
        };
    }

    #endregion
}
