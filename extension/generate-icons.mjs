/**
 * generate-icons.mjs — 產 placeholder icons (16/32/48/128 PNG)
 *
 * 用最 minimal valid PNG（uncompressed IDAT）+ 純色方塊 + 簡單 T 字母
 * 不需要 canvas / sharp / 其他 native 依賴
 *
 * 取代成設計師 icons 之後直接刪此 script
 *
 * 用法：node generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = resolve(__dirname, 'icons')
mkdirSync(ICONS_DIR, { recursive: true })

// PNG signature
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  const crcInput = Buffer.concat([typeBuf, data])
  crcBuf.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// 畫 size x size 的 T 字母（白底深色 T，或反過來）
function drawTIcon(size) {
  // bg #0f172a slate-900, fg #ffffff
  const BG = [0x0f, 0x17, 0x2a, 0xff]
  const FG = [0xff, 0xff, 0xff, 0xff]

  // T 字母 bbox：水平條 + 垂直條
  // 水平條：top 25%-35%，width 70%（左右各 15% margin）
  // 垂直條：left 40%-60%，top 25%-80%
  const hBarTop = Math.round(size * 0.25)
  const hBarBottom = Math.round(size * 0.35)
  const hBarLeft = Math.round(size * 0.15)
  const hBarRight = Math.round(size * 0.85)
  const vBarLeft = Math.round(size * 0.40)
  const vBarRight = Math.round(size * 0.60)
  const vBarTop = hBarTop
  const vBarBottom = Math.round(size * 0.80)

  const isT = (x, y) => {
    if (y >= hBarTop && y < hBarBottom && x >= hBarLeft && x < hBarRight) return true
    if (y >= vBarTop && y < vBarBottom && x >= vBarLeft && x < vBarRight) return true
    return false
  }

  // RGBA raw bytes，prefix 每 row 一個 filter byte (0 = None)
  const rowLen = 1 + size * 4
  const raw = Buffer.alloc(rowLen * size)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0  // filter byte
    for (let x = 0; x < size; x++) {
      const color = isT(x, y) ? FG : BG
      const off = y * rowLen + 1 + x * 4
      raw[off] = color[0]
      raw[off + 1] = color[1]
      raw[off + 2] = color[2]
      raw[off + 3] = color[3]
    }
  }

  // IHDR: width, height, bit depth, color type (6=RGBA), compression(0), filter(0), interlace(0)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // IDAT: deflate raw
  const idat = deflateSync(raw)

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const sizes = [16, 32, 48, 128]
for (const size of sizes) {
  const png = drawTIcon(size)
  const fp = resolve(ICONS_DIR, `icon-${size}.png`)
  writeFileSync(fp, png)
  console.log(`✓ icons/icon-${size}.png (${png.length} bytes)`)
}
console.log(`✓ Done. 4 placeholder icons generated. 真實 icons 設計後直接覆蓋 ${ICONS_DIR}/icon-*.png`)
