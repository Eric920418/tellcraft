using System.Text.Json;
using Tw.Sdd.Isa.TestLib.Helper;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper.ApiCallHelperTest;

/// <summary>
///     ApiCallHelper 單元測試
///     對應 Java 的 tw.sdd.isa.testlib.helper.ApiCallHelperTest
///     測試策略：使用 WebApplicationFactory + TestServer 模擬 API
///     測試範圍：
///     1. 路徑/查詢/標頭/Body 參數組裝
///     2. Token header 設定
///     3. TIME-System (LocalTime) 序列化
///     4. VAR-System 回存至 ScenarioContext
/// </summary>
[Trait("Category", "ApiCallHelper")]
public class ApiCallHelperTest : IClassFixture<ApiTestFixture>, IDisposable
{
    private readonly ApiTestFixture _fixture;
    private readonly ApiCallHelper _helper;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly ScenarioContext _scenarioContext;
    private readonly RequestCaptureHolder _captureHolder;

    public ApiCallHelperTest(ApiTestFixture fixture)
    {
        _fixture = fixture;
        _captureHolder = fixture.CaptureHolder;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };
        _scenarioContext = new ScenarioContext();
        var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, _jsonOptions, resolver);

        _captureHolder.Clear();
    }

    public void Dispose()
    {
        _captureHolder.Clear();
        GC.SuppressFinalize(this);
    }

    private static string? FindHeader(Dictionary<string, string> headers, string name)
    {
        foreach (var entry in headers)
        {
            if (entry.Key.Equals(name, StringComparison.OrdinalIgnoreCase))
            {
                return entry.Value;
            }
        }

        return null;
    }

    #region Phase 2: 主測試類別 (7 個測試)

    [Fact(DisplayName = "應該正確組裝 request 並抽取回應變數")]
    public async Task ShouldBuildRequestAndExtractVariables()
    {
        // Arrange
        var dataTable = TestDataTableFactory.FromRows(
        [
            ["P:id", "Q:q", "q2", "H:X-Trace", "H:X-Mode", "punchTime", "a.b[0].c", ">extracted"],
            ["123", "search", "second", "trace", "fast", "@localtime(\"09:00:00\")", "1", "<token"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/test/{id}",
            HttpMethod.Post,
            ["id"],
            ["q2"],
            ["X-Mode"],
            () => "my-token"
        );

        // Assert
        var capture = _captureHolder.GetCapture();
        Assert.NotNull(capture);
        Assert.Equal("123", capture.Id);
        Assert.Equal("search", capture.Query["q"]);
        Assert.Equal("second", capture.Query["q2"]);
        Assert.Equal("trace", FindHeader(capture.Headers, "x-trace"));
        Assert.Equal("fast", FindHeader(capture.Headers, "x-mode"));
        Assert.Equal("Bearer my-token", FindHeader(capture.Headers, "authorization"));
        Assert.Equal("09:00:00", capture.Body?["punchTime"]);

        var a = (Dictionary<string, object?>)capture.Body!["a"]!;
        var b = (List<object?>)a["b"]!;
        var b0 = (Dictionary<string, object?>)b[0]!;
        Assert.Equal("1", b0["c"]);

        Assert.Equal("abc", _scenarioContext.Get("extracted"));
    }

    [Fact(DisplayName = "只有路徑/查詢/標頭欄位時不應送出 request body")]
    public async Task ShouldNotSendBodyWhenOnlyPathQueryHeader()
    {
        // Arrange
        var dataTable = TestDataTableFactory.FromRows(
        [
            ["P:id", "Q:q", "H:X-Trace"],
            ["777", "hello", "trace-777"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/test/{id}",
            HttpMethod.Post,
            ["id"],
            ["q"],
            [],
            () => "token-777"
        );

        // Assert
        Assert.NotNull(_scenarioContext.LastResponse);
        var capture = _captureHolder.GetCapture();
        Assert.NotNull(capture);
        Assert.Equal("777", capture.Id);
        Assert.Equal("hello", capture.Query["q"]);
        Assert.Equal("trace-777", FindHeader(capture.Headers, "x-trace"));
        Assert.Equal("Bearer token-777", FindHeader(capture.Headers, "authorization"));
        Assert.Null(capture.Body);
    }

    [Fact(DisplayName = "invokeWithoutActor 不應加入 Authorization header，且可使用參數集合")]
    public async Task ShouldInvokeWithoutActorAndUseParamSets()
    {
        // Arrange
        var dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "agentId", "XMode", "note"],
            ["9", "A1", "fast", "hello"],
        ]);

        // Act
        await _helper.InvokeWithoutActorAsync(
            dataTable,
            "/test/{id}",
            HttpMethod.Post,
            ["id"],
            ["agentId"],
            ["XMode"]
        );

        // Assert
        Assert.NotNull(_scenarioContext.LastResponse);
        var capture = _captureHolder.GetCapture();
        Assert.NotNull(capture);
        Assert.Equal("9", capture.Id);
        Assert.Equal("A1", capture.Query["agentId"]);
        Assert.Equal("fast", FindHeader(capture.Headers, "xmode"));
        Assert.Null(FindHeader(capture.Headers, "authorization"));
        Assert.NotNull(capture.Body);
    }

    [Fact(DisplayName = "明確指定前綴應覆寫同名參數的自動填寫")]
    public async Task ShouldOverrideAutoFillWhenPrefixSpecified()
    {
        // Arrange
        var dataTable = TestDataTableFactory.FromRows(
        [
            ["P:gameId", "gameId", "Q:notify", "notify", "name"],
            ["G999", "G001", "false", "true", "Bob"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/api/games/{gameId}/players",
            HttpMethod.Post,
            ["gameId"],
            ["notify"],
            [],
            () => "token-123"
        );

        // Assert
        var capture = _captureHolder.GetCapture();

        // 驗證 path 使用明確指定的值
        Assert.Equal("G999", capture!.Id);

        // 驗證 query 使用明確指定的值
        Assert.Equal("false", capture.Query["notify"]);

        // 驗證 body 使用無前綴的值
        Assert.Equal("G001", capture.Body?["gameId"]);
        Assert.Equal("true", capture.Body?["notify"]);
        Assert.Equal("Bob", capture.Body?["name"]);
    }

    [Fact(DisplayName = "同名參數應自動填入 path/query 和 body")]
    public async Task ShouldAutoFillSameNamedParameters()
    {
        // Arrange
        var dataTable = TestDataTableFactory.FromRows(
        [
            ["gameId", "notify", "name", "email"],
            ["G001", "true", "Alice", "alice@test.com"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/api/games/{gameId}/players",
            HttpMethod.Post,
            ["gameId"],
            ["notify"],
            [],
            () => "token-456"
        );

        // Assert
        var capture = _captureHolder.GetCapture();

        // 驗證自動填入 path
        Assert.Contains("G001", capture!.Id);

        // 驗證自動填入 query
        Assert.Equal("true", capture.Query["notify"]);

        // 驗證也存在於 body
        Assert.Equal("G001", capture.Body?["gameId"]);
        Assert.Equal("true", capture.Body?["notify"]);
        Assert.Equal("Alice", capture.Body?["name"]);
        Assert.Equal("alice@test.com", capture.Body?["email"]);
    }

    [Fact(DisplayName = "VAR-System 整合：變數解析後應自動填入同名參數")]
    public async Task ShouldAutoFillWithVarSystemVariables()
    {
        // Arrange: 前置儲存變數到 ScenarioContext
        _scenarioContext.Put("gameId", "G001");
        _scenarioContext.Put("playerId", "P123");
        _scenarioContext.Put("adminToken", "admin-token-abc");

        var dataTable = TestDataTableFactory.FromRows(
        [
            ["gameId", "playerId", "notify", "name", "email"],
            ["$gameId", "$playerId", "true", "NewName", "newemail@test.com"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/api/games/{gameId}/players/{playerId}",
            HttpMethod.Post,
            ["gameId", "playerId"],
            ["notify"],
            [],
            () => "$adminToken"
        );

        // Assert
        var capture = _captureHolder.GetCapture();

        // 驗證 path 參數使用解析後的變數值
        Assert.Contains("G001", capture!.Id);
        Assert.Contains("P123", capture.Id);

        // 驗證 query 參數自動填入
        Assert.Equal("true", capture.Query["notify"]);

        // 驗證 Authorization header 使用解析後的變數
        Assert.Equal("Bearer admin-token-abc", FindHeader(capture.Headers, "authorization"));

        // 驗證 body 包含所有解析後的參數
        Assert.Equal("G001", capture.Body?["gameId"]);
        Assert.Equal("P123", capture.Body?["playerId"]);
        Assert.Equal("true", capture.Body?["notify"]);
        Assert.Equal("NewName", capture.Body?["name"]);
        Assert.Equal("newemail@test.com", capture.Body?["email"]);
    }

    [Fact(DisplayName = "混合場景：VAR-System + 明確前綴 + 自動填入")]
    public async Task ShouldHandleComplexMixedScenario()
    {
        // Arrange: 前置儲存部分變數
        _scenarioContext.Put("storedGameId", "G100");

        var dataTable = TestDataTableFactory.FromRows(
        [
            ["P:gameId", "gameId", "playerId", "Q:notify", "notify", "name", ">resultId"],
            ["$storedGameId", "G200", "P456", "false", "true", "MixedPlayer", "<id"],
        ]);

        // Act
        await _helper.InvokeWithActorAsync(
            dataTable,
            "/api/games/{gameId}/players/{playerId}",
            HttpMethod.Post,
            ["gameId", "playerId"],
            ["notify"],
            [],
            () => "complex-token"
        );

        // Assert
        var capture = _captureHolder.GetCapture();

        // 驗證 path：P:gameId 使用解析後的變數，playerId 自動填入
        Assert.Contains("G100", capture!.Id); // Path should use resolved P:gameId
        Assert.Contains("P456", capture.Id); // Path should auto-fill playerId

        // 驗證 query：Q:notify 使用明確指定的值
        Assert.Equal("false", capture.Query["notify"]);

        // 驗證 body：使用無前綴的值
        Assert.Equal("G200", capture.Body?["gameId"]);
        Assert.Equal("P456", capture.Body?["playerId"]);
        Assert.Equal("true", capture.Body?["notify"]);
        Assert.Equal("MixedPlayer", capture.Body?["name"]);

        // 驗證變數提取
        Assert.NotNull(_scenarioContext.Get("resultId"));
    }

    #endregion

    #region Phase 3.1: ExplicitPrefixExclusionFromBodyTest (4 個測試)

    [Trait("Category", "ExplicitPrefixExclusionFromBody")]
    [Trait("DisplayName", "部分明確指定時，明確指定的不放入 body")]
    public class ExplicitPrefixExclusionFromBodyTest : IClassFixture<ApiTestFixture>, IDisposable
    {
        private readonly ApiTestFixture _fixture;
        private readonly ApiCallHelper _helper;
        private readonly ScenarioContext _scenarioContext;
        private readonly RequestCaptureHolder _captureHolder;

        public ExplicitPrefixExclusionFromBodyTest(ApiTestFixture fixture)
        {
            _fixture = fixture;
            _captureHolder = fixture.CaptureHolder;
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, jsonOptions, resolver);
            _captureHolder.Clear();
        }

        public void Dispose()
        {
            _captureHolder.Clear();
            GC.SuppressFinalize(this);
        }

        [Fact(DisplayName = "明確指定 P: 前綴的參數不放入 body")]
        public async Task ShouldExcludeExplicitPathPrefixFromBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["gameId", "P:playerId", "notify", "name"],
                ["G001", "P999", "true", "Charlie"],
            ]);

            // Act
            await _helper.InvokeWithActorAsync(
                dataTable,
                "/api/games/{gameId}/players/{playerId}",
                HttpMethod.Post,
                ["gameId", "playerId"],
                ["notify"],
                [],
                () => "token-789"
            );

            // Assert
            var capture = _captureHolder.GetCapture();

            // 驗證 path
            Assert.Contains("G001", capture!.Id);
            Assert.Contains("P999", capture.Id);

            // 驗證 body：gameId 和 notify 存在，playerId 不存在
            Assert.Equal("G001", capture.Body?["gameId"]);
            Assert.Equal("true", capture.Body?["notify"]);
            Assert.False(capture.Body!.ContainsKey("playerId"));
            Assert.Equal("Charlie", capture.Body?["name"]);
        }

        [Fact(DisplayName = "明確指定 Q: 前綴的參數不放入 body")]
        public async Task ShouldExcludeExplicitQueryPrefixFromBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["gameId", "playerId", "Q:notify", "name"],
                ["G002", "P888", "false", "David"],
            ]);

            // Act
            await _helper.InvokeWithActorAsync(
                dataTable,
                "/api/games/{gameId}/players/{playerId}",
                HttpMethod.Post,
                ["gameId", "playerId"],
                ["notify"],
                [],
                () => "token-790"
            );

            // Assert
            var capture = _captureHolder.GetCapture();

            // 驗證 query
            Assert.Equal("false", capture!.Query["notify"]);

            // 驗證 body：gameId 和 playerId 存在，notify 不存在
            Assert.Equal("G002", capture.Body?["gameId"]);
            Assert.Equal("P888", capture.Body?["playerId"]);
            Assert.False(capture.Body!.ContainsKey("notify"));
            Assert.Equal("David", capture.Body?["name"]);
        }

        [Fact(DisplayName = "明確指定 H: 前綴的參數不放入 body")]
        public async Task ShouldExcludeExplicitHeaderPrefixFromBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["gameId", "playerId", "H:X-Trace", "name"],
                ["G003", "P777", "trace-123", "Emma"],
            ]);

            // Act
            await _helper.InvokeWithActorAsync(
                dataTable,
                "/api/games/{gameId}/players/{playerId}",
                HttpMethod.Post,
                ["gameId", "playerId"],
                [],
                ["X-Trace"],
                () => "token-791"
            );

            // Assert
            var capture = _captureHolder.GetCapture();

            // 驗證 header
            Assert.Equal("trace-123", FindHeader(capture!.Headers, "x-trace"));

            // 驗證 body：gameId 和 playerId 存在，X-Trace 不存在
            Assert.Equal("G003", capture.Body?["gameId"]);
            Assert.Equal("P777", capture.Body?["playerId"]);
            Assert.False(capture.Body!.ContainsKey("X-Trace"));
            Assert.False(capture.Body.ContainsKey("xTrace"));
            Assert.Equal("Emma", capture.Body?["name"]);
        }

        [Fact(DisplayName = "混合多種明確前綴，所有明確指定的都不放入 body")]
        public async Task ShouldExcludeAllExplicitPrefixesFromBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["P:gameId", "playerId", "Q:notify", "H:X-Mode", "name"],
                ["G004", "P666", "true", "fast", "Frank"],
            ]);

            // Act
            await _helper.InvokeWithActorAsync(
                dataTable,
                "/api/games/{gameId}/players/{playerId}",
                HttpMethod.Post,
                ["gameId", "playerId"],
                ["notify"],
                ["X-Mode"],
                () => "token-792"
            );

            // Assert
            var capture = _captureHolder.GetCapture();

            // 驗證 path
            Assert.Contains("G004", capture!.Id);

            // 驗證 query
            Assert.Equal("true", capture.Query["notify"]);

            // 驗證 header
            Assert.Equal("fast", FindHeader(capture.Headers, "x-mode"));

            // 驗證 body：只有 playerId 和 name 存在
            Assert.Equal("P666", capture.Body?["playerId"]);
            Assert.Equal("Frank", capture.Body?["name"]);
            Assert.False(capture.Body!.ContainsKey("gameId"));
            Assert.False(capture.Body.ContainsKey("notify"));
            Assert.False(capture.Body.ContainsKey("X-Mode"));
            Assert.False(capture.Body.ContainsKey("xMode"));
        }
    }

    #endregion

    #region Phase 3.2: JsonArrayAndObjectHandlingTest (10 個測試)

    [Trait("Category", "JsonArrayAndObjectHandling")]
    [Trait("DisplayName", "JSON Array 和 Object 處理測試")]
    public class JsonArrayAndObjectHandlingTest : IClassFixture<ApiTestFixture>, IDisposable
    {
        private readonly ApiTestFixture _fixture;
        private readonly ApiCallHelper _helper;
        private readonly ScenarioContext _scenarioContext;
        private readonly RequestCaptureHolder _captureHolder;

        public JsonArrayAndObjectHandlingTest(ApiTestFixture fixture)
        {
            _fixture = fixture;
            _captureHolder = fixture.CaptureHolder;
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, jsonOptions, resolver);
            _captureHolder.Clear();
        }

        public void Dispose()
        {
            _captureHolder.Clear();
            GC.SuppressFinalize(this);
        }

        [Fact(DisplayName = "應該正確處理 body 中的空 JSON array")]
        public async Task ShouldHandleEmptyJsonArrayInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["P:itemId", "details"],
                ["ITEM-001", "[]"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/items/{itemId}/details",
                HttpMethod.Post,
                ["itemId"],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // details 應該是一個空的 array，而不是字串 "[]"
            var details = capture.Body["details"];
            Assert.IsType<List<object?>>(details); // details 應該是 List 類型
            var detailsList = (List<object?>)details!;
            Assert.Empty(detailsList); // details 應該是空的 List
        }

        [Fact(DisplayName = "應該正確處理 body 中的 JSON array")]
        public async Task ShouldHandleJsonArrayInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "tags"],
                ["Product A", "[\"new\", \"featured\", \"sale\"]"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/products",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            Assert.Equal("Product A", capture.Body["name"]);

            // tags 應該是一個 array，而不是字串
            var tags = capture.Body["tags"];
            Assert.IsType<List<object?>>(tags); // tags 應該是 List 類型
            var tagsList = (List<object?>)tags!;
            Assert.Equal(3, tagsList.Count);
            Assert.Equal("new", tagsList[0]);
            Assert.Equal("featured", tagsList[1]);
            Assert.Equal("sale", tagsList[2]);
        }

        [Fact(DisplayName = "應該正確處理 body 中的空 JSON object")]
        public async Task ShouldHandleEmptyJsonObjectInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "metadata"],
                ["Item A", "{}"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/items",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            Assert.Equal("Item A", capture.Body["name"]);

            // metadata 應該是一個空的 object，而不是字串 "{}"
            var metadata = capture.Body["metadata"];
            Assert.IsType<Dictionary<string, object?>>(metadata); // metadata 應該是 Map 類型
            var metadataMap = (Dictionary<string, object?>)metadata!;
            Assert.Empty(metadataMap); // metadata 應該是空的 object
        }

        [Fact(DisplayName = "應該正確處理 body 中的 JSON object")]
        public async Task ShouldHandleJsonObjectInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "config"],
                ["Service A", "{\"timeout\": 30, \"retries\": 3, \"enabled\": true}"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/services",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            Assert.Equal("Service A", capture.Body["name"]);

            // config 應該是一個 object，而不是字串
            var config = capture.Body["config"];
            Assert.IsType<Dictionary<string, object?>>(config); // config 應該是 Map 類型
            var configMap = (Dictionary<string, object?>)config!;
            Assert.Equal(30, configMap["timeout"]);
            Assert.Equal(3, configMap["retries"]);
            Assert.Equal(true, configMap["enabled"]);
        }

        [Fact(DisplayName = "應該正確處理 body 中的巢狀 JSON array")]
        public async Task ShouldHandleNestedJsonArrayInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "matrix"],
                ["Matrix A", "[[1, 2], [3, 4], [5, 6]]"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/matrices",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            Assert.Equal("Matrix A", capture.Body["name"]);

            // matrix 應該是一個巢狀的 array
            var matrix = capture.Body["matrix"];
            Assert.IsType<List<object?>>(matrix); // matrix 應該是 List 類型
            var matrixList = (List<object?>)matrix!;
            Assert.Equal(3, matrixList.Count);

            Assert.IsType<List<object?>>(matrixList[0]);
            var row1 = (List<object?>)matrixList[0]!;
            Assert.Equal(2, row1.Count);
            Assert.Equal(1, row1[0]);
            Assert.Equal(2, row1[1]);
        }

        [Fact(DisplayName = "應該正確處理 body 中混合的 JSON 資料類型")]
        public async Task ShouldHandleMixedJsonTypesInBody()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "items", "settings", "count"],
                ["Mixed Data", "[1, 2, 3]", "{\"mode\": \"fast\"}", "5"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/data",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // name 應該是字串
            Assert.Equal("Mixed Data", capture.Body["name"]);

            // items 應該是 array
            Assert.IsType<List<object?>>(capture.Body["items"]);

            // settings 應該是 object
            Assert.IsType<Dictionary<string, object?>>(capture.Body["settings"]);

            // count 應該是字串（不做型別轉換）
            Assert.Equal("5", capture.Body["count"]);
        }

        [Fact(DisplayName = "格式錯誤的 JSON 應該被當作純文字處理")]
        public async Task ShouldTreatInvalidJsonAsText()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["name", "data"],
                ["Invalid", "[invalid json"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/items",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 格式錯誤的 JSON 應該被當作純文字
            Assert.Equal("[invalid json", capture.Body["data"]);
        }

        [Fact(DisplayName = "前導零的數字字串應保持原樣（不做型別轉換）")]
        public async Task ShouldPreserveLeadingZerosInStrings()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["accountNumber", "zipCode", "productCode"],
                ["000123", "00501", "0000456"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/data",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 前導零應該被保留（不轉換為數字）
            Assert.Equal("000123", capture.Body["accountNumber"]);
            Assert.Equal("00501", capture.Body["zipCode"]);
            Assert.Equal("0000456", capture.Body["productCode"]);
        }

        [Fact(DisplayName = "電話號碼應保持字串格式（不做型別轉換）")]
        public async Task ShouldPreservePhoneNumbersAsStrings()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["phoneNumber", "mobilePhone", "internationalPhone"],
                ["02-12345678", "0912345678", "+886912345678"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/data",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 電話號碼應保持字串格式
            Assert.Equal("02-12345678", capture.Body["phoneNumber"]);
            Assert.Equal("0912345678", capture.Body["mobilePhone"]);
            Assert.Equal("+886912345678", capture.Body["internationalPhone"]);
        }

        [Fact(DisplayName = "混合格式：數字、前導零、電話號碼應全部保持字串")]
        public async Task ShouldPreserveMixedNumericFormatsAsStrings()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["id", "phone", "amount", "code"],
                ["123", "0912345678", "99.99", "000456"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/data",
                HttpMethod.Post,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 所有值都應該保持字串格式（不做型別轉換）
            Assert.Equal("123", capture.Body["id"]);
            Assert.Equal("0912345678", capture.Body["phone"]);
            Assert.Equal("99.99", capture.Body["amount"]);
            Assert.Equal("000456", capture.Body["code"]);
        }
    }

    #endregion

    #region Phase 3.3: EmptyDataTableHandlingTest (2 個測試)

    [Trait("Category", "EmptyDataTableHandling")]
    [Trait("DisplayName", "空 DataTable 處理測試")]
    public class EmptyDataTableHandlingTest : IClassFixture<ApiTestFixture>, IDisposable
    {
        private readonly ApiTestFixture _fixture;
        private readonly ApiCallHelper _helper;
        private readonly ScenarioContext _scenarioContext;
        private readonly RequestCaptureHolder _captureHolder;

        public EmptyDataTableHandlingTest(ApiTestFixture fixture)
        {
            _fixture = fixture;
            _captureHolder = fixture.CaptureHolder;
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, jsonOptions, resolver);
            _captureHolder.Clear();
        }

        public void Dispose()
        {
            _captureHolder.Clear();
            GC.SuppressFinalize(this);
        }

        [Fact(DisplayName = "應該正確處理完全空白的 DataTable (只有 | |)")]
        public async Task ShouldHandleCompletelyEmptyDataTable()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                [""],
            ]);

            // Act
            await _helper.InvokeWithActorAsync(
                dataTable,
                "/api/items",
                HttpMethod.Get,
                [],
                [],
                [],
                () => "token-123"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture);

            // 驗證不應該有 body
            Assert.Null(capture.Body); // 完全空白的 DataTable 不應產生 body

            // 驗證應該有 Authorization header
            Assert.Equal("Bearer token-123", FindHeader(capture.Headers, "authorization"));
        }

        [Fact(DisplayName = "應該正確處理完全空白的 DataTable (不使用 actor)")]
        public async Task ShouldHandleCompletelyEmptyDataTableWithoutActor()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                [""],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/items",
                HttpMethod.Get,
                [],
                [],
                []
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture);

            // 驗證不應該有 body
            Assert.Null(capture.Body);

            // 驗證不應該有 Authorization header
            Assert.Null(FindHeader(capture.Headers, "authorization"));
        }
    }

    #endregion

    #region Phase 3.4: TimeFormatConversionTest (9 個測試)

    [Trait("Category", "TimeFormatConversion")]
    [Trait("DisplayName", "時間格式轉換測試")]
    public class TimeFormatConversionTest : IClassFixture<ApiTestFixture>, IDisposable
    {
        private readonly ApiTestFixture _fixture;
        private readonly ApiCallHelper _helper;
        private readonly ScenarioContext _scenarioContext;
        private readonly RequestCaptureHolder _captureHolder;

        public TimeFormatConversionTest(ApiTestFixture fixture)
        {
            _fixture = fixture;
            _captureHolder = fixture.CaptureHolder;
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, jsonOptions, resolver);
            _captureHolder.Clear();
        }

        public void Dispose()
        {
            _captureHolder.Clear();
            GC.SuppressFinalize(this);
        }

        [Fact(DisplayName = "預設應使用 ISO 格式 (null)")]
        public async Task ShouldUseISOFormatByDefault()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "meetingDate", "startTime"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@date(\"2025-12-16\")", "@localtime(\"09:00:00\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [] // 預設 ISO 格式
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // ZonedDateTime 應該輸出 ISO-8601 格式
            Assert.Equal("2025-12-25T14:30:00+08:00", capture.Body["eventTime"]);

            // LocalDate 應該輸出 ISO-8601 日期格式
            Assert.Equal("2025-12-16", capture.Body["meetingDate"]);

            // LocalTime 應該輸出 HH:mm:ss 格式
            Assert.Equal("09:00:00", capture.Body["startTime"]);
        }

        [Fact(DisplayName = "明確指定 ISO 格式")]
        public async Task ShouldConvertToISOFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "meetingDate", "startTime"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@date(\"2025-12-16\")", "@localtime(\"09:00:00\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "ISO"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);
            Assert.Equal("2025-12-25T14:30:00+08:00", capture.Body["eventTime"]);
            Assert.Equal("2025-12-16", capture.Body["meetingDate"]);
            Assert.Equal("09:00:00", capture.Body["startTime"]);
        }

        [Fact(DisplayName = "TIMESTAMP 格式應轉換為 Unix timestamp 毫秒")]
        public async Task ShouldConvertToTimestampFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "meetingDate"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@date(\"2025-12-16\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "TIMESTAMP"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 驗證是字串型別（數字格式）
            Assert.IsType<string>(capture.Body["eventTime"]);
            Assert.IsType<string>(capture.Body["meetingDate"]);

            // ZonedDateTime 轉 timestamp (毫秒) - 驗證字串內容是數字
            var eventTimeStr = (string)capture.Body["eventTime"]!;
            Assert.Matches(@"^\d+$", eventTimeStr); // eventTime 應該是數字字串
            var eventTimeMs = long.Parse(eventTimeStr);
            Assert.True(eventTimeMs > 0); // timestamp 應該是正數

            // LocalDate 轉 timestamp (毫秒，從當天 00:00:00 開始)
            var meetingDateStr = (string)capture.Body["meetingDate"]!;
            Assert.Matches(@"^\d+$", meetingDateStr); // meetingDate 應該是數字字串
            var meetingDateMs = long.Parse(meetingDateStr);
            Assert.True(meetingDateMs > 0); // timestamp 應該是正數
        }

        [Fact(DisplayName = "EPOCH 格式應轉換為 Unix timestamp 秒")]
        public async Task ShouldConvertToEpochFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "meetingDate"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@date(\"2025-12-16\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "EPOCH"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 驗證是字串型別（數字格式）
            Assert.IsType<string>(capture.Body["eventTime"]);
            Assert.IsType<string>(capture.Body["meetingDate"]);

            // 驗證是秒級時間戳（比毫秒小 1000 倍）
            var eventTimeStr = (string)capture.Body["eventTime"]!;
            Assert.Matches(@"^\d+$", eventTimeStr); // eventTime 應該是數字字串
            var eventTimeSec = long.Parse(eventTimeStr);
            Assert.True(eventTimeSec > 0);
            // 秒級時間戳應該遠小於毫秒級時間戳
            Assert.True(eventTimeSec < DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        }

        [Fact(DisplayName = "DATE_ONLY 格式應只輸出日期部分")]
        public async Task ShouldConvertToDateOnlyFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "meetingDate"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@date(\"2025-12-16\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "DATE_ONLY"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // ZonedDateTime 應該只輸出日期部分
            Assert.Equal("2025-12-25", capture.Body["eventTime"]);

            // LocalDate 應該輸出日期
            Assert.Equal("2025-12-16", capture.Body["meetingDate"]);
        }

        [Fact(DisplayName = "TIME_ONLY 格式應只輸出時間部分")]
        public async Task ShouldConvertToTimeOnlyFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "startTime"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "@localtime(\"09:00:00\")"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "TIME_ONLY"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // ZonedDateTime 應該只輸出時間部分
            Assert.Equal("14:30:00", capture.Body["eventTime"]);

            // LocalTime 應該輸出時間
            Assert.Equal("09:00:00", capture.Body["startTime"]);
        }

        [Fact(DisplayName = "不支援的格式應拋出 ArgumentException")]
        public async Task ShouldThrowExceptionForUnsupportedFormat()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime"],
                ["@time(\"2025-12-25T14:30:00+08:00\")"],
            ]);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(async () =>
                await _helper.InvokeWithoutActorAsync(
                    dataTable,
                    "/api/events",
                    HttpMethod.Post,
                    [],
                    [],
                    [],
                    "INVALID_FORMAT"
                )
            );

            Assert.Contains("不支援的時間格式", exception.Message);
            Assert.Contains("INVALID_FORMAT", exception.Message);
            Assert.Contains("ISO", exception.Message);
            Assert.Contains("TIMESTAMP", exception.Message);
            Assert.Contains("EPOCH", exception.Message);
        }

        [Fact(DisplayName = "非時間類型的值不應受時間格式影響")]
        public async Task ShouldNotAffectNonTimeValues()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["eventTime", "title", "count", "enabled"],
                ["@time(\"2025-12-25T14:30:00+08:00\")", "Meeting", "10", "true"],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events",
                HttpMethod.Post,
                [],
                [],
                [],
                "TIMESTAMP"
            );

            // Assert
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);

            // 時間欄位應該轉換為字串（數字格式）
            Assert.IsType<string>(capture.Body["eventTime"]);
            var eventTimeStr = (string)capture.Body["eventTime"]!;
            Assert.Matches(@"^\d+$", eventTimeStr); // eventTime 應該是數字字串

            // 非時間欄位應保持原樣
            Assert.Equal("Meeting", capture.Body["title"]);
            Assert.Equal("10", capture.Body["count"]);
            Assert.Equal("true", capture.Body["enabled"]);
        }

        [Fact(DisplayName = "時間格式應用於 Query 和 Path 參數")]
        public async Task ShouldApplyTimeFormatToQueryAndPathParams()
        {
            // Arrange
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["Q:from", "Q:to", "P:date"],
                [
                    "@time(\"2025-12-01T00:00:00+08:00\")",
                    "@time(\"2025-12-31T23:59:59+08:00\")",
                    "@date(\"2025-12-25\")",
                ],
            ]);

            // Act
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/api/events/{date}",
                HttpMethod.Post,
                ["date"],
                ["from", "to"],
                [],
                "TIMESTAMP"
            );

            // Assert
            var capture = _captureHolder.GetCapture();

            // Query 參數應該使用 TIMESTAMP 格式
            Assert.NotNull(capture!.Query["from"]);
            Assert.NotNull(capture.Query["to"]);
            Assert.Matches(@"^\d+$", capture.Query["from"]); // Query 參數應該是數字字串
            Assert.Matches(@"^\d+$", capture.Query["to"]); // Query 參數應該是數字字串
        }
    }

    #endregion

    #region Phase 3.5: VarSystemTimeSystemIntegrationTests (3 個測試)

    [Trait("Category", "VarSystemTimeSystemIntegration")]
    [Trait("DisplayName", "ADR-0004: VAR-System 不支援與 TIME-System 混用")]
    public class VarSystemTimeSystemIntegrationTests : IClassFixture<ApiTestFixture>, IDisposable
    {
        private readonly ApiTestFixture _fixture;
        private readonly ApiCallHelper _helper;
        private readonly ScenarioContext _scenarioContext;
        private readonly RequestCaptureHolder _captureHolder;

        public VarSystemTimeSystemIntegrationTests(ApiTestFixture fixture)
        {
            _fixture = fixture;
            _captureHolder = fixture.CaptureHolder;
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new ApiCallHelper(_fixture.Client, _scenarioContext, jsonOptions, resolver);
            _captureHolder.Clear();
        }

        public void Dispose()
        {
            _captureHolder.Clear();
            GC.SuppressFinalize(this);
        }


        // ADR-0004: 決議不支持在 VAR-System 的 >contextKey 中直接使用 TIME-System 表達式設定變數值
        // 在 API 呼叫場景中：
        // - @time() 應該用於 request body/query/header 的參數轉換
        // - >contextKey 配合 <executionKey 應該用於從 response 中提取值
        // - 不應該在同一個欄位中混用 >contextKey 和 @time()
        [Fact(DisplayName = "ADR-0004: 不支援在 >contextKey 中使用 @time() 設定變數")]
        public async Task ShouldNotSupportContextKeyWithTimeExpressionInApiCall()
        {
            // Arrange: 錯誤用法範例（根據 ADR-0004 不應該這樣寫）
            // 試圖在 header 使用 >punchTime，在 data row 使用 @time()
            // 注意：>punchTime 會被視為 VAR-System header（用於捕獲），不會被視為 body 欄位
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["P:id", "agentId", ">punchTime"],
                ["101", "A001", "@time(\"2025-11-04T08:00:00\")"],
            ]);

            // Act: 執行 API 呼叫
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/test/{id}",
                HttpMethod.Post,
                ["id"],
                [],
                []
            );

            // Assert: >punchTime 是 VAR-System header，@time() 不會進入 request body
            // 這展示了混用的問題：語意混亂
            var capture = _captureHolder.GetCapture();
            Assert.Equal("101", capture!.Id);
            Assert.NotNull(capture.Body);
            Assert.Equal("A001", capture.Body["agentId"]);

            // punchTime 不在 body 中（因為 >punchTime 是 VAR-System header）
            Assert.Null(capture.Body.GetValueOrDefault("punchTime")); // >punchTime 是 VAR-System header，不會被當作 body 欄位

            // 驗證：context 中也不應該有 punchTime（因為沒有對應的 <executionKey）
            Assert.Null(_scenarioContext.Get("punchTime")); // 根據 ADR-0004，>contextKey 應該與 <executionKey 配對使用
        }

        [Fact(DisplayName = "ADR-0004: 正確用法 - @time() 用於 request，<executionKey 用於 response")]
        public async Task ShouldUseTimeSystemInRequestAndExtractFromResponse()
        {
            // Arrange: 正確用法
            // - @time() 直接用於 request body 的參數
            // - >contextKey + <executionKey 用於從 response 提取值
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["P:id", "agentId", "punchTime", ">extractedToken"],
                ["102", "A002", "@time(\"2025-11-04T09:00:00\")", "<token"],
            ]);

            // Act: 執行 API 呼叫
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/test/{id}",
                HttpMethod.Post,
                ["id"],
                [],
                []
            );

            // Assert: @time() 被解析並作為 request body 發送
            var capture = _captureHolder.GetCapture();
            Assert.NotNull(capture!.Body);
            Assert.NotNull(capture.Body["punchTime"]); // @time() 應該被解析並放入 request body

            // <token 從 response 提取並存入 extractedToken
            Assert.Equal("abc", _scenarioContext.Get("extractedToken")); // 應該從 response 提取 token 並存入 context（正確用法）
        }

        [Fact(DisplayName = "ADR-0004: TIME-System 用於 API 參數轉換的完整範例")]
        public async Task ShouldUseTimeSystemForApiParametersOnly()
        {
            // Arrange: @time() 用於多種 API 參數（path/query/header/body）
            var dataTable = TestDataTableFactory.FromRows(
            [
                ["P:id", "Q:startTime", "H:X-Request-Time", "punchTime", ">result"],
                ["123", "@time(\"2025-11-01T00:00:00\")", "@time(\"now\")", "@time(\"2025-11-04T08:00:00\")", "<token"],
            ]);

            // Act: 執行 API 呼叫
            await _helper.InvokeWithoutActorAsync(
                dataTable,
                "/test/{id}",
                HttpMethod.Post,
                ["id"],
                ["startTime"],
                ["X-Request-Time"]
            );

            // Assert: 所有 @time() 都被正常解析並放入對應位置
            var capture = _captureHolder.GetCapture();
            Assert.Equal("123", capture!.Id);
            Assert.NotNull(capture.Query["startTime"]); // Query 參數應包含解析後的 startTime
            Assert.NotNull(FindHeader(capture.Headers, "x-request-time")); // Header 應包含解析後的時間
            Assert.NotNull(capture.Body?["punchTime"]); // Body 應包含解析後的 punchTime

            // 變數從 response 提取
            Assert.Equal("abc", _scenarioContext.Get("result")); // 變數應該從 response 提取，而不是從 @time() 設定
        }
    }

    #endregion
}