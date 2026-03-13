using Tw.Sdd.Isa.TestLib.Context;
using Tw.Sdd.Isa.TestLib.Helper;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
///     TIME-System 時間轉換系統單元測試
/// </summary>
[Collection("TIME-System 時間轉換系統單元測試")]
public class ISAFeatureArgumentResolverTimeTest
{
    [Collection("@time() - ZonedDateTime 轉換測試")]
    public class TimeExpressionTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;

        public TimeExpressionTests()
        {
            _resolver = new ISAFeatureArgumentResolver(new ScenarioContext());
        }

        [Fact(DisplayName = "@time() - ISO 8601 完整日期時間")]
        public void TestTimeSystem_ISODateTime()
        {
            var timeExpr = "@time(\"2025-11-04T08:00:00\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "@time() - ISO 8601 帶時區偏移")]
        public void TestTimeSystem_ISODateTimeWithTimezone()
        {
            var timeExpr = "@time(\"2025-12-24T02:36:54-12:00\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(12, zonedDateTime.Month);
            Assert.Equal(24, zonedDateTime.Day);
            Assert.Equal(2, zonedDateTime.Hour);
            Assert.Equal(36, zonedDateTime.Minute);
            Assert.Equal(54, zonedDateTime.Second);
            Assert.Equal(TimeSpan.FromHours(-12), zonedDateTime.Offset);
        }

        [Fact(DisplayName = "@time() - ISO 8601 UTC 時區 (Z)")]
        public void TestTimeSystem_ISODateTimeWithUTC()
        {
            var timeExpr = "@time(\"2025-11-04T08:00:00Z\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
            Assert.Equal(TimeSpan.Zero, zonedDateTime.Offset);
        }

        [Fact(DisplayName = "@time() - 只有日期（自動補 00:00:00）")]
        public void TestTimeSystem_DateOnly()
        {
            var timeExpr = "@time(\"2025-11-04\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(0, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "@time() - now（當前時間）")]
        public void TestTimeSystem_Now()
        {
            var timeExpr = "@time(\"now\")";
            var beforeTime = DateTimeOffset.Now;

            var result = _resolver.ResolveVariable(timeExpr);
            var afterTime = DateTimeOffset.Now;

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.True(zonedDateTime >= beforeTime && zonedDateTime <= afterTime,
                $"時間 {zonedDateTime} 應該在 {beforeTime} 和 {afterTime} 之間");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now-1d）")]
        public void TestTimeSystem_RelativeTime()
        {
            var timeExpr = "@time(\"now-1d\")";
            var now = DateTimeOffset.Now;
            var oneDayAgo = now.AddDays(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneDayAgo).TotalSeconds);
            Assert.True(diffSeconds < 3600,
                $"時間差 {diffSeconds} 秒應該小於 3600 秒（1 小時）");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now-1s）- 減 1 秒")]
        public void TestTimeSystem_RelativeTime_MinusOneSecond()
        {
            var timeExpr = "@time(\"now-1s\")";
            var now = DateTimeOffset.Now;
            var oneSecondAgo = now.AddSeconds(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneSecondAgo).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now-1m）- 減 1 分鐘")]
        public void TestTimeSystem_RelativeTime_MinusOneMinute()
        {
            var timeExpr = "@time(\"now-1m\")";
            var now = DateTimeOffset.Now;
            var oneMinuteAgo = now.AddMinutes(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneMinuteAgo).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now-1h）- 減 1 小時")]
        public void TestTimeSystem_RelativeTime_MinusOneHour()
        {
            var timeExpr = "@time(\"now-1h\")";
            var now = DateTimeOffset.Now;
            var oneHourAgo = now.AddHours(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneHourAgo).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now-1M）- 減 1 個月")]
        public void TestTimeSystem_RelativeTime_MinusOneMonth()
        {
            var timeExpr = "@time(\"now-1M\")";
            var now = DateTimeOffset.Now;
            var oneMonthAgo = now.AddMonths(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneMonthAgo).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now+1s）- 加 1 秒")]
        public void TestTimeSystem_RelativeTime_PlusOneSecond()
        {
            var timeExpr = "@time(\"now+1s\")";
            var now = DateTimeOffset.Now;
            var oneSecondLater = now.AddSeconds(1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneSecondLater).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now+1m）- 加 1 分鐘")]
        public void TestTimeSystem_RelativeTime_PlusOneMinute()
        {
            var timeExpr = "@time(\"now+1m\")";
            var now = DateTimeOffset.Now;
            var oneMinuteLater = now.AddMinutes(1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneMinuteLater).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now+1h）- 加 1 小時")]
        public void TestTimeSystem_RelativeTime_PlusOneHour()
        {
            var timeExpr = "@time(\"now+1h\")";
            var now = DateTimeOffset.Now;
            var oneHourLater = now.AddHours(1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneHourLater).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 相對時間表達式（now+1M）- 加 1 個月")]
        public void TestTimeSystem_RelativeTime_PlusOneMonth()
        {
            var timeExpr = "@time(\"now+1M\")";
            var now = DateTimeOffset.Now;
            var oneMonthLater = now.AddMonths(1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - oneMonthLater).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 組合相對時間表達式（now-1M-1d-1h-1m-1s）")]
        public void TestTimeSystem_RelativeTime_CombinedExpression()
        {
            var timeExpr = "@time(\"now-1M-1d-1h-1m-1s\")";
            var now = DateTimeOffset.Now;
            var expected = now.AddMonths(-1).AddDays(-1).AddHours(-1).AddMinutes(-1).AddSeconds(-1);

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            var diffSeconds = Math.Abs((zonedDateTime - expected).TotalSeconds);
            Assert.True(diffSeconds <= 2,
                $"時間差 {diffSeconds} 秒應該小於等於 2 秒");
        }

        [Fact(DisplayName = "@time() - 錯誤格式應該拋例外")]
        public void TestTimeSystem_InvalidFormat()
        {
            var invalidExpr = "@time(\"invalid-date\")";

            Assert.Throws<Exception>(() => _resolver.ResolveVariable(invalidExpr));
        }

        [Fact(DisplayName = "@time() - 不帶引號的參數")]
        public void TestTimeSystem_WithoutQuotes()
        {
            var timeExpr = "@time(2025-11-04T08:00:00)";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            Assert.IsType<DateTimeOffset>(result);
        }
    }

    [Collection("ADR-0006: setNow() 和 getNow() - 設定與取得當前時間測試")]
    public class SetNowAndGetNowTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public SetNowAndGetNowTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "ADR-0006: setNow() - 使用 ISO 8601 格式設定當前時間")]
        public void TestSetNow_ISODateTime()
        {
            var timeString = "2025-11-04T08:00:00";

            _resolver.SetNow(timeString);

            var now = _scenarioContext.Get("now");
            Assert.NotNull(now);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(now);

            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "ADR-0006: setNow() - 使用帶時區的 ISO 8601 格式")]
        public void TestSetNow_ISODateTimeWithTimezone()
        {
            var timeString = "2025-12-24T02:36:54+08:00";

            _resolver.SetNow(timeString);

            var now = _scenarioContext.Get("now");
            Assert.NotNull(now);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(now);

            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(12, zonedDateTime.Month);
            Assert.Equal(24, zonedDateTime.Day);
            Assert.Equal(2, zonedDateTime.Hour);
            Assert.Equal(36, zonedDateTime.Minute);
            Assert.Equal(54, zonedDateTime.Second);
        }

        [Fact(DisplayName = "ADR-0006: setNow() - 使用帶 Z 的 UTC 時區格式")]
        public void TestSetNow_ISODateTimeWithUTC()
        {
            var timeString = "2025-11-04T08:00:00Z";

            _resolver.SetNow(timeString);

            var now = _scenarioContext.Get("now");
            Assert.NotNull(now);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(now);

            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
            Assert.Equal(TimeSpan.Zero, zonedDateTime.Offset);
        }

        [Fact(DisplayName = "ADR-0006: setNow() - 使用只有日期的格式")]
        public void TestSetNow_DateOnly()
        {
            var timeString = "2025-11-04";

            _resolver.SetNow(timeString);

            var now = _scenarioContext.Get("now");
            Assert.NotNull(now);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(now);

            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(0, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "ADR-0006: getNow() - 取得設定的當前時間")]
        public void TestGetNow_AfterSetNow()
        {
            var timeString = "2025-11-04T08:00:00";
            _resolver.SetNow(timeString);

            var now = _resolver.GetNow();

#pragma warning disable xUnit2002 // Do not use null check on value type
            Assert.NotNull(now);
#pragma warning restore xUnit2002 // Do not use null check on value type
            Assert.Equal(2025, now.Year);
            Assert.Equal(11, now.Month);
            Assert.Equal(4, now.Day);
            Assert.Equal(8, now.Hour);
            Assert.Equal(0, now.Minute);
            Assert.Equal(0, now.Second);
        }

        [Fact(DisplayName = "ADR-0006: getNow() - 沒有設定時返回系統當前時間")]
        public void TestGetNow_WithoutSetNow()
        {
            var beforeTime = DateTimeOffset.Now;

            var now = _resolver.GetNow();
            var afterTime = DateTimeOffset.Now;

#pragma warning disable xUnit2002 // Do not use null check on value type
            Assert.NotNull(now);
#pragma warning restore xUnit2002 // Do not use null check on value type
            Assert.True(now >= beforeTime && now <= afterTime,
                $"時間 {now} 應該在 {beforeTime} 和 {afterTime} 之間");
        }

        [Fact(DisplayName = "ADR-0006: @time(\"now\") - 使用 setNow 設定後應該返回設定的時間")]
        public void TestTimeExpression_Now_AfterSetNow()
        {
            var timeString = "2025-11-04T08:00:00";
            _resolver.SetNow(timeString);

            var result = _resolver.ResolveVariable("@time(\"now\")");

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "resolveVariable(\"@time(\\\"now\\\")\") - 應回傳 setNow 設定的時間 (DateTimeOffset)")]
        public void TestResolveVariableNow_ShouldUseSetNow()
        {
            _resolver.SetNow("2025-11-04T08:00:00+08:00");

            var result = _resolver.ResolveVariable("@time(\"now\")");

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "&sameTime 支援不帶秒格式 (HH:mm)")]
        public void TestSameTimeWithoutSeconds()
        {
            var actual = new DateTime(2025, 11, 4, 8, 0, 0);

            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-11-04T08:00\")", actual));
        }

        [Fact(DisplayName = "&sameTime 支援 UTC Z 字串格式")]
        public void TestSameTimeWithUtcString()
        {
            var actual = "2025-01-15T10:30:00.000Z";

            Assert.True(_resolver.EvaluateConstraints("&sameTime(\"2025-01-15T10:30:00.000Z\")", actual));
        }

        [Fact(DisplayName = "ADR-0006: @time(\"now-1d\") - 使用 setNow 設定後應該基於設定的時間計算")]
        public void TestTimeExpression_RelativeTime_AfterSetNow()
        {
            var timeString = "2025-11-04T08:00:00";
            _resolver.SetNow(timeString);

            var result = _resolver.ResolveVariable("@time(\"now-1d\")");

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(3, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
            Assert.Equal(0, zonedDateTime.Minute);
            Assert.Equal(0, zonedDateTime.Second);
        }

        [Fact(DisplayName = "ADR-0006: setNow() - 錯誤格式應該拋例外")]
        public void TestSetNow_InvalidFormat()
        {
            var invalidTimeString = "invalid-date";

            Assert.Throws<Exception>(() => _resolver.SetNow(invalidTimeString));
        }
    }

    [Collection("@date() - LocalDate 轉換測試")]
    public class DateExpressionTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;

        public DateExpressionTests()
        {
            _resolver = new ISAFeatureArgumentResolver(new ScenarioContext());
        }

        [Fact(DisplayName = "@date() - 斜線分隔格式 (2025/12/16)")]
        public void TestDateSystem_SlashFormat()
        {
            var dateExpr = "@date(\"2025/12/16\")";

            var result = _resolver.ResolveVariable(dateExpr);

            Assert.NotNull(result);
            var localDate = Assert.IsType<DateOnly>(result);
            Assert.Equal(2025, localDate.Year);
            Assert.Equal(12, localDate.Month);
            Assert.Equal(16, localDate.Day);
        }

        [Fact(DisplayName = "@date() - ISO 8601 格式 (2025-12-16)")]
        public void TestDateSystem_ISOFormat()
        {
            var dateExpr = "@date(\"2025-12-16\")";

            var result = _resolver.ResolveVariable(dateExpr);

            Assert.NotNull(result);
            var localDate = Assert.IsType<DateOnly>(result);
            Assert.Equal(2025, localDate.Year);
            Assert.Equal(12, localDate.Month);
            Assert.Equal(16, localDate.Day);
        }

        [Fact(DisplayName = "@date() - 錯誤格式應該拋例外")]
        public void TestDateSystem_InvalidFormat()
        {
            var invalidExpr = "@date(\"invalid-date\")";

            Assert.Throws<Exception>(() => _resolver.ResolveVariable(invalidExpr));
        }

        [Fact(DisplayName = "ADR-0006: @date(\"now\") - 沒有 setNow 時返回系統當前日期")]
        public void TestDateSystem_Now_WithoutSetNow()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            var result = _resolver.ResolveVariable("@date(\"now\")");

            Assert.NotNull(result);
            var localDate = Assert.IsType<DateOnly>(result);
            Assert.Equal(today.Year, localDate.Year);
            Assert.Equal(today.Month, localDate.Month);
            Assert.Equal(today.Day, localDate.Day);
        }

        [Fact(DisplayName = "ADR-0006: @date(\"now\") - 使用 setNow 設定後應該返回設定的日期")]
        public void TestDateSystem_Now_AfterSetNow()
        {
            var resolver = new ISAFeatureArgumentResolver(new ScenarioContext());
            resolver.SetNow("2025-11-04T08:00:00");

            var result = resolver.ResolveVariable("@date(\"now\")");

            Assert.NotNull(result);
            var localDate = Assert.IsType<DateOnly>(result);
            Assert.Equal(2025, localDate.Year);
            Assert.Equal(11, localDate.Month);
            Assert.Equal(4, localDate.Day);
        }
    }

    [Collection("@localtime() - LocalTime 轉換測試")]
    public class LocalTimeExpressionTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;

        public LocalTimeExpressionTests()
        {
            _resolver = new ISAFeatureArgumentResolver(new ScenarioContext());
        }

        [Fact(DisplayName = "@localtime() - 標準時間格式 (21:00)")]
        public void TestLocalTimeSystem_StandardFormat()
        {
            var timeExpr = "@localtime(\"21:00\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var localTime = Assert.IsType<TimeOnly>(result);
            Assert.Equal(21, localTime.Hour);
            Assert.Equal(0, localTime.Minute);
        }

        [Fact(DisplayName = "@localtime() - 帶秒數格式 (21:00:30)")]
        public void TestLocalTimeSystem_WithSeconds()
        {
            var timeExpr = "@localtime(\"21:00:30\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var localTime = Assert.IsType<TimeOnly>(result);
            Assert.Equal(21, localTime.Hour);
            Assert.Equal(0, localTime.Minute);
            Assert.Equal(30, localTime.Second);
        }

        [Fact(DisplayName = "@localtime() - 錯誤格式應該拋例外")]
        public void TestLocalTimeSystem_InvalidFormat()
        {
            var invalidExpr = "@localtime(\"invalid-time\")";

            Assert.Throws<Exception>(() => _resolver.ResolveVariable(invalidExpr));
        }

        [Fact(DisplayName = "ADR-0006: @localtime(\"now\") - 沒有 setNow 時返回系統當前時間")]
        public void TestLocalTimeSystem_Now_WithoutSetNow()
        {
            var beforeTime = TimeOnly.FromDateTime(DateTime.Now);

            var result = _resolver.ResolveVariable("@localtime(\"now\")");
            var afterTime = TimeOnly.FromDateTime(DateTime.Now);

            Assert.NotNull(result);
            var localTime = Assert.IsType<TimeOnly>(result);

            Assert.True(
                localTime >= beforeTime.Add(TimeSpan.FromSeconds(-1)) &&
                localTime <= afterTime.Add(TimeSpan.FromSeconds(1)),
                $"時間 {localTime} 應該在 {beforeTime} 和 {afterTime} 之間"
            );
        }

        [Fact(DisplayName = "ADR-0006: @localtime(\"now\") - 使用 setNow 設定後應該返回設定的時間")]
        public void TestLocalTimeSystem_Now_AfterSetNow()
        {
            var resolver = new ISAFeatureArgumentResolver(new ScenarioContext());
            resolver.SetNow("2025-11-04T08:30:45");

            var result = resolver.ResolveVariable("@localtime(\"now\")");

            Assert.NotNull(result);
            var localTime = Assert.IsType<TimeOnly>(result);
            Assert.Equal(8, localTime.Hour);
            Assert.Equal(30, localTime.Minute);
            Assert.Equal(45, localTime.Second);
        }
    }

    [Collection("VAR-System 整合測試 - 根據 ADR-0004 不支援")]
    public class VarSystemIntegrationTests
    {
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly ScenarioContext _scenarioContext;

        public VarSystemIntegrationTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        }

        [Fact(DisplayName = "不支援：>contextKey 與 @time() 混合使用")]
        public void TestVarSystem_DoesNotSupport_ContextKeyWithTimeExpression()
        {
            var timeExpr = "@time(\"2025-11-04T08:00:00\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            Assert.IsType<DateTimeOffset>(result);
            Assert.NotNull(result);
        }

        [Fact(DisplayName = "確認：TIME-System 只應用於 API 參數轉換，不應用於變數賦值")]
        public void TestVarSystem_TimeSystemShouldOnlyBeUsedForApiParameters()
        {
            var timeExpr = "@time(\"2025-11-04T08:00:00\")";

            var result = _resolver.ResolveVariable(timeExpr);

            Assert.NotNull(result);
            var zonedDateTime = Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(2025, zonedDateTime.Year);
            Assert.Equal(11, zonedDateTime.Month);
            Assert.Equal(4, zonedDateTime.Day);
            Assert.Equal(8, zonedDateTime.Hour);
        }

        [Fact(DisplayName = "正確用法：變數應該從 context 中已存在的值引用（$variableName）")]
        public void TestVarSystem_CorrectUsage_ReferenceExistingVariable()
        {
            var expectedTime = DateTimeOffset.Parse("2025-11-04T08:00:00+08:00");
            _scenarioContext.PutObject("orderTime", expectedTime);

            var result = _resolver.ResolveVariable("$orderTime");

            Assert.NotNull(result);
            Assert.IsType<DateTimeOffset>(result);
            Assert.Equal(expectedTime, result);
        }
    }
}