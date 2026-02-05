import SaasMinimal from './SaasMinimal'
import SaasPro from './SaasPro'
import LandingStartup from './LandingStartup'
import LandingCorporate from './LandingCorporate'
import EcommerceModern from './EcommerceModern'

export { SaasMinimal, SaasPro, LandingStartup, LandingCorporate, EcommerceModern }

// 模板組件映射（slug -> 組件）
export const TemplateComponents: Record<string, React.ComponentType<{ containerWidth: number }>> = {
  'saas-minimal': SaasMinimal,
  'saas-pro': SaasPro,
  'landing-startup': LandingStartup,
  'landing-corporate': LandingCorporate,
  'ecommerce-modern': EcommerceModern,
}

// 支援的模板 slug 列表
export const SUPPORTED_TEMPLATE_SLUGS = [
  'saas-minimal',
  'saas-pro',
  'landing-startup',
  'landing-corporate',
  'ecommerce-modern',
] as const

export type SupportedTemplateSlug = typeof SUPPORTED_TEMPLATE_SLUGS[number]

// 檢查是否為支援的模板
export function isSupportedTemplate(slug: string): slug is SupportedTemplateSlug {
  return SUPPORTED_TEMPLATE_SLUGS.includes(slug as SupportedTemplateSlug)
}
