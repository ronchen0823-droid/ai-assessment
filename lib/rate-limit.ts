import { NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10
const REPORT_MAX_REQUESTS = 3

// 内存 Map 作为基础速率限制
// 注意：Serverless 环境下不同实例各自维护独立 Map，无法全局共享状态
// 这是"尽力而为"的防护层。如需严格的全局限流，应使用 Redis 等外部存储
const ipHits = new Map<string, { count: number; resetAt: number }>()

// 定期清理过期条目，防止内存泄漏
const CLEANUP_INTERVAL_MS = 5 * 60_000 // 每5分钟清理一次
let lastCleanup = 0

function cleanupStale() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [ip, record] of ipHits) {
    if (now > record.resetAt) {
      ipHits.delete(ip)
    }
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri
  return 'unknown'
}

function isRateLimited(ip: string, maxRequests: number): boolean {
  cleanupStale()
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
