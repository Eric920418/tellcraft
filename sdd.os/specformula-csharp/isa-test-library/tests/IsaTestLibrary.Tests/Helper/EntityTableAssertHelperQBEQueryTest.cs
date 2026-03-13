using System.Linq.Expressions;
using Moq;
using Tw.Sdd.Isa.TestLib.Helper;
using Tw.Sdd.Isa.TestLib.Testables.Repository;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// EntityTableAssertHelper QBE (Query By Example) 查詢測試
///
/// 測試策略：
/// - ISAFeatureArgumentResolver 使用真實實例（含 ScenarioContext）
/// - IRepository 使用 Moq Mock
/// - 使用 Expression&lt;Func&lt;T, bool&gt;&gt; 進行查詢，可分析表達式結構
///
/// 測試範圍：
/// 1. 使用 probeFields 進行 QBE 查詢（單一欄位、多欄位）
/// 2. QBE 查詢後使用 exactMatchOrder 後置篩選
/// 3. QBE 查詢後使用 CAS 約束後置篩選
/// 4. 混合使用 exactMatchOrder 和 CAS 約束
/// 5. QBE 查詢無結果時的錯誤處理
/// 6. QBE 查詢後仍有多筆結果時的錯誤處理
/// </summary>
[Trait("Category", "EntityTableAssertHelper")]
public class EntityTableAssertHelperQBEQueryTest
{
    private readonly ScenarioContext _scenarioContext;
    private readonly ISAFeatureArgumentResolver _resolver;
    private readonly EntityTableAssertHelper _helper;

    public EntityTableAssertHelperQBEQueryTest()
    {
        _scenarioContext = new ScenarioContext();
        _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        _helper = new EntityTableAssertHelper(_resolver);
    }

    /// <summary>
    /// 對應 Java Mockito 的 ArgumentCaptor，用於捕獲傳入 mock 方法的 Expression 參數
    /// 使用 Moq 的 Capture.In() 方法，並透過 ExpressionAnalyzer 分析表達式結構
    /// </summary>
    /// <remarks>
    /// Java 版本:
    /// <code>
    /// ArgumentCaptor<Example<T>> captor = ArgumentCaptor.forClass(Example.class);
    /// verify(repository).findAll(captor.capture());
    /// T probe = captor.getValue().getProbe();
    /// assertEquals("wang@unique.com", probe.getEmail());
    /// assertNull(probe.getName());
    /// </code>
    /// 
    /// C# Expression 對應:
    /// <code>
    /// var capturedExpressions = new List<Expression<Func<T, bool>>>();
    /// mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions))).Returns(...);
    /// 
    /// var accessedFields = ExpressionAnalyzer.ExtractAccessedFields(capturedExpressions[0]);
    /// var fieldValues = ExpressionAnalyzer.ExtractFieldValues(capturedExpressions[0]);
    /// </code>
    /// </remarks>
    private static (ISet<string> AccessedFields, IDictionary<string, object?> FieldValues)
        CaptureSingleProbe<T>(
            Mock<IRepository<T, long>> mockRepository,
            List<Expression<Func<T, bool>>> capturedExpressions) where T : class
    {
        mockRepository.Verify(r => r.Where(It.IsAny<Expression<Func<T, bool>>>()), Times.Once);
        var expression = capturedExpressions[0];
        return (
            ExpressionAnalyzer.ExtractAccessedFields(expression),
            ExpressionAnalyzer.ExtractFieldValues(expression)
        );
    }

    private static List<(ISet<string> AccessedFields, IDictionary<string, object?> FieldValues)>
        CaptureProbes<T>(
            Mock<IRepository<T, long>> mockRepository,
            int times,
            List<Expression<Func<T, bool>>> capturedExpressions) where T : class
    {
        mockRepository.Verify(r => r.Where(It.IsAny<Expression<Func<T, bool>>>()), Times.Exactly(times));
        return capturedExpressions.Select(expr => (
            ExpressionAnalyzer.ExtractAccessedFields(expr),
            ExpressionAnalyzer.ExtractFieldValues(expr)
        )).ToList();
    }

    // ==================== 測試用 Entity ====================

    public class Employee
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? Age { get; set; }
        public string? Department { get; set; }
        public decimal? Salary { get; set; }
        public EmployeeStatus? Status { get; set; }
        public DateOnly? HireDate { get; set; }
        public DateTime? LastLoginAt { get; set; }

        public Employee() { }

        public Employee(long id, string name, string email, int age, string department)
        {
            Id = id;
            Name = name;
            Email = email;
            Age = age;
            Department = department;
        }
    }

    public enum EmployeeStatus
    {
        ACTIVE,
        INACTIVE,
        ON_LEAVE
    }

    public class Customer
    {
        public long? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? City { get; set; }
        public string? MemberLevel { get; set; }
        public DateOnly? RegisteredDate { get; set; }

        public Customer() { }

        public Customer(long customerId, string customerName, string phone, string email, string city)
        {
            CustomerId = customerId;
            CustomerName = customerName;
            Phone = phone;
            Email = email;
            City = city;
        }
    }

    // ==================== 基本 QBE 查詢測試 ====================

    [Fact(DisplayName = "應該使用單一 probeField 進行 QBE 查詢")]
    public void ShouldQueryByExampleWithSingleProbeField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        // 使用 Capture.In() 捕獲 Expression，對應 Java 的 ArgumentCaptor
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Email" }, // 只用 email 做 probe
            new List<string>(),
            new HashSet<string>());

        var employee = new Employee(1001L, "王大明", "wang@unique.com", 30, "IT");
        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { employee });

        // DataTable 不包含 id，使用 email 查詢
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Email", "Name", "Age" },
            new() { "wang@unique.com", "王大明", "30" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);

        // 使用 ExpressionAnalyzer 分析表達式，驗證只有 probeFields 中的欄位被使用
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);

        // 驗證只有 Email 欄位被使用（對應 Java 的 assertNull(probe.getName())）
        Assert.Contains("Email", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);       // name 不在 probeFields，不應被使用
        Assert.DoesNotContain("Department", accessedFields); // department 不在 probeFields，不應被使用

        // 驗證查詢值
        Assert.Equal("wang@unique.com", fieldValues["Email"]);
    }

    [Fact(DisplayName = "應該使用多個 probeFields 進行 QBE 查詢")]
    public void ShouldQueryByExampleWithMultipleProbeFields()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Name", "Department" }, // 使用 name + department 做 probe
            new List<string>(),
            new HashSet<string>());

        var employee = new Employee(2001L, "李小華", "lee@example.com", 28, "HR");
        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { employee });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Name", "Department", "Age" },
            new() { "李小華", "HR", "28" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);

        // 驗證 Name 和 Department 都被使用
        Assert.Contains("Name", accessedFields);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Email", accessedFields);  // email 不在 probeFields，不應被使用

        // 驗證查詢值
        Assert.Equal("李小華", fieldValues["Name"]);
        Assert.Equal("HR", fieldValues["Department"]);
    }

    [Fact(DisplayName = "應該使用 VAR-System 變數作為 probeField 值")]
    public void ShouldQueryByExampleWithVariableInProbeField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Customer, long>>();
        var capturedExpressions = new List<Expression<Func<Customer, bool>>>();

        var spec = new EntityTableSpec<Customer, long>(
            "客戶",
            typeof(Customer),
            new HashSet<string> { "CustomerId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Phone", "City" },
            new List<string>(),
            new HashSet<string>());

        // 設定 VAR-System 變數
        _scenarioContext.PutObject("searchCity", "台北市");

        var customer = new Customer(3001L, "陳五", "0912345678", "chen@example.com", "台北市");
        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Customer> { customer });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Phone", "City", "CustomerName" },
            new() { "0912345678", "$searchCity", "陳五" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);

        // 驗證使用的欄位
        Assert.Contains("Phone", accessedFields);
        Assert.Contains("City", accessedFields);
        Assert.DoesNotContain("Email", accessedFields);

        // 驗證查詢值（變數應該被解析）
        Assert.Equal("0912345678", fieldValues["Phone"]);
        Assert.Equal("台北市", fieldValues["City"]);  // $searchCity 應該被解析為 "台北市"
    }

    // ==================== exactMatchOrder 後置篩選測試 ====================

    [Fact(DisplayName = "QBE 返回多筆時，應使用 exactMatchOrder 單一欄位篩選 (Enum)")]
    public void ShouldFilterByExactMatchOrderWithSingleField()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Name" },
            new List<string> { "Status" }, // 使用 status 做精準比對
            new HashSet<string>());

        // 兩個同名員工，不同 status
        var emp1 = new Employee(1001L, "王大明", "wang1@example.com", 35, "IT")
        {
            Status = EmployeeStatus.INACTIVE
        };

        var emp2 = new Employee(1002L, "王大明", "wang2@example.com", 30, "IT")
        {
            Status = EmployeeStatus.ACTIVE
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2 });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Name", "Status", "Email" },
            new() { "王大明", "ACTIVE", "wang2@example.com" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Name", accessedFields);
        Assert.DoesNotContain("Department", accessedFields);
        Assert.Equal("王大明", fieldValues["Name"]);
        // 應該成功找到 emp2（ACTIVE）
    }

    [Fact(DisplayName = "QBE 返回多筆時，應使用 exactMatchOrder 單一欄位篩選 (LocalDate)")]
    public void ShouldFilterByExactMatchOrderWithLocalDate()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string> { "HireDate" }, // 使用 hireDate 做精準比對
            new HashSet<string>());

        var emp1 = new Employee(2001L, "張三", "zhang1@example.com", 40, "IT")
        {
            HireDate = new DateOnly(2020, 1, 15)
        };

        var emp2 = new Employee(2002L, "李四", "li@example.com", 35, "IT")
        {
            HireDate = new DateOnly(2021, 3, 20)
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2 });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "HireDate", "Name" },
            new() { "IT", "2021-03-20", "李四" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.Equal("IT", fieldValues["Department"]);
        // 應該成功找到 emp2（2021-03-20）
    }

    [Fact(DisplayName = "QBE 返回多筆時，應使用多個 exactMatchOrder 欄位依序篩選")]
    public void ShouldFilterByMultipleExactMatchOrderFields()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string> { "Status", "HireDate" }, // 先用 status，再用 hireDate
            new HashSet<string>());

        var emp1 = new Employee(3001L, "員工A", "a@example.com", 30, "IT")
        {
            Status = EmployeeStatus.ACTIVE,
            HireDate = new DateOnly(2020, 1, 1)
        };

        var emp2 = new Employee(3002L, "員工B", "b@example.com", 28, "IT")
        {
            Status = EmployeeStatus.ACTIVE,
            HireDate = new DateOnly(2021, 6, 15)
        };

        var emp3 = new Employee(3003L, "員工C", "c@example.com", 32, "IT")
        {
            Status = EmployeeStatus.INACTIVE,
            HireDate = new DateOnly(2021, 6, 16)
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2, emp3 });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "Status", "HireDate", "Name" },
            new() { "IT", "ACTIVE", "2021-06-15", "員工B" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.Equal("IT", fieldValues["Department"]);
        // 應該成功找到 emp2（ACTIVE + 2021-06-15）
    }

    // ==================== CAS 約束後置篩選測試 ====================

    [Fact(DisplayName = "QBE 返回多筆時，應使用 CAS 約束 &gt 篩選年齡")]
    public void ShouldFilterByCASGreaterThan()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string>(),
            new HashSet<string>());

        var emp1 = new Employee(5001L, "年輕員工", "young@example.com", 25, "IT");
        var emp2 = new Employee(5002L, "資深員工", "senior@example.com", 45, "IT");

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2 });

        // 使用 CAS 約束 &gt(40) 篩選年齡大於 40 的員工
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "Age", "Name" },
            new() { "IT", "&gt(40)", "資深員工" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.Equal("IT", fieldValues["Department"]);
        // 應該成功找到 emp2（age=45 > 40）
    }

    [Fact(DisplayName = "QBE 返回多筆時，應使用 CAS 約束 &contains 篩選字串")]
    public void ShouldFilterByCASContains()
    {
        // Given
        var mockRepository = new Mock<IRepository<Customer, long>>();
        var capturedExpressions = new List<Expression<Func<Customer, bool>>>();

        var spec = new EntityTableSpec<Customer, long>(
            "客戶",
            typeof(Customer),
            new HashSet<string> { "CustomerId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "City" },
            new List<string>(),
            new HashSet<string>());

        var cust1 = new Customer(6001L, "王小明", "0911111111", "wang@gmail.com", "台北市");
        var cust2 = new Customer(6002L, "李大華", "0922222222", "li@yahoo.com", "台北市");

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Customer> { cust1, cust2 });

        // 使用 CAS 約束 &contains("yahoo") 篩選 email
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "City", "Email", "CustomerName" },
            new() { "台北市", "&contains(\"yahoo\")", "李大華" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("City", accessedFields);
        Assert.DoesNotContain("Email", accessedFields);  // Email 是 CAS 約束，不應在 probe 中
        Assert.Equal("台北市", fieldValues["City"]);
        // 應該成功找到 cust2（email 包含 "yahoo"）
    }

    [Fact(DisplayName = "QBE 返回多筆時，應使用多個 CAS 約束組合篩選")]
    public void ShouldFilterByMultipleCASConstraints()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string>(),
            new HashSet<string>());

        var emp1 = new Employee(7001L, "員工A", "a@example.com", 25, "IT")
        {
            Salary = 30000m
        };

        var emp2 = new Employee(7002L, "員工B", "b@example.com", 35, "IT")
        {
            Salary = 50000m
        };

        var emp3 = new Employee(7003L, "員工C", "c@example.com", 45, "IT")
        {
            Salary = 70000m
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2, emp3 });

        // 使用多個 CAS 約束：age > 30 且 salary == 50000
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "Age", "Salary", "Name" },
            new() { "IT", "&gt(30)", "&eq(50000)", "員工B" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.DoesNotContain("Age", accessedFields);     // Age 是 CAS 約束
        Assert.DoesNotContain("Salary", accessedFields);  // Salary 是 CAS 約束
        Assert.Equal("IT", fieldValues["Department"]);
        // 應該成功找到 emp2（age=35 > 30 且 salary=50000 == 50000）
    }

    // ==================== 混合篩選測試 ====================

    [Fact(DisplayName = "QBE 返回多筆時，應先使用 CAS 篩選，再使用 exactMatchOrder 篩選")]
    public void ShouldFilterByCASAndThenExactMatchOrder()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string> { "HireDate" }, // exactMatchOrder
            new HashSet<string>());

        var emp1 = new Employee(8001L, "員工A", "a@example.com", 25, "IT")
        {
            HireDate = new DateOnly(2020, 1, 1)
        };

        var emp2 = new Employee(8002L, "員工B", "b@example.com", 35, "IT")
        {
            HireDate = new DateOnly(2021, 6, 15)
        };

        var emp3 = new Employee(8003L, "員工C", "c@example.com", 38, "IT")
        {
            HireDate = new DateOnly(2021, 6, 16)
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2, emp3 });

        // 先用 CAS 篩選 age > 30，再用 exactMatchOrder 篩選 hireDate
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "Age", "HireDate", "Name" },
            new() { "IT", "&gt(30)", "2021-06-15", "員工B" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.DoesNotContain("Age", accessedFields);  // Age 是 CAS 約束
        Assert.Equal("IT", fieldValues["Department"]);
        // CAS 篩選後剩下 emp2, emp3，再用 hireDate exactMatch 應找到 emp2
    }

    // ==================== 錯誤處理測試 ====================

    [Fact(DisplayName = "QBE 查詢無結果時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenQBEReturnsNoResults()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Email" },
            new List<string>(),
            new HashSet<string>());

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee>());

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Email", "Name" },
            new() { "nonexistent@example.com", "不存在的員工" }
        });

        // When & Then
        var error = Assert.Throws<Exception>(() =>
        {
            _helper.AssertExists(dataTable, mockRepository.Object, spec);
        });

        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Email", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.Equal("nonexistent@example.com", fieldValues["Email"]);
        Assert.Contains("找不到符合條件的", error.Message);
        Assert.Contains("員工", error.Message);
    }

    [Fact(DisplayName = "exactMatchOrder 篩選後仍有多筆時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenExactMatchOrderStillReturnsMultiple()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();
        var capturedExpressions = new List<Expression<Func<Employee, bool>>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Department" },
            new List<string> { "Status" },
            new HashSet<string>());

        // 兩個員工：同 department、同 status
        var emp1 = new Employee(4001L, "員工A", "a@example.com", 30, "IT")
        {
            Status = EmployeeStatus.ACTIVE
        };

        var emp2 = new Employee(4002L, "員工B", "b@example.com", 28, "IT")
        {
            Status = EmployeeStatus.ACTIVE
        };

        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(new List<Employee> { emp1, emp2 });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Department", "Status" },
            new() { "IT", "ACTIVE" }
        });

        // When & Then
        var error = Assert.Throws<Exception>(() =>
        {
            _helper.AssertExists(dataTable, mockRepository.Object, spec);
        });

        var (accessedFields, fieldValues) = CaptureSingleProbe(mockRepository, capturedExpressions);
        Assert.Contains("Department", accessedFields);
        Assert.DoesNotContain("Name", accessedFields);
        Assert.Equal("IT", fieldValues["Department"]);
        Assert.Contains("找到多筆", error.Message);
        Assert.Contains("員工", error.Message);
    }

    [Fact(DisplayName = "缺少查詢條件時應拋出 AssertionError")]
    public void ShouldThrowAssertionErrorWhenNoQueryConditions()
    {
        // Given
        var mockRepository = new Mock<IRepository<Employee, long>>();

        var spec = new EntityTableSpec<Employee, long>(
            "員工",
            typeof(Employee),
            new HashSet<string> { "Id" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "Name", "Email" }, // probeFields
            new List<string>(),
            new HashSet<string>());

        // DataTable 只包含 constraint 欄位，沒有實際查詢條件
        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "Name", "Age" },
            new() { "&contains(\"王\")", "&gt(30)" } // 都是 constraint，不能用於 probe
        });

        // When & Then
        var error = Assert.Throws<Exception>(() =>
        {
            _helper.AssertExists(dataTable, mockRepository.Object, spec);
        });

        Assert.Contains("缺少查詢條件", error.Message);
    }

    // ==================== 多筆資料 QBE 測試 ====================

    [Fact(DisplayName = "應該能夠對多筆資料進行 QBE 查詢")]
    public void ShouldQueryMultipleRowsByExample()
    {
        // Given
        var mockRepository = new Mock<IRepository<Customer, long>>();
        var capturedExpressions = new List<Expression<Func<Customer, bool>>>();

        var spec = new EntityTableSpec<Customer, long>(
            "客戶",
            typeof(Customer),
            new HashSet<string> { "CustomerId" },
            map => long.Parse(map.Values.First().ToString()!),
            new HashSet<string> { "City", "MemberLevel" },
            new List<string>(),
            new HashSet<string>());

        var cust1 = new Customer(9001L, "王小明", "0911111111", "wang@example.com", "台北市")
        {
            MemberLevel = "GOLD"
        };

        var cust2 = new Customer(9002L, "李大華", "0922222222", "li@example.com", "高雄市")
        {
            MemberLevel = "SILVER"
        };

        var cust3 = new Customer(9003L, "陳小美", "0933333333", "chen@example.com", "台中市")
        {
            MemberLevel = "BRONZE"
        };

        // Mock 三次不同的 QBE 查詢
        var callCount = 0;
        mockRepository.Setup(r => r.Where(Capture.In(capturedExpressions)))
            .Returns(() =>
            {
                callCount++;
                return callCount switch
                {
                    1 => new List<Customer> { cust1 },
                    2 => new List<Customer> { cust2 },
                    _ => new List<Customer> { cust3 }
                };
            });

        var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
        {
            new() { "City", "MemberLevel", "CustomerName" },
            new() { "台北市", "GOLD", "王小明" },
            new() { "高雄市", "SILVER", "李大華" },
            new() { "台中市", "BRONZE", "陳小美" }
        });

        // When
        _helper.AssertExists(dataTable, mockRepository.Object, spec);

        // Then
        var probes = CaptureProbes(mockRepository, 3, capturedExpressions);

        // 驗證三次查詢都只使用 City 和 MemberLevel
        foreach (var (accessedFields, _) in probes)
        {
            Assert.Contains("City", accessedFields);
            Assert.Contains("MemberLevel", accessedFields);
            Assert.DoesNotContain("CustomerName", accessedFields);
            Assert.DoesNotContain("Email", accessedFields);
        }

        // 驗證查詢值
        Assert.Equal("台北市", probes[0].FieldValues["City"]);
        Assert.Equal("高雄市", probes[1].FieldValues["City"]);
        Assert.Equal("台中市", probes[2].FieldValues["City"]);
        Assert.Equal("GOLD", probes[0].FieldValues["MemberLevel"]);
        Assert.Equal("SILVER", probes[1].FieldValues["MemberLevel"]);
        Assert.Equal("BRONZE", probes[2].FieldValues["MemberLevel"]);

        mockRepository.Verify(r => r.FindById(It.IsAny<long>()), Times.Never);
    }
}
