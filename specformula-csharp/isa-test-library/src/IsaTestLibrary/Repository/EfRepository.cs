using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Tw.Sdd.Isa.TestLib.Testables.Repository;

namespace Tw.Sdd.Isa.TestLib.Repository;

/// <summary>
/// Entity Framework Core 實作的泛型 Repository
/// 注意：此實作不會自動呼叫 SaveChanges，需搭配 IUnitOfWork 使用
/// </summary>
/// <typeparam name="T">Entity 類型</typeparam>
/// <typeparam name="TId">主鍵類型</typeparam>
public class EfRepository<T, TId> : IRepository<T, TId> where T : class
{
    protected readonly DbContext Context;
    protected readonly DbSet<T> DbSet;

    public EfRepository(DbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    /// <inheritdoc />
    public virtual T? FindById(TId id)
    {
        return DbSet.Find(id);
    }

    /// <inheritdoc />
    public virtual T Save(T entity)
    {
        var entry = Context.Entry(entity);
        if (entry.State == EntityState.Detached)
        {
            DbSet.Add(entity);
        }
        // 不呼叫 SaveChanges，由 IUnitOfWork 統一處理
        return entity;
    }

    /// <inheritdoc />
    public virtual void Delete(T entity)
    {
        DbSet.Remove(entity);
        // 不呼叫 SaveChanges，由 IUnitOfWork 統一處理
    }

    /// <inheritdoc />
    public virtual void DeleteById(TId id)
    {
        var entity = FindById(id);
        if (entity != null)
        {
            Delete(entity);
        }
    }

    /// <inheritdoc />
    public virtual bool ExistsById(TId id)
    {
        return FindById(id) != null;
    }

    /// <inheritdoc />
    public virtual IEnumerable<T> FindAll()
    {
        return DbSet.ToList();
    }

    /// <inheritdoc />
    public virtual IEnumerable<T> Where(Expression<Func<T, bool>> predicate)
    {
        return DbSet.Where(predicate).ToList();
    }
}
