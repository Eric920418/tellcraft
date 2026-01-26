import type { Metadata } from 'next'
import { ThemeProvider } from './components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-Genesis',
  description: 'Platform Administration',
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
