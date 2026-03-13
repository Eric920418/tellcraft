using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper.ApiCallHelperTest;

/// <summary>
/// 測試用 Echo Controller
/// 對應 Java 的 ApiCallHelperTest.EchoController
/// </summary>
[ApiController]
public class EchoController : ControllerBase
{
    private readonly RequestCaptureHolder _captureHolder;

    public EchoController(RequestCaptureHolder captureHolder)
    {
        _captureHolder = captureHolder;
    }

    [HttpGet("/test/{id}")]
    [HttpPost("/test/{id}")]
    public IActionResult HandleTest(
        [FromRoute] string id,
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(id, query, body);
    }

    [HttpGet("/api/games/{gameId}/players")]
    [HttpPost("/api/games/{gameId}/players")]
    public IActionResult HandleGamePlayers(
        [FromRoute] string gameId,
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(gameId, query, body);
    }

    [HttpGet("/api/games/{gameId}/players/{playerId}")]
    [HttpPost("/api/games/{gameId}/players/{playerId}")]
    public IActionResult HandleGamePlayerById(
        [FromRoute] string gameId,
        [FromRoute] string playerId,
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond($"{gameId}/{playerId}", query, body);
    }

    [HttpGet("/api/events")]
    [HttpPost("/api/events")]
    public IActionResult HandleEvents(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    [HttpGet("/api/events/{date}")]
    [HttpPost("/api/events/{date}")]
    public IActionResult HandleEventsByDate(
        [FromRoute] string date,
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(date, query, body);
    }

    [HttpGet("/api/items/{itemId}/details")]
    [HttpPost("/api/items/{itemId}/details")]
    public IActionResult HandleItemDetails(
        [FromRoute] string itemId,
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(itemId, query, body);
    }

    [HttpGet("/api/products")]
    [HttpPost("/api/products")]
    public IActionResult HandleProducts(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    [HttpGet("/api/items")]
    [HttpPost("/api/items")]
    public IActionResult HandleItems(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    [HttpGet("/api/services")]
    [HttpPost("/api/services")]
    public IActionResult HandleServices(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    [HttpGet("/api/matrices")]
    [HttpPost("/api/matrices")]
    public IActionResult HandleMatrices(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    [HttpGet("/api/data")]
    [HttpPost("/api/data")]
    public IActionResult HandleData(
        [FromQuery] Dictionary<string, string>? query,
        [FromBody] Dictionary<string, object?>? body = null)
    {
        return CaptureAndRespond(null, query, body);
    }

    private IActionResult CaptureAndRespond(
        string? id,
        Dictionary<string, string>? query,
        Dictionary<string, object?>? body)
    {
        var headers = Request.Headers
            .ToDictionary(h => h.Key, h => h.Value.ToString());

        // Convert JsonElement values to proper types
        var convertedBody = body != null ? ConvertJsonElements(body) : null;

        var capture = new RequestCapture(
            id,
            query ?? new Dictionary<string, string>(),
            headers,
            convertedBody
        );

        _captureHolder.SetCapture(capture);

        return Ok(new
        {
            id,
            query,
            headers,
            body = convertedBody,
            token = "abc"
        });
    }

    private Dictionary<string, object?>? ConvertJsonElements(Dictionary<string, object?> dict)
    {
        var result = new Dictionary<string, object?>();
        foreach (var kvp in dict)
        {
            result[kvp.Key] = ConvertValue(kvp.Value);
        }
        return result;
    }

    private object? ConvertValue(object? value)
    {
        if (value is JsonElement element)
        {
            return ConvertJsonElement(element);
        }
        return value;
    }

    private object? ConvertJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Object => element.EnumerateObject()
                .ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
            JsonValueKind.Array => element.EnumerateArray()
                .Select(e => ConvertJsonElement(e))
                .ToList<object?>(),
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
}
