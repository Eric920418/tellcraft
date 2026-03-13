using System.Reflection;
using Tw.Sdd.Isa.TestLib.Context;
using Tw.Sdd.Isa.TestLib.Helper;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
///     VAR-System (Variable System) 單元測試
/// </summary>
[Collection("VAR-System 單元測試")]
public class ISAFeatureArgumentResolverVarSystemTest
{
    [Collection("解析 >contextKey（Context Key）")]
    public class ParseContextKeysTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ParseContextKeysTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該正確解析單個 >contextKey")]
        public void ShouldParseSingleContextKey()
        {
            var headers = new List<string?> { ">agentId", "name", "email" };

            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            Assert.Single(contextKeyMap);
            Assert.Equal("agentId", contextKeyMap[0]);
        }

        [Fact(DisplayName = "應該正確解析多個 >contextKey")]
        public void ShouldParseMultipleContextKeys()
        {
            var headers = new List<string?> { ">agentId", "name", ">token", "email", ">createdAt" };

            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            Assert.Equal(3, contextKeyMap.Count);
            Assert.Equal("agentId", contextKeyMap[0]);
            Assert.Equal("token", contextKeyMap[2]);
            Assert.Equal("createdAt", contextKeyMap[4]);
        }

        [Fact(DisplayName = "應該處理沒有 >contextKey 的 header")]
        public void ShouldHandleHeadersWithoutContextKeys()
        {
            var headers = new List<string?> { "name", "email", "age" };

            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            Assert.Empty(contextKeyMap);
        }

        [Fact(DisplayName = "應該處理空的 header")]
        public void ShouldHandleEmptyHeaders()
        {
            var headers = new List<string?>();

            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            Assert.Empty(contextKeyMap);
        }

        [Fact(DisplayName = "應該忽略 null 值的 header")]
        public void ShouldIgnoreNullHeaders()
        {
            var headers = new List<string?> { ">agentId", null, "name" };

            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            Assert.Single(contextKeyMap);
            Assert.Equal("agentId", contextKeyMap[0]);
        }

        [Fact(DisplayName = "應該拒絕使用保留變數名稱 'now' 作為 context key")]
        public void ShouldRejectReservedVariableNameNow()
        {
            var headers = new List<string?> { ">now", "name", "email" };

            var ex = Assert.Throws<ArgumentException>(() => _resolver.ParseContextKeys(headers!));
            Assert.Contains("now", ex.Message);
            Assert.Contains("保留", ex.Message);
        }

        [Fact(DisplayName = "應該拒絕使用保留變數名稱 'now' - 混合其他有效 context key")]
        public void ShouldRejectReservedVariableNameNowWithOtherValidKeys()
        {
            var headers = new List<string?> { ">agentId", ">now", "name" };

            Assert.Throws<ArgumentException>(() => _resolver.ParseContextKeys(headers!));
        }
    }

    [Collection("從 Execution Variable 提取並儲存變數")]
    public class ExtractAndStoreVariablesTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ExtractAndStoreVariablesTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該從 Map 類型的 execution variable 提取單個值")]
        public void ShouldExtractSingleValueFromMapExecutionVariable()
        {
            var headers = new List<string?> { ">agentId", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
                ["name"] = "王大明",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal(12345, _scenarioContext.Get("agentId"));
        }

        [Fact(DisplayName = "應該從 Map 類型的 execution variable 提取多個值")]
        public void ShouldExtractMultipleValuesFromMapExecutionVariable()
        {
            var headers = new List<string?> { ">agentId", ">token", "name", ">timestamp" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "<jwt", "王大明", "<createdAt" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
                ["jwt"] = "eyJhbGc...",
                ["createdAt"] = "2025-01-01T10:00:00",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal(12345, _scenarioContext.Get("agentId"));
            Assert.Equal("eyJhbGc...", _scenarioContext.Get("token"));
            Assert.Equal("2025-01-01T10:00:00", _scenarioContext.Get("timestamp"));
        }

        [Fact(DisplayName = "應該處理不存在的 execution key")]
        public void ShouldHandleNonExistentExecutionKey()
        {
            var headers = new List<string?> { ">agentId", "name" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<nonExistentKey", "王大明" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Null(_scenarioContext.Get("agentId"));
        }

        [Fact(DisplayName = "應該處理 null 的 execution variable")]
        public void ShouldHandleNullExecutionVariable()
        {
            var headers = new List<string?> { ">agentId", "name" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明" };

            var ex = Record.Exception(() => _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, null));
            Assert.Null(ex);

            Assert.Null(_scenarioContext.Get("agentId"));
        }

        [Fact(DisplayName = "應該處理 Java Bean 類型的 execution variable")]
        public void ShouldExtractValueFromJavaBeanExecutionVariable()
        {
            var headers = new List<string?> { ">agentId", ">agentName" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "<name" };
            var agent = new TestAgent(12345, "王大明", "wang@example.tw");

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, agent);

            Assert.Equal(12345, _scenarioContext.Get("agentId"));
            Assert.Equal("王大明", _scenarioContext.Get("agentName"));
        }

        [Fact(DisplayName = "應該支援 nested path 從 Map 提取值")]
        public void ShouldExtractValueFromNestedPathInMap()
        {
            var headers = new List<string?> { ">orderId", "status" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<orderResponse.orderId", "PENDING" };

            var orderResp = new Dictionary<string, object?>
            {
                ["orderId"] = "ORD-001",
                ["totalAmount"] = 1500,
            };

            var executionVariable = new Dictionary<string, object?>
            {
                ["orderResponse"] = orderResp,
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal("ORD-001", _scenarioContext.Get("orderId"));
        }

        [Fact(DisplayName = "應該支援多層 nested path 從 Map 提取值")]
        public void ShouldExtractValueFromMultiLevelNestedPath()
        {
            var headers = new List<string?> { ">productId", ">categoryName" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<product.details.id", "<product.category.name" };

            var details = new Dictionary<string, object?>
            {
                ["id"] = "PROD-123",
            };

            var category = new Dictionary<string, object?>
            {
                ["name"] = "電子產品",
            };

            var product = new Dictionary<string, object?>
            {
                ["details"] = details,
                ["category"] = category,
            };

            var executionVariable = new Dictionary<string, object?>
            {
                ["product"] = product,
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal("PROD-123", _scenarioContext.Get("productId"));
            Assert.Equal("電子產品", _scenarioContext.Get("categoryName"));
        }

        [Fact(DisplayName = "nested path 不存在時應該忽略該變數")]
        public void ShouldIgnoreNonExistentNestedPath()
        {
            var headers = new List<string?> { ">shippingId", "status" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<orderResponse.nonExistentField", "SHIPPED" };

            var orderResp = new Dictionary<string, object?>
            {
                ["orderId"] = "ORD-001",
            };

            var executionVariable = new Dictionary<string, object?>
            {
                ["orderResponse"] = orderResp,
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Null(_scenarioContext.Get("shippingId"));
        }

        [Fact(DisplayName = "nested path 中間層級不是 Map 時應該忽略")]
        public void ShouldIgnoreNestedPathWhenIntermediateIsNotMap()
        {
            var headers = new List<string?> { ">value", "status" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<data.someField.value", "OK" };

            var executionVariable = new Dictionary<string, object?>
            {
                ["data"] = "not a map",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Null(_scenarioContext.Get("value"));
        }

        [Fact(DisplayName = "應該支援單層 path（向後兼容）")]
        public void ShouldSupportSingleLevelPathForBackwardCompatibility()
        {
            var headers = new List<string?> { ">userId", "name" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明" };

            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
                ["name"] = "王大明",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal(12345, _scenarioContext.Get("userId"));
        }

        private class TestAgent
        {
            public TestAgent(int id, string name, string email)
            {
                Id = id;
                Name = name;
                Email = email;
            }

            public int Id { get; }
            public string Name { get; }
            public string Email { get; }
        }
    }

    [Collection("解析 $variableName（變數引用）")]
    public class ResolveVariableTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ResolveVariableTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該正確解析 $variableName 引用")]
        public void ShouldResolveVariableReference()
        {
            _scenarioContext.PutObject("agentId", 12345);

            var resolved = _resolver.ResolveVariable("$agentId");

            Assert.Equal(12345, resolved);
        }

        [Fact(DisplayName = "應該處理不存在的變數引用")]
        public void ShouldHandleNonExistentVariableReference()
        {
            var resolved = _resolver.ResolveVariable("$nonExistentVar");

            Assert.Equal("$nonExistentVar", resolved);
        }

        [Fact(DisplayName = "應該保留非變數引用的字串")]
        public void ShouldPreserveNonVariableString()
        {
            var normalString = "王大明";

            var resolved = _resolver.ResolveVariable(normalString);

            Assert.Equal("王大明", resolved);
        }

        [Fact(DisplayName = "應該處理帶引號的變數引用（不解析）")]
        public void ShouldNotResolveQuotedVariableReference()
        {
            _scenarioContext.PutObject("agentId", 12345);

            var resolved = _resolver.ResolveVariable("\"$agentId\"");

            Assert.Equal("$agentId", resolved);
        }

        [Fact(DisplayName = "應該處理帶單引號的變數引用（不解析）")]
        public void ShouldNotResolveSingleQuotedVariableReference()
        {
            _scenarioContext.PutObject("agentId", 12345);

            var resolved = _resolver.ResolveVariable("'$agentId'");

            Assert.Equal("$agentId", resolved);
        }

        [Fact(DisplayName = "應該處理 null 值")]
        public void ShouldHandleNullValue()
        {
            var resolved = _resolver.ResolveVariable(null);

            Assert.Null(resolved);
        }

        [Fact(DisplayName = "應該處理空字串")]
        public void ShouldHandleEmptyString()
        {
            var resolved = _resolver.ResolveVariable(string.Empty);

            Assert.Equal(string.Empty, resolved);
        }

        [Fact(DisplayName = "ADR-0006: 應該處理 $now（從 scenarioContext 查找，找不到則使用 getNow）")]
        public void ShouldHandleDollarNowWithoutMock()
        {
            var resolved = _resolver.ResolveVariable("$now");

            Assert.NotNull(resolved);
            Assert.IsType<DateTimeOffset>(resolved);
        }

        [Fact(DisplayName = "ADR-0006: 應該處理 $now（設定 mock now 時使用 mock 時間）")]
        public void ShouldHandleDollarNowWithMockedTime()
        {
            _resolver.SetNow("2025-11-04T08:00:00+08:00");

            var resolved = _resolver.ResolveVariable("$now");

            Assert.NotNull(resolved);
            var zonedNow = Assert.IsType<DateTimeOffset>(resolved);
            Assert.Equal(2025, zonedNow.Year);
            Assert.Equal(11, zonedNow.Month);
            Assert.Equal(4, zonedNow.Day);
            Assert.Equal(8, zonedNow.Hour);
        }

        [Fact(DisplayName = "應該處理普通字串 'now'（不應該被解析為時間）")]
        public void ShouldHandlePlainStringNow()
        {
            var resolved = _resolver.ResolveVariable("now");

            Assert.Equal("now", resolved);
        }

        [Fact(DisplayName = "ADR-0006: 應該處理 $now（從 scenarioContext 查找，找不到則使用 getNow）")]
        public void ShouldHandleVariableReferenceNow()
        {
            // Given: scenarioContext 中沒有 "now" 變數

            // When: 解析 $now
            var resolved = _resolver.ResolveVariable("$now");

            // Then: 找不到變數時使用 getNow()（ADR-0006）
            Assert.NotNull(resolved);
            Assert.IsType<DateTimeOffset>(resolved);
        }

        [Fact(DisplayName = "ADR-0006：應該處理 $now（如果 scenarioContext 有 now 變數則使用該值）")]
        public void ShouldHandleVariableReferenceNowFromContext()
        {
            _scenarioContext.PutObject("now", "1996-08-07T08:00:00+08:00");

            var resolved = _resolver.ResolveVariable("$now");

            Assert.Equal("1996-08-07T08:00:00+08:00", resolved);
        }

        [Fact(DisplayName = "應該移除字串字面值的引號")]
        public void ShouldRemoveQuotesFromStringLiterals()
        {
            var resolved1 = _resolver.ResolveVariable("\"王大明\"");
            var resolved2 = _resolver.ResolveVariable("'李小華'");

            Assert.Equal("王大明", resolved1);
            Assert.Equal("李小華", resolved2);
        }
    }

    [Collection("變數生命週期：完整流程測試")]
    public class VariableLifecycleTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public VariableLifecycleTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "完整流程：註冊特務並引用生成的 ID")]
        public void ShouldCompleteVariableLifecycleAgentRegistration()
        {
            var headers = new List<string?> { ">agentId", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 10001,
                ["name"] = "王大明",
                ["email"] = "wang@example.tw",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            var resolvedId = _resolver.ResolveVariable("$agentId");

            Assert.NotNull(contextKeyMap);
            Assert.Equal(10001, _scenarioContext.Get("agentId"));
            Assert.Equal(10001, resolvedId);
        }

        [Fact(DisplayName = "完整流程：用戶登入並引用 JWT Token")]
        public void ShouldCompleteVariableLifecycleUserLogin()
        {
            var headers = new List<string?> { ">myToken", "email", "password" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<token", "user@example.tw", "password123" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["token"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            var resolvedToken = _resolver.ResolveVariable("$myToken");
            var authHeader = "Bearer " + resolvedToken;

            Assert.Equal("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", resolvedToken);
            Assert.StartsWith("Bearer eyJ", authHeader);
        }

        [Fact(DisplayName = "完整流程：創建訂單並引用多個生成的值")]
        public void ShouldCompleteVariableLifecycleCreateOrder()
        {
            var headers = new List<string?> { ">orderId", ">orderTime", "userId", "amount" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "<createdAt", "1001", "500" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 20001,
                ["createdAt"] = "2025-01-15T14:30:00",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            var resolvedOrderId = _resolver.ResolveVariable("$orderId");
            var resolvedOrderTime = _resolver.ResolveVariable("$orderTime");

            Assert.Equal(20001, resolvedOrderId);
            Assert.Equal("2025-01-15T14:30:00", resolvedOrderTime);
        }

        [Fact(DisplayName = "完整流程：多步驟變數傳遞")]
        public void ShouldCompleteVariableLifecycleMultiStepPropagation()
        {
            var deptHeaders = new List<string?> { ">deptId", "name", "budget" };
            var deptContextKeyMap = _resolver.ParseContextKeys(deptHeaders!);

            var deptDataRow = new List<string?> { "<id", "技術部", "1000000" };
            var deptExecutionVariable = new Dictionary<string, object?>
            {
                ["id"] = 5001,
            };

            _resolver.ExtractAndStoreVariables(deptDataRow!, deptContextKeyMap, deptExecutionVariable);

            var empHeaders = new List<string?> { ">empId", "name", "deptId", "salary" };
            var empContextKeyMap = _resolver.ParseContextKeys(empHeaders!);

            var empDataRow = new List<string?> { "<id", "李工程師", "$deptId", "50000" };

            var resolvedDeptIdObj = _resolver.ResolveVariable(empDataRow[2]);
            var resolvedDeptId = Convert.ToString(resolvedDeptIdObj);

            var empExecutionVariable = new Dictionary<string, object?>
            {
                ["id"] = 6001,
                ["deptId"] = int.Parse(resolvedDeptId ?? "0"),
            };

            _resolver.ExtractAndStoreVariables(empDataRow!, empContextKeyMap, empExecutionVariable);

            Assert.Equal(5001, _scenarioContext.Get("deptId"));
            Assert.Equal(6001, _scenarioContext.Get("empId"));
            Assert.Equal(5001, int.Parse(resolvedDeptId ?? "0"));
        }
    }

    [Collection(">contextKey 與 <executionKey 必須成對")]
    public class ContextKeyExecutionKeyPairingTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ContextKeyExecutionKeyPairingTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該拋出異常：>contextKey 存在但 data row 沒有對應的 <executionKey")]
        public void ShouldThrowExceptionWhenContextKeyWithoutMatchingExecutionKey()
        {
            var headers = new List<string?> { ">agentId", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "12345", "王大明", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 99999,
            };

            var exception = Assert.Throws<ArgumentException>(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );

            Assert.True(exception.Message.Contains("agentId") || exception.Message.Contains("成對"));
        }

        [Fact(DisplayName = "應該拋出異常：data row 有 <executionKey 但 header 沒有對應的 >contextKey")]
        public void ShouldThrowExceptionWhenExecutionKeyWithoutMatchingContextKey()
        {
            var headers = new List<string?> { "agentId", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
            };

            var exception = Assert.Throws<ArgumentException>(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );

            Assert.True(exception.Message.Contains("<") || exception.Message.Contains("成對"));
        }

        [Fact(DisplayName = "應該正確處理成對的 >contextKey 與 <executionKey（同欄位對齊）")]
        public void ShouldCorrectlyHandlePairedContextKeyAndExecutionKey()
        {
            var headers = new List<string?> { ">agentId", "name", ">token" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明", "<jwt" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
                ["jwt"] = "eyJhbGc...",
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Equal(12345, _scenarioContext.Get("agentId"));
            Assert.Equal("eyJhbGc...", _scenarioContext.Get("token"));
        }

        [Fact(DisplayName = "應該拋出異常：部分欄位不成對")]
        public void ShouldThrowExceptionWhenPartiallyPaired()
        {
            var headers = new List<string?> { ">agentId", "name", ">token", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明", "someValue", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
            };

            Assert.Throws<ArgumentException>(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );
        }

        [Fact(DisplayName = "應該拋出異常：錯位（>contextKey 與 <executionKey 不在同一欄位）")]
        public void ShouldThrowExceptionWhenMisaligned()
        {
            var headers = new List<string?> { ">agentId", ">token", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "12345", "<id", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 99999,
            };

            Assert.Throws<ArgumentException>(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );
        }

        [Fact(DisplayName = "應該允許：沒有任何 >contextKey 和 <executionKey（全是普通欄位）")]
        public void ShouldAllowNoContextKeysAndExecutionKeys()
        {
            var headers = new List<string?> { "agentId", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "12345", "王大明", "wang@example.tw" };
            var executionVariable = new Dictionary<string, object?>();

            var ex = Record.Exception(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );

            Assert.Null(ex);
        }
    }

    [Collection("邊界條件與錯誤處理")]
    public class EdgeCasesAndErrorHandlingTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public EdgeCasesAndErrorHandlingTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該處理 data row 長度不匹配 header")]
        public void ShouldHandleDataRowLengthMismatch()
        {
            var headers = new List<string?> { ">agentId", ">token", "name", "email" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "<jwt" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = 12345,
                ["jwt"] = "token123",
            };

            var ex = Record.Exception(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );

            Assert.Null(ex);
            Assert.Equal(12345, _scenarioContext.Get("agentId"));
            Assert.Equal("token123", _scenarioContext.Get("token"));
        }

        [Fact(DisplayName = "應該拋出異常：> 符號後沒有名稱（空 key）")]
        public void ShouldThrowExceptionForEmptyContextKey()
        {
            var headers = new List<string?> { ">", "name" };

            Assert.Throws<ArgumentException>(() => _resolver.ParseContextKeys(headers!));
        }

        [Fact(DisplayName = "應該拋出異常：< 符號後沒有名稱（空 key）")]
        public void ShouldThrowExceptionForEmptyExecutionKey()
        {
            var headers = new List<string?> { ">agentId", "name" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<", "王大明" };
            var executionVariable = new Dictionary<string, object?>
            {
                [""] = 12345,
            };

            var exception = Assert.Throws<ArgumentException>(() =>
                _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable)
            );

            Assert.True(exception.Message.Contains("空") || exception.Message.Contains("名稱"));
        }

        [Fact(DisplayName = "應該處理 execution variable 中的 null 值")]
        public void ShouldHandleNullValueInExecutionVariable()
        {
            var headers = new List<string?> { ">agentId", "name" };
            var contextKeyMap = _resolver.ParseContextKeys(headers!);

            var dataRow = new List<string?> { "<id", "王大明" };
            var executionVariable = new Dictionary<string, object?>
            {
                ["id"] = null,
            };

            _resolver.ExtractAndStoreVariables(dataRow!, contextKeyMap, executionVariable);

            Assert.Null(_scenarioContext.Get("agentId"));
        }
    }

    [Collection("TIME-System: @localTime() 轉換")]
    public class LocalTimeExpressionTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public LocalTimeExpressionTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該正確解析 @localTime(\"09:00:00\")")]
        public void ShouldParseLocalTime()
        {
            var startTimeExpr = "@localTime(\"09:00:00\")";
            var endTimeExpr = "@localTime(\"12:00:00\")";

            var startTimeResult = _resolver.ResolveVariable(startTimeExpr);
            var endTimeResult = _resolver.ResolveVariable(endTimeExpr);

            Assert.IsType<TimeOnly>(startTimeResult);
            Assert.Equal(new TimeOnly(9, 0, 0), startTimeResult);
            Assert.Equal(new TimeOnly(12, 0, 0), endTimeResult);
        }

        [Fact(DisplayName = "應該支援不帶引號的 @localTime(09:00:00)")]
        public void ShouldParseLocalTimeWithoutQuotes()
        {
            var timeExpr = "@localTime(09:00:00)";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.Equal(new TimeOnly(9, 0, 0), result);
        }

        [Fact(DisplayName = "應該支援帶毫秒的 @localTime(\"09:00:00.123\")")]
        public void ShouldParseLocalTimeWithMilliseconds()
        {
            var timeExpr = "@localTime(\"09:00:00.123\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.Equal(new TimeOnly(9, 0, 0, 123), result);
        }

        [Fact(DisplayName = "無效的 LocalTime 格式應拋出異常")]
        public void ShouldThrowExceptionForInvalidLocalTimeFormat()
        {
            var invalidTimeExpr = "@localTime(\"25:00:00\")";

            Assert.Throws<ArgumentException>(() => _resolver.ResolveVariable(invalidTimeExpr));
        }
    }

    [Collection("CAS: parseConstraints 解析約束條件")]
    public class ParseConstraintsTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ParseConstraintsTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該正確解析簡單的約束條件")]
        public void ShouldParseSimpleConstraint()
        {
            var constraintString = "&gt(0)";

            var constraints = ParseConstraintsViaReflection(constraintString);

            Assert.Single(constraints);
        }

        [Fact(DisplayName = "應該正確解析包含 TIME-System 表達式的約束條件")]
        public void ShouldParseConstraintWithTimeExpression()
        {
            var constraintString = "&sameTime(\"@time(\\\"2024-01-15T10:30:00+08:00\\\")\")";

            var constraints = ParseConstraintsViaReflection(constraintString);

            Assert.Single(constraints);
            var constraint = constraints[0];
            var paramsValue = GetConstraintParams(constraint);

            Assert.Contains("@time(", paramsValue);
            Assert.Contains("2024-01-15T10:30:00+08:00", paramsValue);
        }

        [Fact(DisplayName = "應該正確解析多層嵌套括號的約束條件")]
        public void ShouldParseConstraintWithNestedParentheses()
        {
            var constraintString = "&customFunc(\"outer(inner(value))\")";

            var constraints = ParseConstraintsViaReflection(constraintString);

            Assert.Single(constraints);
            var constraint = constraints[0];
            var paramsValue = GetConstraintParams(constraint);

            Assert.Equal("\"outer(inner(value))\"", paramsValue);
        }

        [Fact(DisplayName = "應該正確解析包含轉義字符的約束條件")]
        public void ShouldParseConstraintWithEscapedCharacters()
        {
            var constraintString = "&eq(\"He said \\\"Hello\\\"\")";

            var constraints = ParseConstraintsViaReflection(constraintString);

            Assert.Single(constraints);
            var constraint = constraints[0];
            var paramsValue = GetConstraintParams(constraint);

            Assert.Contains("\\\"", paramsValue);
        }

        [Fact(DisplayName = "應該正確解析多個約束條件")]
        public void ShouldParseMultipleConstraints()
        {
            var constraintString = "&gt(0) &lt(100) &isNum";

            var constraints = ParseConstraintsViaReflection(constraintString);

            Assert.Equal(3, constraints.Count);
        }

        // Helper method: 透過反射呼叫 private parseConstraints 方法
        private List<object> ParseConstraintsViaReflection(string constraintString)
        {
            var method = typeof(ISAFeatureArgumentResolver)
                .GetMethod("ParseConstraints", BindingFlags.NonPublic | BindingFlags.Instance);

            if (method is null)
            {
                throw new InvalidOperationException("ParseConstraints method not found");
            }

            var result = method.Invoke(_resolver, new object?[] { constraintString });
            return (result as IEnumerable<object>)?.ToList() ?? new List<object>();
        }

        // Helper method: 透過反射取得 Constraint 的 params
        private string GetConstraintParams(object constraint)
        {
            var method = constraint.GetType().GetMethod("GetParams");
            if (method is null)
            {
                throw new InvalidOperationException("GetParams method not found");
            }

            return (string)(method.Invoke(constraint, Array.Empty<object>()) ?? string.Empty);
        }
    }

    /// <summary>
    ///     字串插值 ${VAR} 語法測試
    /// </summary>
    [Collection("字串插值 ${VAR} 語法")]
    public class StringInterpolationTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public StringInterpolationTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            SetupVariables();
        }

        private void SetupVariables()
        {
            // 設置測試用的變數
            _scenarioContext.PutObject("name", "王大明");
            _scenarioContext.PutObject("firstName", "王");
            _scenarioContext.PutObject("lastName", "大明");
            _scenarioContext.PutObject("id", 12345);
            _scenarioContext.PutObject("id1", "1");
            _scenarioContext.PutObject("id2", "2");
            _scenarioContext.PutObject("id3", "3");
            _scenarioContext.PutObject("email", "wang@example.tw");
            _scenarioContext.PutObject("emptyStr", "");
            _scenarioContext.PutObject("amount", "500");
            _scenarioContext.PutObject("count1", "10");
            _scenarioContext.PutObject("count2", "20");
            _scenarioContext.PutObject("total", "30");

            // 嵌套路徑變數
            _scenarioContext.PutObject("Users.UserA.id", "101");
            _scenarioContext.PutObject("Users.UserB.id", "102");
        }

        public static IEnumerable<object[]> GetStringInterpolationTestCases()
        {
            return new List<object[]>
            {
                // 基本單變數插值
                new object[] { "這是一個 ${name}。", "這是一個 王大明。", "基本單變數插值" },
                new object[] { "Hello ${name}!", "Hello 王大明!", "英文句子中的插值" },
                new object[] { "${name}", "王大明", "只有變數無其他文字" },

                // 多變數插值
                new object[] { "${firstName},${lastName}", "王,大明", "兩個變數用逗號分隔" },
                new object[] { "${id1},${id2},${id3}", "1,2,3", "三個變數用逗號分隔" },
                new object[]
                {
                    "User ${id}: ${name} (${email})", "User 12345: 王大明 (wang@example.tw)", "多個變數混合文字"
                },

                // 變數在不同位置
                new object[] { "${name} 在前面", "王大明 在前面", "變數在開頭" },
                new object[] { "在後面 ${name}", "在後面 王大明", "變數在結尾" },
                new object[] { "在 ${name} 中間", "在 王大明 中間", "變數在中間" },

                // 無插值的情況
                new object[] { "沒有變數", "沒有變數", "純文字無變數" },
                new object[] { "這是 $oldStyle", "這是 $oldStyle", "舊式變數語法不影響（保持原樣）" },

                // 邊界情況
                new object[] { "${name}${name}", "王大明王大明", "連續兩個變數無分隔" },
                new object[] { "a${name}b${name}c", "a王大明b王大明c", "同一變數重複出現" },
                new object[] { "${}", "${}", "空的大括號應保持原樣" },
                new object[] { "未閉合的 ${name", "未閉合的 ${name", "未閉合的大括號應保持原樣" },

                // 不存在的變數
                new object[] { "${notFound}", "${notFound}", "不存在的變數保持原樣" },
                new object[]
                {
                    "Found: ${name}, NotFound: ${notExist}", "Found: 王大明, NotFound: ${notExist}",
                    "混合存在與不存在的變數"
                },

                // 嵌套路徑
                new object[] { "${Users.UserA.id}", "101", "嵌套路徑變數" },
                new object[] { "IDs: ${Users.UserA.id},${Users.UserB.id}", "IDs: 101,102", "多個嵌套路徑變數" },

                // 空字串和 null
                new object[] { "", "", "空字串" },
                new object[] { "Value: ${emptyStr}", "Value: ", "變數值為空字串" },

                // 特殊字符
                new object[] { "Price: $${amount}", "Price: $500", "包含 $ 符號" },
                new object[] { "Bracket: {${name}}", "Bracket: {王大明}", "包含普通大括號" },

                // 數值變數
                new object[] { "ID: ${id}", "ID: 12345", "數值變數" },
                new object[] { "Count: ${count1} + ${count2} = ${total}", "Count: 10 + 20 = 30", "多個數值變數" }
            };
        }

        [Theory(DisplayName = "應該正確處理字串插值")]
        [MemberData(nameof(GetStringInterpolationTestCases))]
        public void ShouldInterpolateStringsCorrectly(string input, string expected, string _)
        {
            // When: 解析包含插值的字串
            var result = _resolver.ResolveVariable(input);

            // Then: 應該正確替換變數
            Assert.Equal(expected, result?.ToString() ?? "");
        }

        [Fact(DisplayName = "字串插值應該與舊式 $VAR 語法並存")]
        public void ShouldCoexistWithOldDollarSyntax()
        {
            // Given: 字串同時包含新舊語法
            const string input = "Old: $name, New: ${name}";

            // When: 解析字串
            var result = _resolver.ResolveVariable(input);

            // Then: 新語法應該被插值，舊語法保持原樣（因為整個字串不是以 $ 開頭）
            Assert.Equal("Old: $name, New: 王大明", result?.ToString() ?? "");
        }

        [Fact(DisplayName = "字串插值不應影響引號內的字串")]
        public void ShouldNotInterpolateQuotedStrings()
        {
            // Given: 帶引號的字串
            const string input = "\"${name}\"";

            // When: 解析帶引號的字串
            var result = _resolver.ResolveVariable(input);

            // Then: 應該移除引號但不做插值
            Assert.Equal("${name}", result?.ToString() ?? "");
        }

        [Fact(DisplayName = "批量查詢用戶 ID 的實際使用場景")]
        public void ShouldHandleRealWorldBatchQueryScenario()
        {
            // Given: 實際場景中的用戶 ID 變數
            _scenarioContext.PutObject("Users.UserA.id", "1001");
            _scenarioContext.PutObject("Users.UserB.id", "1002");
            _scenarioContext.PutObject("Users.UserC.id", "1003");

            const string input = "${Users.UserA.id},${Users.UserB.id},${Users.UserC.id}";

            // When: 解析字串
            var result = _resolver.ResolveVariable(input);

            // Then: 應該得到逗號分隔的 ID 列表
            Assert.Equal("1001,1002,1003", result?.ToString() ?? "");
        }
    }
}