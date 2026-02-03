import { NextResponse } from 'next/server'

// ============================================================
// Inngest API Route - 已遷移到 VPS
// ============================================================

// Inngest 功能已遷移到 VPS Backend (54.238.4.117:8080)
// 這個 route 僅保留用於兼容性，實際處理由 VPS 的 BullMQ Worker 執行

export async function GET() {
  return NextResponse.json({
    status: 'migrated',
    message: 'Inngest orchestrator has been migrated to VPS backend',
    vps_endpoint: 'http://54.238.4.117:8080',
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'migrated',
    message: 'Please use VPS API endpoint instead',
    vps_endpoint: 'http://54.238.4.117:8080',
  }, { status: 410 }) // 410 Gone
}

export async function PUT() {
  return NextResponse.json({
    status: 'migrated',
    message: 'Please use VPS API endpoint instead',
    vps_endpoint: 'http://54.238.4.117:8080',
  }, { status: 410 })
}
