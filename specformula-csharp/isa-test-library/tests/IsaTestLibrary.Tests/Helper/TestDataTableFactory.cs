using Reqnroll;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// 測試用 DataTable 工廠
/// 對應 Java 的 tw.sdd.isa.testlib.helper.TestDataTableFactory
/// </summary>
internal static class TestDataTableFactory
{
    public static DataTable FromRows(List<List<string>> rows)
    {
        if (rows.Count == 0)
        {
            return new DataTable();
        }

        var headers = rows[0].ToArray();
        var table = new DataTable(headers);

        for (int i = 1; i < rows.Count; i++)
        {
            table.AddRow(rows[i].ToArray());
        }

        return table;
    }

    /// <summary>
    /// 建立包含 null 值的 DataTable（用於測試 null 處理）
    /// </summary>
    public static DataTable FromMaps(List<Dictionary<string, string?>> maps)
    {
        if (maps.Count == 0)
        {
            return new DataTable();
        }

        var headers = maps[0].Keys.ToArray();
        var table = new DataTable(headers);

        foreach (var map in maps)
        {
            var values = headers.Select(h => map.TryGetValue(h, out var v) ? v ?? "" : "").ToArray();
            table.AddRow(values);
        }

        return table;
    }
}
