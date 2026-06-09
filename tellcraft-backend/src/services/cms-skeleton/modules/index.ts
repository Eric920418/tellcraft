// ============================================================
// CMS Skeleton — Framework Modules（Phase 1 Week 5+）
//
// 此檔 side-effect import 所有 framework modules，觸發 registerModule。
// 加新 module 步驟：
//   1. 在此目錄建 <module-id>.ts，實作 SkeletonModuleDefinition，檔末 registerModule(myModule)
//   2. 在此檔加 import './<module-id>'
//   3. 在 cms-skeleton.test.ts 加形狀驗證
// ============================================================

// 第一批 framework module（Week 5.2/5.3）
import './contact-form'
import './newsletter'

// Day-2 自助營運層 content modules（A1）— detect() 內 gate ENABLE_CONTENT_MODEL，預設不啟用
import './blog'
import './pages'

export {}
