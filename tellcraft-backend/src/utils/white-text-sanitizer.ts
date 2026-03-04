/**
 * 白話化後處理層：統一攔截 Clarify 階段的技術術語
 *
 * 規則式清洗，在 sendClarifyQuestion 發送前呼叫。
 * DB 中仍保留原始技術 question/options（Formulation 消費需要技術資訊）。
 */

// ============================================================
// 術語替換對照表：精確匹配 + 正則匹配
// ============================================================

const TERM_REPLACEMENTS: [RegExp, string][] = [
  // SQL/DB 術語
  [/\bNOT NULL\b/gi, '必填'],
  [/\bNULL\b/gi, '空白'],
  [/\bTRUE\b/g, '是'],
  [/\bFALSE\b/g, '否'],
  [/\bBOOLEAN\b/gi, '是或否'],
  [/\bDECIMAL\(\d+,\s*\d+\)/gi, '可以有小數的數字'],
  [/\bINT\b/gi, '整數'],
  [/\bVARCHAR\(\d+\)/gi, '文字'],
  [/\bENUM\([^)]+\)/gi, '只能從幾個選項中選'],
  [/\bJSONB?\b/gi, '結構化資料'],
  [/\bUUID\b/gi, '唯一識別碼'],
  [/\bCHECK\s*\(/gi, '限制條件（'],
  [/\bCONSTRAINT\b/gi, '限制'],
  [/\bFOREIGN KEY\b/gi, '關聯'],
  [/\bPRIMARY KEY\b/gi, '主鍵'],
  [/\bJOIN\b/gi, '關聯查詢'],
  [/\bINDEX\b/gi, '索引'],
  [/\bSELECT\b/gi, '查詢'],
  [/\bINSERT\b/gi, '新增'],
  [/\bUPDATE\b/gi, '更新'],
  [/\bDELETE\b/gi, '刪除'],

  // 命名慣例術語
  [/\bsnake_case\b/gi, '底線命名（如 cover_image）'],
  [/\bcamelCase\b/gi, '駝峰命名（如 coverImage）'],
  [/\bCRUD\b/gi, '新增修改刪除查詢'],
  [/\bAPI\b/g, '系統介面'],
  [/\bSchema\b/gi, '資料結構'],
  [/\bmiddleware\b/gi, '中間處理'],
  [/\bcallback\b/gi, '回呼'],
  [/\bendpoint\b/gi, '接口'],
  [/\bpayload\b/gi, '傳送內容'],
  [/\bquery\b/gi, '查詢'],
  [/\bmutation\b/gi, '變更操作'],
]

// ============================================================
// 模式匹配
// ============================================================

/**
 * 偵測 table_name.column_name 格式的技術引用
 * 如 works.is_featured → 「works 的 is_featured」
 */
const TABLE_COLUMN_PATTERN = /\b([a-z_]+)\.([a-z_]+)\b/g

/**
 * 偵測反引號包裹的技術名稱
 * 如 `coverImage` → coverImage
 */
const BACKTICK_PATTERN = /`([^`]+)`/g

/**
 * 偵測程式比較運算子（只在非 markdown 上下文中替換）
 */
const COMPARISON_REPLACEMENTS: [RegExp, string][] = [
  [/\s>=\s/g, ' 大於等於 '],
  [/\s<=\s/g, ' 小於等於 '],
  [/\s!=\s/g, ' 不等於 '],
  [/\s==\s/g, ' 等於 '],
  [/\s&&\s/g, ' 而且 '],
  [/\s\|\|\s/g, ' 或者 '],
]

// ============================================================
// 核心清洗函數
// ============================================================

export function sanitizeForDisplay(text: string): string {
  let result = text

  // 1. 替換 table.column 引用為更易讀的格式
  result = result.replace(TABLE_COLUMN_PATTERN, (_, table, column) => {
    return `「${humanizeSnakeCase(table)}」的「${humanizeSnakeCase(column)}」`
  })

  // 2. 移除反引號但保留內容（先做人性化轉換）
  result = result.replace(BACKTICK_PATTERN, (_, content) => {
    // 如果內容是 snake_case 或 camelCase，嘗試人性化
    if (/^[a-z]+_[a-z_]+$/.test(content)) {
      return humanizeSnakeCase(content)
    }
    if (/^[a-z]+[A-Z]/.test(content)) {
      return humanizeCamelCase(content)
    }
    return content
  })

  // 3. 套用程式比較運算子替換
  for (const [pattern, replacement] of COMPARISON_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  // 4. 套用術語替換表
  for (const [pattern, replacement] of TERM_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  return result
}

// ============================================================
// 輔助：變數名人性化
// ============================================================

/** snake_case → 空格分隔的可讀文字 */
function humanizeSnakeCase(name: string): string {
  // 常見欄位名對照
  const FIELD_MAP: Record<string, string> = {
    'id': '編號',
    'created_at': '建立時間',
    'updated_at': '更新時間',
    'deleted_at': '刪除時間',
    'is_featured': '是否精選',
    'is_active': '是否啟用',
    'is_published': '是否發佈',
    'cover_image': '封面圖片',
    'featured_works': '精選作品',
    'work_media': '作品媒體',
    'user_id': '用戶編號',
    'project_id': '專案編號',
    'file_path': '檔案路徑',
    'file_type': '檔案類型',
    'display_order': '排列順序',
    'sort_order': '排序順序',
    'start_date': '開始日期',
    'end_date': '結束日期',
    'max_count': '最大數量',
    'min_count': '最小數量',
    'total_count': '總數量',
    'status_code': '狀態碼',
  }

  if (FIELD_MAP[name]) return FIELD_MAP[name]
  return name.replace(/_/g, ' ')
}

/** camelCase → 空格分隔的可讀文字 */
function humanizeCamelCase(name: string): string {
  const CAMEL_MAP: Record<string, string> = {
    'coverImage': '封面圖片',
    'isActive': '是否啟用',
    'isFeatured': '是否精選',
    'isPublished': '是否發佈',
    'userId': '用戶編號',
    'projectId': '專案編號',
    'workId': '作品編號',
    'startDate': '開始日期',
    'endDate': '結束日期',
    'createdAt': '建立時間',
    'updatedAt': '更新時間',
    'displayOrder': '排列順序',
    'sortOrder': '排序順序',
    'fileName': '檔案名稱',
    'filePath': '檔案路徑',
    'fileType': '檔案類型',
  }

  if (CAMEL_MAP[name]) return CAMEL_MAP[name]
  // 通用：拆分 camelCase
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

// ============================================================
// 技術術語偵測（供日誌監控）
// ============================================================

const TECH_TERM_DETECTORS = [
  /\b[a-z]+_[a-z]+\b/g,           // snake_case 變數名
  /\b[a-z]+[A-Z][a-zA-Z]*\b/g,    // camelCase 變數名
  /`[^`]+`/g,                       // 反引號包裹
  /\b(NULL|NOT NULL|BOOLEAN|DECIMAL|VARCHAR|ENUM|JSONB|UUID|CHECK|CONSTRAINT|JOIN|FOREIGN KEY)\b/gi,
]

export function detectTechTerms(text: string): string[] {
  const found: string[] = []
  for (const pattern of TECH_TERM_DETECTORS) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags))
    if (matches) {
      found.push(...matches)
    }
  }
  // 去重
  return [...new Set(found)]
}

// ============================================================
// 完整白話清洗管線
// ============================================================

/**
 * 清洗 Clarify 問題和選項，規則式替換技術術語為白話文。
 * 殘留術語記 log 但不阻塞。
 */
export function sanitizeClarifyForDisplay(
  question: string,
  options: string[]
): { question: string; options: string[]; hadTechTerms: boolean } {
  const cleanQuestion = sanitizeForDisplay(question)
  const cleanOptions = options.map(opt => sanitizeForDisplay(opt))

  const remainingTerms = [
    ...detectTechTerms(cleanQuestion),
    ...cleanOptions.flatMap(opt => detectTechTerms(opt)),
  ]

  if (remainingTerms.length > 0) {
    console.warn('[WhiteTextSanitizer] 清洗後仍有技術術語:', remainingTerms.slice(0, 10))
  }

  return {
    question: cleanQuestion,
    options: cleanOptions,
    hadTechTerms: remainingTerms.length > 0,
  }
}
