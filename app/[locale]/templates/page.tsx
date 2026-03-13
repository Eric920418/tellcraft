import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import TemplatesPage from './TemplatesPage'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('templatesTitle'),
    description: t('templatesDescription'),
  }
}

export default function Page() {
  return <TemplatesPage />
}
