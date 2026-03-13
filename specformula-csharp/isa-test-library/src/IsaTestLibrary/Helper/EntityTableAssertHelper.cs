using System.Linq.Expressions;
using System.Reflection;
using Reqnroll;
using Tw.Sdd.Isa.TestLib.Testables.Repository;

namespace Tw.Sdd.Isa.TestLib.Helper;

/// <summary>
/// Entity 資料表斷言輔助工具
/// 對應 Java 的 tw.sdd.isa.testlib.helper.EntityTableAssertHelper
/// </summary>
public class EntityTableAssertHelper
{
    private readonly ISAFeatureArgumentResolver _resolver;

    public EntityTableAssertHelper(ISAFeatureArgumentResolver resolver)
    {
        _resolver = resolver;
    }

    /// <summary>
    /// 斷言指定的主鍵在資料庫中不存在
    /// </summary>
    public void AssertNotExists<T, TId>(
        DataTable dataTable,
        IRepository<T, TId> repository,
        EntityTableSpec<T, TId> spec) where T : class
    {
        var headers = dataTable.Header.ToList();
        var rows = dataTable.Rows.ToList();

        foreach (var row in rows)
        {
            var rowData = BuildRowData(headers, row.Values.ToList());
            
            // 驗證主鍵欄位是否存在且有效
            ValidatePrimaryKeyFields(rowData, spec.PkColumns, spec.EntityName);
            
            // 解析主鍵
            var resolvedMap = ResolveRowData(rowData);
            var id = spec.IdParser(resolvedMap);
            
            // 查詢資料庫
            var entity = repository.FindById(id);
            
            if (entity != null)
            {
                throw new Exception($"{spec.EntityName} with id={id} should not exist, but it was found.");
            }
        }
    }

    /// <summary>
    /// 斷言指定的主鍵在資料庫中存在，並驗證欄位值
    /// </summary>
    public void AssertExists<T, TId>(
        DataTable dataTable,
        IRepository<T, TId> repository,
        EntityTableSpec<T, TId> spec) where T : class
    {
        var headers = dataTable.Header.ToList();
        var rows = dataTable.Rows.ToList();
        
        // 解析 context keys (>contextKey)
        var contextKeyMap = _resolver.ParseContextKeys(headers);

        foreach (var row in rows)
        {
            var rowValues = row.Values.ToList();
            var rowData = BuildRowData(headers, rowValues);
            
            // 嘗試使用 PK 查詢或 QBE 查詢
            var entity = FindEntity(rowData, headers, repository, spec);
            
            // 提取並儲存變數 (<executionKey -> >contextKey)
            _resolver.ExtractAndStoreVariables(rowValues, contextKeyMap, entity);
            
            // 驗證非主鍵、非變數儲存的欄位
            ValidateEntityFields(entity, rowData, headers, spec);
        }
    }

    private Dictionary<string, string?> BuildRowData(List<string> headers, List<string> values)
    {
        var rowData = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Count && i < values.Count; i++)
        {
            var header = headers[i];
            // 跳過 context key 欄位 (>xxx)
            if (!string.IsNullOrEmpty(header) && !header.StartsWith(">"))
            {
                rowData[header] = values[i];
            }
        }
        return rowData;
    }

    private void ValidatePrimaryKeyFields(Dictionary<string, string?> rowData, ISet<string> pkColumns, string entityName)
    {
        foreach (var pk in pkColumns)
        {
            var pkLower = pk.ToLowerInvariant();
            var matchingKey = rowData.Keys.FirstOrDefault(k => k.Equals(pk, StringComparison.OrdinalIgnoreCase));
            
            if (matchingKey == null)
            {
                throw new Exception($"缺少主鍵欄位: {pk}. 請在 DataTable 中提供所有主鍵欄位。");
            }
            
            var value = rowData[matchingKey];
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new Exception($"缺少主鍵欄位: {pk}. 主鍵欄位值不能為空白。");
            }
            
            // 以 & 開頭的值視為無效（CAS 約束語法，不是有效的主鍵值）
            if (value.StartsWith("&"))
            {
                throw new Exception($"缺少主鍵欄位: {pk}. 主鍵欄位不能使用 CAS 約束語法。");
            }
        }
    }

    private IDictionary<string, object> ResolveRowData(Dictionary<string, string?> rowData)
    {
        var resolved = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in rowData)
        {
            var resolvedValue = _resolver.ResolveVariable(kvp.Value);
            resolved[kvp.Key] = resolvedValue!;
        }
        return resolved;
    }

    private T FindEntity<T, TId>(
        Dictionary<string, string?> rowData,
        List<string> headers,
        IRepository<T, TId> repository,
        EntityTableSpec<T, TId> spec) where T : class
    {
        // 檢查是否可以使用 PK 查詢
        if (CanUsePkQuery(rowData, spec.PkColumns))
        {
            return FindByPrimaryKey(rowData, repository, spec);
        }
        
        // 使用 QBE 查詢
        return FindByExample(rowData, headers, repository, spec);
    }

    private bool CanUsePkQuery(Dictionary<string, string?> rowData, ISet<string> pkColumns)
    {
        foreach (var pk in pkColumns)
        {
            var matchingKey = rowData.Keys.FirstOrDefault(k => k.Equals(pk, StringComparison.OrdinalIgnoreCase));
            if (matchingKey == null)
            {
                return false;
            }
            
            var value = rowData[matchingKey];
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }
            
            // CAS 約束不能作為 PK 查詢
            if (value.StartsWith("&"))
            {
                return false;
            }
        }
        return true;
    }

    private T FindByPrimaryKey<T, TId>(
        Dictionary<string, string?> rowData,
        IRepository<T, TId> repository,
        EntityTableSpec<T, TId> spec) where T : class
    {
        var resolvedMap = ResolveRowData(rowData);
        
        // 過濾只有 PK 欄位（忽略大小寫）
        var pkMap = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var pk in spec.PkColumns)
        {
            var matchingKey = resolvedMap.Keys.FirstOrDefault(k => k.Equals(pk, StringComparison.OrdinalIgnoreCase));
            if (matchingKey != null)
            {
                pkMap[pk] = resolvedMap[matchingKey];
            }
        }
        
        var id = spec.IdParser(pkMap);
        var entity = repository.FindById(id);
        
        if (entity == null)
        {
            var pkValues = string.Join(", ", pkMap.Select(kvp => $"{kvp.Key}={kvp.Value}"));
            throw new Exception($"{spec.EntityName} with {pkValues} should exist, but was not found.");
        }
        
        return entity;
    }

    private T FindByExample<T, TId>(
        Dictionary<string, string?> rowData,
        List<string> headers,
        IRepository<T, TId> repository,
        EntityTableSpec<T, TId> spec) where T : class
    {
        // 收集 probe 欄位值（只使用 probeFields 中的欄位，且值不是 CAS 約束）
        var probeValues = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        
        foreach (var field in spec.ProbeFields)
        {
            var matchingKey = rowData.Keys.FirstOrDefault(k => k.Equals(field, StringComparison.OrdinalIgnoreCase));
            if (matchingKey != null)
            {
                var value = rowData[matchingKey];
                // 跳過 CAS 約束
                if (!string.IsNullOrEmpty(value) && !value.StartsWith("&"))
                {
                    var resolved = _resolver.ResolveVariable(value);
                    probeValues[field] = resolved;
                }
            }
        }
        
        // 檢查是否有查詢條件
        if (probeValues.Count == 0)
        {
            throw new Exception($"缺少查詢條件: 無法找到可用於 QBE 查詢的欄位。請提供 probeFields 中的欄位: {string.Join(", ", spec.ProbeFields)}");
        }
        
        // 構建 Expression 進行 Where 查詢
        var expression = BuildWhereExpression<T>(probeValues);
        var results = repository.Where(expression).ToList();
        
        // 如果 Where 查詢無結果，嘗試使用 FindAll 並過濾
        if (results.Count == 0)
        {
            results = repository.FindAll().ToList();
            results = FilterByProbeValues(results, probeValues);
        }
        
        if (results.Count == 0)
        {
            var conditions = string.Join(", ", probeValues.Select(kvp => $"{kvp.Key}={kvp.Value}"));
            throw new Exception($"找不到符合條件的 {spec.EntityName}: {conditions}");
        }
        
        // 如果只有一筆，直接返回
        if (results.Count == 1)
        {
            return results[0];
        }
        
        // 使用 exactMatchOrder 和 CAS 約束進行後置篩選
        var filtered = FilterResults(results, rowData, spec);
        
        if (filtered.Count == 0)
        {
            throw new Exception($"找不到符合條件的 {spec.EntityName}: 後置篩選後無結果");
        }
        
        if (filtered.Count > 1)
        {
            throw new Exception($"找到多筆 {spec.EntityName}: 後置篩選後仍有 {filtered.Count} 筆結果，請提供更多篩選條件");
        }
        
        return filtered[0];
    }
    
    private List<T> FilterByProbeValues<T>(List<T> entities, Dictionary<string, object?> probeValues) where T : class
    {
        return entities.Where(entity =>
        {
            foreach (var kvp in probeValues)
            {
                var property = typeof(T).GetProperty(kvp.Key, 
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                if (property == null) continue;
                
                var actualValue = property.GetValue(entity);
                var expectedValue = TypeConverter.Convert(kvp.Value, property.PropertyType);
                
                if (!Equals(actualValue, expectedValue))
                {
                    return false;
                }
            }
            return true;
        }).ToList();
    }

    private Expression<Func<T, bool>> BuildWhereExpression<T>(Dictionary<string, object?> probeValues)
    {
        var parameter = Expression.Parameter(typeof(T), "e");
        Expression? combined = null;
        
        foreach (var kvp in probeValues)
        {
            var property = typeof(T).GetProperty(kvp.Key, 
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            
            if (property == null) continue;
            
            var propertyAccess = Expression.Property(parameter, property);
            var convertedValue = TypeConverter.Convert(kvp.Value, property.PropertyType);
            var constant = Expression.Constant(convertedValue, property.PropertyType);
            var equals = Expression.Equal(propertyAccess, constant);
            
            combined = combined == null ? equals : Expression.AndAlso(combined, equals);
        }
        
        if (combined == null)
        {
            combined = Expression.Constant(true);
        }
        
        return Expression.Lambda<Func<T, bool>>(combined, parameter);
    }

    private List<T> FilterResults<T, TId>(
        List<T> results,
        Dictionary<string, string?> rowData,
        EntityTableSpec<T, TId> spec) where T : class
    {
        var filtered = results;
        
        // 先用 CAS 約束篩選
        filtered = FilterByCASConstraints(filtered, rowData, spec);
        
        // 再用 exactMatchOrder 篩選
        filtered = FilterByExactMatchOrder(filtered, rowData, spec);
        
        return filtered;
    }

    private List<T> FilterByCASConstraints<T, TId>(
        List<T> results,
        Dictionary<string, string?> rowData,
        EntityTableSpec<T, TId> spec) where T : class
    {
        return results.Where(entity =>
        {
            foreach (var kvp in rowData)
            {
                if (string.IsNullOrEmpty(kvp.Value)) continue;
                if (!kvp.Value.StartsWith("&")) continue;
                
                // 找到對應的屬性
                var property = typeof(T).GetProperty(kvp.Key, 
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                if (property == null) continue;
                
                var actualValue = property.GetValue(entity);
                
                try
                {
                    if (!_resolver.EvaluateConstraints(kvp.Value, actualValue))
                    {
                        return false;
                    }
                }
                catch
                {
                    return false;
                }
            }
            return true;
        }).ToList();
    }

    private List<T> FilterByExactMatchOrder<T, TId>(
        List<T> results,
        Dictionary<string, string?> rowData,
        EntityTableSpec<T, TId> spec) where T : class
    {
        if (spec.ExactMatchOrder.Count == 0)
        {
            return results;
        }
        
        foreach (var field in spec.ExactMatchOrder)
        {
            var matchingKey = rowData.Keys.FirstOrDefault(k => k.Equals(field, StringComparison.OrdinalIgnoreCase));
            if (matchingKey == null) continue;
            
            var expectedValueStr = rowData[matchingKey];
            if (string.IsNullOrEmpty(expectedValueStr)) continue;
            if (expectedValueStr.StartsWith("&")) continue; // 跳過 CAS 約束
            
            var resolved = _resolver.ResolveVariable(expectedValueStr);
            
            results = results.Where(entity =>
            {
                var property = typeof(T).GetProperty(field, 
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                if (property == null) return true;
                
                var actualValue = property.GetValue(entity);
                var expectedValue = TypeConverter.Convert(resolved, property.PropertyType);
                
                return Equals(actualValue, expectedValue);
            }).ToList();
            
            if (results.Count <= 1)
            {
                break;
            }
        }
        
        return results;
    }

    private void ValidateEntityFields<T, TId>(
        T entity,
        Dictionary<string, string?> rowData,
        List<string> headers,
        EntityTableSpec<T, TId> spec) where T : class
    {
        foreach (var kvp in rowData)
        {
            var fieldName = kvp.Key;
            var expectedValueStr = kvp.Value;
            
            // 跳過 context key 欄位
            if (fieldName.StartsWith(">")) continue;
            
            // 跳過 execution key 欄位 (<xxx)
            if (!string.IsNullOrEmpty(expectedValueStr) && expectedValueStr.StartsWith("<")) continue;
            
            // 跳過空值（除非是 blankMeansNull）
            if (string.IsNullOrEmpty(expectedValueStr))
            {
                // 如果是 blankMeansNull 欄位，驗證實際值為 null
                if (spec.BlankMeansNullFields.Any(f => f.Equals(fieldName, StringComparison.OrdinalIgnoreCase)))
                {
                    var property = typeof(T).GetProperty(fieldName, 
                        BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    if (property != null)
                    {
                        var actualValue = property.GetValue(entity);
                        if (actualValue != null)
                        {
                            throw new Exception($"Field '{fieldName}' expected null (blankMeansNull), but was '{actualValue}'");
                        }
                    }
                }
                continue;
            }
            
            // 找到對應的屬性
            var prop = typeof(T).GetProperty(fieldName, 
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop == null) continue;
            
            var actual = prop.GetValue(entity);
            
            // CAS 約束驗證
            if (expectedValueStr.StartsWith("&"))
            {
                _resolver.EvaluateConstraints(expectedValueStr, actual);
                continue;
            }
            
            // 一般值驗證
            var resolved = _resolver.ResolveVariable(expectedValueStr);
            var expected = TypeConverter.Convert(resolved, prop.PropertyType);
            
            if (!Equals(actual, expected))
            {
                throw new Exception($"Field '{fieldName}' expected '{expected}', but was '{actual}'");
            }
        }
    }
}
