using Moq;
using Reqnroll;
using Tw.Sdd.Isa.TestLib.Helper;
using Tw.Sdd.Isa.TestLib.Testables.Repository;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// EntityTableAssertHelper assertNotExists 方法完整流程測試
///
/// 測試策略：
/// - ISAFeatureArgumentResolver 使用真實實例（含 ScenarioContext）
/// - IRepository 使用 Moq Mock
///
/// 測試範圍：
/// 1. assertNotExists 基本功能：主鍵不存在時通過
/// 2. 主鍵存在時拋出 AssertionError
/// 3. 缺少主鍵欄位時拋出 AssertionError
/// 4. 使用 VAR-System 變數作為主鍵
/// 5. 多行資料處理
/// 6. 不同主鍵類型（Long, String, 複合主鍵）
/// 7. 錯誤處理
/// </summary>
[Trait("Category", "EntityTableAssertHelper")]
public class EntityTableAssertHelperAssertNotExistsTest
{
    // ==================== 測試用 Entity ====================

    public class Product
    {
        public long ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Sku { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }

        public Product() { }

        public Product(long productId, string? productName, string? sku, decimal price, int stock)
        {
            ProductId = productId;
            ProductName = productName;
            Sku = sku;
            Price = price;
            Stock = stock;
        }
    }

    public class Order
    {
        public string OrderNo { get; set; } = string.Empty;
        public string? CustomerName { get; set; }

        public Order() { }

        public Order(string orderNo, string? customerName)
        {
            OrderNo = orderNo;
            CustomerName = customerName;
        }
    }

    public class OrderItem
    {
        public string OrderNo { get; set; } = string.Empty;
        public int ItemSeq { get; set; }
        public string? ProductName { get; set; }

        public OrderItem() { }

        public OrderItem(string orderNo, int itemSeq, string? productName)
        {
            OrderNo = orderNo;
            ItemSeq = itemSeq;
            ProductName = productName;
        }
    }

    public class OrderItemId : IEquatable<OrderItemId>
    {
        public string OrderNo { get; set; } = string.Empty;
        public int ItemSeq { get; set; }

        public OrderItemId() { }

        public OrderItemId(string orderNo, int itemSeq)
        {
            OrderNo = orderNo;
            ItemSeq = itemSeq;
        }

        public bool Equals(OrderItemId? other)
        {
            if (other is null) return false;
            if (ReferenceEquals(this, other)) return true;
            return OrderNo == other.OrderNo && ItemSeq == other.ItemSeq;
        }

        public override bool Equals(object? obj) => Equals(obj as OrderItemId);

        public override int GetHashCode() => HashCode.Combine(OrderNo, ItemSeq);
    }

    // ==================== 基本功能測試 ====================

    [Trait("Category", "BasicFunctionality")]
    public class BasicFunctionalityTests
    {
        private readonly EntityTableAssertHelper _helper;

        public BasicFunctionalityTests()
        {
            var scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(scenarioContext);
            _helper = new EntityTableAssertHelper(resolver);
        }

        [Fact(DisplayName = "應該驗證主鍵不存在時通過")]
        public void ShouldPassWhenPrimaryKeyDoesNotExist()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            mockRepository.Setup(r => r.FindById(99999L)).Returns((Product?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["99999"]
            ]);

            // When & Then - 不拋出例外即通過
            var exception = Record.Exception(() =>
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec));

            Assert.Null(exception);
            mockRepository.Verify(r => r.FindById(99999L), Times.Once);
        }

        [Fact(DisplayName = "應該在主鍵存在時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyExists()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            var existingProduct = new Product(1001L, "已存在的商品", "SKU-001", 1000m, 10);
            mockRepository.Setup(r => r.FindById(1001L)).Returns(existingProduct);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["1001"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("商品", error.Message);
            Assert.Contains("should not exist", error.Message);
            mockRepository.Verify(r => r.FindById(1001L), Times.Once);
        }
    }

    // ==================== 錯誤處理測試 ====================

    [Trait("Category", "ErrorHandling")]
    public class ErrorHandlingTests
    {
        private readonly EntityTableAssertHelper _helper;

        public ErrorHandlingTests()
        {
            var scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(scenarioContext);
            _helper = new EntityTableAssertHelper(resolver);
        }

        [Fact(DisplayName = "應該在缺少主鍵欄位時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyFieldMissing()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productName"],
                ["測試商品"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            Assert.Contains("productId", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
        }

        [Fact(DisplayName = "應該在主鍵欄位為空字串時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyFieldIsEmpty()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                [""]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
        }

        [Fact(DisplayName = "應該在主鍵欄位以 & 開頭時拋出 AssertionError（視為無效）")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyStartsWithAmpersand()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["&gt(1000)"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
        }

        [Fact(DisplayName = "應該在主鍵欄位只有空格時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyFieldIsOnlyWhitespace()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["   "]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
        }

        [Fact(DisplayName = "應該在主鍵欄位為 null 時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenPrimaryKeyFieldIsNull()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            // 創建一個包含 null 值的 DataTable
            DataTable dataTable = TestDataTableFactory.FromMaps(
            [
                new Dictionary<string, string?> { { "productId", null } }
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
        }

        [Fact(DisplayName = "應該在複合主鍵中部分欄位為空字串時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenCompositePrimaryKeyHasEmptyField()
        {
            // Given
            var mockRepository = new Mock<IRepository<OrderItem, OrderItemId>>();

            var spec = new EntityTableSpec<OrderItem, OrderItemId>(
                "訂單項目",
                typeof(OrderItem),
                new HashSet<string> { "orderNo", "itemSeq" },
                map => new OrderItemId(
                    map["orderNo"].ToString()!,
                    int.Parse(map["itemSeq"].ToString()!)
                ),
                new HashSet<string> { "orderNo", "itemSeq" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo", "itemSeq"],
                ["ORD-001", ""]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<OrderItemId>()), Times.Never);
        }

        [Fact(DisplayName = "應該在複合主鍵中部分欄位以 & 開頭時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenCompositePrimaryKeyStartsWithAmpersand()
        {
            // Given
            var mockRepository = new Mock<IRepository<OrderItem, OrderItemId>>();

            var spec = new EntityTableSpec<OrderItem, OrderItemId>(
                "訂單項目",
                typeof(OrderItem),
                new HashSet<string> { "orderNo", "itemSeq" },
                map => new OrderItemId(
                    map["orderNo"].ToString()!,
                    int.Parse(map["itemSeq"].ToString()!)
                ),
                new HashSet<string> { "orderNo", "itemSeq" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo", "itemSeq"],
                ["ORD-001", "&skip"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<OrderItemId>()), Times.Never);
        }
    }

    // ==================== VAR-System 整合測試 ====================

    [Trait("Category", "VarSystemIntegration")]
    public class VarSystemIntegrationTests
    {
        private readonly ScenarioContext _scenarioContext;
        private readonly EntityTableAssertHelper _helper;

        public VarSystemIntegrationTests()
        {
            _scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new EntityTableAssertHelper(resolver);
        }

        [Fact(DisplayName = "應該使用 VAR-System 變數作為主鍵")]
        public void ShouldUseVariableAsPrimaryKey()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            _scenarioContext.PutObject("testProductId", 88888L);
            mockRepository.Setup(r => r.FindById(88888L)).Returns((Product?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["$testProductId"]
            ]);

            // When & Then - 不拋出例外即通過
            var exception = Record.Exception(() =>
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec));

            Assert.Null(exception);
            mockRepository.Verify(r => r.FindById(88888L), Times.Once);
        }
    }

    // ==================== 多行資料處理測試 ====================

    [Trait("Category", "MultipleRows")]
    public class MultipleRowsTests
    {
        private readonly EntityTableAssertHelper _helper;

        public MultipleRowsTests()
        {
            var scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(scenarioContext);
            _helper = new EntityTableAssertHelper(resolver);
        }

        [Fact(DisplayName = "應該處理多行資料")]
        public void ShouldHandleMultipleRows()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            mockRepository.Setup(r => r.FindById(2001L)).Returns((Product?)null);
            mockRepository.Setup(r => r.FindById(2002L)).Returns((Product?)null);
            mockRepository.Setup(r => r.FindById(2003L)).Returns((Product?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["2001"],
                ["2002"],
                ["2003"]
            ]);

            // When & Then - 不拋出例外即通過
            var exception = Record.Exception(() =>
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec));

            Assert.Null(exception);

            // 驗證查詢了所有 ID
            mockRepository.Verify(r => r.FindById(2001L), Times.Once);
            mockRepository.Verify(r => r.FindById(2002L), Times.Once);
            mockRepository.Verify(r => r.FindById(2003L), Times.Once);
        }

        [Fact(DisplayName = "應該在多行資料中，如果任何一行存在則拋出 AssertionError")]
        public void ShouldThrowAssertionErrorIfAnyRowExists()
        {
            // Given
            var mockRepository = new Mock<IRepository<Product, long>>();

            var spec = new EntityTableSpec<Product, long>(
                "商品",
                typeof(Product),
                new HashSet<string> { "productId" },
                map => long.Parse(map["productId"].ToString()!),
                new HashSet<string> { "sku" },
                new List<string>(),
                new HashSet<string>()
            );

            mockRepository.Setup(r => r.FindById(3001L)).Returns((Product?)null);
            var existingProduct = new Product(3002L, "存在的商品", "SKU-EXISTS", 1000m, 10);
            mockRepository.Setup(r => r.FindById(3002L)).Returns(existingProduct);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["productId"],
                ["3001"],
                ["3002"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("商品", error.Message);
            Assert.Contains("should not exist", error.Message);
            mockRepository.Verify(r => r.FindById(3001L), Times.Once);
            mockRepository.Verify(r => r.FindById(3002L), Times.Once);
        }
    }

    // ==================== 不同主鍵類型測試 ====================

    [Trait("Category", "DifferentPrimaryKeyTypes")]
    public class DifferentPrimaryKeyTypesTests
    {
        private readonly EntityTableAssertHelper _helper;

        public DifferentPrimaryKeyTypesTests()
        {
            var scenarioContext = new ScenarioContext();
            var resolver = new ISAFeatureArgumentResolver(scenarioContext);
            _helper = new EntityTableAssertHelper(resolver);
        }

        [Fact(DisplayName = "應該支援 String 型別主鍵")]
        public void ShouldSupportStringPrimaryKey()
        {
            // Given
            var mockRepository = new Mock<IRepository<Order, string>>();

            var spec = new EntityTableSpec<Order, string>(
                "訂單",
                typeof(Order),
                new HashSet<string> { "orderNo" },
                map => map["orderNo"].ToString()!,
                new HashSet<string> { "customerName" },
                new List<string>(),
                new HashSet<string>()
            );

            mockRepository.Setup(r => r.FindById("ORD-NOT-EXISTS")).Returns((Order?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo"],
                ["ORD-NOT-EXISTS"]
            ]);

            // When & Then - 不拋出例外即通過
            var exception = Record.Exception(() =>
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec));

            Assert.Null(exception);
            mockRepository.Verify(r => r.FindById("ORD-NOT-EXISTS"), Times.Once);
        }

        [Fact(DisplayName = "應該支援複合主鍵")]
        public void ShouldSupportCompositePrimaryKey()
        {
            // Given
            var mockRepository = new Mock<IRepository<OrderItem, OrderItemId>>();

            var spec = new EntityTableSpec<OrderItem, OrderItemId>(
                "訂單項目",
                typeof(OrderItem),
                new HashSet<string> { "orderNo", "itemSeq" },
                map => new OrderItemId(
                    map["orderNo"].ToString()!,
                    int.Parse(map["itemSeq"].ToString()!)
                ),
                new HashSet<string> { "orderNo", "itemSeq" },
                new List<string>(),
                new HashSet<string>()
            );

            var compositeKey = new OrderItemId("ORD-001", 1);
            // 回傳 null 表示「資料不存在」，assertNotExists 預期不存在時通過
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns((OrderItem?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo", "itemSeq"],
                ["ORD-001", "1"]
            ]);

            // When & Then - 不拋出例外即通過（因為資料不存在）
            var exception = Record.Exception(() =>
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec));

            Assert.Null(exception);
            mockRepository.Verify(r => r.FindById(compositeKey), Times.Once);
        }

        [Fact(DisplayName = "應該在複合主鍵缺少部分欄位時拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenCompositePrimaryKeyPartiallyMissing()
        {
            // Given
            var mockRepository = new Mock<IRepository<OrderItem, OrderItemId>>();

            var spec = new EntityTableSpec<OrderItem, OrderItemId>(
                "訂單項目",
                typeof(OrderItem),
                new HashSet<string> { "orderNo", "itemSeq" },
                map => new OrderItemId(
                    map["orderNo"].ToString()!,
                    int.Parse(map["itemSeq"].ToString()!)
                ),
                new HashSet<string> { "orderNo", "itemSeq" },
                new List<string>(),
                new HashSet<string>()
            );

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo"],
                ["ORD-001"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertNotExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("缺少主鍵欄位", error.Message);
            Assert.Contains("itemSeq", error.Message);
            mockRepository.Verify(r => r.FindById(It.IsAny<OrderItemId>()), Times.Never);
        }
    }
}
