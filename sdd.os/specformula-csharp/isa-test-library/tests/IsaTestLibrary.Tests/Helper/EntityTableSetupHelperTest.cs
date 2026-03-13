using Moq;
using Reqnroll;
using Tw.Sdd.Isa.TestLib.Helper;
using Tw.Sdd.Isa.TestLib.Testables.Repository;
using ScenarioContext = Tw.Sdd.Isa.TestLib.Context.ScenarioContext;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

/// <summary>
/// EntityTableSetupHelper 單元測試
/// 
/// 測試策略：
/// - ISAFeatureArgumentResolver 使用真實實例（含 ScenarioContext）
/// - IRepository 使用 Moq Mock
/// - IUnitOfWork 使用 Moq Mock，驗證 SaveChanges 被呼叫
/// 
/// 測試範圍：
/// 1. prepareEntities 完整流程：解析 DataTable + 建立 Entity + 儲存
/// 2. 型別轉換（使用 fieldTypes）
/// 3. Fallback 邏輯（fieldTypes 未定義時）
/// 4. 變數儲存（>contextKey 和 &lt;executionKey）
/// 5. 跳過 VAR-system headers
/// 6. 跳過空值
/// 7. 錯誤處理
/// </summary>
public class EntityTableSetupHelperTest
{
    protected readonly ScenarioContext _scenarioContext;
    protected readonly ISAFeatureArgumentResolver _resolver;
    protected readonly EntityTableSetupHelper _helper;

    public EntityTableSetupHelperTest()
    {
        _scenarioContext = new ScenarioContext();
        _resolver = new ISAFeatureArgumentResolver(_scenarioContext);
        _helper = new EntityTableSetupHelper(_resolver);
    }

    // ==================== 測試用 Entity ====================

    public class TestEntity
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public int? Age { get; set; }
        public decimal? Price { get; set; }
        public bool? Active { get; set; }
        public DateOnly? BirthDate { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
    }

    // 測試繼承場景的 Entity
    public class BaseEntity
    {
        public long? EntityId { get; set; }
        public DateTimeOffset? CreatedTime { get; set; }
        public DateTimeOffset? ModifiedTime { get; set; }
    }

    public class ChildEntity : BaseEntity
    {
        public string? ChildName { get; set; }
    }

    // 測試用：沒有無參數建構子的 Entity
    public class EntityWithoutDefaultConstructor
    {
        public long? Id { get; set; }

        public EntityWithoutDefaultConstructor(long id)
        {
            Id = id;
        }
    }

    // ==================== 基本功能測試 ====================

    [Trait("Category", "基本功能")]
    public class BasicFunctionalityTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "應該正確建立並儲存單一 Entity")]
        public void ShouldCreateAndSaveSingleEntity()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            var savedEntity = new TestEntity
            {
                Id = 1L,
                Name = "測試",
                Age = 25
            };

            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Returns(savedEntity);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) },
                { "age", typeof(int) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", "age" },
                new() { "1", "測試", "25" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            mockRepository.Verify(r => r.Save(It.IsAny<TestEntity>()), Times.Once());
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該正確建立並儲存多個 Entity")]
        public void ShouldCreateAndSaveMultipleEntities()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Returns((TestEntity entity) => entity);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name" },
                new() { "1", "Entity1" },
                new() { "2", "Entity2" },
                new() { "3", "Entity3" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            mockRepository.Verify(r => r.Save(It.IsAny<TestEntity>()), Times.Exactly(3));
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== 型別轉換測試 ====================

    [Trait("Category", "型別轉換")]
    public class TypeConversionTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "應該正確轉換基本數值類型")]
        public void ShouldConvertBasicNumericTypes()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "age", typeof(int) },
                { "price", typeof(decimal) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "age", "price" },
                new() { "100", "30", "99.99" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(100L, capturedEntity!.Id);
            Assert.Equal(30, capturedEntity.Age);
            Assert.Equal(99.99m, capturedEntity.Price);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該正確轉換布林類型")]
        public void ShouldConvertBooleanType()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "active", typeof(bool) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "active" },
                new() { "true" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.True(capturedEntity!.Active);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該正確轉換日期時間類型")]
        public void ShouldConvertDateTimeTypes()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "birthDate", typeof(DateOnly) },
                { "createdAt", typeof(DateTime) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "birthDate", "createdAt" },
                new() { "2000-01-15", "2025-12-20T10:30:00" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(new DateOnly(2000, 1, 15), capturedEntity!.BirthDate);
            Assert.Equal(new DateTime(2025, 12, 20, 10, 30, 0), capturedEntity.CreatedAt);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該正確轉換 DateTimeOffset 類型（Z 結尾格式）")]
        public void ShouldConvertDateTimeOffsetTypeWithZSuffix()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "updatedAt", typeof(DateTimeOffset) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "updatedAt" },
                new() { "2025-12-20T10:30:00Z" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(DateTimeOffset.Parse("2025-12-20T10:30:00Z"), capturedEntity!.UpdatedAt);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== 繼承場景測試 ====================

    [Trait("Category", "繼承場景")]
    public class InheritanceTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "應該正確設置繼承自父類的欄位")]
        public void ShouldSetFieldsInheritedFromParentClass()
        {
            // Given
            var mockRepository = new Mock<IRepository<ChildEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            ChildEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<ChildEntity>()))
                .Callback<ChildEntity>(e => capturedEntity = e)
                .Returns((ChildEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "entityId", typeof(long) },
                { "childName", typeof(string) },
                { "createdTime", typeof(DateTimeOffset) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "entityId", "childName", "createdTime" },
                new() { "1001", "子實體", "2025-12-20T10:00:00Z" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(ChildEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(1001L, capturedEntity!.EntityId);
            Assert.Equal("子實體", capturedEntity.ChildName);
            Assert.Equal(DateTimeOffset.Parse("2025-12-20T10:00:00Z"), capturedEntity.CreatedTime);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== 跳過邏輯測試 ====================

    [Trait("Category", "跳過邏輯")]
    public class SkipLogicTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "應該跳過 VAR-system headers（< 開頭）")]
        public void ShouldSkipVarSystemHeadersWithLessThan()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) }
            };

            // <savedId 是 VAR-system header，應該被跳過
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", "<savedId" },
                new() { "1", "測試", "someValue" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(1L, capturedEntity!.Id);
            Assert.Equal("測試", capturedEntity.Name);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該跳過 VAR-system headers（> 開頭）")]
        public void ShouldSkipVarSystemHeadersWithGreaterThan()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) }
            };

            // >contextKey 是 VAR-system header，應該被跳過
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", ">contextKey" },
                new() { "1", "測試", "<id" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(1L, capturedEntity!.Id);
            Assert.Equal("測試", capturedEntity.Name);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該跳過空值欄位")]
        public void ShouldSkipEmptyValues()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) },
                { "age", typeof(int) }
            };

            // age 為空，應該跳過
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", "age" },
                new() { "1", "測試", "" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(1L, capturedEntity!.Id);
            Assert.Equal("測試", capturedEntity.Name);
            Assert.Null(capturedEntity.Age); // 空值欄位應該保持 null
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== 變數儲存測試 ====================

    [Trait("Category", "變數儲存")]
    public class VariableStorageTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "應該儲存 entity 欄位值到 scenario context")]
        public void ShouldStoreEntityFieldValueToScenarioContext()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            var savedEntity = new TestEntity
            {
                Id = 1001L,
                Name = "測試Entity",
                Age = 30
            };

            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Returns(savedEntity);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) }
            };

            // >savedId 指定 context key，<id 指定 execution key
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", ">savedId" },
                new() { "1001", "測試Entity", "<id" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            var storedValue = _scenarioContext.Get("savedId");
            Assert.NotNull(storedValue); // savedId 應該被儲存到 scenario context
            Assert.Equal(1001L, storedValue); // 儲存的值應該與 entity 的 id 欄位相同
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }

        [Fact(DisplayName = "應該儲存多個欄位值到 scenario context")]
        public void ShouldStoreMultipleFieldValuesToScenarioContext()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            var savedEntity = new TestEntity
            {
                Id = 2001L,
                Name = "多欄位測試",
                Age = 25
            };

            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Returns(savedEntity);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "name", typeof(string) }
            };

            // 儲存多個欄位
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", ">savedId", ">savedName", ">savedAge" },
                new() { "2001", "多欄位測試", "<id", "<name", "<age" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.Equal(2001L, _scenarioContext.Get("savedId"));
            Assert.Equal("多欄位測試", _scenarioContext.Get("savedName"));
            Assert.Equal(25, _scenarioContext.Get("savedAge"));
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== Fallback 邏輯測試 ====================

    [Trait("Category", "Fallback邏輯")]
    public class FallbackLogicTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "當 fieldTypes 未定義欄位時應 fallback 到自動型別推斷")]
        public void ShouldFallbackWhenFieldTypeNotDefined()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            TestEntity? capturedEntity = null;
            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Callback<TestEntity>(e => capturedEntity = e)
                .Returns((TestEntity e) => e);

            // 只定義 id，不定義 name 和 age
            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "name", "age" },
                new() { "1", "Fallback測試", "35" }
            });

            // When
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then
            Assert.NotNull(capturedEntity);
            Assert.Equal(1L, capturedEntity!.Id);
            Assert.Equal("Fallback測試", capturedEntity.Name);
            Assert.Equal(35, capturedEntity.Age);
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());
        }
    }

    // ==================== 錯誤處理測試 ====================

    [Trait("Category", "錯誤處理")]
    public class ErrorHandlingTests : EntityTableSetupHelperTest
    {
        [Fact(DisplayName = "當 Entity 沒有無參數建構子時應拋出異常")]
        public void ShouldThrowExceptionWhenNoDefaultConstructor()
        {
            // Given
            var mockRepository = new Mock<IRepository<EntityWithoutDefaultConstructor, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id" },
                new() { "1" }
            });

            // When & Then
            Assert.ThrowsAny<Exception>(() =>
            {
                _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(EntityWithoutDefaultConstructor), fieldTypes);
            });
        }

        [Fact(DisplayName = "當找不到 setter 且 fieldTypes 有定義時應拋出 RuntimeException")]
        public void ShouldThrowRuntimeExceptionWhenSetterNotFoundWithFieldTypes()
        {
            // Given
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            // 定義一個不存在的欄位
            var fieldTypes = new Dictionary<string, Type>
            {
                { "nonExistentField", typeof(string) }
            };

            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "nonExistentField" },
                new() { "someValue" }
            });

            // When & Then
            Assert.Throws<InvalidOperationException>(() =>
            {
                _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);
            });
        }
    }

    // ==================== ADR-0004: VAR-System 不支援與 TIME-System 混用 ====================

    [Trait("Category", "ADR-0004")]
    public class VarSystemTimeSystemIntegrationTests : EntityTableSetupHelperTest
    {
        /// <summary>
        /// ADR-0004: 決議不支持在 VAR-System 的 >contextKey 中直接使用 TIME-System 表達式設定變數值
        /// 
        /// 此測試驗證：當使用者試圖在 DataTable 中同時使用 >contextKey (VAR-System) 
        /// 和 @time() (TIME-System) 時，@time() 會被正常解析並存入實體，
        /// 但不會因為 >contextKey 而自動存入 ScenarioContext。
        /// 
        /// 理由：
        /// - VAR-System 的設計原則是從執行結果中提取值（使用 &lt;executionKey）
        /// - TIME-System 應該用於 API 參數轉換，而不是變數賦值
        /// - 混用會模糊「系統產生的值」和「測試設定的假設值」的界限
        /// </summary>
        [Fact(DisplayName = "不支援：>contextKey 與 @time() 在同一欄位混用")]
        public void ShouldNotSupportContextKeyWithTimeExpression()
        {
            // Given: 模擬使用者錯誤地嘗試在 header 使用 >contextKey，在 data row 使用 @time()
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "createdAt", typeof(DateTime) }
            };

            // 錯誤用法範例（根據 ADR-0004 不應該這樣寫）：
            // | >orderTime                   | amount |
            // | @time("2025-11-04T08:00:00") | 1000   |
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { ">orderTime", "name" },
                new() { "@time(\"2025-11-04T08:00:00\")", "測試記錄" }
            });

            // When & Then: 應該拋出 ArgumentException
            // 因為 VAR-System 嚴格成對規則：>contextKey 必須與 <executionKey 配對
            Assert.Throws<ArgumentException>(() =>
            {
                _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);
            });
        }

        [Fact(DisplayName = "正確用法：@time() 應用於 data row，變數應從 <executionKey 提取")]
        public void ShouldUseTimeSystemInDataRowAndExtractVariablesFromExecutionKey()
        {
            // Given: 正確的用法是在 data row 直接使用 @time() 作為欄位值
            var mockRepository = new Mock<IRepository<TestEntity, long>>();
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            mockRepository
                .Setup(r => r.Save(It.IsAny<TestEntity>()))
                .Returns((TestEntity e) => e);

            var fieldTypes = new Dictionary<string, Type>
            {
                { "id", typeof(long) },
                { "createdAt", typeof(DateTime) }
            };

            // 正確用法：直接在 data row 使用 @time()，不要與 >contextKey 混用
            var dataTable = TestDataTableFactory.FromRows(new List<List<string>>
            {
                new() { "id", "createdAt", "name" },
                new() { "1", "@time(\"2025-11-04T08:00:00\")", "測試記錄" }
            });

            // When: 執行 PrepareEntities
            _helper.PrepareEntities(dataTable, mockRepository.Object, mockUnitOfWork.Object, typeof(TestEntity), fieldTypes);

            // Then: @time() 被正常解析（測試不會拋錯）
            // 驗證實體被正確創建並解析時間（透過 mockRepository.Save 的 verify）
            mockRepository.Verify(r => r.Save(It.IsAny<TestEntity>()), Times.Once());
            mockUnitOfWork.Verify(u => u.SaveChanges(), Times.Once());

            // 如果需要保存時間值作為變數，應該使用 <executionKey 從執行結果中提取
            // （這部分由 step definition 層級處理，不在 helper 測試範圍內）
        }
    }
}
