"""Unit tests for ISA Feature Argument Resolver.

Tests the VAR, CAS, and TIME systems in isolation and integration.
"""

# Add src to path for imports
import sys
from datetime import datetime, timedelta
from datetime import time as datetime_time
from pathlib import Path
from unittest.mock import Mock

import pytest

sys.path.insert(0, str(Path(__file__).parent / "src"))

from test.features.steps.helpers.isa_resolver import ISAFeatureArgumentResolver


class MockContext:
    """Lightweight context object for tests that need attribute assignment."""

    def __init__(self):
        self._storage = {}

    def __getattr__(self, item):
        if item in self.__dict__:
            return self.__dict__[item]
        return self._storage.get(item)

    def __setattr__(self, key, value):
        if key in {"_storage"}:
            super().__setattr__(key, value)
        else:
            self._storage[key] = value


class TestVARSystem:
    """Test Variable Management System (>, <, $)"""

    def test_parse_context_keys(self):
        """Test parsing >contextKey from headers"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        headers = ["gameId", ">savedGameId", "status", ">savedStatus"]
        result = resolver.parse_context_keys(headers)

        assert result == {1: "savedGameId", 3: "savedStatus"}

    def test_extract_and_store_variables_from_dict(self):
        """Test extracting <executionKey from result dict"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        _headers = ["gameId", ">savedGameId"]
        context_key_map = {1: "savedGameId"}
        row = ["G001", "<id"]
        execution_result = {"id": "G001", "status": "Active"}

        resolver.extract_and_store_variables(row, context_key_map, execution_result)

        assert resolver._variables["savedGameId"] == "G001"

    def test_extract_nested_value(self):
        """Test extracting nested value like <result.a"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        context_key_map = {0: "savedA"}
        row = ["<result.a"]
        execution_result = {"result": {"a": 2, "b": 1}}

        resolver.extract_and_store_variables(row, context_key_map, execution_result)

        assert resolver._variables["savedA"] == 2

    def test_resolve_variable(self):
        """Test resolving $variable reference"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        resolver._variables["savedGameId"] = "G001"

        assert resolver.resolve_variable("$savedGameId") == "G001"
        assert resolver.resolve_variable("G001") == "G001"  # No change

    def test_resolve_variable_not_found(self):
        """Test error when variable not found"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        with pytest.raises(ValueError, match="Variable \\$unknownVar not found"):
            resolver.resolve_variable("$unknownVar")


class TestCASSystem:
    """Test Constraint Assertion System (&constraint)"""

    def test_numerical_constraints(self):
        """Test numerical comparison constraints"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.evaluate_constraints("&gt(10)", 20)
        assert resolver.evaluate_constraints("&lt(100)", 50)
        assert resolver.evaluate_constraints("&ge(10)", 10)
        assert resolver.evaluate_constraints("&le(10)", 10)
        assert resolver.evaluate_constraints("&eq(50)", 50)
        assert resolver.evaluate_constraints("&ne(100)", 50)

    def test_multiple_constraints(self):
        """Test multiple constraints combined"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        # Value 50 should be > 10 AND < 100
        assert resolver.evaluate_constraints("&gt(10)&lt(100)", 50)

    def test_type_checking_constraints(self):
        """Test type checking constraints"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.evaluate_constraints("&isNotNull", "value")
        assert resolver.evaluate_constraints("&isNull", None)
        assert resolver.evaluate_constraints("&isNum", 42)
        assert resolver.evaluate_constraints("&isStr", "hello")
        assert resolver.evaluate_constraints("&isBool", True)

    def test_string_constraints(self):
        """Test string operation constraints"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.evaluate_constraints("&contains(hello)", "hello world")
        assert resolver.evaluate_constraints("&startsWith(hello)", "hello world")
        assert resolver.evaluate_constraints("&endsWith(world)", "hello world")
        assert resolver.evaluate_constraints("&length(11)", "hello world")
        assert resolver.evaluate_constraints("&matches(^hello)", "hello world")

    def test_collection_constraints(self):
        """Test collection operation constraints"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.evaluate_constraints("&hasItem(2)", [1, 2, 3])
        assert resolver.evaluate_constraints("&size(3)", [1, 2, 3])
        assert resolver.evaluate_constraints("&isEmpty", [])
        assert resolver.evaluate_constraints("&isNotEmpty", [1, 2, 3])

    def test_range_constraints(self):
        """Test range operation constraints"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.evaluate_constraints("&between(10,100)", 50)
        assert resolver.evaluate_constraints("&oneOf(A,B,C)", "B")
        assert resolver.evaluate_constraints("&noneOf(X,Y,Z)", "A")

    def test_constraint_failure(self):
        """Test constraint failure raises AssertionError"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        with pytest.raises(AssertionError, match="Constraint .* failed"):
            resolver.evaluate_constraints("&gt(100)", 50)

    def test_constraint_with_variable_parameter(self):
        """Test constraint with $variable in parameter (Problem 2 fix)"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        # Set up variable in context
        resolver._variables["minScore"] = 50

        # Should resolve $minScore to 50, then evaluate 75 > 50
        assert resolver.evaluate_constraints("&gt($minScore)", 75)

        # Should fail: 30 is not > 50
        with pytest.raises(AssertionError):
            resolver.evaluate_constraints("&gt($minScore)", 30)

    def test_constraint_with_time_parameter(self):
        """Test constraint with @time(...) in parameter (Problem 2 fix)"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        # Get a timestamp from 2 days ago
        two_days_ago = int((datetime.now() - timedelta(days=2)).timestamp() * 1000)

        # Current time should be after 2 days ago
        assert resolver.evaluate_constraints(
            "&after(@time(now-2d))", two_days_ago + 100000
        )

        # 3 days ago should not be after 2 days ago
        three_days_ago = int((datetime.now() - timedelta(days=3)).timestamp() * 1000)
        with pytest.raises(AssertionError):
            resolver.evaluate_constraints("&after(@time(now-2d))", three_days_ago)

    def test_constraint_with_multiple_var_parameters(self):
        """Test constraint with multiple variables (between)"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        # Set up variables
        resolver._variables["minValue"] = 10
        resolver._variables["maxValue"] = 100

        # Should resolve both variables and evaluate 50 between 10 and 100
        assert resolver.evaluate_constraints("&between($minValue,$maxValue)", 50)

        # Should fail: 5 is not between 10 and 100
        with pytest.raises(AssertionError):
            resolver.evaluate_constraints("&between($minValue,$maxValue)", 5)


class TestTIMESystem:
    """Test Time Expression Conversion System (@time, @localTime)"""

    def test_parse_now(self):
        """Test parsing 'now' to current timestamp"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_time_expression("now")
        now = int(datetime.now().timestamp() * 1000)

        # Should be within 1 second
        assert abs(result - now) < 1000

    def test_parse_relative_time_past(self):
        """Test parsing 'now-1d' (1 day ago)"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_time_expression("now-1d")
        expected = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)

        # Should be within 1 second
        assert abs(result - expected) < 1000

    def test_parse_relative_time_future(self):
        """Test parsing 'now+2h' (2 hours later)"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_time_expression("now+2h")
        expected = int((datetime.now() + timedelta(hours=2)).timestamp() * 1000)

        # Should be within 1 second
        assert abs(result - expected) < 1000

    def test_parse_date_only(self):
        """Test parsing date like '2025-12-13'"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_time_expression("2025-12-13")
        expected = int(datetime(2025, 12, 13).timestamp() * 1000)

        assert result == expected

    def test_parse_iso_datetime(self):
        """Test parsing ISO 8601 datetime"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_time_expression("2025-12-13T10:30:00")
        expected = int(datetime(2025, 12, 13, 10, 30, 0).timestamp() * 1000)

        assert result == expected

    def test_parse_local_time_with_seconds(self):
        """Test parsing LocalTime with seconds"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_local_time_expression("10:30:45")

        assert result == datetime_time(10, 30, 45)

    def test_parse_local_time_without_seconds(self):
        """Test parsing LocalTime without seconds"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.parse_local_time_expression("14:45")

        assert result == datetime_time(14, 45, 0)


class TestIntegration:
    """Test integrated VAR + CAS + TIME functionality"""

    def test_resolve_and_validate_with_variable(self):
        """Test resolve_and_validate with $variable"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        resolver._variables["savedGameId"] = "G001"
        result = resolver.resolve_and_validate("$savedGameId", "G001", "gameId")

        assert result == "G001"

    def test_resolve_and_validate_with_constraint(self):
        """Test resolve_and_validate with constraint"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.resolve_and_validate("&gt(10)&lt(100)", 50, "score")

        assert result == 50  # Returns actual value after validation

    def test_resolve_and_validate_with_notnull(self):
        """Test resolve_and_validate with $notnull"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.resolve_and_validate("$notnull", "value", "field")

        assert result == "value"

    def test_resolve_and_validate_notnull_fails(self):
        """Test $notnull fails on None"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        with pytest.raises(AssertionError, match="should not be null"):
            resolver.resolve_and_validate("$notnull", None, "field", "Game")

    def test_resolve_and_validate_with_time(self):
        """Test resolve_and_validate with @time expression"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        result = resolver.resolve_and_validate("@time(2025-12-13)", None, "timestamp")
        expected = int(datetime(2025, 12, 13).timestamp() * 1000)

        assert result == expected

    def test_auto_number_conversion(self):
        """Test automatic number conversion"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        assert resolver.resolve_and_validate("42", 42, "score") == 42
        assert resolver.resolve_and_validate("3.14", 3.14, "pi") == 3.14

    def test_complex_workflow(self):
        """Test complex workflow: extract variable → use in constraint"""
        context = Mock()
        resolver = ISAFeatureArgumentResolver(context)

        # Step 1: Extract variable from API response
        _headers = [">savedScore"]
        context_key_map = {0: "savedScore"}
        row = ["<score"]
        api_response = {"score": 85}

        resolver.extract_and_store_variables(row, context_key_map, api_response)

        # Step 2: Use variable in next step
        expected_score = resolver.resolve_variable("$savedScore")
        assert expected_score == 85

        # Step 3: Validate with constraint
        result = resolver.resolve_and_validate(
            "&gt(50)&lt(100)", expected_score, "score"
        )
        assert result == 85

    def test_ampersand_in_normal_string_not_treated_as_constraint(self):
        """Test that strings containing & but not starting with & are treated as normal strings."""
        context = MockContext()
        resolver = ISAFeatureArgumentResolver(context)

        # Case 1: String with & in the middle (e.g., "R&D Labs")
        test_value = "R&D Labs"
        result = resolver.resolve_and_validate(
            "R&D Labs", test_value, "department", "Response"
        )
        assert result == "R&D Labs", (
            "Normal string with & should be treated as literal value"
        )

        # Case 2: String with multiple & characters (e.g., "A&B&C")
        test_value = "A&B&C"
        result = resolver.resolve_and_validate("A&B&C", test_value, "code", "Response")
        assert result == "A&B&C", (
            "String with multiple & should be treated as literal value"
        )

        # Case 3: Verify that only &<alphanumeric> at start is treated as constraint
        # Valid constraint should pass
        resolver.resolve_and_validate(
            "&gt(10)", 15, "value", "Response"
        )  # Should not raise

        # Invalid: & followed by non-alphanumeric (e.g., "& hello")
        result = resolver.resolve_and_validate("& hello", "& hello", "text", "Response")
        assert result == "& hello", "& followed by space should be treated as literal"

    def test_constraint_detection_edge_cases(self):
        """Test edge cases for constraint detection logic."""
        context = MockContext()
        resolver = ISAFeatureArgumentResolver(context)

        # Case 1: Single & character (not a constraint)
        result = resolver.resolve_and_validate("&", "&", "symbol", "Response")
        assert result == "&", "Single & should be treated as literal"

        # Case 2: & at the end of string
        result = resolver.resolve_and_validate("test&", "test&", "suffix", "Response")
        assert result == "test&", "String ending with & should be treated as literal"

        # Case 3: Valid constraint syntax
        resolver.resolve_and_validate(
            "&isNotNull", "some value", "field", "Response"
        )  # Should not raise
        resolver.resolve_and_validate(
            "&contains(test)", "test data", "field", "Response"
        )  # Should not raise


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
