using System.Reflection;
using Reqnroll;
using Tw.Sdd.Isa.TestLib.Testables.Repository;

namespace Tw.Sdd.Isa.TestLib.Helper;

/// <summary>
/// Entity 資料表設定輔助類
/// 對應 Java 的 tw.sdd.isa.testlib.helper.EntityTableSetupHelper
/// 
/// 功能：
/// 1. 解析 DataTable 並建立 Entity 實例
/// 2. 型別轉換（使用 fieldTypes）
/// 3. Fallback 邏輯（fieldTypes 未定義時自動推斷）
/// 4. 變數儲存（>contextKey 和 &lt;executionKey）
/// 5. 跳過 VAR-system headers
/// 6. 跳過空值
/// </summary>
public class EntityTableSetupHelper
{
    private readonly ISAFeatureArgumentResolver _resolver;

    public EntityTableSetupHelper(ISAFeatureArgumentResolver resolver)
    {
        _resolver = resolver ?? throw new ArgumentNullException(nameof(resolver));
    }

    /// <summary>
    /// 準備並儲存 Entity
    /// </summary>
    /// <typeparam name="T">Entity 類型</typeparam>
    /// <typeparam name="TId">主鍵類型</typeparam>
    /// <param name="dataTable">Cucumber/Reqnroll DataTable</param>
    /// <param name="repository">Repository 介面</param>
    /// <param name="unitOfWork">Unit of Work 介面，用於提交變更</param>
    /// <param name="entityType">Entity 類型</param>
    /// <param name="fieldTypes">欄位型別映射</param>
    public void PrepareEntities<T, TId>(
        DataTable dataTable,
        IRepository<T, TId> repository,
        IUnitOfWork unitOfWork,
        Type entityType,
        Dictionary<string, Type> fieldTypes) where T : class
    {
        var rows = dataTable.Rows.ToList();
        if (rows.Count == 0) return;

        var headers = dataTable.Header.ToList();
        
        // 驗證 VAR-System 配對規則
        ValidateVarSystemPairing(headers, rows);

        foreach (var row in rows)
        {
            var dataRow = headers.Select(h => row[h]).ToList();
            
            // 建立 Entity 實例
            var entity = CreateEntityInstance<T>(entityType);
            
            // 設定 Entity 欄位值
            for (int i = 0; i < headers.Count; i++)
            {
                var header = headers[i];
                var value = dataRow[i];
                
                // 跳過 VAR-system headers
                if (IsVarSystemHeader(header)) continue;
                
                // 跳過空值
                if (string.IsNullOrEmpty(value)) continue;
                
                // 解析變數引用和時間表達式
                var resolvedValue = _resolver.ResolveVariable(value);
                var stringValue = resolvedValue?.ToString() ?? value;
                
                // 設定欄位值
                SetFieldValue(entity, header, stringValue, fieldTypes, entityType);
            }
            
            // 儲存 Entity
            var savedEntity = repository.Save(entity);
            
            // 處理變數儲存
            ProcessVariableStorage(headers, dataRow, savedEntity);
        }
        
        // 提交所有變更
        unitOfWork.SaveChanges();
    }

    /// <summary>
    /// 驗證 VAR-System 配對規則：>contextKey 必須與 &lt;executionKey 配對
    /// </summary>
    private void ValidateVarSystemPairing(List<string> headers, List<DataTableRow> rows)
    {
        for (int i = 0; i < headers.Count; i++)
        {
            var header = headers[i];
            if (header.StartsWith(">"))
            {
                // 這是 >contextKey，檢查所有 data row 中對應位置是否都是 <executionKey
                foreach (var row in rows)
                {
                    var dataRow = headers.Select(h => row[h]).ToList();
                    var cellValue = dataRow[i];
                    
                    if (!cellValue.StartsWith("<"))
                    {
                        throw new ArgumentException(
                            $"Header position {i} has context key '{header}' but data row does not have corresponding '<executionKey'. They must be paired.");
                    }
                }
            }
        }
    }

    /// <summary>
    /// 檢查 header 是否為 VAR-system header（以 &lt; 或 > 開頭）
    /// </summary>
    private bool IsVarSystemHeader(string header)
    {
        if (string.IsNullOrEmpty(header)) return false;
        return header.StartsWith("<") || header.StartsWith(">");
    }

    /// <summary>
    /// 建立 Entity 實例
    /// </summary>
    private T CreateEntityInstance<T>(Type entityType) where T : class
    {
        var instance = Activator.CreateInstance(entityType);
        if (instance == null)
        {
            throw new InvalidOperationException($"無法建立 {entityType.Name} 的實例");
        }
        return (T)instance;
    }

    /// <summary>
    /// 設定 Entity 欄位值
    /// </summary>
    private void SetFieldValue<T>(
        T entity,
        string fieldName,
        string value,
        Dictionary<string, Type> fieldTypes,
        Type entityType) where T : class
    {
        var property = FindPropertyWithSetter(entityType, fieldName);
        
        if (property == null)
        {
            // 如果 fieldTypes 有定義這個欄位，則拋出異常
            if (fieldTypes.ContainsKey(fieldName))
            {
                throw new InvalidOperationException(
                    $"在 {entityType.Name} 中找不到可設定的屬性 '{fieldName}'");
            }
            // 否則忽略
            return;
        }
        
        // 決定目標型別
        Type targetType;
        if (fieldTypes.TryGetValue(fieldName, out var definedType))
        {
            targetType = definedType;
        }
        else
        {
            // Fallback: 使用 Property 的型別
            targetType = property.PropertyType;
        }
        
        // 轉換並設定值
        var convertedValue = ConvertValue(value, targetType);
        property.SetValue(entity, convertedValue);
    }

    /// <summary>
    /// 設定 Entity 欄位值（向後相容的重載）
    /// </summary>
    private void SetFieldValue<T>(
        T entity,
        string fieldName,
        string value,
        Dictionary<string, Type> fieldTypes) where T : class
    {
        SetFieldValue(entity, fieldName, value, fieldTypes, typeof(T));
    }

    /// <summary>
    /// 轉換字串值為目標型別
    /// </summary>
    private object? ConvertValue(string value, Type targetType)
    {
        return TypeConverter.Convert(value, targetType);
    }

    /// <summary>
    /// 從 Entity 類別取得欄位的 setter 方法對應的 PropertyInfo
    /// 支援繼承：會搜尋父類的屬性
    /// </summary>
    private PropertyInfo? FindPropertyWithSetter(Type entityType, string fieldName)
    {
        // 先嘗試直接取得屬性（包含繼承的）
        var property = entityType.GetProperty(
            fieldName,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        
        if (property != null && property.CanWrite)
        {
            return property;
        }
        
        // 如果找不到，嘗試搜尋所有繼承鏈
        var currentType = entityType;
        while (currentType != null)
        {
            property = currentType.GetProperty(
                fieldName,
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.IgnoreCase);
            
            if (property != null && property.CanWrite)
            {
                return property;
            }
            
            currentType = currentType.BaseType;
        }
        
        return null;
    }

    /// <summary>
    /// 處理變數儲存（>contextKey 和 &lt;executionKey）
    /// </summary>
    private void ProcessVariableStorage<T>(
        List<string> headers,
        List<string> dataRow,
        T savedEntity) where T : class
    {
        // 解析 context keys
        var contextKeyMap = _resolver.ParseContextKeys(headers);
        
        if (contextKeyMap.Count == 0) return;
        
        // 提取並儲存變數
        _resolver.ExtractAndStoreVariables(dataRow, contextKeyMap, savedEntity);
    }

    /// <summary>
    /// 從 Entity 取得指定欄位的值
    /// </summary>
    private object? GetFieldValue<T>(T entity, string fieldName) where T : class
    {
        var property = entity.GetType().GetProperty(
            fieldName,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        
        return property?.GetValue(entity);
    }
}
