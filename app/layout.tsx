import type { Metadata } from 'next'
import { ThemeProvider } from './components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tellcraft',
  description: 'Tellcraft - AI-driven automation platform for developers 泰爾工藝 用對話打造你的軟體產品',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
