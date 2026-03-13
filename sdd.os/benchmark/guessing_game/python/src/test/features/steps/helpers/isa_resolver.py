"""ISA Feature Argument Resolver for Python Behave tests.

This module provides the Python implementation of ISAFeatureArgumentResolver,
porting the functionality from the Java version in agent_hr_system.

It integrates three systems:
- VAR-System: Variable management with >, <, $ symbols
- CAS-System: Constraint assertion with &constraint(params) syntax
- TIME-System: Time expression conversion with @time and @localTime

Reference: benchmark/agent_hr_system/.../ISAFeatureArgumentResolver.java
"""

import re
from datetime import datetime, timedelta
from datetime import time as datetime_time
from decimal import Decimal
from typing import Any


class ISAFeatureArgumentResolver:
    """Resolves ISA-Gherkin special syntax for variable, constraint, and time handling.

    This class is the Python equivalent of Java's ISAFeatureArgumentResolver,
    adapted to work with Behave's context system instead of Spring's dependency injection.

    Usage in Behave steps:
        resolver = ISAFeatureArgumentResolver(context)
        resolved_value = resolver.resolve_and_validate(expected, actual, field_name, entity_name)
    """

    def __init__(self, context):
        """Initialize resolver with Behave context.

        Args:
            context: Behave scenario context (equivalent to Java's ScenarioContext)
        """
        self.context = context
        self._variables: dict[str, Any] = {}  # Variable storage

    # ============================================================================
    # VAR-System: Variable Management (>, <, $)
    # ============================================================================

    def parse_context_keys(self, headers: list[str]) -> dict[int, str]:
        """Parse >contextKey from table headers.

        Example:
            headers = ["gameId", ">savedGameId", "status"]
            returns = {1: "savedGameId"}

        Args:
            headers: List of column headers from Gherkin DataTable

        Returns:
            Mapping of column index to context key name
        """
        context_key_map = {}
        for i, header in enumerate(headers):
            if header and header.startswith(">"):
                context_key = header[1:]  # Remove > prefix
                context_key_map[i] = context_key
        return context_key_map

    def extract_and_store_variables(
        self, row: list[str], context_key_map: dict[int, str], execution_result: Any
    ) -> None:
        """Extract <executionKey values and store to context variables.

        Example:
            headers = ["gameId", ">savedGameId"]
            row = ["G001", "<id"]
            execution_result = {"id": "G001", "status": "Active"}
            → stores context["savedGameId"] = "G001"

        Args:
            row: Data row from Gherkin DataTable
            context_key_map: Mapping from parse_context_keys()
            execution_result: Result object (dict or object with attributes)
        """
        # Convert execution_result to dict if it's an object
        if isinstance(execution_result, dict):
            result_dict = execution_result
        else:
            result_dict = (
                vars(execution_result) if hasattr(execution_result, "__dict__") else {}
            )

        for col_index, context_key in context_key_map.items():
            if col_index < len(row):
                execution_key = row[col_index]
                if execution_key and execution_key.startswith("<"):
                    field_name = execution_key[1:]  # Remove < prefix

                    # Support dot notation: <result.a
                    if "." in field_name:
                        value = self._get_nested_value(result_dict, field_name)
                    else:
                        value = result_dict.get(field_name)

                    if value is not None:
                        self._variables[context_key] = value
                        # Also store in Behave context for compatibility
                        setattr(self.context, context_key, value)

    def resolve_variable(self, value: str) -> Any:
        """Resolve $variableName to actual value.

        Example:
            context has savedGameId = "G001"
            resolve_variable("$savedGameId") → "G001"
            resolve_variable("G001") → "G001" (no change)

        Args:
            value: Value string that may contain $variable reference

        Returns:
            Resolved value (from context) or original value
        """
        if not isinstance(value, str):
            return value

        if value.startswith("$"):
            var_name = value[1:]  # Remove $ prefix

            # Check internal storage first
            if var_name in self._variables:
                return self._variables[var_name]

            # Check Behave context (handle Mock objects carefully)
            try:
                if hasattr(self.context, var_name):
                    context_value = getattr(self.context, var_name)
                    # Skip Mock objects and internal attributes
                    if context_value is not None and not str(
                        type(context_value)
                    ).startswith("<class 'unittest.mock"):
                        return context_value
            except (AttributeError, TypeError):
                pass

            # Variable not found - raise error
            raise ValueError(f"Variable ${var_name} not found in context")

        return value

    # ============================================================================
    # CAS-System: Constraint Assertion (&constraint)
    # ============================================================================

    def evaluate_constraints(self, constraint_string: str, actual_value: Any) -> bool:
        """Evaluate constraint assertions on actual value.

        Example:
            evaluate_constraints("&gt(10)&lt(100)", 50) → True
            evaluate_constraints("&contains(hello)", "hello world") → True
            evaluate_constraints("&isNotNull", None) → False

        Args:
            constraint_string: Constraint expression like "&gt(10)&lt(100)"
            actual_value: Actual value to validate

        Returns:
            True if all constraints pass

        Raises:
            AssertionError: If any constraint fails
        """
        constraints = self._parse_constraints(constraint_string)

        for constraint_name, params in constraints:
            if not self._evaluate_single_constraint(
                constraint_name, params, actual_value
            ):
                raise AssertionError(
                    f"Constraint &{constraint_name}({','.join(params)}) failed for value: {actual_value}"
                )

        return True

    def _parse_constraints(self, constraint_string: str) -> list[tuple[str, list[str]]]:
        """Parse constraint string into list of (name, params) tuples.

        Supports nested parentheses in parameters (e.g., @time(now-1d)).

        Example:
            "&gt(10)&lt(100)" → [("gt", ["10"]), ("lt", ["100"])]
            "&contains(hello)" → [("contains", ["hello"])]
            "&isNotNull" → [("isNotNull", [])]
            "&after(@time(now-1d))" → [("after", ["@time(now-1d)"])]
        """
        constraints = []
        i = 0
        while i < len(constraint_string):
            if constraint_string[i] == "&":
                # Found start of constraint
                i += 1  # Skip &

                # Extract constraint name
                name_start = i
                while i < len(constraint_string) and constraint_string[i].isalnum():
                    i += 1
                constraint_name = constraint_string[name_start:i]

                # Check if there are parameters
                if i < len(constraint_string) and constraint_string[i] == "(":
                    i += 1  # Skip (

                    # Extract parameters (handle nested parentheses)
                    paren_depth = 1
                    param_start = i
                    while i < len(constraint_string) and paren_depth > 0:
                        if constraint_string[i] == "(":
                            paren_depth += 1
                        elif constraint_string[i] == ")":
                            paren_depth -= 1
                        if paren_depth > 0:
                            i += 1

                    params_str = constraint_string[param_start:i]
                    params = [p.strip() for p in params_str.split(",")]
                    i += 1  # Skip closing )
                else:
                    params = []

                constraints.append((constraint_name, params))
            else:
                i += 1

        return constraints

    def _evaluate_single_constraint(
        self, constraint_name: str, params: list[str], actual_value: Any
    ) -> bool:
        """Evaluate a single constraint against actual value.

        Supports 30+ constraint types from Java implementation.

        Parameters are resolved before evaluation to support:
        - $variable references (VAR-System)
        - @time(...) expressions (TIME-System)
        - @localTime(...) expressions (TIME-System)
        """
        # Resolve all parameters first (VAR-System + TIME-System integration)
        resolved_params = []
        for param in params:
            resolved_param = self._resolve_constraint_parameter(param)
            resolved_params.append(resolved_param)

        # Use resolved_params instead of params for all evaluations
        params = resolved_params

        # Numerical comparisons
        if constraint_name == "eq":
            return self._to_number(actual_value) == self._to_number(params[0])
        elif constraint_name == "ne":
            return self._to_number(actual_value) != self._to_number(params[0])
        elif constraint_name == "gt":
            return self._to_number(actual_value) > self._to_number(params[0])
        elif constraint_name == "lt":
            return self._to_number(actual_value) < self._to_number(params[0])
        elif constraint_name == "ge":
            return self._to_number(actual_value) >= self._to_number(params[0])
        elif constraint_name == "le":
            return self._to_number(actual_value) <= self._to_number(params[0])

        # Type checking
        elif constraint_name == "isNull":
            return actual_value is None
        elif constraint_name == "isNotNull":
            return actual_value is not None
        elif constraint_name == "isNum":
            return isinstance(actual_value, (int, float, Decimal))
        elif constraint_name == "isStr":
            return isinstance(actual_value, str)
        elif constraint_name == "isBool":
            return isinstance(actual_value, bool)

        # String operations
        elif constraint_name == "contains":
            return params[0] in str(actual_value)
        elif constraint_name == "startsWith":
            return str(actual_value).startswith(params[0])
        elif constraint_name == "endsWith":
            return str(actual_value).endswith(params[0])
        elif constraint_name == "matches":
            return re.match(params[0], str(actual_value)) is not None
        elif constraint_name == "length":
            return len(str(actual_value)) == int(params[0])

        # Collection operations
        elif constraint_name == "hasItem":
            # Try to convert param to match collection item type
            target = params[0]
            # Try int first
            try:
                target_int = int(target)
                if target_int in actual_value:
                    return True
            except (ValueError, TypeError):
                pass
            # Try string match
            return target in actual_value
        elif constraint_name == "size":
            return len(actual_value) == int(params[0])
        elif constraint_name == "isEmpty":
            return len(actual_value) == 0
        elif constraint_name == "isNotEmpty":
            return len(actual_value) > 0

        # Range operations
        elif constraint_name == "between":
            val = self._to_number(actual_value)
            return self._to_number(params[0]) <= val <= self._to_number(params[1])
        elif constraint_name == "oneOf":
            return str(actual_value) in params
        elif constraint_name == "noneOf":
            return str(actual_value) not in params

        # Time operations (basic implementation)
        elif constraint_name == "before":
            return self._to_timestamp(actual_value) < self._to_timestamp(params[0])
        elif constraint_name == "after":
            return self._to_timestamp(actual_value) > self._to_timestamp(params[0])
        elif constraint_name == "sameDay":
            dt1 = datetime.fromtimestamp(self._to_timestamp(actual_value) / 1000)
            dt2 = datetime.fromtimestamp(self._to_timestamp(params[0]) / 1000)
            return dt1.date() == dt2.date()
        elif constraint_name == "withinDays":
            dt1 = datetime.fromtimestamp(self._to_timestamp(actual_value) / 1000)
            dt2 = datetime.fromtimestamp(self._to_timestamp(params[0]) / 1000)
            days_diff = abs((dt1 - dt2).days)
            return days_diff <= int(params[1])

        else:
            raise ValueError(f"Unknown constraint: &{constraint_name}")

    # ============================================================================
    # TIME-System: Time Expression Conversion
    # ============================================================================

    def parse_time_expression(self, expr: str) -> int:
        """Parse @time(...) expression to Unix timestamp (milliseconds).

        Supports:
        - ISO 8601: "2025-12-13T10:30:00"
        - Date only: "2025-12-13"
        - Relative time: "now", "now-1d", "now+2h"

        Example:
            parse_time_expression("now") → 1702468200000
            parse_time_expression("now-1d") → 1702381800000
            parse_time_expression("2025-12-13") → 1702425600000

        Args:
            expr: Time expression string

        Returns:
            Unix timestamp in milliseconds
        """
        cleaned = expr.strip().strip('"')

        # Handle relative time
        if cleaned == "now":
            return int(datetime.now().timestamp() * 1000)

        if cleaned.startswith("now"):
            return self._parse_relative_time(cleaned)

        # Handle ISO 8601 datetime
        if "T" in cleaned:
            dt = datetime.fromisoformat(cleaned)
            return int(dt.timestamp() * 1000)

        # Handle date only (assume start of day)
        dt = datetime.strptime(cleaned, "%Y-%m-%d")
        return int(dt.timestamp() * 1000)

    def parse_local_time_expression(self, expr: str) -> datetime_time:
        """Parse @localTime(...) expression to time object.

        Example:
            parse_local_time_expression("10:30:00") → time(10, 30, 0)
            parse_local_time_expression("14:45") → time(14, 45, 0)

        Args:
            expr: Time expression string (HH:MM:SS or HH:MM format)

        Returns:
            datetime.time object
        """
        cleaned = expr.strip().strip('"')

        # Try HH:MM:SS format
        if cleaned.count(":") == 2:
            return datetime.strptime(cleaned, "%H:%M:%S").time()

        # Try HH:MM format
        return datetime.strptime(cleaned, "%H:%M").time()

    def _parse_relative_time(self, expr: str) -> int:
        """Parse relative time expression like 'now-1d' or 'now+2h'.

        Supported units: d (days), h (hours), m (minutes), s (seconds)
        """
        pattern = r"now([+-])(\d+)([dhms])"
        match = re.match(pattern, expr)

        if not match:
            raise ValueError(f"Invalid relative time expression: {expr}")

        operator = match.group(1)
        amount = int(match.group(2))
        unit = match.group(3)

        now = datetime.now()

        # Convert to timedelta
        if unit == "d":
            delta = timedelta(days=amount)
        elif unit == "h":
            delta = timedelta(hours=amount)
        elif unit == "m":
            delta = timedelta(minutes=amount)
        elif unit == "s":
            delta = timedelta(seconds=amount)
        else:
            raise ValueError(f"Unknown time unit: {unit}")

        # Apply operator
        if operator == "+":
            result = now + delta
        else:
            result = now - delta

        return int(result.timestamp() * 1000)

    # ============================================================================
    # Unified Entry Point (integrates VAR + CAS + TIME)
    # ============================================================================

    def resolve_and_validate(
        self,
        expected_value: str,
        actual_value: Any,
        field_name: str = "",
        entity_name: str = "",
    ) -> Any:
        """Unified entry point that integrates VAR, CAS, and TIME systems.

        This is the main method to use in Behave step definitions.

        Processing order:
        1. Handle $notnull special value
        2. Resolve variables ($variable)
        3. Evaluate constraints if contains &
        4. Auto-convert TIME (@time, @localTime)
        5. Auto-convert numbers (int ↔ float)
        6. Return resolved value for traditional validation

        Example:
            # Variable resolution
            resolve_and_validate("$savedGameId", "G001", "gameId") → "G001"

            # Constraint validation
            resolve_and_validate("&gt(10)", 50, "score") → 50 (passes)

            # Time conversion
            resolve_and_validate("@time(now)", 1702468200000, "timestamp") → 1702468200000

        Args:
            expected_value: Expected value from Gherkin DataTable (may contain ISA syntax)
            actual_value: Actual value from API/database
            field_name: Field name for error messages
            entity_name: Entity name for error messages

        Returns:
            Resolved expected value for comparison

        Raises:
            AssertionError: If constraint validation fails
        """
        # Handle $notnull special value
        if expected_value == "$notnull":
            if actual_value is None:
                raise AssertionError(f"{entity_name}.{field_name} should not be null")
            return actual_value

        # Resolve variables
        if isinstance(expected_value, str) and expected_value.startswith("$"):
            expected_value = self.resolve_variable(expected_value)

        # Evaluate constraints
        if self.is_constraint_expression(expected_value):
            self.evaluate_constraints(expected_value, actual_value)
            return actual_value

        # Auto-convert TIME expressions
        if isinstance(expected_value, str):
            if expected_value.startswith("@time("):
                time_expr = expected_value[6:-1]  # Remove @time( and )
                expected_value = self.parse_time_expression(time_expr)
            elif expected_value.startswith("@localTime("):
                time_expr = expected_value[11:-1]  # Remove @localTime( and )
                expected_value = self.parse_local_time_expression(time_expr)

        # Auto-convert numbers for comparison
        if isinstance(expected_value, str) and re.match(
            r"^-?\d+(\.\d+)?$", expected_value
        ):
            if "." in expected_value:
                expected_value = float(expected_value)
            else:
                expected_value = int(expected_value)

        return expected_value

    # ============================================================================
    # Helper Methods
    # ============================================================================

    def _resolve_constraint_parameter(self, param: str) -> Any:
        """Resolve constraint parameter supporting VAR and TIME systems.

        This method mirrors Java's resolveValue() method, enabling constraints
        to use variables and time expressions in their parameters.

        Examples:
            _resolve_constraint_parameter("$minScore") → 50 (from context)
            _resolve_constraint_parameter("@time(now-1d)") → 1702381800000
            _resolve_constraint_parameter("100") → "100" (literal)

        Args:
            param: Parameter string that may contain VAR/TIME syntax

        Returns:
            Resolved parameter value
        """
        if not isinstance(param, str):
            return param

        param = param.strip()

        # TIME-System: Handle @time(...) format
        if param.startswith("@time(") and param.endswith(")"):
            time_expr = param[6:-1]  # Remove @time( and )
            return self.parse_time_expression(time_expr)

        # TIME-System: Handle @localTime(...) format
        if param.startswith("@localTime(") and param.endswith(")"):
            time_expr = param[11:-1]  # Remove @localTime( and )
            return self.parse_local_time_expression(time_expr)

        # Remove quotes if present
        is_quoted = False
        if (param.startswith('"') and param.endswith('"')) or (
            param.startswith("'") and param.endswith("'")
        ):
            param = param[1:-1]
            is_quoted = True

        # VAR-System: Handle $variable (only if not quoted)
        if not is_quoted and param.startswith("$"):
            return self.resolve_variable(param)

        # Return literal value
        return param

    def is_constraint_expression(self, value: Any) -> bool:
        """Return True if value string should be treated as CAS constraint.

        Constraints must:
        - Be a string
        - Start with '&' after trimming leading whitespace
        - Have a second character that is an alphabet (constraint name)
        """
        if not isinstance(value, str):
            return False

        stripped = value.lstrip()
        if not stripped.startswith("&"):
            return False
        if len(stripped) < 2:
            return False

        return stripped[1].isalpha()

    def _to_number(self, value: Any) -> float:
        """Convert value to number for comparison."""
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, str):
            return float(value)
        raise ValueError(f"Cannot convert to number: {value}")

    def _to_timestamp(self, value: Any) -> int:
        """Convert value to Unix timestamp (milliseconds)."""
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            # Try parsing as time expression (but not if it's already been partially parsed)
            if value.startswith("@time("):
                # Already a @time expression, parse it
                return self.parse_time_expression(value)
            # Otherwise assume it's a plain time expression
            return self.parse_time_expression(value)
        if isinstance(value, datetime):
            return int(value.timestamp() * 1000)
        raise ValueError(f"Cannot convert to timestamp: {value}")

    def _get_nested_value(self, obj: dict, path: str) -> Any:
        """Get nested value from dict using dot notation.

        Example:
            _get_nested_value({"result": {"a": 2}}, "result.a") → 2
        """
        keys = path.split(".")
        value = obj
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                value = getattr(value, key, None)
            if value is None:
                return None
        return value
