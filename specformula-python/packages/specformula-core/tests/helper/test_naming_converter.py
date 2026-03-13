from specformula.core.helper import naming_converter


class TestNamingConverter:
    """Tests for the naming_converter utility module."""

    def test_camel_to_snake(self) -> None:
        assert naming_converter.camel_to_snake("managerId") == "manager_id"
        assert naming_converter.camel_to_snake("userId") == "user_id"
        assert (
            naming_converter.camel_to_snake("someLongVariableName")
            == "some_long_variable_name"
        )
        assert naming_converter.camel_to_snake("already_snake") == "already_snake"
        assert naming_converter.camel_to_snake(None) is None

    def test_snake_to_camel(self) -> None:
        assert naming_converter.snake_to_camel("manager_id") == "managerId"
        assert naming_converter.snake_to_camel("user_id") == "userId"
        assert (
            naming_converter.snake_to_camel("some_long_variable_name")
            == "someLongVariableName"
        )
        assert naming_converter.snake_to_camel("alreadyCamel") == "alreadyCamel"
        assert naming_converter.snake_to_camel(None) is None
        assert naming_converter.snake_to_camel("") == ""

    def test_get_row_value(self) -> None:
        row = {"managerId": "123", "user_id": "456"}

        # Test finding snake_case key directly
        assert naming_converter.get_row_value(row, "user_id") == "456"

        # Test finding camelCase key via snake_case argument
        assert naming_converter.get_row_value(row, "manager_id") == "123"

        # Test non-existent key
        assert naming_converter.get_row_value(row, "nonExistent") is None

    def test_to_camel_case_keys(self) -> None:
        snake_map = {"user_id": 1, "manager_id": 2}
        expected = {"userId": 1, "managerId": 2}
        assert naming_converter.to_camel_case_keys(snake_map) == expected
