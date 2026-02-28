'use server'

import { db } from '@/app/lib/db'

// ============================================================
// Supabase Storage - 生成程式碼儲存
// ============================================================

export interface GeneratedFile {
  path: string      // 相對路徑，如 'app/page.tsx'
  content: string   // 檔案內容
}

export interface UploadResult {
  success: boolean
  url?: string      // 公開 URL 或 signed URL
  error?: string
}

export interface GenerationArtifacts {
  pages: GeneratedFile[]
  components: GeneratedFile[]
  styles?: GeneratedFile[]
  utils?: GeneratedFile[]
}

// Storage bucket 名稱
const BUCKET_NAME = 'generations'

/**
 * 確保 Storage Bucket 存在
 */
async function ensureBucketExists(): Promise<{ success: boolean; error?: string }> {
  const { data: buckets, error: listError } = await db.storage.listBuckets()

  if (listError) {
    return { success: false, error: `Failed to list buckets: ${listError.message}` }
  }

  const exists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!exists) {
    const { error: createError } = await db.storage.createBucket(BUCKET_NAME, {
      public: false,  // 私有 bucket，需要 signed URL 存取
      fileSizeLimit: 52428800,  // 50MB（預留未來存設計預覽圖等）
    })

    if (createError) {
      return { success: false, error: `Failed to create bucket: ${createError.message}` }
    }
  }

  return { success: true }
}

/**
 * 上傳生成的程式碼到 Supabase Storage
 *
 * @param projectId - 專案 ID
 * @param generationId - 生成記錄 ID
 * @param artifacts - 生成的檔案
 * @returns 上傳結果，包含打包檔案的 URL
 */
export async function uploadGeneratedCode(
  projectId: string,
  generationId: string,
  artifacts: GenerationArtifacts
): Promise<UploadResult> {
  // 確保 bucket 存在
  const bucketResult = await ensureBucketExists()
  if (!bucketResult.success) {
    return { success: false, error: bucketResult.error }
  }

  // 將所有檔案打包成 JSON（簡化版，實際可用 tar.gz）
  const allFiles = [
    ...artifacts.pages,
    ...artifacts.components,
    ...(artifacts.styles || []),
    ...(artifacts.utils || []),
  ]

  const packageData = {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectId,
    generationId,
    files: allFiles,
  }

  const packageContent = JSON.stringify(packageData, null, 2)
  const packagePath = `${projectId}/${generationId}/code-package.json`

  // 上傳打包檔案
  const { error: uploadError } = await db.storage
    .from(BUCKET_NAME)
    .upload(packagePath, packageContent, {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` }
  }

  // 取得 signed URL（有效期 7 天）
  const { data: urlData, error: urlError } = await db.storage
    .from(BUCKET_NAME)
    .createSignedUrl(packagePath, 7 * 24 * 60 * 60)

  if (urlError || !urlData?.signedUrl) {
    return { success: false, error: `Failed to get URL: ${urlError?.message}` }
  }

  return { success: true, url: urlData.signedUrl }
}

/**
 * 下載生成的程式碼
 *
 * @param url - Storage URL
 * @returns 檔案內容
 */
export async function downloadGeneratedCode(url: string): Promise<{
  success: boolean
  artifacts?: GenerationArtifacts
  error?: string
}> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      return { success: false, error: `Download failed: ${response.statusText}` }
    }

    const packageData = await response.json()

    // 解析檔案
    const pages: GeneratedFile[] = []
    const components: GeneratedFile[] = []
    const styles: GeneratedFile[] = []
    const utils: GeneratedFile[] = []

    for (const file of packageData.files || []) {
      if (file.path.includes('/page.tsx') || file.path.includes('/layout.tsx')) {
        pages.push(file)
      } else if (file.path.includes('components/')) {
        components.push(file)
      } else if (file.path.endsWith('.css')) {
        styles.push(file)
      } else {
        utils.push(file)
      }
    }

    return {
      success: true,
      artifacts: { pages, components, styles, utils },
    }
  } catch (err) {
    return { success: false, error: `Parse failed: ${err}` }
  }
}

/**
 * 建立 UIUX 生成記錄並上傳程式碼
 *
 * @param projectId - 專案 ID
 * @param artifacts - 生成的檔案
 * @param designBrief - 設計簡報
 * @param selectedVariant - 選中的設計變體
 * @returns 生成記錄 ID 和 URL
 */
export async function createUiuxGeneration(
  projectId: string,
  artifacts: GenerationArtifacts,
  designBrief: Record<string, unknown>,
  selectedVariant: string
): Promise<{
  success: boolean
  generationId?: string
  codeUrl?: string
  error?: string
}> {
  // 建立生成記錄
  const { data: generation, error: genError } = await db
    .from('generations')
    .insert({
      project_id: projectId,
      status: 'success',
      attempt_count: 1,
      requirement_spec: designBrief,
      technical_design: {
        type: 'uiux',
        selectedVariant,
        pagesCount: artifacts.pages.length,
        componentsCount: artifacts.components.length,
      },
    })
    .select('id')
    .single()

  if (genError || !generation) {
    return { success: false, error: genError?.message || 'Failed to create generation record' }
  }

  // 上傳程式碼
  const uploadResult = await uploadGeneratedCode(projectId, generation.id, artifacts)

  if (!uploadResult.success) {
    // 標記生成失敗
    await db
      .from('generations')
      .update({ status: 'failed', error_message: uploadResult.error })
      .eq('id', generation.id)

    return { success: false, error: uploadResult.error }
  }

  // 更新 URL
  await db
    .from('generations')
    .update({ generated_code_url: uploadResult.url })
    .eq('id', generation.id)

  return {
    success: true,
    generationId: generation.id,
    codeUrl: uploadResult.url,
  }
}

/**
 * 取得專案最新的 UIUX 生成記錄
 */
export async function getLatestUiuxGeneration(projectId: string): Promise<{
  success: boolean
  generation?: {
    id: string
    codeUrl: string | null
    designBrief: Record<string, unknown>
    selectedVariant: string
    createdAt: string
  }
  error?: string
}> {
  const { data, error } = await db
    .from('generations')
    .select('id, generated_code_url, requirement_spec, technical_design, created_at')
    .eq('project_id', projectId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: 'Generation record not found' }
  }

  return {
    success: true,
    generation: {
      id: data.id,
      codeUrl: data.generated_code_url,
      designBrief: data.requirement_spec || {},
      selectedVariant: (data.technical_design as Record<string, unknown>)?.selectedVariant as string || '',
      createdAt: data.created_at,
    },
  }
}
