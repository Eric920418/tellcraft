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

  // ==========================================================
  // hasExplicitNullIntent 寬鬆偵測（覆蓋中英文變體）
  // ==========================================================
  describe('hasExplicitNullIntent（寬鬆 null 意圖偵測）', () => {
    const positiveExamples = [
      // 用戶實際失敗的 case
      '分類應可被設為未分類（null） - 成功將分類清除為未分類',
      // 中文變體
      '分類應可清除',
      '應清除為未分類',
      '應可以設為無',
      '應設為 null',
      'categoryId 應變為 null',
      '標籤應被清空',
      '取消分類關聯',
      '移除選擇',
      '解除群組連結',
      // 英文變體
      'category should become null',
      'tag should be cleared',
      'project should be unset',
      'foo should be reset to null',
      'bar is cleared after remove',
      // 括號強信號
      '執行刪除 (null)',
      '處理結果（null）',
    ]
    positiveExamples.forEach(name => {
      it(`[positive] "${name}" → true`, async () => {
        const { hasExplicitNullIntent } = await import('../services/semantic-consistency-validator')
        expect(hasExplicitNullIntent(name)).toBe(true)
      })
    })

    const negativeExamples = [
      '建立分類成功',
      '更新標籤',
      '查詢所有記錄',
      '編輯交易記錄',
      'create category success',
      'list all items',
    ]
    negativeExamples.forEach(name => {
      it(`[negative] "${name}" → false`, async () => {
        const { hasExplicitNullIntent } = await import('../services/semantic-consistency-validator')
        expect(hasExplicitNullIntent(name)).toBe(false)
      })
    })
  })

  // ==========================================================
  // Actual-driven 偵測：scenario 名稱全中文時能抓到矛盾
  // ==========================================================
  describe('Actual-driven DataTable 掃描（中文 scenario 無英文欄位名）', () => {
    it('用戶實際案例：「分類應可被設為未分類（null） - 成功將分類清除為未分類」+ DataTable categoryId = UUID → 偵測為矛盾', async () => {
      const feature = {
        name: '編輯交易記錄',
        content: `
Feature: 編輯交易記錄

Scenario: 分類應可被設為未分類（null） - 成功將分類清除為未分類
  Given 準備一個分類, with table:
    | id >cat1.id | name |
    | <id         | 飲食 |
  Given 準備一個帳目記錄, with table:
    | id >txn1.id | categoryId |
    | <id         | $cat1.id   |
  When (No Actor) 編輯交易記錄, call table:
    | id       | categoryId |
    | $txn1.id | null       |
  Then 編輯交易記錄(200)回應
  And 應該存在一個帳目記錄, with table:
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
    })

    it('「脫勾 / 取消關聯」表述 + DataTable 有 FK 非 null → 偵測', async () => {
      const feature = {
        name: '任務管理',
        content: `
Feature: 任務管理

Scenario: 解除群組關聯 - 任務應不屬於任何群組
  Given 準備一個任務, with table:
    | id >task1.id | groupId    |
    | <id          | $group1.id |
  Then 應該存在一個任務, with table:
    | id        | groupId    |
    | $task1.id | $group1.id |
`,
      }

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })

      const issues = result.issues.filter(i => i.issueType === 'name_vs_datatable')
      expect(issues.length).toBeGreaterThan(0)
    })

    it('正確用 &isNull 的全中文 scenario → 不誤報', async () => {
      const feature = {
        name: '編輯交易記錄',
        content: `
Feature: 編輯交易記錄

Scenario: 分類應可被設為未分類（null）
  Then 應該存在一個帳目記錄, with table:
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

    it('有 null 意圖但 DataTable 僅有 non-FK 欄位 → 不誤報（沒 FK 就沒衝突對象）', async () => {
      const feature = {
        name: '更新',
        content: `
Feature: 更新

Scenario: 應清除描述 (null)
  Then 應該存在一個記錄, with table:
    | id | title |
    | $x | foo   |
`,
      }

      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })

      const issues = result.issues.filter(i => i.issueType === 'name_vs_datatable')
      expect(issues.length).toBe(0)
    })
  })

  // ==========================================================
  // analyzeSpecIssuesInFailures 對用戶實際失敗訊息的偵測
  // ==========================================================
  describe('analyzeSpecIssuesInFailures（用戶實際失敗格式）', () => {
    it('scenario 名稱含「應可被設為...(null)」+ error expect/actual → 偵測', () => {
      const failures = [
        {
          scenarioName: '分類應可被設為未分類（null） - 成功將分類清除為未分類',
          error: '[entity_validate] [帳目記錄.categoryId] expect: [dda4721b-22a9-4b42-95c0-f3694077ac54], actual: [null]',
        },
      ]
      const result = analyzeSpecIssuesInFailures(failures, [])
      expect(result.hasSpecIssues).toBe(true)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.humanReadableReport).toContain('null')
    })

    it('scenario 名稱含「清除為」+ error expect/actual → 偵測', () => {
      const failures = [
        {
          scenarioName: '欄位清除為空',
          error: 'expect: [abc123], actual: [null]',
        },
      ]
      const result = analyzeSpecIssuesInFailures(failures, [])
      expect(result.hasSpecIssues).toBe(true)
    })

    it('scenario 名稱含「取消關聯」+ error expect/actual → 偵測', () => {
      const failures = [
        {
          scenarioName: '取消選擇標籤',
          error: 'expect: [tag-uuid], actual: [null]',
        },
      ]
      const result = analyzeSpecIssuesInFailures(failures, [])
      expect(result.hasSpecIssues).toBe(true)
    })
  })

  // ==========================================================
  // Regression: clause-aware null intent extraction
  // 歷史 case：「Successfully clear A while updating B」誤報 B 應為 null
  // ==========================================================

  describe('clause-aware null intent (regression)', () => {
    it('「clear X while updating Y」不該把 Y 當 null candidate', async () => {
      const feature = {
        name: 'Update SEO Settings',
        content: `
Feature: Update SEO Settings

Scenario: Successfully clear metaDescription while updating pageTitle
  When (No Actor) Update SEO Settings, call table:
    | metaDescription | pageTitle                    |
    | &isNull         | "AC Cleaning Taipei Expert"  |
  Then Update SEO Settings(200)回應
  And 應該存在一個SEOSettings, with table:
    | metaDescription | pageTitle                    |
    | &isNull         | "AC Cleaning Taipei Expert"  |
`,
      }
      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })
      const pageTitleIssues = result.issues.filter(
        i => i.issueType === 'name_vs_datatable' && i.description.includes('pageTitle')
      )
      expect(pageTitleIssues).toEqual([])
    })

    it('「clear A and clear B」兩個 clause 都應該偵測（合理 case）', async () => {
      const feature = {
        name: 'Clear Multiple',
        content: `
Feature: Clear Multiple

Scenario: Clear categoryId and clear tagId
  When (No Actor) Clear Multiple, call table:
    | id       |
    | $rec.id  |
  Then 應該存在一個Record, with table:
    | id      | categoryId    | tagId         |
    | $rec.id | actual-cat-id | actual-tag-id |
`,
      }
      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })
      const issues = result.issues.filter(i => i.issueType === 'name_vs_datatable')
      // 至少抓到 categoryId 或 tagId 其一（兩個都該抓到）
      expect(issues.length).toBeGreaterThan(0)
    })

    it('「clear A while updating B」中 A 仍然要被偵測為 null candidate', async () => {
      const feature = {
        name: 'SEO',
        content: `
Feature: SEO

Scenario: Successfully clear metaDescription while updating pageTitle
  Then 應該存在一個SEOSettings, with table:
    | metaDescription           | pageTitle |
    | "still-has-old-meta-desc" | "new"     |
`,
      }
      const result = await validateSemanticConsistency({
        features: [feature],
        schemaSql: '',
      })
      const metaDescIssues = result.issues.filter(
        i => i.issueType === 'name_vs_datatable' && i.description.includes('metaDescription')
      )
      // metaDescription 在 clear clause 裡 + DataTable 是非 null → 應該被偵測
      expect(metaDescIssues.length).toBeGreaterThan(0)
    })
  })
})
