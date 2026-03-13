using Microsoft.EntityFrameworkCore;
using Tw.Sdd.Isa.TestLib.Testables.Repository;

namespace Tw.Sdd.Isa.TestLib.Repository;

/// <summary>
/// Unit of Work 實作，使用 Entity Framework Core DbContext
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly DbContext _context;

    public UnitOfWork(DbContext context)
    {
        _context = context;
    }

    public int SaveChanges() => _context.SaveChanges();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
