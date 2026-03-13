#!/usr/bin/env python3
import sys
import urllib.request
from collections.abc import Sequence
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, cast

GITHUB_RAW_BASE = r"https://raw.githubusercontent.com/github/gitignore/main"

# Cache for fetched templates to avoid redundant network requests
TEMPLATE_CACHE: dict[str, str] = {}


@dataclass
class GitignoreBlock:
    header: list[str] = field(default_factory=list)
    patterns: list[str] = field(default_factory=list)

    def to_content(self) -> str:
        parts: list[str] = []
        if self.header:
            parts.append("\n".join(self.header))
        if self.patterns:
            parts.append("\n".join(self.patterns))
        return "\n".join(parts)


class Language(Enum):
    TYPESCRIPT = ("Node.gitignore",)
    PYTHON = ("Python.gitignore",)
    JAVA = (
        "Java.gitignore",
        "Maven.gitignore",
    )
    CSHARP = ("VisualStudio.gitignore",)
    GO = ("Go.gitignore",)
    RUST = ("Rust.gitignore",)
    CPP = ("C++.gitignore",)


class GlobalTemplate(Enum):
    IDE = (
        "# === IDE ===\n",
        [
            ("Global/JetBrains.gitignore", "# JetBrains\n"),
            ("Global/VisualStudioCode.gitignore", "# VS Code\n"),
            ("Global/Cursor.gitignore", "# Cursor\n"),
        ],
    )
    OS = (
        "# === OS ===\n",
        [
            ("Global/macOS.gitignore", "# macOS\n"),
            ("Global/Windows.gitignore", "# Windows\n"),
            ("Global/Linux.gitignore", "# Linux\n"),
        ],
    )


DIR_MAP: dict[str, Language] = {
    "specformula-java": Language.JAVA,
    "specformula-csharp": Language.CSHARP,
    "specformula-ts": Language.TYPESCRIPT,
    "specformula-python": Language.PYTHON,
    "benchmark/todo_list/java_multi_ds": Language.JAVA,
    "benchmark/agent_hr_system/backend": Language.JAVA,
    "benchmark/agent_hr_system/frontend": Language.TYPESCRIPT,
    "benchmark/*/java": Language.JAVA,
    "benchmark/*/csharp": Language.CSHARP,
    "benchmark/*/typescript": Language.TYPESCRIPT,
    "benchmark/*/python": Language.PYTHON,
    "benchmark/*/golang": Language.GO,
}


def fetch_template(name: str) -> str | None:
    """Fetches a .gitignore template from GitHub."""
    url: str = f"{GITHUB_RAW_BASE}/{name}"
    if not url.startswith("https://"):
        print(f"Error: URL must use https scheme: {url}", file=sys.stderr)
        return None
    try:
        # S310 is audited but ignored as per project needs for simplicity.
        with urllib.request.urlopen(url, timeout=10) as response:  # noqa: S310
            # Read response and ensure it's decoded to string
            content: Any = response.read()
            if hasattr(content, "decode"):
                return str(content.decode("utf-8"))
            return str(content)
    except Exception as e:
        print(f"Error fetching {name}: {e}", file=sys.stderr)
        return None


def parse_gitignore_blocks(content: str) -> list[GitignoreBlock]:
    """Parses gitignore content into logical blocks based on headers."""
    blocks: list[GitignoreBlock] = []
    block = GitignoreBlock()
    in_pattern_section = False

    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            in_pattern_section = True
            continue
        if stripped.startswith("#"):
            if in_pattern_section and block.patterns:
                blocks.append(block)
                block = GitignoreBlock()
            block.header.append(line)
            in_pattern_section = False
        else:
            block.patterns.append(stripped)
            in_pattern_section = True

    if block.header or block.patterns:
        blocks.append(block)

    return blocks


def merge_gitignore(existing_content: str, new_content: str) -> str:
    """Merges new template with existing content, preserving custom rules."""
    existing_blocks = parse_gitignore_blocks(existing_content)
    new_blocks = parse_gitignore_blocks(new_content)

    new_patterns = {p for block in new_blocks for p in block.patterns}

    # If all new patterns are already present, do nothing
    existing_patterns = {p for block in existing_blocks for p in block.patterns}
    if new_patterns.issubset(existing_patterns):
        return existing_content

    # Keep only patterns that are not in the new template
    filtered_blocks: list[GitignoreBlock] = []
    for block in existing_blocks:
        filtered_patterns = [p for p in block.patterns if p not in new_patterns]
        if filtered_patterns:
            filtered_block = GitignoreBlock(
                header=block.header.copy(), patterns=filtered_patterns
            )
            filtered_blocks.append(filtered_block)

    if not filtered_blocks:
        return new_content

    # Ensure at least one header for the custom section
    if not any(block.header for block in filtered_blocks):
        filtered_blocks[0].header = ["# Custom"]

    merged = ""
    for block in filtered_blocks:
        if merged:
            merged += "\n\n"
        merged += block.to_content()

    merged += "\n\n" + new_content

    return merged


def merge_templates(templates: Sequence[str]) -> str | None:
    """
    Merges multiple template names into a single content string.
    Returns None if any template fails to fetch.
    """
    contents: list[str] = []
    for t in templates:
        if t not in TEMPLATE_CACHE:
            content = fetch_template(t)
            if content is None:
                return None
            TEMPLATE_CACHE[t] = content
        contents.append(f"# Source: {t}\n{TEMPLATE_CACHE[t]}")
    return "\n\n".join(contents)


def blocks_to_content(blocks: list[GitignoreBlock]) -> str:
    """Converts a list of blocks back to a single string."""
    return "\n\n".join(
        block.to_content() for block in blocks if block.to_content().strip()
    )


def fetch_gitignore_blocks(lang: Language) -> list[GitignoreBlock] | None:
    """Fetches and parses blocks for a specific language."""
    content = merge_templates(cast(Sequence[str], lang.value))
    if content is None:
        return None
    return parse_gitignore_blocks(content)


def load_global_template_blocks() -> list[GitignoreBlock] | None:
    """Loads and parses blocks for global IDE and OS templates."""
    all_blocks: list[GitignoreBlock] = []
    for template in GlobalTemplate:
        value: Any = template.value
        category_header: str = str(value[0])
        templates: list[tuple[str, str]] = cast(list[tuple[str, str]], value[1])

        section_content = category_header
        for path, header in templates:
            if path not in TEMPLATE_CACHE:
                content = fetch_template(path)
                if content is None:
                    return None
                TEMPLATE_CACHE[path] = content
            content = TEMPLATE_CACHE[path]
            section_content += f"# Source: {path}\n" + str(header) + content + "\n"
        all_blocks.extend(parse_gitignore_blocks(section_content))
    return all_blocks


def resolve_dirs(project_root: Path) -> dict[Path, Language]:
    """Resolves directory patterns to their corresponding languages."""
    return {
        matched: lang
        for pattern, lang in DIR_MAP.items()
        for matched in project_root.glob(pattern)
        if matched.is_dir()
    }


def update_gitignore(
    gitignore_path: Path, new_blocks: list[GitignoreBlock] | None, project_root: Path
) -> None:
    """Updates or creates a .gitignore file with the provided blocks."""
    if new_blocks is None:
        print(f"Error:  {gitignore_path.relative_to(project_root)} (fetch failed)")
        return

    new_content = blocks_to_content(new_blocks)
    if gitignore_path.exists():
        existing_content = gitignore_path.read_text(encoding="utf-8")
        merged_content = merge_gitignore(existing_content, new_content)
        if merged_content == existing_content:
            print(f"Skip:   {gitignore_path.relative_to(project_root)} (no change)")
        else:
            gitignore_path.write_text(merged_content, encoding="utf-8", newline="\n")
            print(f"Update: {gitignore_path.relative_to(project_root)}")
    else:
        gitignore_path.write_text(new_content, encoding="utf-8", newline="\n")
        print(f"Create: {gitignore_path.relative_to(project_root)}")


def main() -> None:
    """Main execution logic for updating all .gitignore files."""
    project_root = Path(__file__).resolve().parent.parent
    resolved = resolve_dirs(project_root)

    # Collect all targets including the root directory
    targets: dict[Path, Language | None] = {project_root: None}
    for p, lang in resolved.items():
        targets[p] = lang

    # Processing order: Level-order then Alphabetical
    sorted_paths = sorted(
        targets.keys(),
        key=lambda p: (len(p.relative_to(project_root).parts), str(p)),
    )

    for path in sorted_paths:
        lang = targets[path]
        gitignore_path = path / ".gitignore"
        if lang is None:
            new_blocks = load_global_template_blocks()
        else:
            new_blocks = fetch_gitignore_blocks(lang)
        update_gitignore(gitignore_path, new_blocks, project_root)


if __name__ == "__main__":
    main()
