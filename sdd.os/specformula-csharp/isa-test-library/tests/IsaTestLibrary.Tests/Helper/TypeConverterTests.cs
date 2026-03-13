using System.Text;
using Tw.Sdd.Isa.TestLib.Helper;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper;

[Collection("TypeConverter 單元測試")]
public class TypeConverterTests
{
    // 測試用 Enum
    private enum TestStatus
    {
        Active,
        Inactive,
        Pending,
    }

    // ==================== Convert() 通用轉換方法測試 ====================

    [Collection("Convert() 通用轉換方法")]
    public class ConvertMethodTests
    {
        [Fact(DisplayName = "value 為 null 時應返回 null")]
        public void Convert_ShouldReturnNull_WhenValueIsNull()
        {
            Assert.Null(TypeConverter.Convert(null, typeof(string)));
            Assert.Null(TypeConverter.Convert(null, typeof(long)));
            Assert.Null(TypeConverter.Convert(null, typeof(int)));
        }

        [Fact(DisplayName = "targetType 為 null 時應返回原值")]
        public void Convert_ShouldReturnOriginalValue_WhenTargetTypeIsNull()
        {
            var value = "test";
            Assert.Same(value, TypeConverter.Convert(value, null));
        }

        [Fact(DisplayName = "value 已經是目標型別時應直接返回")]
        public void Convert_ShouldReturnValueDirectly_WhenAlreadyTargetType()
        {
            var longValue = 100L;
            Assert.Equal(longValue, TypeConverter.Convert(longValue, typeof(long)));

            var strValue = "test";
            Assert.Same(strValue, TypeConverter.Convert(strValue, typeof(string)));
        }

        [Fact(DisplayName = "應正確轉換為 String")]
        public void Convert_ShouldConvertToString()
        {
            Assert.Equal("100", TypeConverter.Convert(100, typeof(string)));
            Assert.Equal("true", TypeConverter.Convert(true, typeof(string)));
            Assert.Equal("3.14", TypeConverter.Convert(3.14, typeof(string)));
        }
    }

    // ==================== 數值型別轉換測試 ====================

    [Collection("ToLong()")]
    public class ToLongTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Long")]
        public void ToLong_ShouldConvertStringToLong()
        {
            Assert.Equal(100L, TypeConverter.ToLong("100"));
            Assert.Equal(-50L, TypeConverter.ToLong("-50"));
            Assert.Equal(0L, TypeConverter.ToLong("0"));
        }

        [Fact(DisplayName = "應正確轉換 Number 為 Long")]
        public void ToLong_ShouldConvertNumberToLong()
        {
            Assert.Equal(100L, TypeConverter.ToLong(100));
            Assert.Equal(100L, TypeConverter.ToLong(100.9));
            Assert.Equal(100L, TypeConverter.ToLong((short)100));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Long)")]
        public void ToLong_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToLong(null));
            Assert.Null(TypeConverter.ToLong(""));
            Assert.Null(TypeConverter.ToLong("  "));
        }

        [Fact(DisplayName = "應正確轉換在範圍內的 ulong 為 Long")]
        public void ToLong_ShouldConvertUlongInRange()
        {
            ulong validUlong = (ulong)long.MaxValue;
            Assert.Equal(long.MaxValue, TypeConverter.ToLong(validUlong));
        }

        [Fact(DisplayName = "ulong 超過 long.MaxValue 時應拋出 OverflowException")]
        public void ToLong_ShouldThrowOverflowException_WhenUlongExceedsMaxValue()
        {
            ulong overflowUlong = (ulong)long.MaxValue + 1;
            var exception = Assert.Throws<OverflowException>(() => TypeConverter.ToLong(overflowUlong));
            Assert.Contains("exceeds long.MaxValue", exception.Message);
        }
    }

    [Collection("ToInteger()")]
    public class ToIntegerTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Integer")]
        public void ToInteger_ShouldConvertStringToInteger()
        {
            Assert.Equal(100, TypeConverter.ToInteger("100"));
            Assert.Equal(-50, TypeConverter.ToInteger("-50"));
        }

        [Fact(DisplayName = "應正確轉換 Number 為 Integer")]
        public void ToInteger_ShouldConvertNumberToInteger()
        {
            Assert.Equal(100, TypeConverter.ToInteger(100L));
            Assert.Equal(100, TypeConverter.ToInteger(100.9));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Integer)")]
        public void ToInteger_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToInteger(null));
            Assert.Null(TypeConverter.ToInteger(""));
        }

        [Fact(DisplayName = "應正確轉換在範圍內的 ulong 為 Integer")]
        public void ToInteger_ShouldConvertUlongInRange()
        {
            ulong validUlong = (ulong)int.MaxValue;
            Assert.Equal(int.MaxValue, TypeConverter.ToInteger(validUlong));
        }

        [Fact(DisplayName = "ulong 超過 int.MaxValue 時應拋出 OverflowException")]
        public void ToInteger_ShouldThrowOverflowException_WhenUlongExceedsMaxValue()
        {
            ulong overflowUlong = (ulong)int.MaxValue + 1;
            var exception = Assert.Throws<OverflowException>(() => TypeConverter.ToInteger(overflowUlong));
            Assert.Contains("exceeds int.MaxValue", exception.Message);
        }
    }

    [Collection("ToShort()")]
    public class ToShortTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Short")]
        public void ToShort_ShouldConvertStringToShort()
        {
            Assert.Equal((short)100, TypeConverter.ToShort("100"));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Short)")]
        public void ToShort_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToShort(null));
            Assert.Null(TypeConverter.ToShort(""));
        }

        [Fact(DisplayName = "應正確轉換在範圍內的 ulong 為 Short")]
        public void ToShort_ShouldConvertUlongInRange()
        {
            ulong validUlong = (ulong)short.MaxValue;
            Assert.Equal(short.MaxValue, TypeConverter.ToShort(validUlong));
        }

        [Fact(DisplayName = "ulong 超過 short.MaxValue 時應拋出 OverflowException")]
        public void ToShort_ShouldThrowOverflowException_WhenUlongExceedsMaxValue()
        {
            ulong overflowUlong = (ulong)short.MaxValue + 1;
            var exception = Assert.Throws<OverflowException>(() => TypeConverter.ToShort(overflowUlong));
            Assert.Contains("exceeds short.MaxValue", exception.Message);
        }
    }

    [Collection("ToByte()")]
    public class ToByteTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Byte")]
        public void ToByte_ShouldConvertStringToByte()
        {
            Assert.Equal((byte)100, TypeConverter.ToByte("100"));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Byte)")]
        public void ToByte_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToByte(null));
            Assert.Null(TypeConverter.ToByte(""));
        }

        [Fact(DisplayName = "應正確轉換在範圍內的 ulong 為 Byte")]
        public void ToByte_ShouldConvertUlongInRange()
        {
            ulong validUlong = (ulong)byte.MaxValue;
            Assert.Equal(byte.MaxValue, TypeConverter.ToByte(validUlong));
        }

        [Fact(DisplayName = "ulong 超過 byte.MaxValue 時應拋出 OverflowException")]
        public void ToByte_ShouldThrowOverflowException_WhenUlongExceedsMaxValue()
        {
            ulong overflowUlong = (ulong)byte.MaxValue + 1;
            var exception = Assert.Throws<OverflowException>(() => TypeConverter.ToByte(overflowUlong));
            Assert.Contains("exceeds byte.MaxValue", exception.Message);
        }
    }

    [Collection("ToDouble()")]
    public class ToDoubleTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Double")]
        public void ToDouble_ShouldConvertStringToDouble()
        {
            Assert.Equal(3.14, TypeConverter.ToDouble("3.14")!.Value, 10);
            Assert.Equal(-2.5, TypeConverter.ToDouble("-2.5")!.Value, 10);
        }

        [Fact(DisplayName = "應正確轉換 Number 為 Double")]
        public void ToDouble_ShouldConvertNumberToDouble()
        {
            Assert.Equal(100.0, TypeConverter.ToDouble(100));
            Assert.Equal(100.0, TypeConverter.ToDouble(100L));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Double)")]
        public void ToDouble_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToDouble(null));
            Assert.Null(TypeConverter.ToDouble(""));
        }
    }

    [Collection("ToFloat()")]
    public class ToFloatTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Float")]
        public void ToFloat_ShouldConvertStringToFloat()
        {
            Assert.Equal(3.14f, TypeConverter.ToFloat("3.14")!.Value, 5);
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Float)")]
        public void ToFloat_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToFloat(null));
            Assert.Null(TypeConverter.ToFloat(""));
        }
    }

    [Collection("ToDecimal()")]
    public class ToDecimalTests
    {
        [Fact(DisplayName = "應正確轉換字串為 Decimal")]
        public void ToDecimal_ShouldConvertStringToDecimal()
        {
            Assert.Equal(99.99m, TypeConverter.ToDecimal("99.99"));
            Assert.Equal(1000m, TypeConverter.ToDecimal("1000"));
        }

        [Fact(DisplayName = "應正確轉換 Number 為 Decimal")]
        public void ToDecimal_ShouldConvertNumberToDecimal()
        {
            Assert.Equal(100.0m, TypeConverter.ToDecimal(100));
            Assert.Equal(99.99m, TypeConverter.ToDecimal(99.99));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Decimal)")]
        public void ToDecimal_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToDecimal(null));
            Assert.Null(TypeConverter.ToDecimal(""));
        }
    }

    // ==================== 布林型別轉換測試 ====================

    [Collection("ToBoolean()")]
    public class ToBooleanTests
    {
        [Fact(DisplayName = "應正確轉換 'true' 為 true")]
        public void ToBoolean_ShouldConvertTrueStringToTrue()
        {
            Assert.True(TypeConverter.ToBoolean("true"));
            Assert.True(TypeConverter.ToBoolean("TRUE"));
            Assert.True(TypeConverter.ToBoolean("True"));
        }

        [Fact(DisplayName = "應正確轉換 '1' 為 true")]
        public void ToBoolean_ShouldConvertOneToTrue()
        {
            Assert.True(TypeConverter.ToBoolean("1"));
        }

        [Fact(DisplayName = "應正確轉換 'yes' 為 true")]
        public void ToBoolean_ShouldConvertYesToTrue()
        {
            Assert.True(TypeConverter.ToBoolean("yes"));
            Assert.True(TypeConverter.ToBoolean("YES"));
        }

        [Fact(DisplayName = "應正確轉換其他值為 false")]
        public void ToBoolean_ShouldConvertOtherValuesToFalse()
        {
            Assert.False(TypeConverter.ToBoolean("false"));
            Assert.False(TypeConverter.ToBoolean("0"));
            Assert.False(TypeConverter.ToBoolean("no"));
            Assert.False(TypeConverter.ToBoolean("anything"));
        }

        [Fact(DisplayName = "null 或空字串應返回 null (Boolean)")]
        public void ToBoolean_ShouldReturnNull_ForNullOrEmpty()
        {
            Assert.Null(TypeConverter.ToBoolean(null));
            Assert.Null(TypeConverter.ToBoolean(""));
        }

        [Fact(DisplayName = "Boolean 實例應直接返回")]
        public void ToBoolean_ShouldReturnBooleanDirectly()
        {
            Assert.True(TypeConverter.ToBoolean(true));
            Assert.False(TypeConverter.ToBoolean(false));
        }
    }

    // ==================== 時間型別轉換測試 ====================

    [Collection("時間型別轉換")]
    public class DateTimeConversionTests
    {
        [Collection("ToLocalDate()")]
        public class ToLocalDateTests
        {
            [Fact(DisplayName = "應正確轉換 ISO 日期字串")]
            public void ToLocalDate_ShouldConvertIsoDateString()
            {
                Assert.Equal(new DateOnly(2025, 1, 15), TypeConverter.ToLocalDate("2025-01-15"));
            }

            [Fact(DisplayName = "應正確從 DateTime 提取 DateOnly")]
            public void ToLocalDate_ShouldExtractFromDateTime()
            {
                var dateTime = new DateTime(2025, 1, 15, 10, 30, 0);
                Assert.Equal(new DateOnly(2025, 1, 15), TypeConverter.ToLocalDate(dateTime));
            }

            [Fact(DisplayName = "應正確從 DateTimeOffset 提取 DateOnly")]
            public void ToLocalDate_ShouldExtractFromDateTimeOffset()
            {
                var dto = new DateTimeOffset(2025, 1, 15, 10, 30, 0, TimeSpan.Zero);
                Assert.Equal(new DateOnly(2025, 1, 15), TypeConverter.ToLocalDate(dto));
            }

            [Fact(DisplayName = "null 或空字串應返回 null (LocalDate)")]
            public void ToLocalDate_ShouldReturnNull_ForNullOrEmpty()
            {
                Assert.Null(TypeConverter.ToLocalDate(null));
                Assert.Null(TypeConverter.ToLocalDate(""));
            }
        }

        [Collection("ToLocalDateTime()")]
        public class ToLocalDateTimeTests
        {
            [Fact(DisplayName = "應正確轉換 ISO 日期時間字串")]
            public void ToLocalDateTime_ShouldConvertIsoDateTimeString()
            {
                Assert.Equal(
                    new DateTime(2025, 12, 20, 10, 30, 0),
                    TypeConverter.ToLocalDateTime("2025-12-20T10:30:00")
                );
            }

            [Fact(DisplayName = "應正確轉換 Z 結尾的 UTC 格式")]
            public void ToLocalDateTime_ShouldConvertUtcFormat()
            {
                var result = TypeConverter.ToLocalDateTime("2025-12-20T10:30:00Z");
                Assert.NotNull(result);
                Assert.Equal(2025, result!.Value.Year);
                Assert.Equal(12, result.Value.Month);
                Assert.Equal(20, result.Value.Day);
            }

            [Fact(DisplayName = "應正確轉換 yyyy-MM-dd HH:mm:ss 格式")]
            public void ToLocalDateTime_ShouldConvertSpaceFormat()
            {
                Assert.Equal(
                    new DateTime(2025, 12, 20, 10, 30, 0),
                    TypeConverter.ToLocalDateTime("2025-12-20 10:30:00")
                );
            }

            [Fact(DisplayName = "應正確從 DateOnly 轉換為當天開始時間")]
            public void ToLocalDateTime_ShouldConvertFromDateOnly()
            {
                var date = new DateOnly(2025, 1, 15);
                Assert.Equal(
                    new DateTime(2025, 1, 15, 0, 0, 0),
                    TypeConverter.ToLocalDateTime(date)
                );
            }

            [Fact(DisplayName = "應正確轉換只有日期的字串")]
            public void ToLocalDateTime_ShouldConvertDateOnlyString()
            {
                Assert.Equal(
                    new DateTime(2025, 1, 15, 0, 0, 0),
                    TypeConverter.ToLocalDateTime("2025-01-15")
                );
            }

            [Fact(DisplayName = "null 或空字串應返回 null (LocalDateTime)")]
            public void ToLocalDateTime_ShouldReturnNull_ForNullOrEmpty()
            {
                Assert.Null(TypeConverter.ToLocalDateTime(null));
                Assert.Null(TypeConverter.ToLocalDateTime(""));
            }

            [Fact(DisplayName = "無法解析的格式應拋出異常 (LocalDateTime)")]
            public void ToLocalDateTime_ShouldThrowException_ForInvalidFormat()
            {
                Assert.Throws<ArgumentException>(() => TypeConverter.ToLocalDateTime("invalid-date"));
            }
        }

        [Collection("ToLocalTime()")]
        public class ToLocalTimeTests
        {
            [Fact(DisplayName = "應正確轉換 HH:mm:ss 格式")]
            public void ToLocalTime_ShouldConvertHHmmssFormat()
            {
                Assert.Equal(new TimeOnly(10, 30, 45), TypeConverter.ToLocalTime("10:30:45"));
            }

            [Fact(DisplayName = "應正確轉換 HH:mm 格式（自動補秒）")]
            public void ToLocalTime_ShouldConvertHHmmFormat()
            {
                Assert.Equal(new TimeOnly(10, 30, 0), TypeConverter.ToLocalTime("10:30"));
            }

            [Fact(DisplayName = "應正確從 DateTime 提取 TimeOnly")]
            public void ToLocalTime_ShouldExtractFromDateTime()
            {
                var dateTime = new DateTime(2025, 1, 15, 10, 30, 45);
                Assert.Equal(new TimeOnly(10, 30, 45), TypeConverter.ToLocalTime(dateTime));
            }

            [Fact(DisplayName = "null 或空字串應返回 null (LocalTime)")]
            public void ToLocalTime_ShouldReturnNull_ForNullOrEmpty()
            {
                Assert.Null(TypeConverter.ToLocalTime(null));
                Assert.Null(TypeConverter.ToLocalTime(""));
            }

            [Fact(DisplayName = "無法解析的格式應拋出異常 (LocalTime)")]
            public void ToLocalTime_ShouldThrowException_ForInvalidFormat()
            {
                Assert.Throws<ArgumentException>(() => TypeConverter.ToLocalTime("invalid-time"));
            }
        }

        [Collection("ToInstant()")]
        public class ToInstantTests
        {
            [Fact(DisplayName = "應正確轉換 ISO-8601 格式（Z 結尾）")]
            public void ToInstant_ShouldConvertIso8601Format()
            {
                var expected = DateTimeOffset.Parse("2025-12-20T10:30:00Z");
                Assert.Equal(expected, TypeConverter.ToInstant("2025-12-20T10:30:00Z"));
            }

            [Fact(DisplayName = "應正確轉換帶毫秒的 ISO-8601 格式")]
            public void ToInstant_ShouldConvertIso8601FormatWithMillis()
            {
                var expected = DateTimeOffset.Parse("2025-12-20T10:30:00.123Z");
                Assert.Equal(expected, TypeConverter.ToInstant("2025-12-20T10:30:00.123Z"));
            }

            [Fact(DisplayName = "應正確從 epoch millis 轉換")]
            public void ToInstant_ShouldConvertFromEpochMillis()
            {
                var millis = 1703062200000L;
                var result = TypeConverter.ToInstant(millis);
                Assert.Equal(DateTimeOffset.FromUnixTimeMilliseconds(millis), result);
            }

            [Fact(DisplayName = "應正確從 DateTimeOffset 轉換")]
            public void ToInstant_ShouldConvertFromDateTimeOffset()
            {
                var dto = new DateTimeOffset(2025, 12, 20, 10, 30, 0, TimeSpan.Zero);
                Assert.Equal(dto, TypeConverter.ToInstant(dto));
            }

            [Fact(DisplayName = "null 或空字串應返回 null (Instant)")]
            public void ToInstant_ShouldReturnNull_ForNullOrEmpty()
            {
                Assert.Null(TypeConverter.ToInstant(null));
                Assert.Null(TypeConverter.ToInstant(""));
            }

            [Fact(DisplayName = "無法解析的格式應拋出異常 (Instant)")]
            public void ToInstant_ShouldThrowException_ForInvalidFormat()
            {
                Assert.Throws<ArgumentException>(() => TypeConverter.ToInstant("invalid-instant"));
            }
        }
    }

    // ==================== 其他型別轉換測試 ====================

    [Collection("其他型別轉換")]
    public class OtherTypeConversionTests
    {
        [Collection("ToUuid()")]
        public class ToUuidTests
        {
            [Fact(DisplayName = "應正確轉換 UUID 字串")]
            public void ToUuid_ShouldConvertUuidString()
            {
                var uuidStr = "550e8400-e29b-41d4-a716-446655440000";
                var expected = Guid.Parse(uuidStr);
                Assert.Equal(expected, TypeConverter.ToUuid(uuidStr));
            }

            [Fact(DisplayName = "UUID 實例應直接返回")]
            public void ToUuid_ShouldReturnUuidDirectly()
            {
                var uuid = Guid.NewGuid();
                Assert.Equal(uuid, TypeConverter.ToUuid(uuid));
            }

            [Fact(DisplayName = "null 或空字串應返回 null (UUID)")]
            public void ToUuid_ShouldReturnNull_ForNullOrEmpty()
            {
                Assert.Null(TypeConverter.ToUuid(null));
                Assert.Null(TypeConverter.ToUuid(""));
            }

            [Fact(DisplayName = "無效的 UUID 格式應拋出異常")]
            public void ToUuid_ShouldThrowException_ForInvalidFormat()
            {
                Assert.Throws<ArgumentException>(() => TypeConverter.ToUuid("not-a-uuid"));
            }
        }

        [Collection("ToBytes()")]
        public class ToBytesTests
        {
            [Fact(DisplayName = "應正確轉換字串為 byte[]")]
            public void ToBytes_ShouldConvertStringToBytes()
            {
                var result = TypeConverter.ToBytes("hello");
                Assert.Equal(Encoding.UTF8.GetBytes("hello"), result);
            }

            [Fact(DisplayName = "byte[] 實例應直接返回")]
            public void ToBytes_ShouldReturnBytesDirectly()
            {
                var bytes = new byte[] { 1, 2, 3 };
                Assert.Same(bytes, TypeConverter.ToBytes(bytes));
            }

            [Fact(DisplayName = "null 應返回 null (bytes)")]
            public void ToBytes_ShouldReturnNull_ForNull()
            {
                Assert.Null(TypeConverter.ToBytes(null));
            }
        }

        [Collection("ToEnum()")]
        public class ToEnumTests
        {
            [Fact(DisplayName = "應正確轉換字串為 Enum")]
            public void ToEnum_ShouldConvertStringToEnum()
            {
                Assert.Equal(TestStatus.Active, TypeConverter.ToEnum("ACTIVE", typeof(TestStatus)));
                Assert.Equal(TestStatus.Inactive, TypeConverter.ToEnum("INACTIVE", typeof(TestStatus)));
                Assert.Equal(TestStatus.Pending, TypeConverter.ToEnum("PENDING", typeof(TestStatus)));
            }

            [Fact(DisplayName = "Enum 實例應直接返回")]
            public void ToEnum_ShouldReturnEnumDirectly()
            {
                Assert.Equal(TestStatus.Active, TypeConverter.ToEnum(TestStatus.Active, typeof(TestStatus)));
            }

            [Fact(DisplayName = "null 應返回 null (Enum)")]
            public void ToEnum_ShouldReturnNull_ForNull()
            {
                Assert.Null(TypeConverter.ToEnum(null, typeof(TestStatus)));
            }

            [Fact(DisplayName = "無效的 Enum 名稱應拋出異常")]
            public void ToEnum_ShouldThrowException_ForInvalidEnumName()
            {
                Assert.Throws<ArgumentException>(() => TypeConverter.ToEnum("INVALID", typeof(TestStatus)));
            }
        }
    }
    // ==================== Convert() 整合測試 ====================

    [Collection("Convert() 整合測試")]
    public class ConvertIntegrationTests
    {
        [Fact(DisplayName = "應透過 Convert() 正確轉換各種型別")]
        public void ConvertIntegration_ShouldConvertVariousTypes()
        {
            Assert.Equal(100L, TypeConverter.Convert("100", typeof(long)));
            Assert.Equal(100L, TypeConverter.Convert("100", typeof(long)));
            Assert.Equal(100, TypeConverter.Convert("100", typeof(int)));
            Assert.Equal(100, TypeConverter.Convert("100", typeof(int)));

            Assert.Equal(true, TypeConverter.Convert("true", typeof(bool)));
            Assert.Equal(true, TypeConverter.Convert("1", typeof(bool)));

            Assert.Equal(99.99m, TypeConverter.Convert("99.99", typeof(decimal)));

            Assert.Equal(new DateOnly(2025, 1, 15), TypeConverter.Convert("2025-01-15", typeof(DateOnly)));
            Assert.Equal(DateTimeOffset.Parse("2025-12-20T10:30:00Z"),
                TypeConverter.Convert("2025-12-20T10:30:00Z", typeof(DateTimeOffset)));

            Assert.Equal(TestStatus.Active, TypeConverter.Convert("ACTIVE", typeof(TestStatus)));
        }

        [Fact(DisplayName = "應正確處理 primitive 型別")]
        public void ConvertIntegration_ShouldHandlePrimitiveTypes()
        {
            Assert.Equal(100L, TypeConverter.Convert("100", typeof(long)));
            Assert.Equal(100, TypeConverter.Convert("100", typeof(int)));
            Assert.Equal((short)100, TypeConverter.Convert("100", typeof(short)));
            Assert.Equal((byte)100, TypeConverter.Convert("100", typeof(byte)));
            Assert.Equal(3.14, TypeConverter.Convert("3.14", typeof(double)));
            Assert.Equal(3.14f, TypeConverter.Convert("3.14", typeof(float)));
            Assert.Equal(true, TypeConverter.Convert("true", typeof(bool)));
        }
    }
}