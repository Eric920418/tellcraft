import { describe, it, expect } from 'vitest'
import { hasExplicitNullIntent } from '../services/semantic-consistency-validator'
import { autoFixNullIntentScenarioConflict } from '../services/deterministic-feature-fix'

describe('hasExplicitNullIntent — b2252efc 漏抓的英文句型', () => {
  it('「has no <noun> assigned」命中（之前漏抓）', () => {
    expect(hasExplicitNullIntent('Successfully retrieve an article that has no category assigned')).toBe(true)
  })

  it('「returns null <field>」命中（之前漏抓）', () => {
    expect(hasExplicitNullIntent('A published article without a category returns null categoryId')).toBe(true)
  })

  it('「without <noun>」+ 後續含 null 命中', () => {
    expect(hasExplicitNullIntent('Article without category returns null categoryId')).toBe(true)
  })

  it('「set to null」已能命中（v1 既有覆蓋）', () => {
    expect(hasExplicitNullIntent('Articles under the deleted category have their category_id set to null')).toBe(true)
  })

  it('純更新 scenario 不誤判', () => {
    expect(hasExplicitNullIntent('Update product price successfully')).toBe(false)
    expect(hasExplicitNullIntent('Create category with valid name')).toBe(false)
  })

  it('純查詢 scenario 不誤判', () => {
    expect(hasExplicitNullIntent('List articles ordered by created_at')).toBe(false)
  })

  it('「has no impact」純語意不誤殺（不該觸發 null 修補）', () => {
    // 雖然命中 has no \w+ regex，但這 case 應該由 deterministic fix 的 extractNullExpectationFields 過濾掉
    // hasExplicitNullIntent 寬鬆偵測接受 false positive，由下游 field 抽取做精準過濾
    // 此 case 預期 hasExplicitNullIntent=true 但 extractNullExpectationFields=[] → 不會誤改 DataTable
    expect(hasExplicitNullIntent('Deletion has no impact on related orders')).toBe(true)  // 寬鬆 OK
  })
})

describe('hasExplicitNullIntent — Negation pre-check（R6 false positive 修補）', () => {
  // (2026-05-18 b2252efc 全 spec 檢測發現的盲區)
  // 「returns a non-null X」含 null + returns 雙關鍵字但語意反向 — 不該觸發

  it('「returns a non-null X」明確反向語意 → 早退', () => {
    expect(hasExplicitNullIntent('A published article returns a non-null publishedAt value')).toBe(false)
  })

  it('「not null」明確反向語意', () => {
    expect(hasExplicitNullIntent('Article must have a not null categoryId')).toBe(false)
    expect(hasExplicitNullIntent('Created order should have a not-null id')).toBe(false)
  })

  it('「non null」帶空格也命中 negation', () => {
    expect(hasExplicitNullIntent('Response includes non null timestamp')).toBe(false)
  })

  it('中文「非 null」「非空」反向語意', () => {
    expect(hasExplicitNullIntent('已發布文章 publishedAt 應為非 null')).toBe(false)
    expect(hasExplicitNullIntent('回應的 timestamp 應為非空值')).toBe(false)
  })

  it('「具體值」中文反向語意', () => {
    expect(hasExplicitNullIntent('publishedAt 必須是具體值')).toBe(false)
  })

  it('Negation 跟 null intent 同句 → negation 勝出（safe default）', () => {
    // 「不該」/ 「應該保留」+ null intent 含混場景，negation 優先（避免誤改）
    expect(hasExplicitNullIntent('publishedAt is non-null even when category is cleared')).toBe(false)
  })

  it('正常 null intent 不被 negation 過濾誤殺', () => {
    // 確保 negation pre-check 不過度激進
    expect(hasExplicitNullIntent('Articles set categoryId to null after cleanup')).toBe(true)
    expect(hasExplicitNullIntent('has no category assigned')).toBe(true)
    expect(hasExplicitNullIntent('returns null categoryId')).toBe(true)
  })
})

describe('autoFixNullIntentScenarioConflict — false positive regression', () => {
  it('「returns a non-null publishedAt value」不該被改成 &isNull', () => {
    const content = `Feature: Get Public Article

Example: A published article returns a non-null publishedAt value
  When (No Actor) GetPublicArticle, call table:
    | id            |
    | $Article1.id  |
  Then GetPublicArticle(200)回應, with table:
    | id            | publishedAt              |
    | $Article1.id  | 2026-01-01T00:00:00.000Z |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBe(0)
    // 確保 publishedAt 期望值保留時間戳，沒被改成 &isNull
    expect(result.content).toContain('2026-01-01T00:00:00.000Z')
    expect(result.content).not.toContain('&isNull')
  })
})

describe('autoFixNullIntentScenarioConflict — entity_validate', () => {
  it('5 個 b2252efc 失敗 case 對應一個典型 case', () => {
    const content = `Feature: Delete Category

Background:
  Given 現在時間為 "2026-01-01T00:00:00Z"
  And 準備一個Category, with table:
    | >Category1.id | name      |
    | $notnull      | Tech      |
  And 準備一個Article, with table:
    | >Article1.id | title  | >categoryId           |
    | $notnull     | Hello  | $Category1.id         |

Example: Articles under the deleted category have their category_id set to null
  When (No Actor) Delete Category, call table:
    | id            |
    | $Category1.id |
  Then Delete Category(200)回應
  And 應該存在一個Article, with table:
    | id            | title  | categoryId    |
    | $Article1.id  | Hello  | $Category1.id |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBeGreaterThan(0)
    const fix = result.fixed.find(x => x.validateType === 'entity' && x.field === 'categoryId')
    expect(fix).toBeDefined()
    expect(fix?.oldValue).toBe('$Category1.id')
    // content 應該含 &isNull 在 Article 那 row 的 categoryId 位置
    expect(result.content).toContain('&isNull')
    // 結構維持（id 跟 title 不被誤改）
    expect(result.content).toContain('$Article1.id')
    expect(result.content).toContain('| Hello  |')
  })

  it('scenario name 不含 null intent → 不動', () => {
    const content = `Feature: List Articles

Example: List all articles ordered by date
  When (No Actor) List Articles, call table:
    | _query |
    |        |
  Then List Articles(200)回應
  And 應該存在一個Article, with table:
    | id            | title | categoryId    |
    | $notnull      | Hello | $Category1.id |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed).toEqual([])
    expect(result.content).toBe(content)
  })

  it('應該不存在（shouldExist=false）跳過', () => {
    const content = `Feature: Test

Example: Article with no category should not exist after cleanup
  When (No Actor) Cleanup, call table:
    | _query |
    |        |
  Then Cleanup(200)回應
  And 應該不存在一個Article, with table:
    | categoryId |
    | $isNull    |
`
    const result = autoFixNullIntentScenarioConflict(content)
    // 「應該不存在」不修，即使 scenario name 含 null intent
    expect(result.fixed).toEqual([])
  })

  it('已是 &isNull 不重複修', () => {
    const content = `Feature: Test

Example: Articles set categoryId to null after cleanup
  When (No Actor) Cleanup, call table:
    | _query |
    |        |
  Then Cleanup(200)回應
  And 應該存在一個Article, with table:
    | id           | categoryId |
    | $Article1.id | &isNull    |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed).toEqual([])  // 已是 &isNull
  })

  it('多 row data 都改', () => {
    const content = `Feature: Test

Example: All articles have categoryId set to null after category deletion
  When (No Actor) DeleteCategory, call table:
    | id            |
    | $Category1.id |
  Then DeleteCategory(200)回應
  And 應該存在一個Article, with table:
    | id            | categoryId    |
    | $Article1.id  | $Category1.id |
    | $Article2.id  | $Category1.id |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBe(2)  // 兩 row 都被改
  })
})

describe('autoFixNullIntentScenarioConflict — response_validate', () => {
  it('「has no <field> assigned」response_validate 改 &isNull', () => {
    const content = `Feature: Get Admin Article

Example: Successfully retrieve an article that has no category assigned
  When (No Actor) GetAdminArticle, call table:
    | id            |
    | $Article1.id  |
  Then GetAdminArticle(200)回應, with table:
    | id            | title | categoryId    |
    | $Article1.id  | Hello | $Category1.id |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBeGreaterThan(0)
    const fix = result.fixed.find(x => x.validateType === 'response' && x.field === 'categoryId')
    expect(fix).toBeDefined()
    expect(fix?.oldValue).toBe('$Category1.id')
  })

  it('「returns null <field>」response_validate 改 &isNull', () => {
    const content = `Feature: Get Public Article

Example: A published article without a category returns null categoryId
  When (No Actor) GetPublicArticle, call table:
    | id            |
    | $Article1.id  |
  Then GetPublicArticle(200)回應, with table:
    | id            | categoryId    |
    | $Article1.id  | $Category1.id |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBeGreaterThan(0)
    const fix = result.fixed.find(x => x.validateType === 'response')
    expect(fix).toBeDefined()
  })

  it('非 2xx response 跳過（不該對錯誤回應做修補）', () => {
    const content = `Feature: Get Public Article

Example: Article returns null categoryId
  When (No Actor) GetPublicArticle, call table:
    | id  |
    | bad |
  Then GetPublicArticle(404)回應, with table:
    | error    |
    | NotFound |
`
    const result = autoFixNullIntentScenarioConflict(content)
    expect(result.fixed.length).toBe(0)  // 4xx 跳過
  })
})

describe('autoFixNullIntentScenarioConflict — 不誤殺', () => {
  it('mentionedFields 抽不到 field → 不改 DataTable', () => {
    const content = `Feature: Test

Example: Should clear something somewhere (abstract description)
  When (No Actor) Op, call table:
    | _query |
    |        |
  Then Op(200)回應
  And 應該存在一個Item, with table:
    | id   | name |
    | $foo | bar  |
`
    const result = autoFixNullIntentScenarioConflict(content)
    // scenario name 含 'clear' (null intent) 但 mentionedFields 抽不出明確 field name
    // → DataTable headers (id/name) 不被誤改
    expect(result.fixed.length).toBe(0)
  })

  it('field 名不在 DataTable headers 中 → 不誤改', () => {
    const content = `Feature: Test

Example: foreignKeyId is set to null after parent deletion
  When (No Actor) Op, call table:
    | _query |
    |        |
  Then Op(200)回應
  And 應該存在一個Child, with table:
    | id           | name |
    | $Child1.id   | xxx  |
`
    const result = autoFixNullIntentScenarioConflict(content)
    // mentionedFields 抽到 'foreignKeyId' 但 DataTable 沒 foreignKeyId column → 不改
    expect(result.fixed.length).toBe(0)
  })
})
