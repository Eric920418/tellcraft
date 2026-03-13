package ai.specformula.core.helper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.UUID;

/**
 * 型別轉換工具類
 *
 * 提供統一的型別轉換方法，用於將 DataTable 中的字串值轉換為 Entity 欄位所需的型別。
 */
public class TypeConverter {

    // ==================== 通用轉換方法 ====================

    /**
     * 根據目標型別進行轉換
     *
     * @param value 原始值
     * @param targetType 目標型別
     * @return 轉換後的值
     */
    public static Object convert(Object value, Class<?> targetType) {
        if (value == null) return null;
        if (targetType == null) return value;

        // 如果已經是目標型別，直接返回
        if (targetType.isInstance(value)) {
            return value;
        }

        // 基本型別轉換
        if (targetType == String.class) {
            return value.toString();
        }
        if (targetType == Long.class || targetType == long.class) {
            return toLong(value);
        }
        if (targetType == Integer.class || targetType == int.class) {
            return toInteger(value);
        }
        if (targetType == Short.class || targetType == short.class) {
            return toShort(value);
        }
        if (targetType == Byte.class || targetType == byte.class) {
            return toByte(value);
        }
        if (targetType == Double.class || targetType == double.class) {
            return toDouble(value);
        }
        if (targetType == Float.class || targetType == float.class) {
            return toFloat(value);
        }
        if (targetType == Boolean.class || targetType == boolean.class) {
            return toBoolean(value);
        }
        if (targetType == BigDecimal.class) {
            return toDecimal(value);
        }

        // 時間型別轉換
        if (targetType == LocalDate.class) {
            return toLocalDate(value);
        }
        if (targetType == LocalDateTime.class) {
            return toLocalDateTime(value);
        }
        if (targetType == LocalTime.class) {
            return toLocalTime(value);
        }
        if (targetType == Instant.class) {
            return toInstant(value);
        }

        // 其他型別
        if (targetType == UUID.class) {
            return toUUID(value);
        }
        if (targetType == byte[].class) {
            return toBytes(value);
        }

        // Enum 處理
        if (targetType.isEnum()) {
            return toEnum(value, targetType);
        }

        // 預設：直接返回原值
        return value;
    }

    // ==================== 數值型別轉換 ====================

    public static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long aLong) return aLong;
        if (value instanceof Number number) return number.longValue();
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return Long.valueOf(str);
    }

    public static Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer integer) return integer;
        if (value instanceof Number number) return number.intValue();
        String str = value.toString().trim();
        if (!str.isEmpty()) {
        } else {
            return null;
        }
        return Integer.valueOf(str);
    }

    public static Short toShort(Object value) {
        if (value == null) return null;
        if (value instanceof Short aShort) return aShort;
        if (value instanceof Number number) return number.shortValue();
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return Short.valueOf(str);
    }

    public static Byte toByte(Object value) {
        if (value == null) return null;
        if (value instanceof Byte aByte) return aByte;
        if (value instanceof Number number) return number.byteValue();
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return Byte.valueOf(str);
    }

    public static Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Double aDouble) return aDouble;
        if (value instanceof Number number) return number.doubleValue();
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return Double.valueOf(str);
    }

    public static Float toFloat(Object value) {
        if (value == null) return null;
        if (value instanceof Float aFloat) return aFloat;
        if (value instanceof Number number) return number.floatValue();
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return Float.valueOf(str);
    }

    public static Boolean toBoolean(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean aBoolean) return aBoolean;
        String str = value.toString().trim().toLowerCase();
        if (str.isEmpty()) return null;
        return "true".equals(str) || "1".equals(str) || "yes".equals(str);
    }

    public static BigDecimal toDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bigDecimal) return bigDecimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return new BigDecimal(str);
    }

    // ==================== 時間型別轉換 ====================

    public static LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate localDate) return localDate;
        if (value instanceof LocalDateTime localDateTime) return localDateTime.toLocalDate();
        if (value instanceof ZonedDateTime zonedDateTime) return zonedDateTime.toLocalDate();
        if (value instanceof Number number) {
            long millis = number.longValue();
            return Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return LocalDate.parse(str);
    }

    public static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime localDateTime) return localDateTime;
        if (value instanceof LocalDate localDate) return localDate.atStartOfDay();
        if (value instanceof ZonedDateTime zonedDateTime) return zonedDateTime.toLocalDateTime();
        if (value instanceof Number number) {
            long millis = number.longValue();
            return Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        String str = value.toString().trim();
        if (str.isEmpty()) return null;

        // 嘗試多種格式
        try {
            return LocalDateTime.parse(str);
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 處理 Z 結尾的 UTC 格式
        if (str.endsWith("Z")) {
            try {
                return ZonedDateTime.parse(str).toLocalDateTime();
            } catch (DateTimeParseException e) {
                // 嘗試其他格式
            }
        }

        // 嘗試 yyyy-MM-dd HH:mm:ss 格式
        try {
            return LocalDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 嘗試 yyyy-MM-dd 格式（轉為當天開始時間）
        try {
            return LocalDate.parse(str).atStartOfDay();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("無法解析日期時間: " + str);
        }
    }

    public static LocalTime toLocalTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalTime localTime) return localTime;
        if (value instanceof LocalDateTime localDateTime) return localDateTime.toLocalTime();
        if (value instanceof Number number) {
            long millis = number.longValue();
            return Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalTime();
        }
        String str = value.toString().trim();
        if (str.isEmpty()) return null;

        // 嘗試標準格式 HH:mm:ss
        try {
            return LocalTime.parse(str);
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 嘗試 HH:mm 格式（自動補秒）
        try {
            return LocalTime.parse(str, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("無法解析時間: " + str);
        }
    }

    public static Instant toInstant(Object value) {
        if (value == null) return null;
        if (value instanceof Instant instant) return instant;
        if (value instanceof LocalDateTime localDateTime) return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        if (value instanceof ZonedDateTime zonedDateTime) return zonedDateTime.toInstant();
        if (value instanceof LocalDate localDate) return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        if (value instanceof Number number) {
            long millis = number.longValue();
            return Instant.ofEpochMilli(millis);
        }
        String str = value.toString().trim();
        if (str.isEmpty()) return null;

        // 嘗試 ISO-8601 格式 (2024-01-01T00:00:00Z)
        try {
            return Instant.parse(str);
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 嘗試 LocalDateTime 格式再轉換
        try {
            return LocalDateTime.parse(str).atZone(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 嘗試 yyyy-MM-dd HH:mm:ss 格式
        try {
            return LocalDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    .atZone(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException e) {
            // 嘗試其他格式
        }

        // 嘗試 yyyy-MM-dd 格式
        try {
            return LocalDate.parse(str).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("無法解析時間戳: " + str);
        }
    }

    // ==================== 其他型別轉換 ====================

    public static UUID toUUID(Object value) {
        if (value == null) return null;
        if (value instanceof UUID uuid) return uuid;
        String str = value.toString().trim();
        if (str.isEmpty()) return null;
        return UUID.fromString(str);
    }

    public static byte[] toBytes(Object value) {
        if (value == null) return null;
        if (value instanceof byte[] bs) return bs;
        return value.toString().getBytes();
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static Object toEnum(Object value, Class<?> enumType) {
        if (value == null) return null;
        if (enumType.isInstance(value)) return value;
        return Enum.valueOf((Class<? extends Enum>) enumType, value.toString());
    }

    // ==================== SQL 欄位型別轉換 ====================

    /**
     * 根據 SQL 欄位類型將字串值轉換為對應的 Java 類型。
     * 用於 PreparedStatement 參數設定時的型別對齊。
     */
    public static Object convertToColumnType(Object value, String columnType) {
        if (value == null || columnType == null || !(value instanceof String)) {
            return value;
        }
        String strValue = (String) value;
        String upperType = columnType.toUpperCase();

        try {
            // UUID 類型（PostgreSQL UUID、MSSQL UNIQUEIDENTIFIER）
            if (upperType.equals("UUID") || upperType.equals("UNIQUEIDENTIFIER")) {
                return toUUID(strValue);
            }
            // MySQL YEAR 類型
            if (upperType.equals("YEAR")) {
                return toShort(strValue);
            }
            // UNSIGNED 整數（MySQL）：必須在一般 INT 之前判斷
            if (upperType.contains("UNSIGNED")) {
                if (upperType.contains("BIGINT")) {
                    return toDecimal(strValue);
                }
                return toLong(strValue);
            }
            // 整數類型（由具體到通用排序，避免 contains("INT") 誤匹配）
            if (upperType.contains("BIGINT") || upperType.equals("BIGSERIAL")) {
                return toLong(strValue);
            }
            if (upperType.contains("SMALLINT")) {
                return toShort(strValue);
            }
            if (upperType.contains("TINYINT")) {
                return toByte(strValue);
            }
            if (upperType.contains("INT") || upperType.contains("SERIAL")) {
                return toInteger(strValue);
            }
            // 浮點數類型
            if (upperType.contains("DECIMAL") || upperType.contains("NUMERIC")) {
                return toDecimal(strValue);
            }
            if (upperType.contains("DOUBLE") || upperType.equals("FLOAT")) {
                return toDouble(strValue);
            }
            if (upperType.equals("REAL")) {
                return toFloat(strValue);
            }
            // 布林類型
            if (upperType.contains("BOOLEAN") || upperType.equals("BIT")) {
                return toBoolean(strValue);
            }
            // 日期時間類型
            if (upperType.contains("DATETIMEOFFSET")) {
                return OffsetDateTime.parse(strValue);
            }
            if (upperType.contains("TIMESTAMP") || upperType.contains("DATETIME")) {
                return toLocalDateTime(strValue);
            }
            if (upperType.equals("DATE")) {
                return toLocalDate(strValue);
            }
            if (upperType.equals("TIME")) {
                return toLocalTime(strValue);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException(String.format(
                    "無法將值 '%s' 轉換為類型 %s: %s",
                    strValue, columnType, e.getMessage()), e);
        }
        return value;
    }

    // ==================== JDBC 型別轉換 ====================

    /**
     * 將 java.time 型別轉為 JDBC 可接受的型別（用於 PreparedStatement 參數）。
     */
    public static Object toJdbcValue(Object value) {
        if (value instanceof OffsetDateTime) {
            return value;
        }
        if (value instanceof ZonedDateTime zdt) {
            return java.sql.Timestamp.valueOf(zdt.toLocalDateTime());
        }
        if (value instanceof LocalDateTime ldt) {
            return java.sql.Timestamp.valueOf(ldt);
        }
        if (value instanceof LocalDate ld) {
            return java.sql.Date.valueOf(ld);
        }
        if (value instanceof LocalTime lt) {
            return java.sql.Time.valueOf(lt);
        }
        return value;
    }

    /**
     * 正規化 JDBC 值：將 java.sql 型別轉為 java.time 型別。
     */
    public static Object normalizeJdbcValue(Object value) {
        if (value instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime();
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof java.sql.Time t) {
            return t.toLocalTime();
        }
        // microsoft.sql.DateTimeOffset 轉換為 OffsetDateTime
        if (value != null && value.getClass().getName().equals("microsoft.sql.DateTimeOffset")) {
            try {
                var method = value.getClass().getMethod("getOffsetDateTime");
                return (OffsetDateTime) method.invoke(value);
            } catch (Exception e) {
                // 反射失敗，保持原值
            }
        }
        return value;
    }
}
