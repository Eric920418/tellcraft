import uuid
from datetime import date, datetime, time, timezone, tzinfo
from decimal import Decimal
from enum import Enum
from typing import Any, TypeVar
from zoneinfo import ZoneInfo

T = TypeVar("T", bound=Enum)


def convert(value: Any, target_type: type | None) -> Any | None:
    """Convert a value based on the target type.

    TODO(Feature): This method currently does not support conversion to datetime with timezones.

    Args:
        value: The value to convert.
        target_type: The target type to convert to.

    Returns:
        The converted value, or the original value if no conversion is possible.

    Behavior:
        - None: returns None
        - target_type is None: returns original value
        - Already target_type: returns as-is
        - Supported types: str, int, float, bool, Decimal, date, datetime, time, uuid.UUID, bytes, Enum

    """
    if value is None:
        return None
    if target_type is None:
        return value

    # Return immediately if already the target type
    if isinstance(value, target_type):
        return value

    # String conversion
    if target_type is str:
        return str(value)

    # Numeric type conversion
    if target_type is int:
        return to_int(value)
    if target_type is float:
        return to_float(value)
    if target_type is bool:
        return to_boolean(value)
    if target_type is Decimal:
        return to_decimal(value)

    # Time type conversion
    if target_type is date:
        return to_local_date(value)
    if target_type is datetime:
        return to_local_datetime(value)
    if target_type is time:
        return to_local_time(value)

    # TODO(Refactor): Support Instant.class

    # Other types
    if target_type is uuid.UUID:
        return to_uuid(value)
    if target_type is bytes:
        return to_bytes(value)

    # Enum handling
    if isinstance(target_type, type) and issubclass(target_type, Enum):
        return to_enum(value, target_type)

    # Default: return original value
    return value


def to_int(value: Any) -> int | None:
    """Convert a value to an integer.

    Args:
        value: The value to convert.

    Returns:
        The converted integer, or None if the input is None or an empty string.

    Behavior:
        - int: returns as-is
        - float/Decimal: truncates decimal part
        - string: parses as integer, strips whitespace
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, (float, Decimal)):
        return int(value)
    str_val = str(value).strip()
    if not str_val:
        return None
    return int(str_val)


def to_float(value: Any) -> float | None:
    """Convert a value to a float.

    Typically represented as IEEE 754 binary64 (aka 64-bit double).
    [Official Document](https://docs.python.org/3.10/tutorial/floatingpoint.html#representation-error)

    Args:
        value: The value to convert.

    Returns:
        The converted float, or None if the input is None or an empty string.

    Behavior:
        - float: returns as-is
        - int/Decimal: converts to float
        - string: parses as float, strips whitespace
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, float):
        return value
    if isinstance(value, (int, Decimal)):
        return float(value)
    str_val = str(value).strip()
    if not str_val:
        return None
    return float(str_val)


def to_boolean(value: Any) -> bool | None:
    """Convert a value to a boolean.

    Args:
        value: The value to convert.

    Returns:
        True if the string representation is "true", "1", or "yes" (case-insensitive).
        False otherwise, or None if the input is None or an empty string.

    Behavior:
        - bool: returns as-is
        - string (case-insensitive): "true", "1", "yes" -> True; others -> False
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    str_val = str(value).strip().lower()
    if not str_val:
        return None
    return str_val in ("true", "1", "yes")


def to_decimal(value: Any) -> Decimal | None:
    """Convert a value to a Decimal.

    Args:
        value: The value to convert.

    Returns:
        The converted Decimal, or None if the input is None or an empty string.

    Behavior:
        - Decimal: returns as-is
        - int/float/string: parses as Decimal
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    str_val = str(value).strip()
    if not str_val:
        return None
    return Decimal(str_val)


def to_local_date(value: Any) -> date | None:
    """Convert a value to a local date.

    Args:
        value: The value to convert.

    Returns:
        The converted date, or None if the input is None or an empty string.

    Behavior:
        - date (not datetime): returns as-is
        - datetime: extracts date part (removes time/tzinfo)
        - int/float: treats as Unix timestamp in milliseconds, returns UTC date
        - string: parses ISO 8601 date (YYYY-MM-DD)
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        dt = to_local_datetime(value)
        return dt.date() if dt else None
    if isinstance(value, (int, float)):
        dt = to_local_datetime(value)
        return dt.date() if dt else None
    str_val = str(value).strip()
    if not str_val:
        return None
    return date.fromisoformat(str_val)


def to_local_datetime(value: Any) -> datetime | None:
    """Convert a value to a local datetime (no timezone).

    Args:
        value: The value to convert.

    Returns:
        The converted datetime without timezone info (naive), or None if the input is None or an empty string.

    Behavior:
        - date (not datetime): combines with midnight (00:00:00)
        - datetime: removes timezone info (keeps local time)
        - int/float: treats as Unix timestamp in milliseconds, converts to UTC then removes timezone
        - string: parses ISO 8601 datetime, removes timezone info
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time.min).replace(tzinfo=None)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value
        return value.replace(tzinfo=None)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc).replace(
            tzinfo=None
        )
    str_val = str(value).strip()
    if not str_val:
        return None
    if str_val.endswith("Z"):
        str_val = str_val[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(str_val).replace(tzinfo=None)
    except ValueError:
        pass
    try:
        return datetime.combine(date.fromisoformat(str_val), time.min).replace(
            tzinfo=None
        )
    except ValueError as e:
        raise ValueError(f"Unable to parse datetime: {str_val}") from e


def to_local_time(value: Any) -> time | None:
    """Convert a value to a local time.

    Args:
        value: The value to convert.

    Returns:
        The converted time without timezone info (naive), or None if the input is None or an empty string.

    Behavior:
        - time (not datetime): returns as-is (removes tzinfo if present)
        - datetime: extracts time part (removes timezone)
        - int/float: treats as Unix timestamp in milliseconds, extracts time
        - string: parses ISO 8601 time (HH:MM:SS)
        - None/empty: returns None

    """
    if value is None:
        return None
    if isinstance(value, time):
        if value.tzinfo is None:
            return value
        return value.replace(tzinfo=None)
    if isinstance(value, datetime):
        return value.time().replace(tzinfo=None)
    if isinstance(value, (int, float)):
        dt = to_local_datetime(value)
        return dt.time() if dt else None
    str_val = str(value).strip()
    if not str_val:
        return None
    try:
        return time.fromisoformat(str_val)
    except ValueError as e:
        raise ValueError(f"Unable to parse time: {str_val}") from e


def to_instant(value: Any) -> datetime | None:
    """Convert a value to a UTC datetime (corresponds to Java Instant).

    Args:
        value: The value to convert.

    Returns:
        The converted UTC datetime with timezone info, or None if conversion fails.

    Behavior:
        - datetime with UTC tz: returns as-is
        - datetime with other tz: converts to UTC
        - datetime without tz: adds UTC timezone
        - string/int/float: delegates to to_local_datetime, then adds UTC timezone

    """
    if isinstance(value, datetime):
        if value.tzinfo == timezone.utc:
            return value
        return value.astimezone(timezone.utc)

    dt = to_local_datetime(value)
    if dt and dt.tzinfo != timezone.utc:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def to_zoned_datetime(
    value: Any, tz: ZoneInfo | str | timezone | None = None
) -> datetime | None:
    """Convert a value to a timezone-aware datetime (corresponds to Java ZonedDateTime).

    Args:
        value: The value to convert. Can be ISO 8601 string, datetime, etc.
        tz: Optional timezone override. If provided, the result will be converted
            to this timezone. If None, the timezone from the value is preserved,
            or naive datetime is returned for inputs without timezone.

    Returns:
        A timezone-aware datetime, or None if the input is None or an empty string.

    Behavior:
        - datetime with tzinfo: preserves timezone
        - datetime without tzinfo: returns naive datetime (no timezone added)
        - date: combines with midnight (00:00:00), adds UTC timezone
        - int/float: treats as Unix timestamp in milliseconds, returns UTC datetime
        - string with timezone (+XX:XX or Z): parses and preserves timezone
        - string without timezone: returns naive datetime
        - If tz parameter provided: converts result to specified timezone

    """
    if value is None:
        return None

    target_tz: tzinfo | None = None
    if tz is not None:
        if isinstance(tz, ZoneInfo):
            target_tz = tz
        elif isinstance(tz, timezone):
            target_tz = tz
        else:
            target_tz = ZoneInfo(tz)

    if isinstance(value, datetime):
        if target_tz is not None:
            return value.astimezone(target_tz)
        return value

    if isinstance(value, date) and not isinstance(value, datetime):
        dt = datetime.combine(value, time.min)
        if target_tz is not None:
            return dt.replace(tzinfo=target_tz)
        return dt.replace(tzinfo=timezone.utc)

    if isinstance(value, (int, float)):
        dt = to_instant(value)
        if dt is None:
            return None
        if target_tz is not None:
            return dt.astimezone(target_tz)
        return dt

    str_val = str(value).strip()
    if not str_val:
        return None

    parse_str = str_val
    if parse_str.endswith("Z"):
        parse_str = parse_str[:-1] + "+00:00"

    try:
        dt = datetime.fromisoformat(parse_str)
        if target_tz is not None:
            return dt.astimezone(target_tz)
        return dt
    except ValueError:
        pass

    try:
        dt = datetime.combine(date.fromisoformat(str_val), time.min)
        if target_tz is not None:
            return dt.replace(tzinfo=target_tz)
        return dt.replace(tzinfo=timezone.utc)
    except ValueError as e:
        raise ValueError(f"Unable to parse zoned datetime: {str_val}") from e


def to_uuid(value: Any) -> uuid.UUID | None:
    """Convert a value to a UUID.

    Args:
        value: The value to convert.

    Returns:
        The converted UUID, or None if the input is None or an empty string.

    """
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return value
    str_val = str(value).strip()
    if not str_val:
        return None
    return uuid.UUID(str_val)


def to_bytes(value: Any) -> bytes | None:
    """Convert a value to bytes.

    Args:
        value: The value to convert.

    Returns:
        The converted bytes, or None if the input is None.

    """
    if value is None:
        return None
    if isinstance(value, bytes):
        return value
    return str(value).encode("utf-8")


def to_enum(value: Any, enum_type: type[T]) -> T | None:
    """Convert a value to an Enum member.

    Args:
        value: The value to convert.
        enum_type: The target Enum type.

    Returns:
        The corresponding Enum member, or None if the input is None.

    """
    if value is None:
        return None
    if isinstance(value, enum_type):
        return value
    str_val = str(value).strip()
    try:
        return enum_type[str_val]
    except KeyError:
        # Try searching by value
        for e in enum_type:
            if str(e.value) == str_val:
                return e
        raise ValueError(
            f"Invalid Enum value: {str_val} for {enum_type.__name__}"
        ) from None


def convert_to_column_type(value: Any, column_type: str | None) -> Any:
    """Convert a value to the corresponding Python type based on a SQL column type.

    Args:
        value: The value to convert.
        column_type: The SQL column type (e.g., "VARCHAR", "INT", "UUID").

    Returns:
        The converted Python object.

    """
    if value is None or column_type is None or (not isinstance(value, str)):
        return value

    upper_type = column_type.upper()
    str_value = str(value)

    try:
        # UUID types (PostgreSQL UUID, MSSQL UNIQUEIDENTIFIER)
        if upper_type in {"UUID", "UNIQUEIDENTIFIER"}:
            return to_uuid(str_value)

        # MySQL YEAR type
        if upper_type == "YEAR":
            return to_int(str_value)

        # UNSIGNED integers (MySQL): Check before general INT
        if "UNSIGNED" in upper_type:
            if "BIGINT" in upper_type:
                return to_decimal(str_value)
            return to_int(str_value)

        # Integer types (sorted from specific to general to avoid "INT" mis-matching)
        if "BIGINT" in upper_type or upper_type == "BIGSERIAL":
            return to_int(str_value)

        if "SMALLINT" in upper_type:
            return to_int(str_value)

        if "TINYINT" in upper_type:
            return to_int(str_value)

        if "INT" in upper_type or "SERIAL" in upper_type:
            return to_int(str_value)

        # Floating-point types
        if "DECIMAL" in upper_type or "NUMERIC" in upper_type:
            return to_decimal(str_value)

        if "DOUBLE" in upper_type or upper_type == "FLOAT":
            return to_float(str_value)

        if upper_type == "REAL":
            return to_float(str_value)

        # Boolean types
        if "BOOLEAN" in upper_type or upper_type == "BIT":
            return to_boolean(str_value)

        # Datetime types
        if "DATETIMEOFFSET" in upper_type:
            # Python 3.10 fromisoformat() does not support Z, convert to +00:00
            str_value = (
                (str_value[:-1] + "+00:00") if str_value.endswith("Z") else str_value
            )
            return datetime.fromisoformat(str_value)

        if "TIMESTAMP" in upper_type or "DATETIME" in upper_type:
            return to_local_datetime(str_value)

        if upper_type == "DATE":
            return to_local_date(str_value)

        if upper_type == "TIME":
            return to_local_time(str_value)
    except (ValueError, TypeError) as e:
        raise ValueError(
            f"Unable to convert value '{value}' to type {column_type}: {e}"
        ) from e

    return value
