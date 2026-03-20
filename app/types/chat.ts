export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  stage?: 'init' | 'init_progress' | 'discovery' | 'clarify' | 'prd_discovery_complete' | 'formulation_start' | 'formulation_progress' | 'formulation' | 'uiux' | 'uiux_template_picker' | 'generating' | 'deploying' | 'complete' | 'prefilter_rejected' | 'meta_response'
    | 'fast_generating'
    | 'es_init' | 'es_explore'
    | 'prd_discovery_analyzing' | 'prd_discovery_generating' | 'prd_discovery_deduping'
    | 'info' | 'error'
    | 'prd_discovery_continue' | 'clarify_question' | 'clarify_revert' | 'batch_confirm' | 'batch_confirmed'
    | 'formulation_complete' | 'spec_discovery_continue' | 'spec_discovery_complete' | 'spec_discovery_error'
    | 'spec_fix_start' | 'spec_fix_complete' | 'spec_fix_error'
    | 'spec_validating' | 'spec_actions_design' | 'spec_isa_config' | 'spec_complete'
    | 'spec_change_analyzing' | 'spec_change_confirm' | 'spec_rollback_select'
    | 'formulation_draft_review'
    | 'uiux_design_preference' | 'uiux_design_clarify' | 'uiux_design_clarify_complete'
    | 'uiux_design_brief_generating' | 'uiux_design_brief_confirm' | 'uiux_design_brief_adjusting'
    | 'uiux_prompt_template_selection' | 'uiux_prompt_variant_selection' | 'uiux_variants_generating' | 'uiux_variants_ready'
    | 'uiux_generation_complete' | 'uiux_pipeline_progress'
    | 'uiux_structure_generating' | 'uiux_structure_complete' | 'uiux_animation_generating' | 'uiux_animation_complete' | 'uiux_rwd_generating'
    | 'uiux_quality_gate_running' | 'uiux_quality_gate_fixing' | 'uiux_quality_gate_complete'
    | 'uiux_complete' | 'uiux_iterating' | 'uiux_iteration_complete'
    | 'deployer_checking' | 'deployer_deploying' | 'deployer_code_sync' | 'deployer_complete' | 'deployer_error' | 'deployer_cancelled' | 'deployer_rolling_back' | 'deployer_rollback_select'
    | 'domain_searching' | 'domain_confirm_purchase' | 'domain_registering' | 'domain_own_setup' | 'domain_dns_verifying' | 'domain_complete' | 'domain_failed'
    | 'db_provisioning' | 'db_complete' | 'db_failed'
    | 'spec_dry_run' | 'spec_dry_run_warning'
    | 'coder_error' | 'coder_testing' | 'coder_generating'
  progress?: { current: number; total: number; step: string }
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'variant_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report' | 'deploy_progress' | 'deploy_result' | 'deployment_history' | 'fast_build_progress' | 'building_progress'
      | 'domain_search_result' | 'domain_progress' | 'domain_dns_instructions' | 'domain_registrant_form' | 'domain_complete_result'
      | 'db_schema_preview' | 'db_provision_result'
    data: Record<string, unknown>
  }
  quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
  pending?: boolean
}

export interface SessionInfo {
  userId: string
  projectId: string
  conversationId: string
  currentTaskId?: string
  isAuthenticated?: boolean
  hasHistory?: boolean
  readOnly?: boolean
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
}

export interface ConversationItem {
  id: string
  projectId: string
  projectName: string
  lastMessage?: string
  messageCount: number
  updatedAt: string
  createdAt: string
}

// INTERNAL_COMMAND_LABELS keys -> command namespace keys
export const COMMAND_KEYS: Record<string, string> = {
  '__go_back__': 'goBack',
  '__retry__': 'retry',
  '__accept_proposal__': 'accept',
  '__reject_proposal__': 'reject',
  '__auto_adopt_all__': 'autoAdopt',
  '__upload_template__': 'uploadTemplate',
  '__retry_db_provision__': 'retryDbProvision',
  '__deploy_without_coder__': 'deployFrontendOnly',
  '__connect_database__': 'connectDatabase',
  '__verify_backend__': 'verifyBackend',
}
