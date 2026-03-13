namespace Tw.Sdd.Isa.TestLib.Tests.Helper.ApiCallHelperTest;

/// <summary>
/// 捕獲 HTTP 請求的資料結構
/// 對應 Java 的 ApiCallHelperTest.RequestCapture
/// </summary>
public record RequestCapture(
    string? Id,
    Dictionary<string, string> Query,
    Dictionary<string, string> Headers,
    Dictionary<string, object?>? Body
);

/// <summary>
/// RequestCapture 的容器
/// 使用 volatile 確保跨執行緒可見性
/// </summary>
public class RequestCaptureHolder
{
    private volatile RequestCapture? _capture;

    public RequestCapture? GetCapture() => _capture;

    public void SetCapture(RequestCapture capture) => _capture = capture;

    public void Clear() => _capture = null;
}
