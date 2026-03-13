using System;
using System.Collections.Generic;

namespace Tw.Sdd.Isa.TestLib.Helper
{
    /// <summary>
    /// 用於描述「DataTable 一列要如何對應到某個 Entity」的規格物件。
    /// </summary>
    public class EntityTableSpec<T, TId>
    {
        public string EntityName { get; }
        public Type EntityClass { get; }
        public ISet<string> PkColumns { get; }
        public Func<IDictionary<string, object>, TId> IdParser { get; }
        public ISet<string> ProbeFields { get; }
        public IList<string> ExactMatchOrder { get; }
        public ISet<string> BlankMeansNullFields { get; }

        public EntityTableSpec(
            string entityName,
            Type entityClass,
            ISet<string> pkColumns,
            Func<IDictionary<string, object>, TId> idParser,
            ISet<string> probeFields,
            IList<string> exactMatchOrder,
            ISet<string> blankMeansNullFields)
        {
            EntityName = entityName;
            EntityClass = entityClass;
            PkColumns = pkColumns;
            IdParser = idParser;
            ProbeFields = probeFields;
            ExactMatchOrder = exactMatchOrder;
            BlankMeansNullFields = blankMeansNullFields;
        }
    }
}
