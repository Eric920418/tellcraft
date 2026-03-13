from dataclasses import dataclass, field
from typing import Any


@dataclass
class ScenarioContext:
    """A key-value storage container for the scenario lifecycle.

    An instance of ScenarioContext is held during the execution of each Cucumber Scenario.
    Created via ``SpecFormulaBackend.buildWorld()`` and cleared via ``disposeWorld()``.
    Corresponds to the Java version: ``ai.specformula.core.context.ScenarioContext``.
    """

    _last_response: Any | None = None
    context_data: dict[str, Any] = field(default_factory=dict)

    @property
    def last_response(self) -> Any | None:
        """Get or set the last response."""
        return self._last_response

    @last_response.setter
    def last_response(self, value: Any) -> None:
        self._last_response = value

    def clear(self) -> None:
        """Clear the last response."""
        self._last_response = None

    def reset(self) -> None:
        """Reset the context by clearing the last response and all context data."""
        self._last_response = None
        self.context_data.clear()

    def put(self, key: str, value: str) -> None:
        """Store a string value in the context data with the given key.

        Args:
            key: The key to store the value under.
            value: The string value to store.

        """
        self.context_data[key] = value

    def put_object(self, key: str, value: Any) -> None:
        """Store an object value in the context data.

        Args:
            key: The key to store the value under.
            value: The value to store (any type).

        """
        self.context_data[key] = value

    def get(self, key: str) -> Any | None:
        """Retrieve a value from the context data by key.

        Args:
            key: The key to retrieve.

        Returns:
            The value associated with the key, or None if not found.

        """
        return self.context_data.get(key)
