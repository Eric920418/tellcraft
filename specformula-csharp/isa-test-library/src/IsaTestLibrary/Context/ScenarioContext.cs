namespace Tw.Sdd.Isa.TestLib.Context;

/// <summary>
/// 場景上下文，用於在測試步驟之間共享資料。
/// 對應 Java 的 tw.sdd.isa.testlib.context.ScenarioContext
/// </summary>
public class ScenarioContext
{
    private readonly Dictionary<string, object?> _contextData = new();

    /// <summary>
    /// 最後一次 HTTP 回應（用於 API 測試）
    /// </summary>
    public HttpResponseMessage? LastResponse { get; set; }

    /// <summary>
    /// 清除最後一次回應
    /// </summary>
    public void Clear()
    {
        LastResponse = null;
    }

    /// <summary>
    /// 重置所有資料
    /// </summary>
    public void Reset()
    {
        LastResponse = null;
        _contextData.Clear();
    }

    /// <summary>
    /// 儲存字串值
    /// </summary>
    public void Put(string key, string value)
    {
        _contextData[key] = value;
    }

    /// <summary>
    /// 儲存任意物件
    /// </summary>
    public void PutObject(string key, object? value)
    {
        _contextData[key] = value;
    }

    /// <summary>
    /// 取得值
    /// </summary>
    public object? Get(string key)
    {
        return _contextData.TryGetValue(key, out var value) ? value : null;
    }

    /// <summary>
    /// 取得強型別值
    /// </summary>
    public T? Get<T>(string key)
    {
        var value = Get(key);
        if (value is T typedValue)
        {
            return typedValue;
        }
        return default;
    }

    /// <summary>
    /// 檢查是否包含指定的 key
    /// </summary>
    public bool ContainsKey(string key)
    {
        return _contextData.ContainsKey(key);
    }
}
