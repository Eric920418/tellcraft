import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

// Root layout: passthrough only. Actual <html>/<body> is in [locale]/layout.tsx
export default function RootLayout({ children }: Props) {
  return children
}
