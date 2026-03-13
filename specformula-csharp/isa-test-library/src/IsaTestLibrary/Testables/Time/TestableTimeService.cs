using Tw.Sdd.Isa.TestLib.Context;

namespace Tw.Sdd.Isa.TestLib.Testables.Time;

/// <summary>
/// 可測試的時間服務實作
/// 對應 Java 的 tw.sdd.isa.testlib.testables.time.TestableTimeService
/// </summary>
public class TestableTimeService : ITimeService
{
    private static readonly TimeZoneInfo TaiwanZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Taipei");

    private readonly ScenarioContext _scenarioContext;

    public TestableTimeService(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext;
    }

    public DateTime Now()
    {
        var currentTime = _scenarioContext.Get("currentTime");
        if (currentTime is long timestamp)
        {
            // 從 timestamp (Long) 轉換為 DateTime
            var utcDateTime = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).UtcDateTime;
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, TaiwanZone);
        }
        if (currentTime is int intTimestamp)
        {
            var utcDateTime = DateTimeOffset.FromUnixTimeMilliseconds(intTimestamp).UtcDateTime;
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, TaiwanZone);
        }
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TaiwanZone);
    }
}
