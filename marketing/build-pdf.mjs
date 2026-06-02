// 把 tellcraft-animation-script.html 渲染成 PDF。
// 用 puppeteer-core + 系統已安裝的 Chrome/Chromium（不下載額外 binary）。
// 執行：node marketing/build-pdf.mjs
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, statSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HTML = join(__dirname, 'tellcraft-animation-script.html')
const OUT = join(__dirname, 'Tellcraft-動畫腳本.pdf')

// 與後端 reference-analyzer.ts 一致的啟動參數
const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--no-first-run',
]

// 依序尋找可用的 Chrome/Chromium 執行檔
function resolveChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean)
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  // 遵守「所有錯誤完整顯示」：找不到就大聲報錯 + 給出修正方式
  throw new Error(
    `找不到可用的 Chrome/Chromium 執行檔。已嘗試：\n` +
      candidates.map((c) => `  - ${c}`).join('\n') +
      `\n\n修正方式：安裝 Google Chrome，或設定環境變數 PUPPETEER_EXECUTABLE_PATH 指向你的瀏覽器執行檔，例如：\n` +
      `  PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node marketing/build-pdf.mjs`,
  )
}

async function main() {
  if (!existsSync(HTML)) throw new Error(`找不到來源 HTML：${HTML}`)
  const executablePath = resolveChrome()
  console.log(`使用瀏覽器：${executablePath}`)

  const browser = await puppeteer.launch({ executablePath, headless: true, args: PUPPETEER_ARGS })
  try {
    const page = await browser.newPage()
    await page.goto(`file://${HTML}`, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: OUT,
      format: 'A4',
      printBackground: true, // 印出深色封面背景
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }

  const kb = (statSync(OUT).size / 1024).toFixed(0)
  console.log(`✅ PDF 已生成：${OUT}（${kb} KB）`)
}

main().catch((err) => {
  console.error('\n❌ PDF 生成失敗：\n' + (err?.stack || err?.message || String(err)))
  process.exit(1)
})
