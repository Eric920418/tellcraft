import { NextResponse } from 'next/server'

// ============================================================
// Inngest API Route - 已遷移到 VPS（靜默處理）
// ============================================================

// Inngest 功能已遷移到 VPS Backend
// 這個 route 返回 200 OK 讓 Inngest Integration 安靜

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST() {
  return NextResponse.json({ status: 'ok' })
}

export async function PUT() {
  return NextResponse.json({ status: 'ok' })
}
