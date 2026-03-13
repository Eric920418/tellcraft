using System;
using System.Globalization;
using System.Text;

namespace Tw.Sdd.Isa.TestLib.Helper;

public static class TypeConverter
{
    // ==================== 通用轉換方法 ====================

    public static object? Convert(object? value, Type? targetType)
    {
        if (value is null) return null;
        if (targetType is null) return value;

        var actualTargetType = Nullable.GetUnderlyingType(targetType) ?? targetType;

        if (actualTargetType.IsInstanceOfType(value))
        {
            return value;
        }

        if (actualTargetType == typeof(string))
        {
            if (value is bool boolValue)
            {
                return boolValue ? "true" : "false";
            }
            return value.ToString();
        }
        if (actualTargetType == typeof(long)) return ToLong(value);
        if (actualTargetType == typeof(int)) return ToInteger(value);
        if (actualTargetType == typeof(short)) return ToShort(value);
        if (actualTargetType == typeof(byte)) return ToByte(value);
        if (actualTargetType == typeof(double)) return ToDouble(value);
        if (actualTargetType == typeof(float)) return ToFloat(value);
        if (actualTargetType == typeof(bool)) return ToBoolean(value);
        if (actualTargetType == typeof(decimal)) return ToDecimal(value);

        if (actualTargetType == typeof(DateOnly)) return ToLocalDate(value);
        if (actualTargetType == typeof(DateTime)) return ToLocalDateTime(value);
        if (actualTargetType == typeof(TimeOnly)) return ToLocalTime(value);
        if (actualTargetType == typeof(DateTimeOffset)) return ToInstant(value);

        if (actualTargetType == typeof(Guid)) return ToUuid(value);
        if (actualTargetType == typeof(byte[])) return ToBytes(value);

        if (actualTargetType.IsEnum) return ToEnum(value, actualTargetType);

        return value;
    }

    // ==================== 數值型別轉換 ====================

    public static long? ToLong(object? value)
    {
        if (value is null) return null;
        if (value is long longValue) return longValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return long.Parse(str, CultureInfo.InvariantCulture);
        }
        return value switch
        {
            double doubleValue => (long)doubleValue,
            float floatValue => (long)floatValue,
            decimal decimalValue => (long)decimalValue,
            int intValue => intValue,
            short shortValue => shortValue,
            byte byteValue => byteValue,
            sbyte sbyteValue => sbyteValue,
            uint uintValue => uintValue,
            ulong ulongValue => ulongValue <= (ulong)long.MaxValue
                ? (long)ulongValue
                : throw new OverflowException($"Value {ulongValue} exceeds long.MaxValue"),
            ushort ushortValue => ushortValue,
            _ => System.Convert.ToInt64(value, CultureInfo.InvariantCulture)
        };
    }

    public static int? ToInteger(object? value)
    {
        if (value is null) return null;
        if (value is int intValue) return intValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return int.Parse(str, CultureInfo.InvariantCulture);
        }
        return value switch
        {
            double doubleValue => (int)doubleValue,
            float floatValue => (int)floatValue,
            decimal decimalValue => (int)decimalValue,
            long longValue => (int)longValue,
            short shortValue => shortValue,
            byte byteValue => byteValue,
            sbyte sbyteValue => sbyteValue,
            uint uintValue => (int)uintValue,
            ulong ulongValue => ulongValue <= (ulong)int.MaxValue
                ? (int)ulongValue
                : throw new OverflowException($"Value {ulongValue} exceeds int.MaxValue"),
            ushort ushortValue => ushortValue,
            _ => System.Convert.ToInt32(value, CultureInfo.InvariantCulture)
        };
    }

    public static short? ToShort(object? value)
    {
        if (value is null) return null;
        if (value is short shortValue) return shortValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return short.Parse(str, CultureInfo.InvariantCulture);
        }
        return value switch
        {
            double doubleValue => (short)doubleValue,
            float floatValue => (short)floatValue,
            decimal decimalValue => (short)decimalValue,
            int intValue => (short)intValue,
            long longValue => (short)longValue,
            byte byteValue => byteValue,
            sbyte sbyteValue => sbyteValue,
            uint uintValue => (short)uintValue,
            ulong ulongValue => ulongValue <= (ulong)short.MaxValue
                ? (short)ulongValue
                : throw new OverflowException($"Value {ulongValue} exceeds short.MaxValue"),
            ushort ushortValue => (short)ushortValue,
            _ => System.Convert.ToInt16(value, CultureInfo.InvariantCulture)
        };
    }

    public static byte? ToByte(object? value)
    {
        if (value is null) return null;
        if (value is byte byteValue) return byteValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return byte.Parse(str, CultureInfo.InvariantCulture);
        }
        return value switch
        {
            double doubleValue => (byte)doubleValue,
            float floatValue => (byte)floatValue,
            decimal decimalValue => (byte)decimalValue,
            int intValue => (byte)intValue,
            long longValue => (byte)longValue,
            short shortValue => (byte)shortValue,
            sbyte sbyteValue => (byte)sbyteValue,
            uint uintValue => (byte)uintValue,
            ulong ulongValue => ulongValue <= (ulong)byte.MaxValue
                ? (byte)ulongValue
                : throw new OverflowException($"Value {ulongValue} exceeds byte.MaxValue"),
            ushort ushortValue => (byte)ushortValue,
            _ => System.Convert.ToByte(value, CultureInfo.InvariantCulture)
        };
    }

    public static double? ToDouble(object? value)
    {
        if (value is null) return null;
        if (value is double doubleValue) return doubleValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return double.Parse(str, CultureInfo.InvariantCulture);
        }
        return System.Convert.ToDouble(value, CultureInfo.InvariantCulture);
    }

    public static float? ToFloat(object? value)
    {
        if (value is null) return null;
        if (value is float floatValue) return floatValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return float.Parse(str, CultureInfo.InvariantCulture);
        }
        return System.Convert.ToSingle(value, CultureInfo.InvariantCulture);
    }

    public static bool? ToBoolean(object? value)
    {
        if (value is null) return null;
        if (value is bool boolValue) return boolValue;
        var str = value.ToString()?.Trim();
        if (string.IsNullOrEmpty(str)) return null;
        return string.Equals(str, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(str, "1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(str, "yes", StringComparison.OrdinalIgnoreCase);
    }

    public static decimal? ToDecimal(object? value)
    {
        if (value is null) return null;
        if (value is decimal decimalValue) return decimalValue;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return decimal.Parse(str, CultureInfo.InvariantCulture);
        }
        return System.Convert.ToDecimal(value, CultureInfo.InvariantCulture);
    }

    // ==================== 時間型別轉換 ====================

    public static DateOnly? ToLocalDate(object? value)
    {
        if (value is null) return null;
        if (value is DateOnly dateOnly) return dateOnly;
        if (value is DateTime dateTime) return DateOnly.FromDateTime(dateTime);
        if (value is DateTimeOffset dateTimeOffset) return DateOnly.FromDateTime(dateTimeOffset.DateTime);
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            return DateOnly.Parse(str, CultureInfo.InvariantCulture);
        }
        if (value is IConvertible)
        {
            var millis = System.Convert.ToInt64(value, CultureInfo.InvariantCulture);
            var dto = DateTimeOffset.FromUnixTimeMilliseconds(millis);
            return DateOnly.FromDateTime(dto.LocalDateTime);
        }
        return null;
    }

    public static DateTime? ToLocalDateTime(object? value)
    {
        if (value is null) return null;
        if (value is DateTime dateTime) return dateTime;
        if (value is DateOnly dateOnly) return dateOnly.ToDateTime(TimeOnly.MinValue);
        if (value is DateTimeOffset dateTimeOffset) return dateTimeOffset.DateTime;
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;

            if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
            {
                return parsed;
            }

            if (str.EndsWith("Z", StringComparison.OrdinalIgnoreCase))
            {
                if (DateTimeOffset.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var utc))
                {
                    return utc.UtcDateTime;
                }
            }

            if (DateTime.TryParseExact(str, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var spaceFormat))
            {
                return spaceFormat;
            }

            if (DateOnly.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOnlyParsed))
            {
                return dateOnlyParsed.ToDateTime(TimeOnly.MinValue);
            }

            throw new ArgumentException($"無法解析日期時間: {str}");
        }

        if (value is IConvertible)
        {
            var millis = System.Convert.ToInt64(value, CultureInfo.InvariantCulture);
            return DateTimeOffset.FromUnixTimeMilliseconds(millis).LocalDateTime;
        }

        return null;
    }

    public static TimeOnly? ToLocalTime(object? value)
    {
        if (value is null) return null;
        if (value is TimeOnly timeOnly) return timeOnly;
        if (value is DateTime dateTime) return TimeOnly.FromDateTime(dateTime);
        if (value is DateTimeOffset dateTimeOffset) return TimeOnly.FromDateTime(dateTimeOffset.DateTime);
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;

            if (TimeOnly.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return parsed;
            }

            if (TimeOnly.TryParseExact(str, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var hhmm))
            {
                return hhmm;
            }

            throw new ArgumentException($"無法解析時間: {str}");
        }

        if (value is IConvertible)
        {
            var millis = System.Convert.ToInt64(value, CultureInfo.InvariantCulture);
            var dto = DateTimeOffset.FromUnixTimeMilliseconds(millis);
            return TimeOnly.FromDateTime(dto.LocalDateTime);
        }

        return null;
    }

    public static DateTimeOffset? ToInstant(object? value)
    {
        if (value is null) return null;
        if (value is DateTimeOffset dto) return dto;
        if (value is DateTime dateTime) return new DateTimeOffset(dateTime);
        if (value is DateOnly dateOnly) return new DateTimeOffset(dateOnly.ToDateTime(TimeOnly.MinValue));
        if (value is string strValue)
        {
            var str = strValue.Trim();
            if (string.IsNullOrEmpty(str)) return null;

            if (DateTimeOffset.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
            {
                return parsed;
            }

            if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateTimeParsed))
            {
                return new DateTimeOffset(dateTimeParsed);
            }

            if (DateTime.TryParseExact(str, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var spaceFormat))
            {
                return new DateTimeOffset(spaceFormat);
            }

            if (DateOnly.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOnlyParsed))
            {
                return new DateTimeOffset(dateOnlyParsed.ToDateTime(TimeOnly.MinValue));
            }

            throw new ArgumentException($"無法解析時間戳: {str}");
        }

        if (value is IConvertible)
        {
            var millis = System.Convert.ToInt64(value, CultureInfo.InvariantCulture);
            return DateTimeOffset.FromUnixTimeMilliseconds(millis);
        }

        return null;
    }

    // ==================== 其他型別轉換 ====================

    public static Guid? ToUuid(object? value)
    {
        if (value is null) return null;
        if (value is Guid guid) return guid;
        var str = value.ToString()?.Trim();
        if (string.IsNullOrEmpty(str)) return null;
        try
        {
            return Guid.Parse(str);
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("無效的 UUID 格式", ex);
        }
    }

    public static byte[]? ToBytes(object? value)
    {
        if (value is null) return null;
        if (value is byte[] bytes) return bytes;
        return Encoding.UTF8.GetBytes(value.ToString() ?? string.Empty);
    }

    public static object? ToEnum(object? value, Type enumType)
    {
        if (value is null) return null;
        if (enumType.IsInstanceOfType(value)) return value;
        return Enum.Parse(enumType, value.ToString() ?? string.Empty, ignoreCase: true);
    }
}
