using Moq;
using Reqnroll;
using Tw.Sdd.Isa.TestLib.Helper;
using Tw.Sdd.Isa.TestLib.Testables.Repository;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// EntityTableAssertHelper PK 查詢測試
///
/// 測試策略：
/// - ISAFeatureArgumentResolver 使用真實實例（含 ScenarioContext）
/// - IRepository 使用 Moq Mock
///
/// 測試範圍：
/// 1. 各種類型的 PK 查詢（Long, Integer, String, UUID 等）
/// 2. 使用 VAR-System 變數作為 PK
/// 3. 使用 ScenarioContext 變數作為 PK
/// 4. 使用 $key 引用 ScenarioContext 變數
/// 5. PK 不存在時的錯誤處理
/// 6. 多筆資料的 PK 查詢
/// </summary>
[Trait("Category", "EntityTableAssertHelper")]
public class EntityTableAssertHelperPKQueryTest
{
    private readonly ScenarioContext _scenarioContext;
    private readonly ISAFeatureArgumentResolver _resolver;
    private readonly EntityTableAssertHelper _helper;

    public EntityTableAssertHelperPKQueryTest()
    {
        _scenarioContext = new ScenarioContext();
        _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        _helper = new EntityTableAssertHelper(_resolver);
    }

    // ==================== 測試用 Entity ====================

    public class Product
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Sku { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }

        public Product() { }

        public Product(long id, string? name, string? sku, decimal price, int stock)
        {
            Id = id;
            Name = name;
            Sku = sku;
            Price = price;
            Stock = stock;
        }
    }

    public class Order
    {
        public string OrderNo { get; set; } = string.Empty;
        public string? CustomerName { get; set; }
        public DateOnly OrderDate { get; set; }
        public decimal TotalAmount { get; set; }

        public Order() { }

        public Order(string orderNo, string? customerName, DateOnly orderDate, decimal totalAmount)
        {
            OrderNo = orderNo;
            CustomerName = customerName;
            OrderDate = orderDate;
            TotalAmount = totalAmount;
        }
    }

    public class Book
    {
        public int BookId { get; set; }
        public string? Isbn { get; set; }
        public string? Title { get; set; }
        public string? Author { get; set; }
        public DateTime? PublishedAt { get; set; }

        public Book() { }

        public Book(int bookId, string? isbn, string? title, string? author)
        {
            BookId = bookId;
            Isbn = isbn;
            Title = title;
            Author = author;
        }
    }

    // ==================== 複合主鍵測試用 Entity ====================

    /// <summary>
    /// 複合主鍵實體：考勤記錄
    /// </summary>
    public class AttendanceRecord
    {
        public long AgentId { get; set; }
        public DateOnly Date { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string? Status { get; set; }

        public AttendanceRecord() { }

        public AttendanceRecord(long agentId, DateOnly date, DateTime? checkInTime, DateTime? checkOutTime, string? status)
        {
            AgentId = agentId;
            Date = date;
            CheckInTime = checkInTime;
            CheckOutTime = checkOutTime;
            Status = status;
        }
    }

    /// <summary>
    /// 複合主鍵類別：考勤記錄 ID
    /// </summary>
    public class AttendanceRecordId : IEquatable<AttendanceRecordId>
    {
        public long AgentId { get; set; }
        public DateOnly Date { get; set; }

        public AttendanceRecordId() { }

        public AttendanceRecordId(long agentId, DateOnly date)
        {
            AgentId = agentId;
            Date = date;
        }

        public bool Equals(AttendanceRecordId? other)
        {
            if (other is null) return false;
            if (ReferenceEquals(this, other)) return true;
            return AgentId == other.AgentId && Date == other.Date;
        }

        public override bool Equals(object? obj) => Equals(obj as AttendanceRecordId);

        public override int GetHashCode() => HashCode.Combine(AgentId, Date);
    }

    /// <summary>
    /// 複合主鍵實體：訂單項目
    /// </summary>
    public class OrderItem
    {
        public string OrderNo { get; set; } = string.Empty;
        public int ItemSeq { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        public OrderItem() { }

        public OrderItem(string orderNo, int itemSeq, string? productName, int quantity, decimal unitPrice)
        {
            OrderNo = orderNo;
            ItemSeq = itemSeq;
            ProductName = productName;
            Quantity = quantity;
            UnitPrice = unitPrice;
        }
    }

    /// <summary>
    /// 訂單項目複合主鍵
    /// </summary>
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

    // ==================== PK 類型測試 ====================

    [Fact(DisplayName = "應該使用 Long 型別 PK 查詢商品")]
    public void ShouldFindProductByLongPrimaryKey()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name", "sku" },
            new List<string>(),
            new HashSet<string>()
        );

        var product = new Product(1001L, "筆記型電腦", "LAPTOP-001", 35000m, 10);
        mockRepository.Setup(r => r.FindById(1001L)).Returns(product);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "name", "price", "stock"],
            ["1001", "筆記型電腦", "35000", "10"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(1001L), Times.Once);
        mockRepository.Verify(r => r.FindAll(), Times.Never);
    }

    [Fact(DisplayName = "應該使用 Integer 型別 PK 查詢書籍")]
    public void ShouldFindBookByIntegerPrimaryKey()
    {
        // Given
        var mockRepository = new Mock<IRepository<Book, int>>();

        var spec = new EntityTableSpec<Book, int>(
            "書籍",
            typeof(Book),
            new HashSet<string> { "bookId" },
            map => int.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "isbn", "title" },
            new List<string>(),
            new HashSet<string>()
        );

        var book = new Book(101, "978-3-16-148410-0", "Clean Code", "Robert C. Martin");
        mockRepository.Setup(r => r.FindById(101)).Returns(book);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["bookId", "title", "author"],
            ["101", "Clean Code", "Robert C. Martin"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(101), Times.Once);
        mockRepository.Verify(r => r.FindAll(), Times.Never);
    }

    [Fact(DisplayName = "應該使用 String 型別 PK 查詢訂單")]
    public void ShouldFindOrderByStringPrimaryKey()
    {
        // Given
        var mockRepository = new Mock<IRepository<Order, string>>();

        var spec = new EntityTableSpec<Order, string>(
            "訂單",
            typeof(Order),
            new HashSet<string> { "orderNo" },
            map => map.Values.First().ToString()!,
            new HashSet<string> { "customerName" },
            new List<string>(),
            new HashSet<string>()
        );

        var order = new Order("ORD-2025-0001", "王大明", new DateOnly(2025, 12, 20), 1500m);
        mockRepository.Setup(r => r.FindById("ORD-2025-0001")).Returns(order);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["orderNo", "customerName", "totalAmount"],
            ["ORD-2025-0001", "王大明", "1500"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById("ORD-2025-0001"), Times.Once);
        mockRepository.Verify(r => r.FindAll(), Times.Never);
    }

    // ==================== VAR-System 整合測試 ====================

    [Fact(DisplayName = "應該使用 $variable 從 ScenarioContext 取得 PK 值查詢")]
    public void ShouldFindByPrimaryKeyFromVariable()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name" },
            new List<string>(),
            new HashSet<string>()
        );

        // 設定 VAR-System 變數
        _scenarioContext.PutObject("savedProductId", 2001L);

        var product = new Product(2001L, "滑鼠", "MOUSE-001", 500m, 50);
        mockRepository.Setup(r => r.FindById(2001L)).Returns(product);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "name", "price"],
            ["$savedProductId", "滑鼠", "500"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(2001L), Times.Once);
    }

    [Fact(DisplayName = "應該使用 ScenarioContext 變數取得 PK 值查詢")]
    public void ShouldFindByPrimaryKeyFromScenarioContext()
    {
        // Given
        var mockRepository = new Mock<IRepository<Order, string>>();

        var spec = new EntityTableSpec<Order, string>(
            "訂單",
            typeof(Order),
            new HashSet<string> { "orderNo" },
            map => map.Values.First().ToString()!,
            new HashSet<string> { "customerName" },
            new List<string>(),
            new HashSet<string>()
        );

        // 模擬 API response 儲存訂單編號
        _scenarioContext.PutObject("createdOrderNo", "ORD-2025-9999");

        var order = new Order("ORD-2025-9999", "李小華", new DateOnly(2025, 12, 21), 3000m);
        mockRepository.Setup(r => r.FindById("ORD-2025-9999")).Returns(order);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["orderNo", "customerName", "totalAmount"],
            ["$createdOrderNo", "李小華", "3000"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById("ORD-2025-9999"), Times.Once);
    }

    [Fact(DisplayName = "應該使用 ScenarioContext 變數並使用 $contextKey 引用 PK 值")]
    public void ShouldStoreAndReuseContextKey()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name" },
            new List<string>(),
            new HashSet<string>()
        );

        var product1 = new Product(5001L, "鍵盤", "KEYBOARD-001", 1200m, 20);
        var product2 = new Product(5001L, "鍵盤", "KEYBOARD-001", 1200m, 20);

        mockRepository.SetupSequence(r => r.FindById(5001L))
            .Returns(product1)
            .Returns(product2);

        // 第一次查詢：使用固定 id 查詢
        DataTable dataTable1 = TestDataTableFactory.FromRows(
        [
            ["id", "name", "price"],
            ["5001", "鍵盤", "1200"]
        ]);

        // When - 第一次查詢
        _helper.AssertExists(dataTable1, mockRepository.Object, spec);

        _scenarioContext.PutObject("keyboardId", product1.Id);

        // 第二次查詢：使用 $keyboardId 引用之前儲存的值
        DataTable dataTable2 = TestDataTableFactory.FromRows(
        [
            ["id", "name", "stock"],
            ["$keyboardId", "鍵盤", "20"]
        ]);

        // When - 第二次查詢
        _helper.AssertExists(dataTable2, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(5001L), Times.Exactly(2));
        Assert.Equal(5001L, _scenarioContext.Get("keyboardId"));
    }

    // ==================== 錯誤處理測試 ====================

    [Fact(DisplayName = "PK 不存在時應拋出 AssertionError 並包含詳細訊息")]
    public void ShouldThrowAssertionErrorWhenPrimaryKeyNotFound()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name" },
            new List<string>(),
            new HashSet<string>()
        );

        mockRepository.Setup(r => r.FindById(9999L)).Returns((Product?)null);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "name"],
            ["9999", "不存在的商品"]
        ]);

        // When & Then
        var error = Assert.ThrowsAny<Exception>(() =>
        {
            _helper.AssertExists(dataTable, mockRepository.Object, spec);
        });

        Assert.Contains("商品", error.Message);
        Assert.Contains("id=9999", error.Message);
        Assert.Contains("should exist", error.Message);
    }

    [Fact(DisplayName = "VAR-System 變數不存在時應拋出錯誤")]
    public void ShouldThrowErrorWhenVariableNotFound()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name" },
            new List<string>(),
            new HashSet<string>()
        );

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "name"],
            ["$nonExistentVariable", "商品A"]
        ]);

        // When & Then
        Assert.ThrowsAny<Exception>(() =>
        {
            _helper.AssertExists(dataTable, mockRepository.Object, spec);
        });
    }

    // ==================== 多筆資料測試 ====================

    [Fact(DisplayName = "應該能夠查詢多筆不同 PK 的資料")]
    public void ShouldFindMultipleRowsByDifferentPrimaryKeys()
    {
        // Given
        var mockRepository = new Mock<IRepository<Product, long>>();

        var spec = new EntityTableSpec<Product, long>(
            "商品",
            typeof(Product),
            new HashSet<string> { "id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "name" },
            new List<string>(),
            new HashSet<string>()
        );

        var product1 = new Product(100L, "商品A", "SKU-A", 100m, 10);
        var product2 = new Product(200L, "商品B", "SKU-B", 200m, 20);
        var product3 = new Product(300L, "商品C", "SKU-C", 300m, 30);

        mockRepository.Setup(r => r.FindById(100L)).Returns(product1);
        mockRepository.Setup(r => r.FindById(200L)).Returns(product2);
        mockRepository.Setup(r => r.FindById(300L)).Returns(product3);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["id", "name", "price"],
            ["100", "商品A", "100"],
            ["200", "商品B", "200"],
            ["300", "商品C", "300"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(100L), Times.Once);
        mockRepository.Verify(r => r.FindById(200L), Times.Once);
        mockRepository.Verify(r => r.FindById(300L), Times.Once);
        mockRepository.Verify(r => r.FindAll(), Times.Never);
    }

    [Fact(DisplayName = "應該能夠混合使用直接值和 VAR-System 變數查詢多筆資料")]
    public void ShouldFindMultipleRowsWithMixedPKSources()
    {
        // Given
        var mockRepository = new Mock<IRepository<Book, int>>();

        var spec = new EntityTableSpec<Book, int>(
            "書籍",
            typeof(Book),
            new HashSet<string> { "bookId" },
            map => int.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "title" },
            new List<string>(),
            new HashSet<string>()
        );

        // 設定變數
        _scenarioContext.PutObject("book2Id", 202);

        var book1 = new Book(201, "ISBN-1", "書籍1", "作者1");
        var book2 = new Book(202, "ISBN-2", "書籍2", "作者2");
        var book3 = new Book(203, "ISBN-3", "書籍3", "作者3");

        mockRepository.Setup(r => r.FindById(201)).Returns(book1);
        mockRepository.Setup(r => r.FindById(202)).Returns(book2);
        mockRepository.Setup(r => r.FindById(203)).Returns(book3);

        DataTable dataTable = TestDataTableFactory.FromRows(
        [
            ["bookId", "title", "author"],
            ["201", "書籍1", "作者1"],
            ["$book2Id", "書籍2", "作者2"],
            ["203", "書籍3", "作者3"]
        ]);

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        _scenarioContext.PutObject("savedBook1", book1.BookId);

        // Then
        mockRepository.Verify(r => r.FindById(201), Times.Once);
        mockRepository.Verify(r => r.FindById(202), Times.Once);
        mockRepository.Verify(r => r.FindById(203), Times.Once);
        Assert.Equal(201, _scenarioContext.Get("savedBook1"));
    }

    // ==================== 複合主鍵測試 ====================

    [Trait("Category", "CompositePrimaryKey")]
    public class CompositePrimaryKeyTests
    {
        private readonly ScenarioContext _scenarioContext;
        private readonly ISAFeatureArgumentResolver _resolver;
        private readonly EntityTableAssertHelper _helper;

        public CompositePrimaryKeyTests()
        {
            _scenarioContext = new ScenarioContext();
            _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
            _helper = new EntityTableAssertHelper(_resolver);
        }

        [Fact(DisplayName = "應該使用複合主鍵 (Long + DateOnly) 查詢考勤記錄")]
        public void ShouldFindAttendanceRecordByCompositePrimaryKey()
        {
            // Given
            var mockRepository = new Mock<IRepository<AttendanceRecord, AttendanceRecordId>>();

            var spec = new EntityTableSpec<AttendanceRecord, AttendanceRecordId>(
                "考勤記錄",
                typeof(AttendanceRecord),
                new HashSet<string> { "agentId", "date" },
                map => new AttendanceRecordId(
                    long.Parse(map["agentId"].ToString()!),
                    DateOnly.Parse(map["date"].ToString()!)
                ),
                new HashSet<string> { "agentId", "date" },
                new List<string>(),
                new HashSet<string>()
            );

            var compositeKey = new AttendanceRecordId(1001L, new DateOnly(2025, 12, 25));
            var record = new AttendanceRecord(
                1001L,
                new DateOnly(2025, 12, 25),
                new DateTime(2025, 12, 25, 9, 0, 0),
                new DateTime(2025, 12, 25, 18, 0, 0),
                "NORMAL"
            );
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns(record);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["agentId", "date", "status"],
                ["1001", "2025-12-25", "NORMAL"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(compositeKey), Times.Once);
            mockRepository.Verify(r => r.FindAll(), Times.Never);
        }

        [Fact(DisplayName = "應該使用複合主鍵 (String + Integer) 查詢訂單項目")]
        public void ShouldFindOrderItemByCompositePrimaryKey()
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
            var item = new OrderItem("ORD-001", 1, "商品A", 2, 100m);
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns(item);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo", "itemSeq", "productName", "quantity"],
                ["ORD-001", "1", "商品A", "2"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(compositeKey), Times.Once);
            mockRepository.Verify(r => r.FindAll(), Times.Never);
        }

        [Fact(DisplayName = "複合主鍵部分欄位缺失時應使用 QBE 查詢")]
        public void ShouldUseQBEWhenCompositePrimaryKeyPartiallyMissing()
        {
            // Given
            var mockRepository = new Mock<IRepository<AttendanceRecord, AttendanceRecordId>>();

            var spec = new EntityTableSpec<AttendanceRecord, AttendanceRecordId>(
                "考勤記錄",
                typeof(AttendanceRecord),
                new HashSet<string> { "agentId", "date" },
                map => new AttendanceRecordId(
                    long.Parse(map["agentId"].ToString()!),
                    DateOnly.Parse(map["date"].ToString()!)
                ),
                new HashSet<string> { "agentId", "status" },
                new List<string> { "date" },
                new HashSet<string>()
            );

            var record = new AttendanceRecord(
                1001L,
                new DateOnly(2025, 12, 25),
                new DateTime(2025, 12, 25, 9, 0, 0),
                new DateTime(2025, 12, 25, 18, 0, 0),
                "NORMAL"
            );
            mockRepository.Setup(r => r.FindAll()).Returns(new List<AttendanceRecord> { record });

            // DataTable 中只有 agentId 和 status，沒有 date (複合主鍵的一部分缺失)
            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["agentId", "status"],
                ["1001", "NORMAL"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(It.IsAny<AttendanceRecordId>()), Times.Never);
            mockRepository.Verify(r => r.FindAll(), Times.Once);
        }

        [Fact(DisplayName = "應該查詢多筆不同複合主鍵的考勤記錄")]
        public void ShouldFindMultipleAttendanceRecordsByCompositePrimaryKeys()
        {
            // Given
            var mockRepository = new Mock<IRepository<AttendanceRecord, AttendanceRecordId>>();

            var spec = new EntityTableSpec<AttendanceRecord, AttendanceRecordId>(
                "考勤記錄",
                typeof(AttendanceRecord),
                new HashSet<string> { "agentId", "date" },
                map => new AttendanceRecordId(
                    long.Parse(map["agentId"].ToString()!),
                    DateOnly.Parse(map["date"].ToString()!)
                ),
                new HashSet<string> { "agentId", "date" },
                new List<string>(),
                new HashSet<string>()
            );

            var key1 = new AttendanceRecordId(1001L, new DateOnly(2025, 12, 25));
            var key2 = new AttendanceRecordId(1001L, new DateOnly(2025, 12, 26));
            var key3 = new AttendanceRecordId(1002L, new DateOnly(2025, 12, 25));

            var record1 = new AttendanceRecord(1001L, new DateOnly(2025, 12, 25),
                new DateTime(2025, 12, 25, 9, 0, 0), new DateTime(2025, 12, 25, 18, 0, 0), "NORMAL");
            var record2 = new AttendanceRecord(1001L, new DateOnly(2025, 12, 26),
                new DateTime(2025, 12, 26, 9, 0, 0), new DateTime(2025, 12, 26, 18, 0, 0), "NORMAL");
            var record3 = new AttendanceRecord(1002L, new DateOnly(2025, 12, 25),
                new DateTime(2025, 12, 25, 9, 0, 0), new DateTime(2025, 12, 25, 18, 0, 0), "LATE");

            mockRepository.Setup(r => r.FindById(key1)).Returns(record1);
            mockRepository.Setup(r => r.FindById(key2)).Returns(record2);
            mockRepository.Setup(r => r.FindById(key3)).Returns(record3);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["agentId", "date", "status"],
                ["1001", "2025-12-25", "NORMAL"],
                ["1001", "2025-12-26", "NORMAL"],
                ["1002", "2025-12-25", "LATE"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(key1), Times.Once);
            mockRepository.Verify(r => r.FindById(key2), Times.Once);
            mockRepository.Verify(r => r.FindById(key3), Times.Once);
            mockRepository.Verify(r => r.FindAll(), Times.Never);
        }

        [Fact(DisplayName = "複合主鍵不存在時應拋出 AssertionError")]
        public void ShouldThrowAssertionErrorWhenCompositePrimaryKeyNotFound()
        {
            // Given
            var mockRepository = new Mock<IRepository<AttendanceRecord, AttendanceRecordId>>();

            var spec = new EntityTableSpec<AttendanceRecord, AttendanceRecordId>(
                "考勤記錄",
                typeof(AttendanceRecord),
                new HashSet<string> { "agentId", "date" },
                map => new AttendanceRecordId(
                    long.Parse(map["agentId"].ToString()!),
                    DateOnly.Parse(map["date"].ToString()!)
                ),
                new HashSet<string> { "agentId", "date" },
                new List<string>(),
                new HashSet<string>()
            );

            var compositeKey = new AttendanceRecordId(9999L, new DateOnly(2025, 12, 25));
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns((AttendanceRecord?)null);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["agentId", "date", "status"],
                ["9999", "2025-12-25", "NORMAL"]
            ]);

            // When & Then
            var error = Assert.ThrowsAny<Exception>(() =>
            {
                _helper.AssertExists(dataTable, mockRepository.Object, spec);
            });

            Assert.Contains("考勤記錄", error.Message);
            Assert.Contains("should exist", error.Message);
        }

        [Fact(DisplayName = "應該使用 $variable 查詢複合主鍵")]
        public void ShouldFindByCompositePrimaryKeyFromVariables()
        {
            // Given
            var mockRepository = new Mock<IRepository<AttendanceRecord, AttendanceRecordId>>();

            var spec = new EntityTableSpec<AttendanceRecord, AttendanceRecordId>(
                "考勤記錄",
                typeof(AttendanceRecord),
                new HashSet<string> { "agentId", "date" },
                map => new AttendanceRecordId(
                    long.Parse(map["agentId"].ToString()!),
                    DateOnly.Parse(map["date"].ToString()!)
                ),
                new HashSet<string> { "agentId", "date" },
                new List<string>(),
                new HashSet<string>()
            );

            // 設定變數
            _scenarioContext.PutObject("currentAgentId", 1001L);
            _scenarioContext.PutObject("targetDate", new DateOnly(2025, 12, 25));

            var compositeKey = new AttendanceRecordId(1001L, new DateOnly(2025, 12, 25));
            var record = new AttendanceRecord(1001L, new DateOnly(2025, 12, 25),
                new DateTime(2025, 12, 25, 9, 0, 0), new DateTime(2025, 12, 25, 18, 0, 0), "NORMAL");
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns(record);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["agentId", "date", "status"],
                ["$currentAgentId", "$targetDate", "NORMAL"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(compositeKey), Times.Once);
        }

        [Fact(DisplayName = "應該混合使用直接值和變數查詢複合主鍵")]
        public void ShouldFindByCompositePKWithMixedDirectValueAndVariable()
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

            _scenarioContext.PutObject("savedOrderNo", "ORD-001");

            var compositeKey = new OrderItemId("ORD-001", 1);
            var item = new OrderItem("ORD-001", 1, "商品A", 2, 100m);
            mockRepository.Setup(r => r.FindById(compositeKey)).Returns(item);

            DataTable dataTable = TestDataTableFactory.FromRows(
            [
                ["orderNo", "itemSeq", "productName"],
                ["$savedOrderNo", "1", "商品A"]
            ]);

            // When
            _helper.AssertExists(dataTable, mockRepository.Object, spec);

            // Then
            mockRepository.Verify(r => r.FindById(compositeKey), Times.Once);
        }
    }
}
