using System.Collections.Generic;

namespace GuessingGame.Tests;

/// <summary>
/// Scenario context for sharing data across step definitions
/// </summary>
public class ScenarioContext
{
    private Dictionary<string, object?> _contextData = new();

    /// <summary>
    /// Last HTTP response from API calls
    /// </summary>
    public HttpResponseMessage? LastResponse { get; set; }

    /// <summary>
    /// Store a value in the context
    /// </summary>
    public void Put(string key, string value)
    {
        _contextData[key] = value;
    }

    /// <summary>
    /// Store an object in the context
    /// </summary>
    public void PutObject(string key, object? value)
    {
        _contextData[key] = value;
    }

    /// <summary>
    /// Retrieve a value from the context
    /// </summary>
    public object? Get(string key)
    {
        return _contextData.TryGetValue(key, out var value) ? value : null;
    }

    /// <summary>
    /// Retrieve a value and cast to specific type
    /// </summary>
    public T? Get<T>(string key) where T : class
    {
        var value = Get(key);
        return value as T;
    }

    /// <summary>
    /// Indexer for accessing context data
    /// </summary>
    public object? this[string key]
    {
        get => _contextData.TryGetValue(key, out var value) ? value : null;
        set => _contextData[key] = value;
    }

    /// <summary>
    /// Try to get a value from the context
    /// </summary>
    public bool TryGetValue(string key, out object? value)
    {
        return _contextData.TryGetValue(key, out value);
    }

    /// <summary>
    /// Clear all data from context
    /// </summary>
    public void Clear()
    {
        LastResponse = null;
    }

    /// <summary>
    /// Reset the entire context
    /// </summary>
    public void Reset()
    {
        LastResponse = null;
        _contextData.Clear();
    }
}
