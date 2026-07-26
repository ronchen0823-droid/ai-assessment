import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10
const REPORT_MAX_REQUESTS = 3

const ipHits = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri
  return 'unknown'
}

function isRateLimited(ip: string, maxRequests: number): boolean {
  const now = Date.now()
  const record = ipHits.get(ip)

  if (!record || now > record.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  record.count++
  return record.count > maxRequests
}

export function withRateLimit(
  handler: (req: NextRequest, ctx: any) => Promise<Response>,
  options: { maxRequests?: number } = {}
) {
  const max = options.maxRequests ?? RATE_LIMIT_MAX_REQUESTS

  return async function (req: NextRequest, ctx: any) {
    const ip = getClientIp(req)

    if (isRateLimited(ip, max)) {
      return new Response(
        JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    return handler(req, ctx)
  }
}

export { REPORT_MAX_REQUESTS }
