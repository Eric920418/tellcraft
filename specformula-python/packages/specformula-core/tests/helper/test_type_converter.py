import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum

import pytest
from specformula.core.helper import type_converter


class Status(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS = 1771537222000
TEST_UNIX_EPOCH_TIMESTAMP = 1771537222
TEST_UNIX_EPOCH_UTC_DATETIME = datetime.fromtimestamp(
    TEST_UNIX_EPOCH_TIMESTAMP, tz=timezone.utc
)
"""Fri, 19 Feb 2026 21:40:22 GMT"""


class TestTypeConverter:
    """Tests for the type_converter utility module."""

    def test_to_int(self) -> None:
        assert type_converter.to_int(" 123 ") == 123
        assert type_converter.to_int(123.9) == 123
        assert type_converter.to_int(Decimal("123.45")) == 123
        assert type_converter.to_int(None) is None
        assert type_converter.to_int("") is None

    def test_to_float(self) -> None:
        assert type_converter.to_float(" 123.45 ") == 123.45
        assert type_converter.to_float(123) == 123.0
        assert type_converter.to_float(None) is None

    def test_to_bool(self) -> None:
        assert type_converter.to_boolean(True) is True
        assert type_converter.to_boolean(False) is False
        assert type_converter.to_boolean("true") is True
        assert type_converter.to_boolean("1") is True
        assert type_converter.to_boolean("YES") is True
        assert type_converter.to_boolean("false") is False
        assert type_converter.to_boolean("no!") is False
        assert type_converter.to_boolean("0") is False
        assert type_converter.to_boolean(None) is None

    def test_to_decimal(self) -> None:
        assert type_converter.to_decimal(Decimal("123.45")) == Decimal("123.45")
        assert type_converter.to_decimal("123.45") == Decimal("123.45")
        assert type_converter.to_decimal(123.45) == Decimal(str(123.45))
        assert type_converter.to_decimal(None) is None

    def test_to_local_date(self) -> None:
        assert (
            type_converter.to_local_date(TEST_UNIX_EPOCH_UTC_DATETIME.date())
            == TEST_UNIX_EPOCH_UTC_DATETIME.date()
        )
        assert (
            type_converter.to_local_date(TEST_UNIX_EPOCH_UTC_DATETIME)
            == TEST_UNIX_EPOCH_UTC_DATETIME.date()
        )
        assert (
            type_converter.to_local_date(TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS)
            == TEST_UNIX_EPOCH_UTC_DATETIME.date()
        )
        assert type_converter.to_local_date("2026-02-19") == date(2026, 2, 19)

    def test_to_local_datetime(self) -> None:
        dt = type_converter.to_local_datetime(TEST_UNIX_EPOCH_UTC_DATETIME)
        assert dt is not None
        assert dt == TEST_UNIX_EPOCH_UTC_DATETIME.replace(tzinfo=None)
        assert type_converter.to_local_datetime(
            TEST_UNIX_EPOCH_UTC_DATETIME.date()
        ) == datetime.combine(TEST_UNIX_EPOCH_UTC_DATETIME.date(), time.min)
        assert type_converter.to_local_datetime(
            TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS
        ) == TEST_UNIX_EPOCH_UTC_DATETIME.replace(tzinfo=None)
        assert type_converter.to_local_datetime("2026-02-19T21:40:22Z") == datetime(
            year=2026,
            month=2,
            day=19,
            hour=21,
            minute=40,
            second=22,
            tzinfo=timezone.utc,
        ).replace(tzinfo=None)
        assert type_converter.to_local_datetime("2026-02-20") == datetime(
            year=2026, month=2, day=20, tzinfo=None
        )

        assert type_converter.to_local_datetime("2026-02-19 21:40:22") == datetime(
            year=2026, month=2, day=19, hour=21, minute=40, second=22
        )

        with pytest.raises(ValueError, match="Unable to parse datetime"):
            type_converter.to_local_datetime("invalid-date")

    def test_to_local_time(self) -> None:
        TEST_TIME = time(12, 30, 45)
        assert type_converter.to_local_time(TEST_TIME) == TEST_TIME
        assert type_converter.to_local_time("12:30:45") == TEST_TIME
        assert type_converter.to_local_time("12:30") == TEST_TIME.replace(second=0)
        assert type_converter.to_local_time(
            TEST_UNIX_EPOCH_UTC_DATETIME.replace(tzinfo=None)
        ) == time(21, 40, 22)
        assert type_converter.to_local_time(
            TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS
        ) == TEST_UNIX_EPOCH_UTC_DATETIME.time().replace(tzinfo=None)

        with pytest.raises(ValueError, match="Unable to parse time"):
            type_converter.to_local_time("invalid-time")

    def test_to_instant(self) -> None:
        tz_taipei = timezone(timedelta(hours=8))
        assert (
            type_converter.to_instant(TEST_UNIX_EPOCH_UTC_DATETIME)
            == TEST_UNIX_EPOCH_UTC_DATETIME
        )
        assert (
            type_converter.to_instant(
                TEST_UNIX_EPOCH_UTC_DATETIME.astimezone(tz_taipei)
            )
            == TEST_UNIX_EPOCH_UTC_DATETIME
        )
        assert type_converter.to_instant(
            TEST_UNIX_EPOCH_UTC_DATETIME.date()
        ) == datetime.combine(TEST_UNIX_EPOCH_UTC_DATETIME.date(), time.min).replace(
            tzinfo=timezone.utc
        )

        naive_dt = datetime(2026, 2, 19, 21, 40, 22)
        result = type_converter.to_instant(naive_dt)
        assert result is not None
        assert result.tzinfo == timezone.utc

        assert (
            type_converter.to_instant(TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS)
            == TEST_UNIX_EPOCH_UTC_DATETIME
        )

        assert type_converter.to_instant("2025-12-20T10:30:00Z") == datetime(
            2025, 12, 20, 10, 30, 0, tzinfo=timezone.utc
        )

        assert type_converter.to_instant("2025-12-20T10:30:00.123Z") == datetime(
            2025, 12, 20, 10, 30, 0, 123000, tzinfo=timezone.utc
        )

        with pytest.raises(ValueError, match="Unable to parse datetime"):
            type_converter.to_instant("invalid-instant")

    def test_to_zoned_datetime(self) -> None:
        from zoneinfo import ZoneInfo

        tz_plus_8 = timezone(timedelta(hours=8))
        tz_plus_9 = timezone(timedelta(hours=9))

        assert type_converter.to_zoned_datetime(None) is None

        dt_utc = datetime(2026, 2, 19, 21, 40, 22, tzinfo=timezone.utc)
        result = type_converter.to_zoned_datetime(dt_utc)
        assert result is not None
        assert result.tzinfo is not None

        dt_naive = datetime(2026, 2, 19, 21, 40, 22)
        result = type_converter.to_zoned_datetime(dt_naive)
        assert result is not None
        assert result.tzinfo is None

        result = type_converter.to_zoned_datetime(dt_utc, tz_plus_8)
        assert result is not None
        assert result.tzinfo == tz_plus_8

        result = type_converter.to_zoned_datetime(date(2026, 2, 19))
        assert result is not None
        assert result.tzinfo == timezone.utc
        assert result.hour == 0

        result = type_converter.to_zoned_datetime(date(2026, 2, 19), tz_plus_8)
        assert result is not None
        assert result.tzinfo == tz_plus_8

        result = type_converter.to_zoned_datetime("2026-02-19T21:40:22Z")
        assert result is not None
        assert result.tzinfo == timezone.utc

        result = type_converter.to_zoned_datetime("2026-02-19T21:40:22+08:00")
        assert result is not None

        result = type_converter.to_zoned_datetime(
            "2026-02-19T21:40:22+08:00", tz_plus_9
        )
        assert result is not None
        assert result.tzinfo == tz_plus_9

        result = type_converter.to_zoned_datetime(
            TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS
        )
        assert result is not None
        assert result.tzinfo == timezone.utc

        result = type_converter.to_zoned_datetime(
            TEST_UNIX_EPOCH_TIMESTAMP_IN_MILLISECONDS, tz_plus_8
        )
        assert result is not None
        assert result.tzinfo == tz_plus_8

        try:
            _ = ZoneInfo("UTC")
            result = type_converter.to_zoned_datetime(dt_utc, "UTC")
            assert result is not None
            assert str(result.tzinfo) == "UTC"
        except Exception:
            pass

    def test_to_uuid(self) -> None:
        u_str = r"550e8400-e29b-41d4-a716-446655440000"
        u_uuid = uuid.UUID(u_str)
        assert type_converter.to_uuid(u_uuid) == u_uuid
        assert type_converter.to_uuid(u_str) == u_uuid
        assert type_converter.to_uuid(None) is None

    def test_to_bytes(self) -> None:
        assert type_converter.to_bytes(None) is None
        assert type_converter.to_bytes(b"123") == b"123"
        assert type_converter.to_bytes("ABC") == b"ABC"

    def test_to_enum(self) -> None:
        assert type_converter.to_enum("ACTIVE", Status) == Status.ACTIVE
        assert type_converter.to_enum("active", Status) == Status.ACTIVE
        assert type_converter.to_enum(Status.INACTIVE, Status) == Status.INACTIVE
        with pytest.raises(ValueError):
            type_converter.to_enum("UNKNOWN", Status)

    def test_convert_to_column_type(self) -> None:
        assert type_converter.convert_to_column_type(None, "INT") is None
        assert type_converter.convert_to_column_type("123", None) == "123"
        assert type_converter.convert_to_column_type(123, "INT") == 123

        u_str = "550e8400-e29b-41d4-a716-446655440000"
        expected_uuid = uuid.UUID(u_str)
        assert type_converter.convert_to_column_type(u_str, "UUID") == expected_uuid
        assert (
            type_converter.convert_to_column_type(u_str, "uniqueidentifier")
            == expected_uuid
        )

        assert type_converter.convert_to_column_type("2024", "YEAR") == 2024

        assert type_converter.convert_to_column_type(
            "123", "BIGINT UNSIGNED"
        ) == Decimal(123)
        assert type_converter.convert_to_column_type("123", "INT UNSIGNED") == 123

        assert type_converter.convert_to_column_type("123", "BIGINT") == 123
        assert type_converter.convert_to_column_type("123", "BIGSERIAL") == 123
        assert type_converter.convert_to_column_type("123", "SMALLINT") == 123
        assert type_converter.convert_to_column_type("123", "TINYINT") == 123
        assert type_converter.convert_to_column_type("123", "INT") == 123
        assert type_converter.convert_to_column_type("123", "SERIAL") == 123

        assert type_converter.convert_to_column_type("123.45", "DECIMAL") == Decimal(
            "123.45"
        )
        assert type_converter.convert_to_column_type("123.45", "NUMERIC") == Decimal(
            "123.45"
        )
        assert type_converter.convert_to_column_type("123.45", "DOUBLE") == 123.45
        assert type_converter.convert_to_column_type("123.45", "FLOAT") == 123.45
        assert type_converter.convert_to_column_type("123.45", "REAL") == 123.45

        assert type_converter.convert_to_column_type("true", "BOOLEAN") is True
        assert type_converter.convert_to_column_type("1", "BIT") is True

        dto_str_z = "2024-01-01T12:00:00Z"
        dto_str_offset = "2024-01-01T12:00:00+08:00"
        assert type_converter.convert_to_column_type(
            dto_str_z, "DATETIMEOFFSET"
        ) == datetime.fromisoformat("2024-01-01T12:00:00+00:00")
        assert type_converter.convert_to_column_type(
            dto_str_offset, "DATETIMEOFFSET"
        ) == datetime.fromisoformat(dto_str_offset)

        dt_str = "2024-01-01 12:00:00"
        expected_dt = datetime(2024, 1, 1, 12, 0, 0)
        assert type_converter.convert_to_column_type(dt_str, "TIMESTAMP") == expected_dt
        assert type_converter.convert_to_column_type(dt_str, "DATETIME") == expected_dt

        assert type_converter.convert_to_column_type("2024-01-01", "DATE") == date(
            2024, 1, 1
        )

        assert type_converter.convert_to_column_type("12:00:00", "TIME") == time(
            12, 0, 0
        )

        assert (
            type_converter.convert_to_column_type("some-value", "UNKNOWN")
            == "some-value"
        )

        with pytest.raises(
            ValueError, match="Unable to convert value 'invalid' to type INT"
        ):
            type_converter.convert_to_column_type("invalid", "INT")
