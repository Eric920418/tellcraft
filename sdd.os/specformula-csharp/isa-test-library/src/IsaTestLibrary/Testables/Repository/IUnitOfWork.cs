namespace Tw.Sdd.Isa.TestLib.Testables.Repository;

/// <summary>
/// Unit of Work 介面，負責統一提交交易
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// 同步提交所有變更
    /// </summary>
    /// <returns>受影響的資料筆數</returns>
    int SaveChanges();

    /// <summary>
    /// 非同步提交所有變更
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>受影響的資料筆數</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
