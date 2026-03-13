using Moq;
using Tw.Sdd.Isa.TestLib.Helper;
using Tw.Sdd.Isa.TestLib.Testables.Repository;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// EntityTableAssertHelper 欄位驗證測試
///
/// 測試策略：
/// - ISAFeatureArgumentResolver 使用真實實例（含 ScenarioContext）
/// - IRepository 使用 Moq Mock
///
/// 測試範圍：
/// 1. 基本型別驗證（String, Integer, Long, Decimal 等）
/// 2. 時間型別驗證（LocalDate, LocalDateTime, LocalTime）
/// 3. Enum 型別驗證
/// 4. 使用 CAS 約束驗證欄位（&gt, &lt, &contains, &isEmpty 等）
/// 5. 使用 VAR-System 變數驗證欄位值
/// 6. 使用 TIME-System 時間表達式驗證
/// 7. blankMeansNull 欄位處理
/// 8. 欄位驗證失敗的錯誤處理
/// </summary>
[Trait("Category", "EntityTableAssertHelper 欄位驗證測試")]
public class EntityTableAssertHelperValidationTest
{
    private ScenarioContext _scenarioContext = null!;
    private ISAFeatureArgumentResolver _resolver = null!;
    private EntityTableAssertHelper _helper = null!;

    public EntityTableAssertHelperValidationTest()
    {
        _scenarioContext = new ScenarioContext();
        _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        _helper = new EntityTableAssertHelper(_resolver);
    }

    // ==================== 測試用 Entity ====================

    public class Transaction
    {
        public long TransactionId { get; set; }
        public string? ReferenceNo { get; set; }
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
        public TransactionStatus? Status { get; set; }
        public DateOnly? TransactionDate { get; set; }
        public DateTime? CreatedAt { get; set; }
        public TimeOnly? ProcessedTime { get; set; }
        public string? Description { get; set; }
        public string? Remark { get; set; }

        public Transaction() { }

        public Transaction(long transactionId, string? referenceNo, decimal amount, string? currency)
        {
            TransactionId = transactionId;
            ReferenceNo = referenceNo;
            Amount = amount;
            Currency = currency;
        }
    }

    public enum TransactionStatus
    {
        PENDING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // ==================== 基本型別驗證測試 ====================

    [Fact(DisplayName = "應該正確驗證 String 型別欄位")]
    public void ShouldValidateStringField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(1001L, "REF-2025-001", 1500.00m, "TWD")
        {
            Description = "購買商品"
        };

        mockRepository.Setup(r => r.FindById(1001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "referenceNo", "description" },
            new() { "1001", "REF-2025-001", "購買商品" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該正確驗證 Decimal 型別欄位")]
    public void ShouldValidateDecimalField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(2001L, "REF-2025-002", 9999.99m, "USD");
        mockRepository.Setup(r => r.FindById(2001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", "currency" },
            new() { "2001", "9999.99", "USD" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該正確驗證 Enum 型別欄位")]
    public void ShouldValidateEnumField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(3001L, "REF-2025-003", 500m, "TWD")
        {
            Status = TransactionStatus.COMPLETED
        };

        mockRepository.Setup(r => r.FindById(3001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "status", "amount" },
            new() { "3001", "COMPLETED", "500" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    // ==================== 時間型別驗證測試 ====================

    [Fact(DisplayName = "應該正確驗證 LocalDate 型別欄位")]
    public void ShouldValidateLocalDateField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(4001L, "REF-2025-004", 1000m, "TWD")
        {
            TransactionDate = new DateOnly(2025, 12, 21)
        };

        mockRepository.Setup(r => r.FindById(4001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "transactionDate", "amount" },
            new() { "4001", "@time(\"2025-12-21\")", "1000" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該正確驗證 LocalDateTime 型別欄位")]
    public void ShouldValidateLocalDateTimeField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(5001L, "REF-2025-005", 2000m, "TWD")
        {
            CreatedAt = new DateTime(2025, 12, 21, 14, 30, 0)
        };

        mockRepository.Setup(r => r.FindById(5001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "createdAt", "amount" },
            new() { "5001", "@time(\"2025-12-21T14:30:00\")", "2000" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該正確驗證 LocalTime 型別欄位")]
    public void ShouldValidateLocalTimeField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(6001L, "REF-2025-006", 800m, "TWD")
        {
            ProcessedTime = new TimeOnly(9, 30, 0)
        };

        mockRepository.Setup(r => r.FindById(6001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "processedTime", "amount" },
            new() { "6001", "@localtime(\"09:30:00\")", "800" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    // ==================== CAS 約束驗證測試 ====================

    [Fact(DisplayName = "應該使用 CAS &gt 約束驗證數值欄位")]
    public void ShouldValidateWithCASGreaterThan()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(7001L, "REF-2025-007", 5000m, "TWD");
        mockRepository.Setup(r => r.FindById(7001L)).Returns(transaction);

        // 使用 CAS 驗證金額 > 1000
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", "referenceNo" },
            new() { "7001", "&gt(1000)", "REF-2025-007" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該使用 CAS &lt 約束驗證數值欄位")]
    public void ShouldValidateWithCASLessThan()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(7002L, "REF-2025-008", 300m, "TWD");
        mockRepository.Setup(r => r.FindById(7002L)).Returns(transaction);

        // 使用 CAS 驗證金額 < 1000
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount" },
            new() { "7002", "&lt(1000)" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該使用 CAS &contains 約束驗證字串欄位")]
    public void ShouldValidateWithCASContains()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(8001L, "REF-2025-009", 1200m, "TWD")
        {
            Description = "線上購買商品"
        };

        mockRepository.Setup(r => r.FindById(8001L)).Returns(transaction);

        // 使用 CAS 驗證 description 包含 "購買"
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "description" },
            new() { "8001", "&contains(\"購買\")" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該使用 CAS &isEmpty 約束驗證空字串")]
    public void ShouldValidateWithCASIsEmpty()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(8002L, "REF-2025-010", 600m, "TWD")
        {
            Remark = ""  // 空字串
        };

        mockRepository.Setup(r => r.FindById(8002L)).Returns(transaction);

        // 使用 CAS 驗證 remark 為空
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "remark" },
            new() { "8002", "&isEmpty" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該使用 CAS &isNull 約束驗證 null 值")]
    public void ShouldValidateWithCASIsNull()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(8003L, "REF-2025-011", 400m, "TWD")
        {
            Remark = null  // null 值
        };

        mockRepository.Setup(r => r.FindById(8003L)).Returns(transaction);

        // 使用 CAS 驗證 remark 為 null
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "remark" },
            new() { "8003", "&isNull" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    // ==================== VAR-System 變數驗證測試 ====================

    [Fact(DisplayName = "應該使用 VAR-System 變數驗證欄位值")]
    public void ShouldValidateFieldWithVariable()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        // 設定期望值變數
        _scenarioContext.PutObject("expectedAmount", 2500m);
        _scenarioContext.PutObject("expectedCurrency", "USD");

        var transaction = new Transaction(9001L, "REF-2025-012", 2500m, "USD");
        mockRepository.Setup(r => r.FindById(9001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", "currency" },
            new() { "9001", "$expectedAmount", "$expectedCurrency" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該使用 ScenarioContext 變數並使用 $contextKey 驗證")]
    public void ShouldStoreAndValidateFieldValue()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var trans1 = new Transaction(9002L, "REF-2025-013", 3000m, "TWD");
        var trans2 = new Transaction(9003L, "REF-2025-014", 3000m, "TWD");

        mockRepository.Setup(r => r.FindById(9002L)).Returns(trans1);
        mockRepository.Setup(r => r.FindById(9003L)).Returns(trans2);

        // 第一次查詢：準備 amount 供後續驗證
        var rows1 = new List<List<string>>
        {
            new() { "transactionId", "amount" },
            new() { "9002", "3000" }
        };
        var dataTable1 = TestDataTableFactory.FromRows(rows1);
        _helper.AssertExists(dataTable1, mockRepository.Object, spec);

        _scenarioContext.PutObject("savedAmount", trans1.Amount);

        // 第二次查詢：使用 $savedAmount 驗證
        var dataTable2 = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount" },
            new() { "9003", "$savedAmount" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable2, mockRepository.Object, spec));
        Assert.Null(exception);
        Assert.Equal(3000m, _scenarioContext.Get("savedAmount"));
    }

    // ==================== blankMeansNull 欄位處理測試 ====================

    [Fact(DisplayName = "應該正確處理 blankMeansNull 欄位（空字串視為 null）")]
    public void ShouldHandleBlankMeansNullFields()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string> { "remark" }  // remark 欄位空字串視為 null
        );

        var transaction = new Transaction(10001L, "REF-2025-015", 1500m, "TWD")
        {
            Remark = null  // 實際值為 null
        };

        mockRepository.Setup(r => r.FindById(10001L)).Returns(transaction);

        // DataTable 中 remark 為空字串，應視為期望 null
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", "remark" },
            new() { "10001", "1500", "" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    // ==================== 複合驗證測試 ====================

    [Fact(DisplayName = "應該同時驗證多種類型的欄位")]
    public void ShouldValidateMultipleFieldTypes()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(11001L, "REF-2025-016", 8888.88m, "USD")
        {
            Status = TransactionStatus.COMPLETED,
            TransactionDate = new DateOnly(2025, 12, 21),
            CreatedAt = new DateTime(2025, 12, 21, 10, 30, 0),
            Description = "國際匯款"
        };

        mockRepository.Setup(r => r.FindById(11001L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "referenceNo", "amount", "currency", "status", "transactionDate", "description" },
            new() { "11001", "REF-2025-016", "8888.88", "USD", "COMPLETED", "@time(\"2025-12-21\")", "國際匯款" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該混合使用直接值、變數和 CAS 約束驗證")]
    public void ShouldValidateWithMixedFieldTypes()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        _scenarioContext.PutObject("expectedCurrency", "EUR");

        var transaction = new Transaction(11002L, "REF-2025-017", 12000m, "EUR")
        {
            Status = TransactionStatus.PENDING,
            Description = "歐洲區域轉帳"
        };

        mockRepository.Setup(r => r.FindById(11002L)).Returns(transaction);

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "currency", "amount", "status", "description" },
            new() { "11002", "$expectedCurrency", "&gt(10000)", "PENDING", "&contains(\"歐洲\")" }
        });

        // When & Then
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    // ==================== 驗證失敗錯誤處理測試 ====================

    [Fact(DisplayName = "欄位值不匹配時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenFieldValueMismatch()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(12001L, "REF-2025-018", 500m, "TWD");
        mockRepository.Setup(r => r.FindById(12001L)).Returns(transaction);

        // 期望金額 1000，但實際是 500
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount" },
            new() { "12001", "1000" }
        });

        // When & Then
        Assert.ThrowsAny<Exception>(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
    }

    [Fact(DisplayName = "CAS 約束不滿足時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenCASConstraintFails()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(12002L, "REF-2025-019", 300m, "TWD");
        mockRepository.Setup(r => r.FindById(12002L)).Returns(transaction);

        // 期望金額 > 1000，但實際是 300
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount" },
            new() { "12002", "&gt(1000)" }
        });

        // When & Then
        Assert.ThrowsAny<Exception>(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
    }

    [Fact(DisplayName = "Enum 值不匹配時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenEnumValueMismatch()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(12003L, "REF-2025-020", 700m, "TWD")
        {
            Status = TransactionStatus.FAILED
        };

        mockRepository.Setup(r => r.FindById(12003L)).Returns(transaction);

        // 期望狀態 COMPLETED，但實際是 FAILED
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "status" },
            new() { "12003", "COMPLETED" }
        });

        // When & Then
        Assert.ThrowsAny<Exception>(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
    }

    [Fact(DisplayName = "時間格式不正確時應拋出異常")]
    public void ShouldThrowExceptionWhenDateTimeFormatInvalid()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var transaction = new Transaction(12004L, "REF-2025-021", 900m, "TWD")
        {
            TransactionDate = new DateOnly(2025, 12, 21)
        };

        mockRepository.Setup(r => r.FindById(12004L)).Returns(transaction);

        // 錯誤的日期格式
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "transactionDate" },
            new() { "12004", "@time(\"2025/12/21\")" }  // 錯誤格式，應該是 2025-12-21
        });

        // When & Then
        Assert.ThrowsAny<Exception>(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
    }

    // ==================== 變數儲存與提取測試 (>contextKey / <executionKey) ====================

    [Fact(DisplayName = "應該使用 >contextKey 和 <executionKey 語法儲存 entity 欄位值到 scenario context")]
    public void ShouldStoreEntityFieldValueUsingContextKeyAndExecutionKey()
    {
        // Given: 準備測試資料
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transaction = new Transaction(13001L, "REF-2025-022", 1000m, "TWD")
        {
            CreatedAt = createdTime,
            Status = TransactionStatus.PENDING
        };

        mockRepository.Setup(r => r.FindById(13001L)).Returns(transaction);

        // DataTable: 使用 >createdAt 指定 context key，<initialTime 指定 execution key
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", ">initialTime" },
            new() { "13001", "<createdAt" }
        });

        // When: 執行 assertExists
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then: createdAt 欄位的值應該被儲存到 scenario context 的 "initialTime" key
        var storedValue = _scenarioContext.Get("initialTime");
        Assert.NotNull(storedValue); // initialTime 應該被儲存到 scenario context
        Assert.Equal(createdTime, storedValue); // 儲存的值應該與 entity 的 createdAt 欄位相同
    }

    [Fact(DisplayName = "應該支援儲存多個欄位到 scenario context")]
    public void ShouldStoreMultipleFieldsToScenarioContext()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transaction = new Transaction(13002L, "REF-2025-023", 2000m, "USD")
        {
            CreatedAt = createdTime,
            Status = TransactionStatus.COMPLETED
        };

        mockRepository.Setup(r => r.FindById(13002L)).Returns(transaction);

        // DataTable: 儲存 createdAt 和 status 兩個欄位
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", ">initialTime", ">initialStatus" },
            new() { "13002", "<createdAt", "<status" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then: 兩個欄位都應該被儲存到對應的 execution key
        Assert.Equal(createdTime, _scenarioContext.Get("initialTime")); //createdAt 應該被儲存到 initialTime
        Assert.Equal(TransactionStatus.COMPLETED, _scenarioContext.Get("initialStatus")); //status 應該被儲存到 initialStatus
    }

    [Fact(DisplayName = "應該支援儲存後使用變數進行驗證（儲存 createdAt 後用 &gt 比較 updatedAt）")]
    public void ShouldSupportVariableComparisonAfterStorage()
    {
        // Given: 第一次查詢，儲存 createdAt
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transaction1 = new Transaction(13003L, "REF-2025-024", 1500m, "TWD")
        {
            CreatedAt = createdTime
        };

        mockRepository.Setup(r => r.FindById(13003L)).Returns(transaction1);

        // 第一次查詢：儲存 createdAt 到 initialTime
        var dataTable1 = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", ">initialTime" },
            new() { "13003", "<createdAt" }
        });

        _helper.AssertExists(dataTable1, mockRepository.Object, spec);

        // 驗證已儲存到 initialTime
        Assert.Equal(createdTime, _scenarioContext.Get("initialTime"));

        // Given: 第二次查詢，驗證 createdAt 大於儲存的 initialTime
        var updatedTime = new DateTime(2025, 12, 30, 11, 59, 0);
        var transaction2 = new Transaction(13004L, "REF-2025-025", 1600m, "TWD")
        {
            CreatedAt = updatedTime
        };

        mockRepository.Setup(r => r.FindById(13004L)).Returns(transaction2);

        // 第二次查詢：使用 $initialTime 變數進行 &gt 比較
        var dataTable2 = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "createdAt" },
            new() { "13004", "&gt($initialTime)" }
        });

        // When & Then: 應該驗證通過 (updatedTime 應該大於儲存的 initialTime)
        var exception = Record.Exception(() => _helper.AssertExists(dataTable2, mockRepository.Object, spec));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "應該支援混合使用一般驗證和變數儲存")]
    public void ShouldSupportMixedValidationAndStorage()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transaction = new Transaction(13005L, "REF-2025-026", 3000m, "EUR")
        {
            CreatedAt = createdTime,
            Status = TransactionStatus.PENDING,
            Description = "國際轉帳"
        };

        mockRepository.Setup(r => r.FindById(13005L)).Returns(transaction);

        // DataTable: 混合一般驗證 (amount, status) 和變數儲存 (>initialTime)
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", "status", ">initialTime", "description" },
            new() { "13005", "3000", "PENDING", "<createdAt", "國際轉帳" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then: 一般欄位應該驗證通過，同時 createdAt 應該被儲存到 initialTime
        Assert.Equal(createdTime, _scenarioContext.Get("initialTime"));
        // 驗證已經在 assertExists 中完成，不拋異常表示驗證通過
    }

    [Fact(DisplayName = "應該正確處理 buildExecutionVariable 轉換 entity 為 Map")]
    public void ShouldBuildExecutionVariableCorrectly()
    {
        // Given: 建立一個 entity with 各種欄位類型
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transactionDate = new DateOnly(2025, 12, 23);
        var processedTime = new TimeOnly(14, 30, 0);

        var transaction = new Transaction(13006L, "REF-2025-027", 5000m, "JPY")
        {
            CreatedAt = createdTime,
            TransactionDate = transactionDate,
            ProcessedTime = processedTime,
            Status = TransactionStatus.COMPLETED,
            Description = "日本匯款"
        };

        mockRepository.Setup(r => r.FindById(13006L)).Returns(transaction);

        // DataTable: 儲存所有不同類型的欄位
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", ">time1", ">date1", ">time2", ">status1", ">amount1", ">desc1" },
            new() { "13006", "<createdAt", "<transactionDate", "<processedTime", "<status", "<amount", "<description" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then: 所有類型的欄位都應該被正確儲存到對應的 execution key
        Assert.Equal(createdTime, _scenarioContext.Get("time1"));
        Assert.Equal(transactionDate, _scenarioContext.Get("date1"));
        Assert.Equal(processedTime, _scenarioContext.Get("time2"));
        Assert.Equal(TransactionStatus.COMPLETED, _scenarioContext.Get("status1"));
        Assert.Equal(5000m, _scenarioContext.Get("amount1"));
        Assert.Equal("日本匯款", _scenarioContext.Get("desc1"));
    }

    [Fact(DisplayName = "變數儲存功能應該與 CAS 約束兼容")]
    public void ShouldSupportVariableStorageWithCASConstraints()
    {
        // Given
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 12, 23, 10, 0, 0);
        var transaction = new Transaction(13007L, "REF-2025-028", 8000m, "KRW")
        {
            CreatedAt = createdTime,
            Description = "韓國轉帳"
        };

        mockRepository.Setup(r => r.FindById(13007L)).Returns(transaction);

        // DataTable: 使用 CAS 約束驗證 amount，同時儲存 createdAt
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", ">timestamp", "description" },
            new() { "13007", "&gt(5000)", "<createdAt", "&contains(\"韓國\")" }
        });

        // When & Then: 驗證和儲存應該都成功
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);
        Assert.Equal(createdTime, _scenarioContext.Get("timestamp")); // createdAt 應該被儲存到 timestamp
    }

    // ==================== ADR-0004: VAR-System 不支援與 TIME-System 混用 ====================

    /// <summary>
    /// ADR-0004: 決議不支持在 VAR-System 的 >contextKey 中直接使用 TIME-System 表達式設定變數值
    /// 
    /// 在 assertExists 場景中，正確用法是：
    /// - 使用 &lt;executionKey 從查詢結果中提取實體欄位值存入 context
    /// - 使用 @time() 等 TIME-System 表達式在驗證時進行比較
    /// - 不應該嘗試在 >contextKey 對應的 data row 中使用 @time() 來「設定」變數
    /// </summary>
    [Fact(DisplayName = "ADR-0004: 不支援在 >contextKey 中使用 @time() 設定變數")]
    public void ShouldNotSupportContextKeyWithTimeExpressionInAssert()
    {
        // Given: 準備測試資料
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 11, 4, 8, 0, 0);
        var transaction = new Transaction(5001L, "REF-2025-099", 2000m, "TWD")
        {
            CreatedAt = createdTime
        };

        mockRepository.Setup(r => r.FindById(5001L)).Returns(transaction);

        // 錯誤用法（根據 ADR-0004 不應該這樣寫）：
        // 試圖在 header 使用 >capturedTime，在 data row 使用 @time() 
        // ADR-0004: 這種混用會被靜默跳過，不會儲存任何值到 context
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", ">capturedTime" },
            new() { "5001", "@time(\"2025-11-04T08:00:00\")" }
        });

        // When: 執行 AssertExists（不會拋出異常，但也不會儲存 capturedTime）
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then: 驗證 context 中沒有 capturedTime（因為 @time() 與 >contextKey 混用不支援）
        Assert.Null(_scenarioContext.Get("capturedTime"));
    }

    [Fact(DisplayName = "ADR-0004: 正確用法 - 使用 <executionKey 從實體提取時間值")]
    public void ShouldUseExecutionKeyToExtractTimeValueFromEntity()
    {
        // Given: 準備測試資料
        var mockRepository = new Mock<IRepository<Transaction, long>>();

        var spec = new EntityTableSpec<Transaction, long>(
            "交易",
            typeof(Transaction),
            new HashSet<string> { "transactionId" },
            map => long.Parse(map["transactionId"].ToString()!),
            new HashSet<string> { "referenceNo" },
            new List<string>(),
            new HashSet<string>()
        );

        var createdTime = new DateTime(2025, 11, 4, 8, 0, 0);
        var transaction = new Transaction(5002L, "REF-2025-100", 3000m, "TWD")
        {
            CreatedAt = createdTime
        };

        mockRepository.Setup(r => r.FindById(5002L)).Returns(transaction);

        // 正確用法：使用 <executionKey 從查詢結果中提取 createdAt
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "transactionId", "amount", ">timestamp" },
            new() { "5002", "&gt(2000)", "<createdAt" }
        });

        // When: 執行驗證
        var exception = Record.Exception(() => _helper.AssertExists(dataTable, mockRepository.Object, spec));
        Assert.Null(exception);

        // Then: createdAt 應該被提取並存入 context 的 timestamp
        Assert.Equal(createdTime, _scenarioContext.Get("timestamp")); 
        //應該從實體的 createdAt 欄位提取值並存入 context（正確用法）
    }
}
