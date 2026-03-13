"""Behave step definitions package with auto-import of nested modules."""

import pkgutil
import sys
from importlib import import_module
from pathlib import Path


def _discover_package_prefix(base_dir: Path) -> str:
    """Find the dotted module prefix for the steps package."""
    base_dir = base_dir.resolve()
    for entry in map(Path, sys.path):
        try:
            relative = base_dir.relative_to(entry.resolve())
        except (ValueError, RuntimeError):
            continue

        parts = [p for p in relative.parts if p not in (".", "")]
        if parts:
            return ".".join(parts)

    raise RuntimeError(
        f"Unable to determine package prefix for step directory: {base_dir}"
    )


def _import_all_step_modules() -> None:
    """Recursively import every step module so Behave can register them."""
    package_path = Path(__file__).parent
    package_prefix = _discover_package_prefix(package_path)

    for _, module_name, _ in pkgutil.walk_packages(
        [str(package_path)],
        prefix=f"{package_prefix}.",
    ):
        if module_name.endswith(".__pycache__"):
            continue

        try:
            import_module(module_name)
        except Exception as exc:  # pragma: no cover - fail fast during startup
            raise RuntimeError(f"Failed to import step module '{module_name}'") from exc


_import_all_step_modules()
