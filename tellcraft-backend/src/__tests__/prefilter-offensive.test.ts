import { describe, it, expect } from 'vitest'
import { checkInputQuality } from '../services/prefilter'

/**
 * Regression suite for L27：用戶實測「幹林娘」漏網讓 LLM 把它當設計偏好
 * 接受。本檔覆蓋台灣 / 中國 / 香港常見髒話變體，並確保善意輸入不誤殺。
 */

describe('prefilter: 台灣髒話變體必須攔截', () => {
  it.each([
    '幹林娘',           // 用戶實測 case：歷史上 /幹你/ 沒抓到
    '幹你娘',
    '幹恁娘',
    '幹拎娘',
    '幹妳娘',
    '操林娘',
    '肏拎娘',
    '幹你媽逼',
    '操你媽B',
    '幹林老師',
    '幹你老母',
    '幹三小',
    '幹什麼小',
    '機掰',
    '機八',
    '雞掰',
    '雞八',
    '幹機掰',
    '北七',
    '北爛',
    '白目',
    '智障',
    '低能',
    '蠢蛋',
    '婊子',
    '賤人',
    '賤婊',
    '王八蛋',
    '龜兒子',
    '他媽的',
    '你媽的',
    '去你媽的',
    '去他媽的',
    '哭爸',
    '哭夭',
  ])('攔截：%s', (msg) => {
    const r = checkInputQuality(msg, 'normal', 'zh')
    expect(r.quality).toBe('offensive')
  })
})

describe('prefilter: 香港 / 廣東髒話必須攔截', () => {
  it.each([
    '屌你老母',
    '丟你老母',
    '屌佢',
    '冚家鏟',
    '冚家剷',
    '仆街',
    '臭閪',
  ])('攔截 HK：%s', (msg) => {
    const r = checkInputQuality(msg, 'normal', 'zh')
    expect(r.quality).toBe('offensive')
  })
})

describe('prefilter: 英文髒話 + 偽裝變體必須攔截', () => {
  it.each([
    'fuck',
    'fuck you',
    'fucking',
    'f*ck',
    'f**k',
    'f-ck',
    'shit',
    'sh*t',
    'bitch',
    'b*tch',
    'asshole',
    'a**hole',
    'cunt',
    'twat',
    'wanker',
    'motherfucker',
    'piss off',
    'retard',
    'kys',
    'stfu',
    'gtfo',
  ])('攔截 EN：%s', (msg) => {
    const r = checkInputQuality(msg, 'normal', 'en')
    expect(r.quality).toBe('offensive')
  })
})

describe('prefilter: 不該誤殺的善意輸入', () => {
  it.each([
    '幹嘛',                 // = 做什麼
    '幹麻',                 // 同 幹嘛
    '幹練的設計師',         // 幹練 = competent
    '操作介面',             // 操作 ≠ 操你
    '我媽的禮物很漂亮',     // 我媽的 ≠ 你媽的；但風險：'媽的' 單獨可能被攔
    '雞肉料理',             // 雞 + 肉 (不是 雞八)
    '機械手錶',             // 機 + 械 (不是 機掰)
    '北七星汽水',           // 北七 在這裡是品牌名，借測 false positive
    '我家在台北',           // 北 + 平淡字
    '需要強烈的視覺',       // 強烈 ≠ 髒話
    'fucking awesome',      // 英文 fucking = 髒話（這個 SHOULD 被攔）
    'shipping address',     // ship + ping ≠ shit
    'hello world',          // 純善意
    '想要藍色系設計',
    'professional and clean',
  ])('不誤殺：%s', (msg) => {
    const isChinese = /[一-鿿]/.test(msg)
    const r = checkInputQuality(msg, 'normal', isChinese ? 'zh' : 'en')
    // 注意：fucking awesome 會被攔（這是預期行為，包含於 above 列表只是測試 boundary）
    if (msg === 'fucking awesome') {
      expect(r.quality).toBe('offensive')
      return
    }
    // 其他必須通過
    expect(r.quality).not.toBe('offensive')
  })

  it('「北七星汽水」與「我家在台北」確實不被誤殺', () => {
    // 邊界：北七 / 北爛 用 \b 邊界限制純整詞
    expect(checkInputQuality('北七星汽水', 'normal', 'zh').quality).not.toBe('offensive')
    expect(checkInputQuality('我家在台北', 'normal', 'zh').quality).not.toBe('offensive')
  })
})
