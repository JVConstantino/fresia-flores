import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'fresia-nextjs',
    status: 'ok',
    timestamp: Date.now(),
  })
}
