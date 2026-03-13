import re
from typing import Any, overload


@overload
def camel_to_snake(camel_case: None) -> None: ...


@overload
def camel_to_snake(camel_case: str) -> str: ...


def camel_to_snake(camel_case: str | None) -> str | None:
    """Convert camelCase to snake_case (e.g., managerId → manager_id).

    Args:
        camel_case: The camelCase string to convert.

    Returns:
        The converted snake_case string, or None if the input is None.

    """
    if camel_case is None:
        return None
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", camel_case).lower()


@overload
def snake_to_camel(snake: None) -> None: ...


@overload
def snake_to_camel(snake: str) -> str: ...


def snake_to_camel(snake: str | None) -> str | None:
    """Convert snake_case to camelCase (e.g., agent_id → agentId).

    Args:
        snake: The snake_case string to convert.

    Returns:
        The converted camelCase string, or None if the input is None.

    """
    if snake is None:
        return None

    parts = snake.split("_")
    if not parts:
        return ""

    # Keep the first word as is, capitalize subsequent words
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


def get_row_value(row: dict[str, str], key: str) -> str | None:
    """Retrieve a value from a DataTable row, supporting both snake_case and camelCase keys.

    Args:
        row: The DataTable row (represented as a dictionary).
        key: The snake_case key to look for.

    Returns:
        The value from the row, or None if not found.

    """
    if key in row:
        return row[key]

    camel_case = snake_to_camel(key)
    if camel_case and camel_case in row:
        return row[camel_case]

    return None


def to_camel_case_keys(snake_case_map: dict[str, Any]) -> dict[str, Any]:
    """Convert all keys in a dictionary from snake_case to camelCase.

    Args:
        snake_case_map: The dictionary with snake_case keys.

    Returns:
        A new dictionary with camelCase keys.

    """
    return {snake_to_camel(k): v for k, v in snake_case_map.items()}
