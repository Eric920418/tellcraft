using System.Linq.Expressions;

namespace Tw.Sdd.Isa.TestLib.Testables.Repository;

/// <summary>
/// 泛型 Repository 介面，對應 Java 的 JpaRepository
/// </summary>
/// <typeparam name="T">Entity 類型</typeparam>
/// <typeparam name="TId">主鍵類型</typeparam>
public interface IRepository<T, TId> where T : class
{
    /// <summary>
    /// 根據主鍵查詢 Entity
    /// </summary>
    /// <param name="id">主鍵</param>
    /// <returns>找到的 Entity，或 null</returns>
    T? FindById(TId id);

    /// <summary>
    /// 儲存 Entity
    /// </summary>
    /// <param name="entity">要儲存的 Entity</param>
    /// <returns>儲存後的 Entity</returns>
    T Save(T entity);

    /// <summary>
    /// 刪除 Entity
    /// </summary>
    /// <param name="entity">要刪除的 Entity</param>
    void Delete(T entity);

    /// <summary>
    /// 根據主鍵刪除 Entity
    /// </summary>
    /// <param name="id">主鍵</param>
    void DeleteById(TId id);

    /// <summary>
    /// 檢查主鍵是否存在
    /// </summary>
    /// <param name="id">主鍵</param>
    /// <returns>是否存在</returns>
    bool ExistsById(TId id);

    /// <summary>
    /// 取得所有 Entity
    /// </summary>
    /// <returns>所有 Entity</returns>
    IEnumerable<T> FindAll();

    /// <summary>
    /// 使用 Expression 進行查詢，可分析查詢結構
    /// 對應 Java 的 findAll(Example) 但更符合 C#/EF Core 慣例
    /// </summary>
    /// <param name="predicate">查詢表達式</param>
    /// <returns>符合條件的 Entity 列表</returns>
    IEnumerable<T> Where(Expression<Func<T, bool>> predicate);
}
