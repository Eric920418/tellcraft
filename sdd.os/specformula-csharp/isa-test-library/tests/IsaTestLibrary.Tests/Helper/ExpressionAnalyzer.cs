using System.Linq.Expressions;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// 表達式分析器，用於從 Expression 中提取查詢欄位和值
/// </summary>
internal static class ExpressionAnalyzer
{
    /// <summary>
    /// 從表達式中提取所有被訪問的欄位名稱
    /// </summary>
    public static ISet<string> ExtractAccessedFields<T>(Expression<Func<T, bool>> expression)
    {
        var visitor = new MemberAccessVisitor();
        visitor.Visit(expression);
        return visitor.AccessedMembers;
    }

    /// <summary>
    /// 從表達式中提取欄位名稱和對應的比較值
    /// </summary>
    public static IDictionary<string, object?> ExtractFieldValues<T>(Expression<Func<T, bool>> expression)
    {
        var visitor = new FieldValueExtractor();
        visitor.Visit(expression);
        return visitor.FieldValues;
    }

    /// <summary>
    /// 訪問表達式樹，收集所有被訪問的成員名稱
    /// </summary>
    private class MemberAccessVisitor : ExpressionVisitor
    {
        public HashSet<string> AccessedMembers { get; } = new();

        protected override Expression VisitMember(MemberExpression node)
        {
            // 只收集直接訪問參數的成員 (e.Email, e.Name 等)
            if (node.Expression is ParameterExpression)
            {
                AccessedMembers.Add(node.Member.Name);
            }
            return base.VisitMember(node);
        }
    }

    /// <summary>
    /// 訪問表達式樹，提取欄位名稱和比較值
    /// 支援 e.Field == value 形式的比較
    /// </summary>
    private class FieldValueExtractor : ExpressionVisitor
    {
        public Dictionary<string, object?> FieldValues { get; } = new();

        protected override Expression VisitBinary(BinaryExpression node)
        {
            // 處理 == 比較
            if (node.NodeType == ExpressionType.Equal)
            {
                TryExtractFieldValue(node.Left, node.Right);
                TryExtractFieldValue(node.Right, node.Left);
            }
            return base.VisitBinary(node);
        }

        private void TryExtractFieldValue(Expression memberSide, Expression valueSide)
        {
            // 檢查是否是 e.Field == value 的形式
            if (memberSide is MemberExpression member && 
                member.Expression is ParameterExpression)
            {
                var fieldName = member.Member.Name;
                var value = GetExpressionValue(valueSide);
                FieldValues[fieldName] = value;
            }
        }

        private static object? GetExpressionValue(Expression expression)
        {
            return expression switch
            {
                ConstantExpression constant => constant.Value,
                MemberExpression member => GetMemberValue(member),
                UnaryExpression unary when unary.NodeType == ExpressionType.Convert 
                    => GetExpressionValue(unary.Operand),
                _ => null
            };
        }

        private static object? GetMemberValue(MemberExpression member)
        {
            // 處理閉包捕獲的變數
            try
            {
                var lambda = Expression.Lambda(member);
                var compiled = lambda.Compile();
                return compiled.DynamicInvoke();
            }
            catch
            {
                return null;
            }
        }
    }
}
