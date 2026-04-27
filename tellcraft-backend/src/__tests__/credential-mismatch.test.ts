// L29.C: Alignment Gate credential 矛盾偵測
// 偵測 entity_setup 的 hashed credential 與 When step plain 值是否有可驗證關係

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

const BASE_ACTIONS_YML = `actions:
  - name: admin_login
    summary: Admin Login
    http_method: POST
    http_path: /api/admin/login
    input: {}
    output: {}
`
const BASE_SCHEMA_SQL = `CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);`
const BASE_ENTITY_MAPPING = `entity_to_table_mapping:
  - AdminUser: admin_users
`

function makeInput(content: string) {
  return {
    features: [{ name: 'Admin Login', actionName: 'admin_login', content }],
    actionsYml: BASE_ACTIONS_YML,
    schemaSql: BASE_SCHEMA_SQL,
    entityMapping: BASE_ENTITY_MAPPING,
  }
}

describe('L29.C — credential_mismatch', () => {
  it('❌ passwordHash 字面值 "HashedPasswordForTest01" + password "CorrectPassword" → 矛盾', async () => {
    const feature = `# Action: admin_login
# [POST] /api/admin/login
# Summary: Admin Login
Feature: Admin Login

  Background:
    Given 準備一個AdminUser, with table:
      | >AdminUser1.id | username    | passwordHash            |
      | <adminUser1Id  | admin_owner | HashedPasswordForTest01 |

  Rule: 後置（回應）- Login should return token

    Example: Login succeeds
      When (No Actor) Admin Login, call table:
        | username    | password        |
        | admin_owner | CorrectPassword |
      Then Admin Login(200)回應, with table:
        | token    |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const mismatch = issues.filter(i => i.checkName === 'credential_mismatch')
    expect(mismatch.length).toBeGreaterThan(0)
    expect(mismatch[0].description).toContain('HashedPasswordForTest01')
    expect(mismatch[0].description).toContain('CorrectPassword')
  })

  it('✅ 真實 bcrypt hash → 不報', async () => {
    const feature = `# Action: admin_login
# [POST] /api/admin/login
# Summary: Admin Login
Feature: Admin Login

  Background:
    Given 準備一個AdminUser, with table:
      | >AdminUser1.id | username    | passwordHash                                                  |
      | <adminUser1Id  | admin_owner | $2b$10$abcdefghijklmnopqrstuv.AbCdEfGhIjKlMnOpQrStUvWxYzAb |

  Rule: 後置（回應）- ok
    Example: Login succeeds
      When (No Actor) Admin Login, call table:
        | username    | password        |
        | admin_owner | CorrectPassword |
      Then Admin Login(200)回應, with table:
        | token    |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const mismatch = issues.filter(i => i.checkName === 'credential_mismatch')
    expect(mismatch).toHaveLength(0)
  })

  it('✅ plain fixture（passwordHash 字面 = password 字面）→ 不報', async () => {
    const feature = `# Action: admin_login
# [POST] /api/admin/login
# Summary: Admin Login
Feature: Admin Login

  Background:
    Given 準備一個AdminUser, with table:
      | >AdminUser1.id | username    | passwordHash    |
      | <adminUser1Id  | admin_owner | CorrectPassword |

  Rule: 後置（回應）- ok
    Example: Login succeeds
      When (No Actor) Admin Login, call table:
        | username    | password        |
        | admin_owner | CorrectPassword |
      Then Admin Login(200)回應, with table:
        | token    |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const mismatch = issues.filter(i => i.checkName === 'credential_mismatch')
    expect(mismatch).toHaveLength(0)
  })

  it('Feature 沒 hashed 欄位 → 不報', async () => {
    const feature = `# Action: admin_login
# [POST] /api/admin/login
# Summary: Admin Login
Feature: Admin Login

  Background:
    Given 準備一個AdminUser, with table:
      | >AdminUser1.id | username    |
      | <adminUser1Id  | admin_owner |

  Rule: 後置（回應）- ok
    Example: Login succeeds
      When (No Actor) Admin Login, call table:
        | username    |
        | admin_owner |
      Then Admin Login(200)回應, with table:
        | token    |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const mismatch = issues.filter(i => i.checkName === 'credential_mismatch')
    expect(mismatch).toHaveLength(0)
  })
})
