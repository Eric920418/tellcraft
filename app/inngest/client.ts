import { Inngest, EventSchemas } from 'inngest'

// ============================================================
// 事件類型定義
// ============================================================

type Events = {
  // 用戶請求事件
  'user/request': {
    data: {
      projectId: string
      conversationId: string
      userId: string
      message: string
      metadata?: Record<string, unknown>
    }
  }

  // 用戶回覆事件（多輪對話）
  'user/reply': {
    data: {
      projectId: string
      conversationId: string
      taskId: string
      message: string
      specConfirmed?: boolean
    }
  }

  // 任務狀態事件
  'task/created': {
    data: {
      taskId: string
      projectId: string
      goal: string
      skillName: string
    }
  }

  'task/approved': {
    data: {
      taskId: string
      approved: boolean
    }
  }

  'task/step.completed': {
    data: {
      taskId: string
      stepName: string
      result: unknown
    }
  }

  // Skill 執行事件
  'skill/bdd-spec.start': {
    data: {
      taskId: string
      projectId: string
      requirements: {
        text?: string
        filePath?: string
      }
      mode: 'full' | 'discovery' | 'formulation' | 'actions-design'
    }
  }

  'skill/bdd-spec.completed': {
    data: {
      taskId: string
      status: 'success' | 'clarification_needed' | 'validation_failed'
      artifacts?: {
        schemaSql?: string
        features?: string[]
      }
    }
  }

  // 程式碼生成事件
  'codegen/start': {
    data: {
      taskId: string
      projectId: string
      specPath: string
    }
  }

  'codegen/completed': {
    data: {
      taskId: string
      success: boolean
      generationId?: string
      error?: string
    }
  }

  // 部署事件
  'deploy/start': {
    data: {
      taskId: string
      projectId: string
    }
  }

  'deploy/completed': {
    data: {
      taskId: string
      success: boolean
      deploymentId?: string
      url?: string
      error?: string
    }
  }

  // Modal Formulation 完成事件
  'modal/formulation-complete': {
    data: {
      sessionId: string
      conversationId: string
      success: boolean
      schema_sql?: string
      entity_mapping?: string
      features?: Array<{ name: string; actionName: string; content: string }>
      validation?: {
        passed: boolean
        errors: string[]
        total_errors: number
      }
      error?: string
    }
  }
}

// ============================================================
// Inngest 客戶端實例
// ============================================================

export const inngest = new Inngest({
  id: 'tellcraft',
  schemas: new EventSchemas().fromRecord<Events>(),
})

// 匯出事件類型供其他模組使用
export type InngestEvents = Events
