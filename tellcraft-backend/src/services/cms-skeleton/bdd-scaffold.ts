// ============================================================
// CMS Skeleton — Canonical BDD Features
//
// 生成 CMS 必有的 5 個 BDD features。每個 feature 是 sdd.os ISA SpecFormula 格式
// 字串，可直接寫進 bdd_sessions.features_content jsonb 欄位。
//
// 設計原則：
//   - 用 manifest 的 canonical_test_username/password 確保 UI hint 跟 BDD seed 對齊
//     （L38 已偵測 UIUX hint 對齊 DB；這層讓 BDD 也對齊）
//   - 步驟用 sdd.os ISA 格式（準備一個X / call table / Then X(status)回應）
//   - VAR-System: >Admin1.id 宣告 / <admin1Id 捕獲 / $admin1Id 引用
// ============================================================
import manifest from './manifest.json'

export interface SkeletonFeature {
  name: string
  actionName: string
  content: string
  skeletonModule: string
}

interface ScaffoldOptions {
  username?: string
  password?: string
}

function getCreds(opts?: ScaffoldOptions): { username: string; password: string } {
  const slot = manifest.modules.admin_auth.slots
  return {
    username: opts?.username ?? slot.canonical_test_username.default,
    password: opts?.password ?? slot.canonical_test_password.default,
  }
}

function buildAdminLogin(opts?: ScaffoldOptions): SkeletonFeature {
  const { username, password } = getCreds(opts)
  return {
    name: 'Admin Login',
    actionName: 'admin_login',
    skeletonModule: 'admin_auth',
    content: `# Action: admin_login
# [POST] /api/admin/login
# Summary: Admin Login
Feature: Admin Login

  Background:
    Given 準備一個Admin, with table:
      | >Admin1.id | username   | passwordHash |
      | <admin1Id  | ${username} | ${password}  |

  Rule: 前置（參數）- Required parameters username and password

    Example: Missing username causes failure
      When (No Actor) Admin Login, call table:
        | username | password |
        |          | ${password} |
      Then 操作失敗

    Example: Missing password causes failure
      When (No Actor) Admin Login, call table:
        | username   | password |
        | ${username} |          |
      Then 操作失敗

  Rule: 後置（回應）- Successful login returns token

    Example: Login succeeds with valid credentials
      When (No Actor) Admin Login, call table:
        | username   | password   |
        | ${username} | ${password} |
      Then Admin Login(200)回應, with table:
        | token      |
        | $notnull   |

  Rule: 後置（狀態）- Wrong password fails

    Example: Wrong password causes failure
      When (No Actor) Admin Login, call table:
        | username   | password    |
        | ${username} | wrongpass99 |
      Then 操作失敗
`,
  }
}

function buildAdminLogout(): SkeletonFeature {
  return {
    name: 'Admin Logout',
    actionName: 'admin_logout',
    skeletonModule: 'admin_auth',
    content: `# Action: admin_logout
# [POST] /api/admin/logout
# Summary: Admin Logout
Feature: Admin Logout

  Background:
    Given 準備一個Admin, with table:
      | >Admin1.id | username | passwordHash |
      | <admin1Id  | admin    | admin123     |

  Rule: 後置（回應）- Logout always succeeds for authenticated admin

    Example: Authenticated admin logs out successfully
      When (UID="$admin1Id") Admin Logout, call table:
        | dummy |
        | none  |
      Then Admin Logout(200)回應, with table:
        | message  |
        | $notnull |
`,
  }
}

function buildListAdmins(): SkeletonFeature {
  return {
    name: 'List Admins',
    actionName: 'list_admins',
    skeletonModule: 'admin_auth',
    content: `# Action: list_admins
# [GET] /api/admin/admins
# Summary: List Admins
Feature: List Admins

  Background:
    Given 準備一個Admin, with table:
      | >Admin1.id | username | passwordHash |
      | <admin1Id  | admin    | admin123     |
    And 準備一個Admin, with table:
      | >Admin2.id | username | passwordHash |
      | <admin2Id  | editor   | editor123    |

  Rule: 後置（回應）- Returns all non-deleted admins

    Example: Authenticated admin lists all admins
      When (UID="$admin1Id") List Admins, call table:
        | dummy |
        | none  |
      Then List Admins(200)回應, with table:
        | id        | username |
        | $admin1Id | admin    |
        | $admin2Id | editor   |
`,
  }
}

function buildUpdateAdminProfile(): SkeletonFeature {
  return {
    name: 'Update Admin Profile',
    actionName: 'update_admin_profile',
    skeletonModule: 'admin_auth',
    content: `# Action: update_admin_profile
# [PUT] /api/admin/profile
# Summary: Update Admin Profile
Feature: Update Admin Profile

  Background:
    Given 準備一個Admin, with table:
      | >Admin1.id | username | passwordHash | displayName |
      | <admin1Id  | admin    | admin123     | Old Name    |

  Rule: 後置（狀態）- displayName can be updated

    Example: Update display name
      When (UID="$admin1Id") Update Admin Profile, call table:
        | id        | displayName |
        | $admin1Id | New Name    |
      Then Update Admin Profile(200)回應, with table:
        | id        | displayName |
        | $admin1Id | New Name    |
      And 應該存在一個Admin, with table:
        | id        | displayName |
        | $admin1Id | New Name    |
`,
  }
}

function buildGetSiteSettings(): SkeletonFeature {
  return {
    name: 'Get Site Settings',
    actionName: 'get_site_settings',
    skeletonModule: 'site_settings',
    content: `# Action: get_site_settings
# [GET] /api/admin/site-settings
# Summary: Get Site Settings
Feature: Get Site Settings

  Background:
    Given 準備一個Admin, with table:
      | >Admin1.id | username | passwordHash |
      | <admin1Id  | admin    | admin123     |
    And 準備一個SiteSetting, with table:
      | >SiteSetting1.id | settingKey | settingValue       |
      | <setting1Id      | site_title | My CMS Site        |
    And 準備一個SiteSetting, with table:
      | >SiteSetting2.id | settingKey | settingValue                  |
      | <setting2Id      | seo_desc   | A great CMS-powered website   |

  Rule: 後置（回應）- Returns all site settings

    Example: Authenticated admin retrieves all settings
      When (UID="$admin1Id") Get Site Settings, call table:
        | dummy |
        | none  |
      Then Get Site Settings(200)回應, with table:
        | settingKey | settingValue                |
        | site_title | My CMS Site                 |
        | seo_desc   | A great CMS-powered website |
`,
  }
}

/**
 * 主入口：生成 5 個 canonical CMS skeleton features
 *
 * @param opts.username / opts.password 覆蓋 manifest 預設（用戶從 slot panel 改過會傳進來）
 */
export function generateSkeletonFeatures(opts?: ScaffoldOptions): SkeletonFeature[] {
  return [
    buildAdminLogin(opts),
    buildAdminLogout(),
    buildListAdmins(),
    buildUpdateAdminProfile(),
    buildGetSiteSettings(),
  ]
}
