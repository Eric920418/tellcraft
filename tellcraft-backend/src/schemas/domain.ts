import { z } from 'zod'

// 域名格式驗證（支援子域名和常見 TLD）
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/

export const checkDomainSchema = z.object({
  domain: z.string()
    .min(3)
    .max(255)
    .regex(DOMAIN_REGEX, '無效的域名格式'),
})

export const createDnsRecordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX']),
  name: z.string().min(1).max(255),
  content: z.string().min(1).max(1024),
  ttl: z.number().int().min(1).max(86400).optional().default(1),
  proxied: z.boolean().optional().default(false),
})

export const registrantSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  address: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
})

export type RegistrantInfo = z.infer<typeof registrantSchema>
export type CreateDnsRecordInput = z.infer<typeof createDnsRecordSchema>
