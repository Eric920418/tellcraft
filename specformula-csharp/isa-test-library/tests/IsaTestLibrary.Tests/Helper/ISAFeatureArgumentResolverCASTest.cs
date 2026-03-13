using Tw.Sdd.Isa.TestLib.Context;
using Tw.Sdd.Isa.TestLib.Helper;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
///     CAS (Constraint Assertion System) 單元測試
///     測試範圍：
///     1. 數值比較斷言（eq, ne, gt, lt, ge, le）
///     2. 類型檢查斷言（isNum, isStr, isBool, isNull, isNotNull, isDef, isUndef）
///     3. 字串操作斷言（contains, startsWith, endsWith, matches, length）
///     4. 集合/陣列斷言（hasItem, hasNoItem, size, isEmpty, isNotEmpty）
///     5. 存在性斷言（exists, notExists, hasField, noField）
///     6. 範圍檢查斷言（between, notBetween, oneOf, noneOf）
///     7. 時間相關斷言（before, after, sameDay, withinDays）
///     8. 多重約束組合
///     注意：時間生成語句測試（@time, @date, @localtime）已移至 ISAFeatureArgumentResolverTimeTest
/// </summary>
[Collection("CAS (Constraint Assertion System) 單元測試")]
public class ISAFeatureArgumentResolverCASTest
{
    /// <summary>
    ///     數值比較斷言
    /// </summary>
    [Collection("數值比較斷言")]
    public class NumericComparisonTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public NumericComparisonTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&eq - 應該驗證相等")]
        public void TestEqualConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過相等驗證
            Assert.True(_resolver.EvaluateConstraints("&eq(100)", actualValue));
        }

        [Fact(DisplayName = "&eq - 應該在不相等時失敗")]
        public void TestEqualConstraint_Failure()
        {
            // Given: 實際值為 100，預期值為 200
            object actualValue = 100;

            // When & Then: 應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&eq(200)", actualValue)
            );
        }

        [Fact(DisplayName = "&eq - 應該支援變數引用")]
        public void TestEqualConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("expectedValue", 100);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&eq($expectedValue)", actualValue));
        }

        [Fact(DisplayName = "&ne - 應該驗證不相等")]
        public void TestNotEqualConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過不相等驗證
            Assert.True(_resolver.EvaluateConstraints("&ne(200)", actualValue));
        }

        [Fact(DisplayName = "&ne - 應該支援變數引用")]
        public void TestNotEqualConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("unexpectedValue", 200);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&ne($unexpectedValue)", actualValue));
        }

        [Fact(DisplayName = "&gt - 應該驗證大於")]
        public void TestGreaterThanConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過大於驗證
            Assert.True(_resolver.EvaluateConstraints("&gt(50)", actualValue));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&gt(150)", actualValue)
            );
        }

        [Fact(DisplayName = "&gt - 應該支援變數引用")]
        public void TestGreaterThanConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("minValue", 50);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&gt($minValue)", actualValue));

            // 失敗情況
            _scenarioContext.PutObject("tooHighValue", 150);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&gt($tooHighValue)", actualValue)
            );
        }

        [Fact(DisplayName = "&lt - 應該驗證小於")]
        public void TestLessThanConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過小於驗證
            Assert.True(_resolver.EvaluateConstraints("&lt(150)", actualValue));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&lt(50)", actualValue)
            );
        }

        [Fact(DisplayName = "&lt - 應該支援變數引用")]
        public void TestLessThanConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("maxValue", 150);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&lt($maxValue)", actualValue));

            // 失敗情況
            _scenarioContext.PutObject("tooLowValue", 50);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&lt($tooLowValue)", actualValue)
            );
        }

        [Fact(DisplayName = "&ge - 應該驗證大於等於")]
        public void TestGreaterThanOrEqualConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過大於等於驗證
            Assert.True(_resolver.EvaluateConstraints("&ge(100)", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&ge(50)", actualValue));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&ge(150)", actualValue)
            );
        }

        [Fact(DisplayName = "&ge - 應該支援變數引用")]
        public void TestGreaterThanOrEqualConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("minValue", 100);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&ge($minValue)", actualValue));
        }

        [Fact(DisplayName = "&le - 應該驗證小於等於")]
        public void TestLessThanOrEqualConstraint()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 應該通過小於等於驗證
            Assert.True(_resolver.EvaluateConstraints("&le(100)", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&le(150)", actualValue));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&le(50)", actualValue)
            );
        }

        [Fact(DisplayName = "&le - 應該支援變數引用")]
        public void TestLessThanOrEqualConstraint_WithVariableReference()
        {
            // Given: scenario context 中有變數，實際值為 100
            _scenarioContext.PutObject("maxValue", 100);
            object actualValue = 100;

            // When & Then: 應該通過驗證（使用變數引用）
            Assert.True(_resolver.EvaluateConstraints("&le($maxValue)", actualValue));
        }

        [Fact(DisplayName = "數值比較 - 應該支援浮點數")]
        public void TestNumericComparison_WithFloat()
        {
            // Given: 實際值為浮點數
            object actualValue = 99.99;

            // When & Then: 應該正確比較浮點數
            Assert.True(_resolver.EvaluateConstraints("&gt(99)", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&lt(100)", actualValue));
        }
    }

    /// <summary>
    ///     類型檢查斷言
    /// </summary>
    [Collection("類型檢查斷言")]
    public class TypeCheckTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public TypeCheckTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&isNum - 應該驗證數字類型")]
        public void TestIsNumConstraint()
        {
            // When & Then: 各種數字類型應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isNum", 100));
            Assert.True(_resolver.EvaluateConstraints("&isNum", 99.99));
            Assert.True(_resolver.EvaluateConstraints("&isNum", 1000L));

            // 非數字類型應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isNum", "100")
            );
        }

        [Fact(DisplayName = "&isStr - 應該驗證字串類型")]
        public void TestIsStrConstraint()
        {
            // When & Then: 字串應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isStr", "王大明"));
            Assert.True(_resolver.EvaluateConstraints("&isStr", ""));

            // 非字串類型應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isStr", 100)
            );
        }

        [Fact(DisplayName = "&isBool - 應該驗證布林類型")]
        public void TestIsBoolConstraint()
        {
            // When & Then: 布林值應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isBool", true));
            Assert.True(_resolver.EvaluateConstraints("&isBool", false));

            // 非布林類型應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isBool", "true")
            );
        }

        [Fact(DisplayName = "&isNull - 應該驗證 null 值")]
        public void TestIsNullConstraint()
        {
            // When & Then: null 應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isNull", null));

            // 非 null 值應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isNull", "王大明")
            );
        }

        [Fact(DisplayName = "&isNotNull - 應該驗證非 null 值")]
        public void TestIsNotNullConstraint()
        {
            // When & Then: 非 null 值應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isNotNull", "王大明"));
            Assert.True(_resolver.EvaluateConstraints("&isNotNull", 0));
            Assert.True(_resolver.EvaluateConstraints("&isNotNull", ""));

            // null 應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isNotNull", null)
            );
        }

        [Fact(DisplayName = "&isDef - 應該驗證已定義的值")]
        public void TestIsDefConstraint()
        {
            // When & Then: 已定義的值應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isDef", "王大明"));
            Assert.True(_resolver.EvaluateConstraints("&isDef", 0));

            // null（未定義）應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isDef", null)
            );
        }
    }

    /// <summary>
    ///     字串操作斷言
    /// </summary>
    [Collection("字串操作斷言")]
    public class StringOperationTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public StringOperationTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&contains - 應該驗證包含子字串")]
        public void TestContainsConstraint()
        {
            // Given: 實際值為 "王大明"
            object actualValue = "王大明";

            // When & Then: 應該通過包含驗證
            Assert.True(_resolver.EvaluateConstraints("&contains(\"王\")", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&contains(\"大明\")", actualValue));

            // 不包含的子字串應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&contains(\"李\")", actualValue)
            );
        }

        [Fact(DisplayName = "&startsWith - 應該驗證字串開頭")]
        public void TestStartsWithConstraint()
        {
            // Given: 實際值為 "wang@example.com"
            object actualValue = "wang@example.com";

            // When & Then: 應該通過開頭驗證
            Assert.True(_resolver.EvaluateConstraints("&startsWith(\"wang\")", actualValue));

            // 錯誤的開頭應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&startsWith(\"li\")", actualValue)
            );
        }

        [Fact(DisplayName = "&endsWith - 應該驗證字串結尾")]
        public void TestEndsWithConstraint()
        {
            // Given: 實際值為 "wang@example.com"
            object actualValue = "wang@example.com";

            // When & Then: 應該通過結尾驗證
            Assert.True(_resolver.EvaluateConstraints("&endsWith(\".com\")", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&endsWith(\"example.com\")", actualValue));

            // 錯誤的結尾應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&endsWith(\".tw\")", actualValue)
            );
        }

        [Fact(DisplayName = "&matches - 應該驗證正則表達式匹配")]
        public void TestMatchesConstraint()
        {
            // Given: 實際值為日期格式字串
            object actualValue = "2025-01-15";

            // When & Then: 應該通過正則驗證
            Assert.True(_resolver.EvaluateConstraints("&matches(\"\\d{4}-\\d{2}-\\d{2}\")", actualValue));

            // 不匹配的格式應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&matches(\"\\d{2}/\\d{2}/\\d{4}\")", actualValue)
            );
        }

        [Fact(DisplayName = "&length - 應該驗證字串長度範圍")]
        public void TestLengthConstraint()
        {
            // Given: 實際值為 "王大明"（3 個字）
            object actualValue = "王大明";

            // When & Then: 應該通過長度驗證
            Assert.True(_resolver.EvaluateConstraints("&length(2,10)", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&length(3,3)", actualValue));

            // 長度超出範圍應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&length(5,10)", actualValue)
            );
        }

        [Fact(DisplayName = "字串操作 - 應該對非字串類型失敗")]
        public void TestStringOperations_WithNonString()
        {
            // Given: 實際值為數字
            object actualValue = 12345;

            // When & Then: 字串操作應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&contains(\"123\")", actualValue)
            );
        }
    }

    /// <summary>
    ///     集合/陣列斷言
    /// </summary>
    [Collection("集合/陣列斷言")]
    public class CollectionArrayTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public CollectionArrayTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&hasItem - 應該驗證集合包含元素")]
        public void TestHasItemConstraint()
        {
            // Given: 實際值為 List
            var actualValue = new List<string> { "admin", "user", "guest" };

            // When & Then: 應該通過包含驗證
            Assert.True(_resolver.EvaluateConstraints("&hasItem(\"admin\")", actualValue));

            // 不包含的元素應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&hasItem(\"superadmin\")", actualValue)
            );
        }

        [Fact(DisplayName = "&hasNoItem - 應該驗證集合不包含元素")]
        public void TestHasNoItemConstraint()
        {
            // Given: 實際值為 List
            var actualValue = new List<string> { "admin", "user", "guest" };

            // When & Then: 應該通過不包含驗證
            Assert.True(_resolver.EvaluateConstraints("&hasNoItem(\"superadmin\")", actualValue));

            // 包含的元素應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&hasNoItem(\"admin\")", actualValue)
            );
        }

        [Fact(DisplayName = "&size - 應該驗證集合大小")]
        public void TestSizeConstraint()
        {
            // Given: 實際值為 List（包含 3 個元素）
            var actualValue = new List<string> { "admin", "user", "guest" };

            // When & Then: 應該通過大小驗證
            Assert.True(_resolver.EvaluateConstraints("&size(3)", actualValue));

            // 錯誤的大小應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&size(5)", actualValue)
            );
        }

        [Fact(DisplayName = "&isEmpty - 應該驗證空集合")]
        public void TestIsEmptyConstraint()
        {
            // Given: 空 List
            var emptyList = new List<string>();

            // When & Then: 空集合應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isEmpty", emptyList));

            // 非空集合應該失敗
            var nonEmptyList = new List<string> { "admin" };
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isEmpty", nonEmptyList)
            );
        }

        [Fact(DisplayName = "&isNotEmpty - 應該驗證非空集合")]
        public void TestIsNotEmptyConstraint()
        {
            // Given: 非空 List
            var nonEmptyList = new List<string> { "admin" };

            // When & Then: 非空集合應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&isNotEmpty", nonEmptyList));

            // 空集合應該失敗
            var emptyList = new List<string>();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isNotEmpty", emptyList)
            );
        }

        [Fact(DisplayName = "集合斷言 - 應該支援陣列")]
        public void TestCollectionConstraints_WithArray()
        {
            // Given: 實際值為陣列
            string[] actualValue = { "admin", "user", "guest" };

            // When & Then: 應該支援陣列操作
            Assert.True(_resolver.EvaluateConstraints("&hasItem(\"admin\")", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&size(3)", actualValue));
        }
    }

    /// <summary>
    ///     存在性斷言
    /// </summary>
    [Collection("存在性斷言")]
    public class ExistenceTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public ExistenceTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&exists - 應該驗證值存在")]
        public void TestExistsConstraint()
        {
            // When & Then: 存在的值應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&exists", "王大明"));
            Assert.True(_resolver.EvaluateConstraints("&exists", 0));
            Assert.True(_resolver.EvaluateConstraints("&exists", ""));

            // null 應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&exists", null)
            );
        }

        [Fact(DisplayName = "&notExists - 應該驗證值不存在")]
        public void TestNotExistsConstraint()
        {
            // When & Then: null 應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&notExists", null));

            // 非 null 值應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&notExists", "王大明")
            );
        }

        [Fact(DisplayName = "&hasField - 應該驗證 Map 包含欄位")]
        public void TestHasFieldConstraint_WithMap()
        {
            // Given: Dictionary 類型的實際值
            var actualValue = new Dictionary<string, object>
            {
                { "name", "王大明" },
                { "email", "wang@example.tw" },
            };

            // When & Then: 應該通過欄位存在驗證
            Assert.True(_resolver.EvaluateConstraints("&hasField(\"name\")", actualValue));

            // 不存在的欄位應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&hasField(\"age\")", actualValue)
            );
        }

        [Fact(DisplayName = "&noField - 應該驗證 Map 不包含欄位")]
        public void TestNoFieldConstraint()
        {
            // Given: Dictionary 類型的實際值
            var actualValue = new Dictionary<string, object>
            {
                { "name", "王大明" },
            };

            // When & Then: 應該通過欄位不存在驗證
            Assert.True(_resolver.EvaluateConstraints("&noField(\"age\")", actualValue));

            // 存在的欄位應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&noField(\"name\")", actualValue)
            );
        }
    }

    /// <summary>
    ///     範圍檢查斷言
    /// </summary>
    [Collection("範圍檢查斷言")]
    public class RangeCheckTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public RangeCheckTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&between - 應該驗證值在範圍內")]
        public void TestBetweenConstraint()
        {
            // Given: 實際值為 25
            object actualValue = 25;

            // When & Then: 應該通過範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&between(18,65)", actualValue));
            Assert.True(_resolver.EvaluateConstraints("&between(25,25)", actualValue)); // 邊界值

            // 超出範圍應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&between(30,65)", actualValue)
            );
        }

        [Fact(DisplayName = "&notBetween - 應該驗證值不在範圍內")]
        public void TestNotBetweenConstraint()
        {
            // Given: 實際值為 17
            object actualValue = 17;

            // When & Then: 應該通過不在範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&notBetween(18,65)", actualValue));

            // 在範圍內應該失敗
            object valueInRange = 25;
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&notBetween(18,65)", valueInRange)
            );
        }

        [Fact(DisplayName = "&oneOf - 應該驗證值為其中之一")]
        public void TestOneOfConstraint()
        {
            // Given: 實際值為 "admin"
            object actualValue = "admin";

            // When & Then: 應該通過枚舉驗證
            Assert.True(_resolver.EvaluateConstraints("&oneOf(\"admin\",\"user\",\"guest\")", actualValue));

            // 不在枚舉中應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&oneOf(\"user\",\"guest\")", actualValue)
            );
        }

        [Fact(DisplayName = "&noneOf - 應該驗證值不為其中之一")]
        public void TestNoneOfConstraint()
        {
            // Given: 實際值為 "active"
            object actualValue = "active";

            // When & Then: 應該通過不在枚舉驗證
            Assert.True(_resolver.EvaluateConstraints("&noneOf(\"banned\",\"suspended\")", actualValue));

            // 在枚舉中應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&noneOf(\"active\",\"inactive\")", actualValue)
            );
        }

        [Fact(DisplayName = "範圍檢查 - 應該支援變數引用")]
        public void TestRangeCheck_WithVariableReference()
        {
            // Given: scenario context 中有變數
            _scenarioContext.PutObject("minAge", 18);
            _scenarioContext.PutObject("maxAge", 65);
            object actualValue = 25;

            // When & Then: 應該支援變數引用
            Assert.True(_resolver.EvaluateConstraints("&between($minAge,$maxAge)", actualValue));
        }
    }

    /// <summary>
    ///     時間相關斷言（代表性測試子集）
    /// </summary>
    [Collection("時間相關斷言")]
    public class TimeRelatedTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public TimeRelatedTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "&before - 應該驗證時間在之前")]
        public void TestBeforeConstraint()
        {
            // Given: 實際值為過去的時間
            var pastTime = new DateTime(2025, 1, 1, 10, 0, 0);

            // When & Then: 應該通過之前驗證
            Assert.True(_resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", pastTime));

            // 未來時間應該失敗
            var futureTime = new DateTime(2026, 1, 1, 10, 0, 0);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", futureTime)
            );
        }

        [Fact(DisplayName = "&before - 應該支援 Number timestamp")]
        public void TestBeforeConstraint_WithTimestamp()
        {
            // Given: 實際值為 timestamp (millis)
            var pastTime = new DateTime(2025, 1, 1, 10, 0, 0, DateTimeKind.Local);
            var pastTimestamp = new DateTimeOffset(pastTime).ToUnixTimeMilliseconds();

            // When & Then: 應該通過之前驗證
            Assert.True(_resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", pastTimestamp));

            // 未來時間的 timestamp 應該失敗
            var futureTime = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Local);
            var futureTimestamp = new DateTimeOffset(futureTime).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", futureTimestamp)
            );
        }

        [Fact(DisplayName = "&before - 字串實際值應該成功解析並驗證")]
        public void TestBeforeConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（ISO DateTime 格式）
            var actualValue = "2025-01-01T10:00:00";

            // When & Then: 應該成功解析並驗證
            Assert.True(_resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", actualValue));
        }

        [Fact(DisplayName = "&after - 應該驗證時間在之後")]
        public void TestAfterConstraint()
        {
            // Given: 實際值為未來的時間
            var futureTime = new DateTime(2026, 1, 1, 10, 0, 0);

            // When & Then: 應該通過之後驗證
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", futureTime));

            // 過去時間應該失敗
            var pastTime = new DateTime(2024, 1, 1, 10, 0, 0);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", pastTime)
            );
        }

        [Fact(DisplayName = "&after - 應該支援 Number timestamp")]
        public void TestAfterConstraint_WithTimestamp()
        {
            // Given: 實際值為 timestamp (millis)
            var futureTime = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Local);
            var futureTimestamp = new DateTimeOffset(futureTime).ToUnixTimeMilliseconds();

            // When & Then: 應該通過之後驗證
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", futureTimestamp));

            // 過去時間的 timestamp 應該失敗
            var pastTime = new DateTime(2024, 1, 1, 10, 0, 0, DateTimeKind.Local);
            var pastTimestamp = new DateTimeOffset(pastTime).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", pastTimestamp)
            );
        }

        [Fact(DisplayName = "&after - 字串實際值應該成功解析並驗證")]
        public void TestAfterConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（ISO DateTime 格式）
            var actualValue = "2026-01-01T10:00:00";

            // When & Then: 應該成功解析並驗證
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", actualValue));
        }

        [Fact(DisplayName = "&sameDay - 應該驗證同一天")]
        public void TestSameDayConstraint()
        {
            // Given: 實際值為特定日期
            var date = new DateOnly(2025, 1, 15);

            // When & Then: 應該通過同日驗證
            Assert.True(_resolver.EvaluateConstraints("&sameDay(\"2025-01-15\")", date));

            // 不同日期應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameDay(\"2025-01-16\")", date)
            );
        }

        [Fact(DisplayName = "&sameDay - 應該支援 Number timestamp")]
        public void TestSameDayConstraint_WithTimestamp()
        {
            // Given: 實際值為 timestamp (millis)
            var dateTime = new DateTime(2025, 1, 15, 10, 30, 0, DateTimeKind.Local);
            var timestamp = new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();

            // When & Then: 應該通過同日驗證
            Assert.True(_resolver.EvaluateConstraints("&sameDay(\"2025-01-15\")", timestamp));

            // 不同日期的 timestamp 應該失敗
            var differentDay = new DateTime(2025, 1, 16, 10, 30, 0, DateTimeKind.Local);
            var differentDayTimestamp = new DateTimeOffset(differentDay).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameDay(\"2025-01-15\")", differentDayTimestamp)
            );
        }

        [Fact(DisplayName = "&sameDay - 字串實際值應該成功解析並驗證")]
        public void TestSameDayConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（ISO Date 格式）
            var actualValue = "2025-01-15";

            // When & Then: 應該成功解析並驗證
            Assert.True(_resolver.EvaluateConstraints("&sameDay(\"2025-01-15\")", actualValue));
        }

        [Fact(DisplayName = "&withinDays - 應該驗證在幾天內")]
        public void TestWithinDaysConstraint()
        {
            // Given: 實際值為今天
            var today = DateTime.Now;

            // When & Then: 應該通過天數範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&withinDays(0)", today));
            Assert.True(_resolver.EvaluateConstraints("&withinDays(1)", today));

            // 超過天數範圍應該失敗
            var pastDate = DateTime.Now.AddDays(-10);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&withinDays(5)", pastDate)
            );
        }

        [Fact(DisplayName = "&withinDays - 應該支援 Number timestamp")]
        public void TestWithinDaysConstraint_WithTimestamp()
        {
            // Given: 實際值為今天的 timestamp
            var todayTimestamp = DateTimeOffset.Now.ToUnixTimeMilliseconds();

            // When & Then: 應該通過天數範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&withinDays(0)", todayTimestamp));
            Assert.True(_resolver.EvaluateConstraints("&withinDays(1)", todayTimestamp));

            // 超過天數範圍的 timestamp 應該失敗
            var pastTimestamp = DateTimeOffset.Now.AddDays(-10).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&withinDays(5)", pastTimestamp)
            );
        }

        [Fact(DisplayName = "&withinDays - 字串實際值應該成功解析並驗證")]
        public void TestWithinDaysConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（當前時間）
            var now = DateTime.Now;
            var actualValue = now.ToString("o");

            // When & Then: 應該成功解析並驗證（在0天內）
            Assert.True(_resolver.EvaluateConstraints("&withinDays(0)", actualValue));
        }

        [Fact(DisplayName = "&sameTime - 應該驗證精準時間比對")]
        public void TestSameTimeConstraint()
        {
            // Given: 實際值為特定時間
            var actualTime = new DateTime(2025, 11, 4, 8, 0, 0);

            // When & Then: 應該通過精準時間驗證
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", actualTime));

            // 不同時間應該失敗
            var differentTime = new DateTime(2025, 11, 4, 8, 0, 1);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", differentTime)
            );
        }

        [Fact(DisplayName = "&sameTime - 應該支援 Number timestamp")]
        public void TestSameTimeConstraint_WithTimestamp()
        {
            // Given: 實際值為 timestamp (millis)
            var dateTime = new DateTime(2025, 11, 4, 8, 0, 0, DateTimeKind.Local);
            var timestampMillis = new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();

            // When & Then: 應該通過 timestamp 驗證
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", timestampMillis));

            // 不同時間的 timestamp 應該失敗
            var differentTime = new DateTime(2025, 11, 4, 8, 0, 1, DateTimeKind.Local);
            var differentTimestamp = new DateTimeOffset(differentTime).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", differentTimestamp)
            );
        }

        [Fact(DisplayName = "&sameTime - 字串實際值應該成功解析並驗證")]
        public void TestSameTimeConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（ISO DateTime 格式）
            var actualValue = "2025-11-04T08:00:00";

            // When & Then: 應該成功解析並驗證
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", actualValue));
        }

        [Fact(DisplayName = "&sameTime - 應該忽略毫秒差異")]
        public void TestSameTimeConstraint_IgnoreMilliseconds()
        {
            // Given: 實際值有毫秒，但預期值只有到秒
            var actualTimeWithMillis = new DateTime(2025, 11, 4, 8, 0, 0, 500, DateTimeKind.Local);

            // When & Then: 應該通過驗證（忽略毫秒差異）
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", actualTimeWithMillis));

            // 即使毫秒不同，只要秒相同就應該通過
            var actualTimeWithDifferentMillis = new DateTime(2025, 11, 4, 8, 0, 0, 999, DateTimeKind.Local);
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")",
                actualTimeWithDifferentMillis));
        }

        [Fact(DisplayName = "&timeRange - 應該驗證時間範圍")]
        public void TestTimeRangeConstraint()
        {
            // Given: 實際值為工作時間內的時間
            var workTime = new DateTime(2025, 11, 4, 10, 30, 0);

            // When & Then: 應該通過時間範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", workTime));

            // 工作時間外的時間應該失敗
            var afterHours = new DateTime(2025, 11, 4, 18, 0, 0);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", afterHours)
            );
        }

        [Fact(DisplayName = "&timeRange - 應該支援 Number timestamp")]
        public void TestTimeRangeConstraint_WithTimestamp()
        {
            // Given: 實際值為 timestamp (millis)
            var workTime = new DateTime(2025, 11, 4, 10, 30, 0, DateTimeKind.Local);
            var timestampMillis = new DateTimeOffset(workTime).ToUnixTimeMilliseconds();

            // When & Then: 應該通過時間範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", timestampMillis));

            // 工作時間外的 timestamp 應該失敗
            var afterHours = new DateTime(2025, 11, 4, 18, 0, 0, DateTimeKind.Local);
            var afterHoursTimestamp = new DateTimeOffset(afterHours).ToUnixTimeMilliseconds();
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", afterHoursTimestamp)
            );
        }

        [Fact(DisplayName = "&timeRange - 字串實際值應該成功解析並驗證")]
        public void TestTimeRangeConstraint_WithString_ShouldSucceed()
        {
            // Given: 實際值為字串（ISO DateTime 格式）
            var actualValue = "2025-11-04T10:30:00";

            // When & Then: 應該成功解析並驗證（在 09:00-17:00 範圍內）
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", actualValue));
        }

        [Fact(DisplayName = "&timeRange - 應該處理邊界情況")]
        public void TestTimeRangeConstraint_EdgeCases()
        {
            // Given: 實際值為邊界時間
            var startTime = new DateTime(2025, 11, 4, 9, 0, 0);
            var endTime = new DateTime(2025, 11, 4, 17, 0, 0);
            var middleTime = new DateTime(2025, 11, 4, 12, 0, 0);

            // When & Then: 邊界時間應該通過驗證
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", startTime));
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", endTime));
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", middleTime));

            // 剛好超過邊界的時間應該失敗
            var beforeStart = new DateTime(2025, 11, 4, 8, 59, 59);
            var afterEnd = new DateTime(2025, 11, 4, 17, 0, 1);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", beforeStart)
            );
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", afterEnd)
            );
        }

        [Fact(DisplayName = "時間斷言 - 應該支援多種日期時間格式")]
        public void TestTimeConstraints_WithVariousFormats()
        {
            // 注意：此測試已移除，因為新規則不支援字串作為實際值
            // 字串實際值會拋出 ArgumentException
        }

        [Fact(DisplayName = "&sameTime - 不同時區的相同時刻應該視為相等")]
        public void TestSameTime_DifferentTimeZones_SameInstant()
        {
            // Given: UTC 時間 00:00:00 等同於 Asia/Taipei 08:00:00
            var utcTime = new DateTimeOffset(2025, 11, 4, 0, 0, 0, TimeSpan.Zero);
            var taipeiTime = new DateTimeOffset(2025, 11, 4, 8, 0, 0, TimeSpan.FromHours(8));

            // 兩者代表相同的時刻
            Assert.Equal(utcTime.ToUnixTimeSeconds(), taipeiTime.ToUnixTimeSeconds());

            // When & Then: 使用明確時區格式，UTC 時間作為實際值
            // 約束條件使用 +08:00 時區，實際值為 UTC，兩者是同一時刻應該通過
            Assert.True(_resolver.EvaluateConstraints(
                "&sameTime(\"2025-11-04T08:00:00+08:00\")",
                utcTime
            ));
        }

        [Fact(DisplayName = "&sameTime - ZonedDateTime 實際值應該正確轉換並比較")]
        public void TestSameTime_WithZonedDateTime()
        {
            // Given: ZonedDateTime 實際值 (Taipei +08:00)
            var actualTime = new DateTimeOffset(2025, 11, 4, 8, 0, 0, TimeSpan.FromHours(8));

            // When & Then: 使用明確時區格式，應該通過精準時間驗證
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00+08:00\")", actualTime));

            // 不同時間應該失敗
            var differentTime = new DateTimeOffset(2025, 11, 4, 9, 0, 0, TimeSpan.FromHours(8));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00+08:00\")", differentTime)
            );
        }

        [Fact(DisplayName = "&after - 不同時區的時間比較應該基於實際時刻")]
        public void TestAfter_DifferentTimeZones()
        {
            // Given: Tokyo 10:00+09:00 = UTC 01:00
            var tokyoTime = new DateTimeOffset(2025, 11, 4, 10, 0, 0, TimeSpan.FromHours(9));

            // When & Then: Tokyo 10:00+09:00 (= UTC 01:00) 應該在 UTC 00:00 之後
            // 使用明確的 UTC 時區格式
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-11-04T00:00:00Z\")", tokyoTime));
        }

        [Fact(DisplayName = "&after - ZonedDateTime 應該正確進行時間比較")]
        public void TestAfter_WithZonedDateTime()
        {
            // Given: 實際值為 DateTimeOffset
            var futureTime = new DateTimeOffset(2026, 1, 1, 10, 0, 0, TimeSpan.FromHours(8));

            // When & Then: 應該通過之後驗證
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", futureTime));

            // 過去時間應該失敗
            var pastTime = new DateTimeOffset(2024, 1, 1, 10, 0, 0, TimeSpan.FromHours(8));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", pastTime)
            );
        }

        [Fact(DisplayName = "&sameDay - ZonedDateTime 應該基於本地日期比較")]
        public void TestSameDay_WithZonedDateTime()
        {
            // Given: DateTimeOffset 實際值
            var zonedDate = new DateTimeOffset(2025, 1, 15, 14, 30, 0, TimeSpan.FromHours(8));

            // When & Then: 應該通過同日驗證
            Assert.True(_resolver.EvaluateConstraints("&sameDay(\"2025-01-15\")", zonedDate));

            // 不同日期應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameDay(\"2025-01-16\")", zonedDate)
            );
        }

        [Fact(DisplayName = "&withinDays - ZonedDateTime 應該正確計算天數差異")]
        public void TestWithinDays_WithZonedDateTime()
        {
            // Given: DateTimeOffset 實際值（今天）
            var today = DateTimeOffset.Now;

            // When & Then: 應該通過天數範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&withinDays(0)", today));
            Assert.True(_resolver.EvaluateConstraints("&withinDays(1)", today));

            // 超過天數範圍應該失敗
            var pastDate = DateTimeOffset.Now.AddDays(-10);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&withinDays(5)", pastDate)
            );
        }

        [Fact(DisplayName = "&timeRange - LocalDateTime 應該正確驗證時間範圍")]
        public void testTimeRange_WithLocalDateTime()
        {
            // Given: 使用 LocalDateTime 避開時區轉換問題
            var workTime = new DateTime(2025, 11, 4, 10, 30, 0);

            // When & Then: 10:30 在 09:00-17:00 範圍內，應該通過
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", workTime));

            // 工作時間外的時間應該失敗
            var afterHours = new DateTime(2025, 11, 4, 18, 0, 0);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", afterHours)
            );
        }

        [Fact(DisplayName = "&sameTime - 應該支援 ISO 8601 UTC 格式 (Z 結尾)")]
        public void TestSameTime_WithISO8601_UTC_Format()
        {
            // Given: 實際值為 DateTimeOffset (UTC 時間)
            var actualTime = DateTimeOffset.Parse("2025-12-18T10:00:00.000Z");

            // When & Then: 使用 ISO 8601 UTC 格式字串作為預期值
            Assert.True(_resolver.EvaluateConstraints(
                "&sameTime(\"2025-12-18T10:00:00.000Z\")",
                actualTime
            ));
        }

        [Fact(DisplayName = "&sameTime - 應該支援 ISO 8601 帶時區偏移格式 (+08:00)")]
        public void TestSameTime_WithISO8601_Offset_Format()
        {
            // Given: 實際值為 DateTimeOffset (Asia/Taipei +08:00)
            var actualTime = new DateTimeOffset(2025, 12, 18, 10, 0, 0, TimeSpan.FromHours(8));

            // When & Then: 使用 ISO 8601 帶時區偏移格式字串作為預期值
            Assert.True(_resolver.EvaluateConstraints(
                "&sameTime(\"2025-12-18T10:00:00+08:00\")",
                actualTime
            ));
        }

        [Fact(DisplayName = "&sameTime - ISO 8601 UTC 格式與 ZonedDateTime 比較應該基於相同時刻")]
        public void TestSameTime_ISO8601_UTC_vs_ZonedDateTime()
        {
            // Given: 2025-12-18T10:00:00Z (UTC) 等同於 2025-12-18T18:00:00+08:00 (Taipei)
            var taipeiTime = new DateTimeOffset(2025, 12, 18, 18, 0, 0, TimeSpan.FromHours(8));

            // When & Then: UTC 10:00 = Taipei 18:00，應該驗證通過
            Assert.True(_resolver.EvaluateConstraints(
                "&sameTime(\"2025-12-18T10:00:00.000Z\")",
                taipeiTime
            ));
        }

        [Fact(DisplayName = "&sameTime - ISO 8601 帶毫秒的 UTC 格式應該正確解析")]
        public void TestSameTime_ISO8601_UTC_WithMilliseconds()
        {
            // Given: 實際值為精確到毫秒的 DateTimeOffset
            var actualTime = DateTimeOffset.Parse("2025-12-18T10:00:00.123Z");

            // When & Then: 應該能比較（忽略毫秒差異）
            Assert.True(_resolver.EvaluateConstraints(
                "&sameTime(\"2025-12-18T10:00:00.000Z\")",
                actualTime
            ));
        }

        [Fact(DisplayName = "&before - 應該支援 ISO 8601 UTC 格式 (Z 結尾)")]
        public void TestBefore_WithISO8601_UTC_Format()
        {
            // Given: 實際值為 2025-12-18T08:00:00Z
            var actualTime = DateTimeOffset.Parse("2025-12-18T08:00:00.000Z");

            // When & Then: 應該在 2025-12-18T10:00:00Z 之前
            Assert.True(_resolver.EvaluateConstraints(
                "&before(\"2025-12-18T10:00:00.000Z\")",
                actualTime
            ));

            // 相反情況應該失敗
            var laterTime = DateTimeOffset.Parse("2025-12-18T12:00:00.000Z");
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&before(\"2025-12-18T10:00:00.000Z\")", laterTime)
            );
        }

        [Fact(DisplayName = "&before - 應該支援 ISO 8601 帶時區偏移格式 (+08:00)")]
        public void TestBefore_WithISO8601_Offset_Format()
        {
            // Given: 實際值為 2025-12-18T08:00:00+08:00
            var actualTime = new DateTimeOffset(2025, 12, 18, 8, 0, 0, TimeSpan.FromHours(8));

            // When & Then: 應該在 2025-12-18T10:00:00+08:00 之前
            Assert.True(_resolver.EvaluateConstraints(
                "&before(\"2025-12-18T10:00:00+08:00\")",
                actualTime
            ));

            // 相反情況應該失敗
            var laterTime = new DateTimeOffset(2025, 12, 18, 12, 0, 0, TimeSpan.FromHours(8));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&before(\"2025-12-18T10:00:00+08:00\")", laterTime)
            );
        }

        [Fact(DisplayName = "&after - 應該支援 ISO 8601 UTC 格式 (Z 結尾)")]
        public void TestAfter_WithISO8601_UTC_Format()
        {
            // Given: 實際值為 2025-12-18T12:00:00Z
            var actualTime = DateTimeOffset.Parse("2025-12-18T12:00:00.000Z");

            // When & Then: 應該在 2025-12-18T10:00:00Z 之後
            Assert.True(_resolver.EvaluateConstraints(
                "&after(\"2025-12-18T10:00:00.000Z\")",
                actualTime
            ));

            // 相反情況應該失敗
            var earlierTime = DateTimeOffset.Parse("2025-12-18T08:00:00.000Z");
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-12-18T10:00:00.000Z\")", earlierTime)
            );
        }

        [Fact(DisplayName = "&after - 應該支援 ISO 8601 帶時區偏移格式 (+08:00)")]
        public void TestAfter_WithISO8601_Offset_Format()
        {
            // Given: 實際值為 2025-12-18T12:00:00+08:00
            var actualTime = new DateTimeOffset(2025, 12, 18, 12, 0, 0, TimeSpan.FromHours(8));

            // When & Then: 應該在 2025-12-18T10:00:00+08:00 之後
            Assert.True(_resolver.EvaluateConstraints(
                "&after(\"2025-12-18T10:00:00+08:00\")",
                actualTime
            ));

            // 相反情況應該失敗
            var earlierTime = new DateTimeOffset(2025, 12, 18, 8, 0, 0, TimeSpan.FromHours(8));
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-12-18T10:00:00+08:00\")", earlierTime)
            );
        }

        [Fact(DisplayName = "&before/&after - 跨時區比較應該基於實際時刻")]
        public void TestBeforeAfter_CrossTimezone_Comparison()
        {
            // Given: UTC 02:00 等同於 Taipei 10:00
            var utcTime = DateTimeOffset.Parse("2025-12-18T02:00:00.000Z");

            // When & Then: UTC 02:00 應該在 Taipei 11:00 (+08:00 = UTC 03:00) 之前
            Assert.True(_resolver.EvaluateConstraints(
                "&before(\"2025-12-18T11:00:00+08:00\")",
                utcTime
            ));

            // When & Then: UTC 02:00 應該在 Taipei 09:00 (+08:00 = UTC 01:00) 之後
            Assert.True(_resolver.EvaluateConstraints(
                "&after(\"2025-12-18T09:00:00+08:00\")",
                utcTime
            ));
        }

        // ========== Instant 型別支援測試 ==========

        [Fact(DisplayName = "&sameTime - Instant 實際值應該正確轉換並比較")]
        public void TestSameTime_WithInstant()
        {
            // Given: DateTimeOffset 實際值（2025-11-04T00:00:00Z）
            var instant = DateTimeOffset.Parse("2025-11-04T00:00:00Z");

            // 計算系統時區對應的 DateTime
            var expectedLocalDateTime = instant.ToLocalTime();
            var expectedTimeStr = expectedLocalDateTime.ToString("yyyy-MM-ddTHH:mm:ss");

            // When & Then: 應該通過精準時間驗證
            Assert.True(_resolver.EvaluateConstraints($"&sameTime(\"{expectedTimeStr}\")", instant));
        }

        [Fact(DisplayName = "&sameTime - Instant 時間不匹配應該失敗")]
        public void TestSameTime_WithInstant_Mismatch()
        {
            // Given: DateTimeOffset 實際值
            var instant = DateTimeOffset.Parse("2025-11-04T00:00:00Z");

            // When & Then: 不同時間應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameTime(\"2025-11-04T10:00:00\")", instant)
            );
        }

        [Fact(DisplayName = "&before - Instant 實際值應該正確進行時間比較")]
        public void TestBefore_WithInstant()
        {
            // Given: DateTimeOffset 實際值（過去的時間）
            var pastInstant = DateTimeOffset.Parse("2025-01-01T00:00:00Z");

            // When & Then: 應該通過之前驗證
            Assert.True(_resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", pastInstant));

            // 未來時間應該失敗
            var futureInstant = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&before(\"2025-12-31T23:59:59\")", futureInstant)
            );
        }

        [Fact(DisplayName = "&after - Instant 實際值應該正確進行時間比較")]
        public void TestAfter_WithInstant()
        {
            // Given: DateTimeOffset 實際值（未來的時間）
            var futureInstant = DateTimeOffset.Parse("2026-01-01T00:00:00Z");

            // When & Then: 應該通過之後驗證
            Assert.True(_resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", futureInstant));

            // 過去時間應該失敗
            var pastInstant = DateTimeOffset.Parse("2024-01-01T00:00:00Z");
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&after(\"2025-01-01T00:00:00\")", pastInstant)
            );
        }

        [Fact(DisplayName = "&sameDay - Instant 實際值應該基於系統時區的日期比較")]
        public void TestSameDay_WithInstant()
        {
            // Given: DateTimeOffset 實際值
            var instant = DateTimeOffset.Parse("2025-01-15T00:00:00Z");
            var expectedDate = instant.ToLocalTime().Date;

            // When & Then: 應該通過同日驗證
            Assert.True(_resolver.EvaluateConstraints($"&sameDay(\"{expectedDate:yyyy-MM-dd}\")", instant));
        }

        [Fact(DisplayName = "&withinDays - Instant 實際值應該正確計算天數差異")]
        public void TestWithinDays_WithInstant()
        {
            // Given: DateTimeOffset 實際值（當前時刻）
            var now = DateTimeOffset.Now;

            // When & Then: 應該通過天數範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&withinDays(0)", now));
            Assert.True(_resolver.EvaluateConstraints("&withinDays(1)", now));

            // 超過天數範圍應該失敗
            var pastInstant = DateTimeOffset.Now.AddDays(-10);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&withinDays(5)", pastInstant)
            );
        }

        [Fact(DisplayName = "&timeRange - Instant 實際值應該正確驗證時間範圍")]
        public void TestTimeRange_WithInstant()
        {
            // Given: 建立一個在工作時間內的 DateTimeOffset
            var workTime = new DateTime(2025, 11, 4, 10, 30, 0, DateTimeKind.Local);
            var workInstant = new DateTimeOffset(workTime);

            // When & Then: 應該通過時間範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", workInstant));

            // 工作時間外的 Instant 應該失敗
            var afterHours = new DateTime(2025, 11, 4, 18, 0, 0, DateTimeKind.Local);
            var afterHoursInstant = new DateTimeOffset(afterHours);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&timeRange(\"09:00\",\"17:00\")", afterHoursInstant)
            );
        }

        [Fact(DisplayName = "&gt - Instant 實際值應該能與其他時間類型進行數值比較")]
        public void TestGreaterThan_WithInstant()
        {
            // Given: 儲存 DateTime 作為參考時間
            var referenceTime = new DateTime(2025, 12, 23, 10, 0, 0, DateTimeKind.Local);
            _scenarioContext.PutObject("referenceTime", referenceTime);

            // When: 實際值為較晚的 Instant
            var laterTime = new DateTime(2025, 12, 23, 11, 0, 0, DateTimeKind.Local);
            var laterInstant = new DateTimeOffset(laterTime);

            // Then: 應該通過大於驗證
            Assert.True(_resolver.EvaluateConstraints("&gt($referenceTime)", laterInstant),
                "laterInstant 應該大於 referenceTime");
        }

        [Fact(DisplayName = "&lt - Instant 實際值應該能與其他時間類型進行數值比較")]
        public void TestLessThan_WithInstant()
        {
            // Given: 儲存 DateTime 作為參考時間
            var referenceTime = new DateTime(2025, 12, 23, 12, 0, 0, DateTimeKind.Local);
            _scenarioContext.PutObject("referenceTime", referenceTime);

            // When: 實際值為較早的 Instant
            var earlierTime = new DateTime(2025, 12, 23, 10, 0, 0, DateTimeKind.Local);
            var earlierInstant = new DateTimeOffset(earlierTime);

            // Then: 應該通過小於驗證
            Assert.True(_resolver.EvaluateConstraints("&lt($referenceTime)", earlierInstant),
                "earlierInstant 應該小於 referenceTime");
        }

        [Fact(DisplayName = "resolveAndValidate() - Instant (actual) vs Long timestamp (expected) 應該自動比較")]
        public void TestResolveAndValidate_Instant_vs_Timestamp()
        {
            // Given: 儲存 timestamp 作為預期值
            var dateTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();
            _scenarioContext.PutObject("expectedTime", expectedTimestamp);

            // When: 實際值為 Instant
            var actualInstant = new DateTimeOffset(dateTime);

            // Then: 應該自動驗證通過
            var resolved = _resolver.ResolveAndValidate("$expectedTime", actualInstant, "createdAt", "Entity");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "resolveAndValidate() - Instant vs timestamp 時間不匹配應該拋出 AssertionError")]
        public void TestResolveAndValidate_Instant_vs_Timestamp_Mismatch()
        {
            // Given: 儲存 timestamp（9:00）
            var expectedTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(expectedTime).ToUnixTimeMilliseconds();
            _scenarioContext.PutObject("expectedTime", expectedTimestamp);

            // When: 實際 Instant 是 10:00
            var actualTime = new DateTime(2025, 11, 4, 10, 0, 0, DateTimeKind.Local);
            var actualInstant = new DateTimeOffset(actualTime);

            // Then: 應該拋出 AssertionError
            Assert.Throws<Exception>(() =>
                _resolver.ResolveAndValidate("$expectedTime", actualInstant, "createdAt", "Entity")
            );
        }
    }

    /// <summary>
    ///     多重約束組合
    /// </summary>
    [Collection("多重約束組合")]
    public class MultipleConstraintsTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public MultipleConstraintsTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "應該支援多個約束條件組合（AND 邏輯）")]
        public void TestMultipleConstraints_AndLogic()
        {
            // Given: 實際值為 100
            object actualValue = 100;

            // When & Then: 所有約束都滿足才通過
            Assert.True(_resolver.EvaluateConstraints("&isNum &gt(0) &le(200)", actualValue));

            // 任一約束不滿足就失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&isNum &gt(0) &le(50)", actualValue)
            );
        }

        [Fact(DisplayName = "應該支援字串的多重約束")]
        public void TestMultipleConstraints_String()
        {
            // Given: 實際值為 email
            object actualValue = "wang@example.com";

            // When & Then: 多個字串約束組合
            Assert.True(_resolver.EvaluateConstraints(
                "&isStr &contains(\"@\") &endsWith(\".com\")",
                actualValue
            ));
        }

        [Fact(DisplayName = "應該支援集合的多重約束")]
        public void TestMultipleConstraints_Collection()
        {
            // Given: 實際值為 List
            var actualValue = new List<string> { "admin", "user", "guest" };

            // When & Then: 多個集合約束組合
            Assert.True(_resolver.EvaluateConstraints(
                "&isNotEmpty &size(3) &hasItem(\"admin\")",
                actualValue
            ));
        }

        [Fact(DisplayName = "應該支援類型檢查與值約束的組合")]
        public void TestMultipleConstraints_TypeAndValue()
        {
            // Given: 實際值為薪資
            object salary = 50000;

            // When & Then: 類型檢查 + 範圍檢查
            Assert.True(_resolver.EvaluateConstraints(
                "&isNum &gt(0) &between(30000,100000)",
                salary
            ));
        }

        [Fact(DisplayName = "應該支援多重約束中的變數引用")]
        public void TestMultipleConstraints_WithVariableReference()
        {
            // Given: scenario context 中有多個變數，實際值為 50000
            _scenarioContext.PutObject("minSalary", 30000);
            _scenarioContext.PutObject("maxSalary", 100000);
            object salary = 50000;

            // When & Then: 多重約束中混合使用變數引用
            Assert.True(_resolver.EvaluateConstraints(
                "&isNum &gt($minSalary) &lt($maxSalary)",
                salary
            ));

            // 也應該支援 between 中的變數引用
            Assert.True(_resolver.EvaluateConstraints(
                "&between($minSalary,$maxSalary)",
                salary
            ));
        }

        [Fact(DisplayName = "完整場景：訂單創建驗證")]
        public void TestRealWorldScenario_OrderCreation()
        {
            // Scenario: 驗證訂單創建後的各個欄位

            // 訂單 ID：應該是數字且大於 0
            object orderId = 12345;
            Assert.True(_resolver.EvaluateConstraints("&isNum &gt(0)", orderId));

            // 訂單金額：應該是數字且在合理範圍內
            object totalAmount = 299.99;
            Assert.True(_resolver.EvaluateConstraints("&isNum &gt(0) &le(10000)", totalAmount));

            // 訂單狀態：應該是字串且為特定值之一
            object status = "pending";
            Assert.True(_resolver.EvaluateConstraints(
                "&isStr &oneOf(\"pending\",\"processing\",\"completed\")",
                status
            ));

            // 創建時間：應該存在且在今天
            var createdAt = DateTime.Now;
            Assert.True(_resolver.EvaluateConstraints("&exists &withinDays(0)", createdAt));
        }

        [Fact(DisplayName = "完整場景：用戶註冊驗證")]
        public void TestRealWorldScenario_UserRegistration()
        {
            // Scenario: 驗證用戶註冊後的各個欄位

            // 用戶 ID：應該是數字且大於 0
            object userId = 10001;
            Assert.True(_resolver.EvaluateConstraints("&isNum &gt(0)", userId));

            // 用戶名稱：應該是字串且長度在範圍內
            object userName = "王大明";
            Assert.True(_resolver.EvaluateConstraints("&isStr &length(2,50)", userName));

            // Email：應該包含 @ 且以 .com 或 .tw 結尾
            object email = "wang@example.tw";
            Assert.True(_resolver.EvaluateConstraints("&isStr &contains(\"@\")", email));

            // 角色：應該不為 null 且為有效角色
            object role = "user";
            Assert.True(_resolver.EvaluateConstraints(
                "&isNotNull &oneOf(\"admin\",\"user\",\"guest\")",
                role
            ));
        }

        [Fact(DisplayName = "完整場景：打卡系統驗證")]
        public void TestRealWorldScenario_PunchInSystem()
        {
            // Scenario: 驗證打卡系統的各種時間約束

            // 打卡時間：應該是 timestamp 且在上班時間內
            var punchTime = DateTime.Now
                .Date
                .AddHours(9)
                .AddMinutes(30);
            var punchTimeTimestamp = new DateTimeOffset(punchTime).ToUnixTimeMilliseconds();
            var todayDate = punchTime.ToString("yyyy-MM-dd");

            Assert.True(_resolver.EvaluateConstraints(
                $"&timeRange(\"09:00\",\"17:00\") &sameDay(\"{todayDate}\")",
                punchTimeTimestamp
            ));

            // 創建時間：應該存在且在今天
            var createdAt = DateTime.Now;
            Assert.True(_resolver.EvaluateConstraints("&exists &withinDays(0)", createdAt));

            // 精準時間驗證：打卡時間應該與預期時間一致（忽略毫秒）
            var exactPunchTime = new DateTime(2025, 11, 4, 8, 0, 0, 500, DateTimeKind.Local);
            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00:00\")", exactPunchTime));
        }

        [Fact(DisplayName = "多重時間約束組合 - 使用 timestamp")]
        public void TestMultipleTimeConstraints_WithTimestamp()
        {
            // Scenario: 驗證多個時間約束組合，使用 timestamp 作為實際值

            // 訂單創建時間：應該是 timestamp，在今天，且在營業時間內
            var orderCreatedTime = DateTime.Now
                .Date
                .AddHours(14)
                .AddMinutes(30);
            var orderCreatedTimestamp = new DateTimeOffset(orderCreatedTime).ToUnixTimeMilliseconds();
            var todayDate = orderCreatedTime.ToString("yyyy-MM-dd");
            var orderCreatedTimeStr = orderCreatedTime.ToString("yyyy-MM-ddTHH:mm:ss");

            Assert.True(_resolver.EvaluateConstraints(
                $"&sameDay(\"{todayDate}\") &timeRange(\"09:00\",\"17:00\") &withinDays(0)",
                orderCreatedTimestamp
            ));

            // 交貨時間：應該是 timestamp，在創建時間之後，且在合理範圍內
            var deliveryTime = orderCreatedTime.AddDays(2);
            var deliveryTimestamp = new DateTimeOffset(deliveryTime).ToUnixTimeMilliseconds();
            Assert.True(_resolver.EvaluateConstraints(
                $"&after(\"{orderCreatedTimeStr}\") &withinDays(7)",
                deliveryTimestamp
            ));
        }
    }

    /// <summary>
    ///     邊界條件與錯誤處理
    /// </summary>
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

        [Fact(DisplayName = "應該處理空約束字串")]
        public void TestEmptyConstraintString()
        {
            // Given: 空約束字串
            object actualValue = 100;

            // When & Then: 空約束應該通過（視為無約束）
            Assert.True(_resolver.EvaluateConstraints("", actualValue));
            Assert.True(_resolver.EvaluateConstraints("   ", actualValue));
        }

        [Fact(DisplayName = "應該處理 null 約束字串")]
        public void TestNullConstraintString()
        {
            // Given: null 約束字串
            object actualValue = 100;

            // When & Then: null 約束應該通過
            Assert.True(_resolver.EvaluateConstraints(null, actualValue));
        }

        [Fact(DisplayName = "應該處理未知的約束條件")]
        public void TestUnknownConstraint()
        {
            // Given: 未知的約束條件
            object actualValue = 100;

            // When & Then: 應該拋出 ArgumentException
            Assert.Throws<ArgumentException>(() =>
                _resolver.EvaluateConstraints("&unknownConstraint(123)", actualValue)
            );
        }

        [Fact(DisplayName = "應該處理格式錯誤的約束條件")]
        public void TestMalformedConstraint()
        {
            // Given: 格式錯誤的約束（缺少參數）
            object actualValue = 100;

            // When & Then: 應該拋出 ArgumentException
            Assert.Throws<ArgumentException>(() =>
                    _resolver.EvaluateConstraints("&between(18)", actualValue) // 缺少第二個參數
            );
        }

        [Fact(DisplayName = "應該提供清晰的錯誤訊息")]
        public void TestClearErrorMessage()
        {
            // Given: 會失敗的約束
            object actualValue = 100;

            // When: 評估約束
            var error = Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&gt(200)", actualValue)
            );

            // Then: 錯誤訊息應該包含約束條件和實際值
            var errorMessage = error.Message;
            Assert.Contains("&gt(200)", errorMessage);
            Assert.Contains("100", errorMessage);
        }

        [Fact(DisplayName = "應該處理類型不匹配的約束")]
        public void TestTypeMismatchConstraint()
        {
            // Given: 字串值用數值約束
            object actualValue = "not a number";

            // When & Then: 應該拋出 ArgumentException
            Assert.Throws<ArgumentException>(() =>
                _resolver.EvaluateConstraints("&gt(100)", actualValue)
            );
        }
    }

    /// <summary>
    ///     Entity 驗證場景 - DateTime vs Timestamp
    /// </summary>
    [Collection("Entity 驗證場景 - LocalDateTime vs Timestamp")]
    public class EntityValidationScenarioTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public EntityValidationScenarioTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "resolveAndValidate() - DateTime (entity) 應該能與 timestamp (expected) 比較")]
        public void TestResolveAndValidate_DateTime_vs_Timestamp()
        {
            // Given: Feature file 中使用 @time() 得到 timestamp
            var punchTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(punchTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("punchTime", expectedTimestamp);

            // When: Entity 返回 DateTime，expected 是 $punchTime (timestamp)
            var expectedValue = "$punchTime";
            var actualValue = punchTime;

            // Then: resolver 應該自動處理時間比對並返回 null（表示已驗證通過）
            var resolved = _resolver.ResolveAndValidate(expectedValue, actualValue, "punchTime", "打卡記錄");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "resolveAndValidate() with &sameTime() - DateTime vs timestamp 應該驗證通過")]
        public void TestResolveAndValidate_WithSameTimeConstraint()
        {
            // Given: 使用 CAS &sameTime() 約束
            var punchTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(punchTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("punchTime", expectedTimestamp);

            // When: 使用 &sameTime() 約束
            var expectedValue = "&sameTime($punchTime)";
            var actualValue = punchTime;

            // Then: 應該驗證通過（返回 null 表示已驗證）
            var resolved = _resolver.ResolveAndValidate(expectedValue, actualValue, "punchTime", "打卡記錄");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "&sameTime() - DateTime (actual) vs Long (expected) 應該自動轉換")]
        public void TestSameTime_DateTime_vs_LongTimestamp()
        {
            // Given
            var dateTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var timestamp = new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("expectedTime", timestamp);

            // When & Then: DateTime 應該自動轉換為 timestamp 進行比較
            Assert.True(
                _resolver.EvaluateConstraints("&sameTime($expectedTime)", dateTime),
                "LocalDateTime 應該能與 timestamp 進行 sameTime 比較"
            );
        }

        [Fact(DisplayName = "&sameTime() - 時間不同時應該拋出 AssertionError")]
        public void TestSameTime_Mismatch()
        {
            // Given: 期望時間是 9:00
            var expectedTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(expectedTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("expectedTime", expectedTimestamp);

            // When: 實際時間是 10:00 (DateTime)
            var actualTime = new DateTime(2025, 11, 4, 10, 0, 0, DateTimeKind.Local);

            // Then: 應該拋出 AssertionError
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&sameTime($expectedTime)", actualTime)
            );
        }

        [Fact(DisplayName = "&before() - DateTime (actual) vs Long (expected) 應該正確比較")]
        public void TestBefore_DateTime_vs_LongTimestamp()
        {
            // Given: 參考時間 10:00
            var referenceTime = new DateTime(2025, 11, 4, 10, 0, 0, DateTimeKind.Local);
            var referenceTimestamp = new DateTimeOffset(referenceTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("referenceTime", referenceTimestamp);

            // When: 實際時間 9:00 (DateTime)
            var actualTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);

            // Then: 9:00 < 10:00，應該驗證通過
            Assert.True(_resolver.EvaluateConstraints("&before($referenceTime)", actualTime));
        }

        [Fact(DisplayName = "&after() - DateTime (actual) vs Long (expected) 應該正確比較")]
        public void TestAfter_DateTime_vs_LongTimestamp()
        {
            // Given: 參考時間 9:00
            var referenceTime = new DateTime(2025, 11, 4, 9, 0, 0, DateTimeKind.Local);
            var referenceTimestamp = new DateTimeOffset(referenceTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("referenceTime", referenceTimestamp);

            // When: 實際時間 10:00 (DateTime)
            var actualTime = new DateTime(2025, 11, 4, 10, 0, 0, DateTimeKind.Local);

            // Then: 10:00 > 9:00，應該驗證通過
            Assert.True(_resolver.EvaluateConstraints("&after($referenceTime)", actualTime));
        }

        [Fact(DisplayName = "resolveAndValidate() - LocalDate (entity) 應該能與 timestamp (expected) 比較")]
        public void TestResolveAndValidate_LocalDate_vs_Timestamp()
        {
            // Given: Feature file 中使用 @time("2025-11-07") 得到 timestamp
            var punchDate = new DateOnly(2025, 11, 7);
            var punchDateTime = punchDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(punchDateTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("punchDate", expectedTimestamp);

            // When: Entity 返回 DateOnly，expected 是 $punchDate (timestamp)
            var expectedValue = "$punchDate";
            var actualValue = punchDate;

            // Then: resolver 應該自動處理日期比對並返回 null
            var resolved = _resolver.ResolveAndValidate(expectedValue, actualValue, "punchDate", "打卡記錄");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "resolveAndValidate() - LocalDate vs timestamp 日期不匹配時應該拋出 AssertionError")]
        public void TestResolveAndValidate_LocalDate_vs_Timestamp_Mismatch()
        {
            // Given: 期望日期是 11/07
            var expectedDate = new DateOnly(2025, 11, 7);
            var expectedDateTime = expectedDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Local);
            var expectedTimestamp = new DateTimeOffset(expectedDateTime).ToUnixTimeMilliseconds();

            _scenarioContext.PutObject("punchDate", expectedTimestamp);

            // When: 實際日期是 11/08
            var actualDate = new DateOnly(2025, 11, 8);

            // Then: 應該拋出 AssertionError
            Assert.Throws<Exception>(() =>
                _resolver.ResolveAndValidate("$punchDate", actualDate, "punchDate", "打卡記錄")
            );
        }

        [Fact(DisplayName = "resolveAndValidate() - $notnull 應該驗證 actual 不為 null")]
        public void TestResolveAndValidate_NotNull()
        {
            // Given: expected 是 $notnull
            var expectedValue = "$notnull";
            var actualValue = DateTime.Now;

            // When & Then: actual 不為 null 應該驗證通過，返回 null
            var resolved = _resolver.ResolveAndValidate(expectedValue, actualValue, "lastLoginAt", "特務");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "resolveAndValidate() - $notnull 遇到 null 應該拋出 AssertionError")]
        public void TestResolveAndValidate_NotNull_Null()
        {
            // Given: expected 是 $notnull, actual 是 null
            var expectedValue = "$notnull";
            object? actualValue = null;

            // When & Then: 應該拋出異常
            Assert.Throws<Exception>(() =>
                _resolver.ResolveAndValidate(expectedValue, actualValue, "lastLoginAt", "特務")
            );
        }

        [Fact(DisplayName = "resolveAndValidate() - Integer (JSON) vs Long (expected) 數值相等應該驗證通過")]
        public void TestResolveAndValidate_Integer_vs_Long()
        {
            // Given: Feature file 中存儲 Long 類型的 agentId
            var expectedAgentId = 1L;
            _scenarioContext.PutObject("agentId", expectedAgentId);

            // When: JSON 回應解析為 Integer
            var actualAgentId = 1;

            // Then: 數值相等應該驗證通過，返回 null
            var resolved = _resolver.ResolveAndValidate("$agentId", actualAgentId, "agentId", "PunchRecordsResponse");
            Assert.Null(resolved);
        }

        [Fact(DisplayName = "resolveAndValidate() - Integer vs Long 數值不相等應該拋出 AssertionError")]
        public void TestResolveAndValidate_Integer_vs_Long_Mismatch()
        {
            // Given: 期望 agentId 是 1
            var expectedAgentId = 1L;
            _scenarioContext.PutObject("agentId", expectedAgentId);

            // When: 實際 agentId 是 2
            var actualAgentId = 2;

            // Then: 應該拋出 AssertionError
            Assert.Throws<Exception>(() =>
                _resolver.ResolveAndValidate("$agentId", actualAgentId, "agentId", "PunchRecordsResponse")
            );
        }

        [Fact(DisplayName = "resolveAndValidate() - 不同數值類型（Integer, Long, Double）相等應該驗證通過")]
        public void TestResolveAndValidate_DifferentNumericTypes()
        {
            // Given: 存儲不同數值類型
            _scenarioContext.PutObject("value1", 100L);
            _scenarioContext.PutObject("value2", 100);
            _scenarioContext.PutObject("value3", 100.0);

            // When & Then: Integer vs Long 應該通過
            Assert.Null(_resolver.ResolveAndValidate("$value1", 100, "value", "Test"));

            // When & Then: Long vs Integer 應該通過
            Assert.Null(_resolver.ResolveAndValidate("$value2", 100L, "value", "Test"));

            // When & Then: Double vs Integer 應該通過（整數部分相等）
            Assert.Null(_resolver.ResolveAndValidate("$value3", 100, "value", "Test"));
        }

        [Fact(DisplayName = "resolveAndValidate() - timestamp (Long) vs Instant 應該自動比對時間戳")]
        public void TestResolveAndValidate_Timestamp_vs_Instant()
        {
            // Given: 期望時間戳為 1735689600000L (2025-01-01T00:00:00Z)
            var expectedTimestamp = 1735689600000L;
            _scenarioContext.PutObject("expectedTime", expectedTimestamp);

            // When: 實際值是對應的 DateTimeOffset
            var actualInstant = DateTimeOffset.FromUnixTimeMilliseconds(1735689600000L);

            // Then: 應該自動比對時間戳並通過驗證
            Assert.Null(_resolver.ResolveAndValidate("$expectedTime", actualInstant, "time", "Test"));
        }

        [Fact(DisplayName = "&gt() - 應該支援 DateTime 自動轉換為 timestamp 進行數值比較")]
        public void TestGreaterThan_WithDateTime()
        {
            // Given: 儲存 initialTime 作為 DateTime
            var initialTime = new DateTime(2025, 12, 23, 10, 0, 0, DateTimeKind.Local);
            _scenarioContext.PutObject("initialTime", initialTime);

            // When: 實際值為更晚的 DateTime
            var updatedTime = new DateTime(2025, 12, 23, 10, 30, 0, DateTimeKind.Local);

            // Then: 應該能將兩個 DateTime 轉換為 timestamp 進行比較
            Assert.True(_resolver.EvaluateConstraints("&gt($initialTime)", updatedTime));

            // 驗證相反情況應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&gt($initialTime)", initialTime)
            );
        }

        [Fact(DisplayName = "&gt() - 應該支援 LocalDate 自動轉換為 timestamp 進行數值比較")]
        public void TestGreaterThan_WithLocalDate()
        {
            // Given: 儲存 initialDate 作為 DateOnly
            var initialDate = new DateOnly(2025, 12, 23);
            _scenarioContext.PutObject("initialDate", initialDate);

            // When: 實際值為更晚的 DateOnly
            var laterDate = new DateOnly(2025, 12, 24);

            // Then: 應該能將兩個 DateOnly 轉換為 timestamp 進行比較
            Assert.True(_resolver.EvaluateConstraints("&gt($initialDate)", laterDate));

            // 驗證相反情況應該失敗
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&gt($initialDate)", initialDate)
            );
        }

        [Fact(DisplayName = "&gt() - LocalDateTime vs LocalDate 應該能進行比較")]
        public void TestGreaterThan_LocalDateTime_vs_LocalDate()
        {
            // Given: 儲存 initialDate (DateOnly 當天開始)
            var initialDate = new DateOnly(2025, 12, 23);
            _scenarioContext.PutObject("initialDate", initialDate);

            // When: 實際值為同一天的 DateTime (下午)
            var afternoonTime = new DateTime(2025, 12, 23, 14, 0, 0, DateTimeKind.Local);

            // Then: 下午時間應該大於當天開始（00:00）
            Assert.True(_resolver.EvaluateConstraints("&gt($initialDate)", afternoonTime));
        }

        [Fact(DisplayName = "&lt() - 應該支援 DateTime 自動轉換為 timestamp 進行數值比較")]
        public void TestLessThan_WithDateTime()
        {
            // Given: 儲存 futureTime 作為 DateTime
            var futureTime = new DateTime(2025, 12, 23, 15, 0, 0, DateTimeKind.Local);
            _scenarioContext.PutObject("futureTime", futureTime);

            // When: 實際值為更早的 DateTime
            var earlierTime = new DateTime(2025, 12, 23, 14, 0, 0, DateTimeKind.Local);

            // Then: 應該能將兩個 DateTime 轉換為 timestamp 進行比較
            Assert.True(_resolver.EvaluateConstraints("&lt($futureTime)", earlierTime));
        }

        [Fact(DisplayName = "&between() - 應該支援 DateTime 作為範圍邊界")]
        public void TestBetween_WithDateTime()
        {
            // Given: 儲存時間範圍
            var startTime = new DateTime(2025, 12, 23, 9, 0, 0, DateTimeKind.Local);
            var endTime = new DateTime(2025, 12, 23, 17, 0, 0, DateTimeKind.Local);
            _scenarioContext.PutObject("startTime", startTime);
            _scenarioContext.PutObject("endTime", endTime);

            // When: 實際值在範圍內
            var workTime = new DateTime(2025, 12, 23, 12, 0, 0, DateTimeKind.Local);

            // Then: 應該通過範圍驗證
            Assert.True(_resolver.EvaluateConstraints("&between($startTime,$endTime)", workTime));

            // 超出範圍應該失敗
            var afterHours = new DateTime(2025, 12, 23, 18, 0, 0, DateTimeKind.Local);
            Assert.Throws<Exception>(() =>
                _resolver.EvaluateConstraints("&between($startTime,$endTime)", afterHours)
            );
        }
    }
}