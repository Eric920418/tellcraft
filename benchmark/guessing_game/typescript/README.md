# 1A2B Guessing Game - TypeScript Benchmark

SDD.OS 的 TypeScript benchmark，展示從 Gherkin 規格自動產生 BDD 測試程式碼，並使用 AI 實作業務邏輯的全自動化開發流程。

## Tech Stack

- **Language**: Node.js 18+, TypeScript 5.0+
- **Web Framework**: NestJS
- **ORM**: Prisma + SQLite
- **Testing**: Cucumber.js + SuperTest
- **Module System**: ES Module

## Quick Start

```bash
# Install dependencies
npm install

# Run full SDD workflow (Codegen → AI Implementation → Test)
bash sdd.sh

# Or run steps manually:
bash assembler_codegen.sh  # Generate test code
npm test                    # Run tests
```

## Project Structure

```
typescript/
├── spec/                   # Specifications (OpenAPI, Entities)
├── src/tests/
│   ├── features/          # Gherkin scenarios
│   └── steps/             # Step definitions (codegen generated)
├── prompts/dev/           # AI implementation prompts
├── isa_codegen.yml        # ISA configuration
├── assembler_codegen.sh   # Codegen script
├── verify_npm.sh          # Test verification script
└── sdd.sh                 # Full SDD workflow
```

## Enhancement

本 Benchmark 尚未進行底下優化：
1. [全自動化開發穩定度優化](https://github.com/SDD-TW/sdd.os/issues/79)