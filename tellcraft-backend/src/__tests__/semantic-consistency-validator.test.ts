import { describe, it, expect } from 'vitest'
import {
  validateSemanticConsistency,
  analyzeSpecIssuesInFailures,
} from '../services/semantic-consistency-validator'

describe('Semantic Consistency Validator', () => {
  // ==========================================================
  // Check A: name_vs_datatable
  // ==========================================================

  describe('Check A: Scenario 名稱 vs DataTable 矛盾', () => {
    it('scenario 名稱說 categoryId 應變為 null，但 DataTable 期望 UUID → 偵測 error', async () => {
      const feature = {
        name: '分類管理',
        content: `
Feature: 分類管理

Scenario: 刪除分類後，關聯的記帳記錄 categoryId 應變為 null
  Given 準備一個Category, with table:
    | id >cat1.id |
    | $cat1.id    |
  Given 準備一個Transaction, with table:
    | id >txn1.id | categoryId |
    | $txn1.id    | $cat1.id   |
  When (No Actor) 刪除分類, call table:
    | id       |
    | $cat1.id |
  Then 刪除分類(204)回應
  And 應該存在一個Transaction, with table:
    | id       | categoryId |
    | $txn1.id | $cat1.id   |
`,
      }

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })

      expect(result.passed).toBe(false)
      const issues = result.issues.filter(i => i.issueType === 'name_vs_datatable')
      expect(issues.length).toBeGreaterThan(0)
      expect(issues[0].severity).toBe('error')
      expect(issues[0].description).toContain('categoryId')
      expect(issues[0].description).toContain('null')
    })

    it('正確用 &isNull 的 scenario → 不報錯', async () => {
      const feature = {
        name: '分類管理',
        content: `
Feature: 分類管理

Scenario: 刪除分類後，關聯的記帳記錄 categoryId 應變為 null
  Given 準備一個Transaction, with table:
    | id >txn1.id | categoryId |
    | $txn1.id    | $cat1.id   |
  Then 應該存在一個Transaction, with table:
    | id       | categoryId |
    | $txn1.id | &isNull    |
`,
      }

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })

      const issues = result.issues.filter(i => i.issueType === 'name_vs_datatable')
      expect(issues.length).toBe(0)
    })

    it('scenario 名稱沒提 null → 不嘗試偵測', async () => {
      const feature = {
        name: '建立分類',
        content: `
Feature: 建立分類

Scenario: 建立分類成功
  When (No Actor) 建立分類, call table:
    | name    |
    | 食物    |
  Then 建立分類(201)回應
  And 應該存在一個Category, with table:
    | id  | name |
    | any | 食物 |
`,
      }

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })

      expect(result.issues.length).toBe(0)
    })
  })

  // ==========================================================
  // Check B: expectation_vs_schema
  // ==========================================================

  describe('Check B: Scenario 期望 vs Schema FK 矛盾', () => {
    it('scenario 期望 cascade null 但 Schema 沒 ON DELETE SET NULL → 偵測 error', async () => {
      const feature = {
        name: '分類管理',
        content: `
Feature: 分類管理

Scenario: 刪除分類後相關記錄 categoryId 變 null
  When (No Actor) 刪除分類, call table:
    | id       |
    | $cat1.id |
  Then 應該存在一個Transaction, with table:
    | id       | categoryId |
    | $txn1.id | &isNull    |
`,
      }

      // Schema 用 CASCADE 而非 SET NULL
      const schemaSql = `
CREATE TABLE categories (id UUID PRIMARY KEY);
CREATE TABLE transactions (id UUID PRIMARY KEY);
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
`

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql,
      })

      const schemaIssues = result.issues.filter(i => i.issueType === 'expectation_vs_schema')
      expect(schemaIssues.length).toBeGreaterThan(0)
      expect(schemaIssues[0].description).toContain('CASCADE')
    })

    it('Schema 有 ON DELETE SET NULL → 不報錯', async () => {
      const feature = {
        name: '分類管理',
        content: `
Feature: 分類管理

Scenario: 刪除分類後相關記錄 categoryId 變 null
  When (No Actor) 刪除分類, call table:
    | id       |
    | $cat1.id |
  Then 應該存在一個Transaction, with table:
    | id       | categoryId |
    | $txn1.id | &isNull    |
`,
      }

      const schemaSql = `
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
`

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql,
      })

      const schemaIssues = result.issues.filter(i => i.issueType === 'expectation_vs_schema')
      expect(schemaIssues.length).toBe(0)
    })
  })

  // ==========================================================
  // analyzeSpecIssuesInFailures
  // ==========================================================

  describe('analyzeSpecIssuesInFailures', () => {
    it('從失敗 scenarios 偵測 spec 矛盾', () => {
      const failures = [
        {
          featureName: '分類管理',
          scenarioName: '刪除分類後 categoryId 應變為 null',
          error: '[Transaction.categoryId] expect: [dda4721b-22a9-4b42-95c0-f3694077ac54], actual: [null]',
        },
      ]

      const features = [
        {
          name: '分類管理',
          content: `
Feature: 分類管理

Scenario: 刪除分類後 categoryId 應變為 null
  Then 應該存在一個Transaction, with table:
    | id       | categoryId |
    | $txn1.id | $cat1.id   |
`,
        },
      ]

      const result = analyzeSpecIssuesInFailures(failures, features)
      expect(result.hasSpecIssues).toBe(true)
      expect(result.humanReadableReport).toContain('null')
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('沒有 spec 矛盾 → hasSpecIssues=false', () => {
      const failures = [
        {
          scenarioName: '建立分類',
          error: 'SQL error: column not found',
        },
      ]

      const result = analyzeSpecIssuesInFailures(failures, [])
      expect(result.hasSpecIssues).toBe(false)
    })
  })
})
