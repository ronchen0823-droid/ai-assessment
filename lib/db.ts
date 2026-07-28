// lib/db.ts
// 统一数据访问层：Vercel / 云端 PostgreSQL 用 Prisma，本地开发无数据库时降级为 JSON 文件
// Serverless 安全：PrismaClient 通过 globalThis 缓存为单例，避免连接池耗尽

import { devStore } from './dev-store'
import type { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────
// PrismaClient 懒加载单例（Serverless 安全）
// 每次冷启动只会创建一个实例，通过 globalThis 跨模块请求共享
// ─────────────────────────────────────────────

type PrismaGlobal = {
  client: PrismaClient | null
  attempted: boolean
}

const globalForPrisma = globalThis as unknown as { __prisma: PrismaGlobal | undefined }

function getPrismaSingleton(): PrismaClient | null {
  // 缓存命中：上次加载成功
  if (globalForPrisma.__prisma?.client) {
    return globalForPrisma.__prisma.client
  }
  // 缓存命中：上次加载失败，不再重试
  if (globalForPrisma.__prisma?.attempted) {
    return null
  }

  // 首次尝试加载
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = { client: null, attempted: false }
  }

  try {
    const { PrismaClient } = require('@prisma/client')
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    })
    globalForPrisma.__prisma.client = client
    globalForPrisma.__prisma.attempted = true
    return client
  } catch {
    globalForPrisma.__prisma.attempted = true
    return null
  }
}

// ─────────────────────────────────────────────
// 环境判断
// ─────────────────────────────────────────────

function isCloudPlatform(): boolean {
  // Vercel
  if (process.env.VERCEL || process.env.VERCEL_ENV) return true
  // 其他云端平台常见环境变量
  if (process.env.RAILWAY_ENVIRONMENT || process.env.FLY_APP_NAME || process.env.RENDER) return true
  // 通用：有真实的 PostgreSQL 连接串（排除示例值）
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('user:password@localhost') &&
    process.env.DATABASE_URL.startsWith('postgres')
  ) {
    return true
  }
  return false
}

export function getStore() {
  // 云端平台 / 有真实数据库 → Prisma
  if (isCloudPlatform()) {
    const prisma = getPrismaSingleton()
    if (prisma) return prisma
    console.error('[db] 云端环境但 Prisma 加载失败，降级为 JSON 文件存储')
    return devStore
  }

  // 本地开发：如果有真实 DATABASE_URL，尝试 Prisma
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('user:password@localhost') &&
    process.env.DATABASE_URL.startsWith('postgres')
  ) {
    const prisma = getPrismaSingleton()
    if (prisma) return prisma
  }

  // 降级为 JSON 文件存储
  console.warn('[store] 使用本地 JSON 文件存储（无 PostgreSQL），数据保存在 .data/ 目录')
  return devStore
}

// ─────────────────────────────────────────────
// 向后兼容：prisma 导出（通过 getStore 获取，避免独立实例）
// 仅在 DATABASE_URL 为真实 PostgreSQL 时可用
// ─────────────────────────────────────────────

export function getPrismaClient(): PrismaClient | null {
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('user:password@localhost') &&
    process.env.DATABASE_URL.startsWith('postgres')
  ) {
    return getPrismaSingleton()
  }
  return null
}

// 向后兼容别名（避免修改所有引用处，逐步废弃）
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaSingleton()
    if (!client) {
      throw new Error('PrismaClient 不可用：未配置 PostgreSQL 数据库')
    }
    return (client as any)[prop]
  },
})

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

export type Grade = 'primary' | 'middle' | 'senior'

export type AssessmentStage =
  | 'assessed'
  | 'report_viewed'
  | 'camp_signup'
  | 'course_signup'

export type AssessmentCreateInput = {
  grade:          Grade
  channel?:       string
  utmSource?:     string
  utmCampaign?:   string
  childToken?:    string

  parentAnswers:  Record<string, string>
  studentAnswers: Record<string, string>
  parentOpen?:    string
  studentOpen?:   string

  scores:         any

  scoreDefine:    number
  scoreJudge:     number
  scoreIntegrate: number
  defLevel:       string
  judgeLevel:     string
  intLevel:       string
  weakestDim:     string
  contradiction:  string
  reliability:    string

  parentUserType?:  string
  parentPainpoint?: string
}

// ─────────────────────────────────────────────
// childToken 工具函数
// ─────────────────────────────────────────────

export function generateChildToken(
  phoneLast4:   string,
  birthYear:    string,
  nameInitial?: string
): string {
  const initial = nameInitial
    ? nameInitial.trim().charAt(0).toUpperCase().replace(/[^A-Z]/g, '')
    : ''
  return `${phoneLast4}${birthYear}${initial}`
}

// ─────────────────────────────────────────────
// 数据访问辅助函数（依赖 PrismaClient，仅在 PostgreSQL 环境下可用）
// ─────────────────────────────────────────────

function ensurePrisma(): PrismaClient {
  const client = getPrismaSingleton()
  if (!client) {
    throw new Error('此功能需要 PostgreSQL 数据库，当前环境不可用')
  }
  return client
}

export async function createAssessment(data: AssessmentCreateInput) {
  const client = ensurePrisma()
  return client.assessment.create({ data })
}

export async function saveReport(
  assessmentId: string,
  report:       Record<string, string>
) {
  const client = ensurePrisma()
  return client.assessment.update({
    where: { id: assessmentId },
    data: {
      report,
      reportGenAt:    new Date(),
      stage:          'report_viewed',
      stageUpdatedAt: new Date(),
    },
  })
}

export async function updateStage(
  assessmentId: string,
  stage:        AssessmentStage
) {
  const client = ensurePrisma()
  return client.assessment.update({
    where: { id: assessmentId },
    data:  { stage, stageUpdatedAt: new Date() },
  })
}

export async function getAssessmentsByChild(childToken: string) {
  const client = ensurePrisma()
  return client.assessment.findMany({
    where:   { childToken },
    orderBy: { createdAt: 'asc' },
    select: {
      id:             true,
      createdAt:      true,
      grade:          true,
      scoreDefine:    true,
      scoreJudge:     true,
      scoreIntegrate: true,
      defLevel:       true,
      judgeLevel:     true,
      intLevel:       true,
      weakestDim:     true,
      report:         true,
      stage:          true,
    },
  })
}

// ─────────────────────────────────────────────
// 训练营前后对比摘要
// ─────────────────────────────────────────────

export type ProgressSummary =
  | { hasHistory: false }
  | {
      hasHistory: true
      before: { date: Date; define: number; judge: number; integrate: number }
      after:  { date: Date; define: number; judge: number; integrate: number }
      improvement: { define: number; judge: number; integrate: number }
      significantImprovement: { define: boolean; judge: boolean; integrate: boolean }
    }

export async function buildProgressSummary(childToken: string): Promise<ProgressSummary> {
  const records = await getAssessmentsByChild(childToken)
  if (records.length < 2) return { hasHistory: false }

  const first = records[0]
  const last  = records[records.length - 1]

  const improvement = {
    define:    parseFloat((last.scoreDefine    - first.scoreDefine).toFixed(2)),
    judge:     parseFloat((last.scoreJudge     - first.scoreJudge).toFixed(2)),
    integrate: parseFloat((last.scoreIntegrate - first.scoreIntegrate).toFixed(2)),
  }

  return {
    hasHistory: true,
    before: {
      date:      first.createdAt,
      define:    first.scoreDefine,
      judge:     first.scoreJudge,
      integrate: first.scoreIntegrate,
    },
    after: {
      date:      last.createdAt,
      define:    last.scoreDefine,
      judge:     last.scoreJudge,
      integrate: last.scoreIntegrate,
    },
    improvement,
    significantImprovement: {
      define:    improvement.define    >= 0.5,
      judge:     improvement.judge     >= 0.5,
      integrate: improvement.integrate >= 0.5,
    },
  }
}

// ─────────────────────────────────────────────
// 漏斗数据查询
// ─────────────────────────────────────────────

export type FunnelGranularity = 'day' | 'week' | 'month' | 'total'

export type FunnelStatsItem = {
  channel:      string | null
  stage:        string
  count:        number
  periodStart?: Date
}

export async function getFunnelStats(params: {
  from:         Date
  to:           Date
  granularity?: FunnelGranularity
  channel?:     string
}): Promise<FunnelStatsItem[]> {
  const client = ensurePrisma()
  const { from, to, granularity = 'total', channel } = params

  if (granularity === 'total') {
    const result = await client.assessment.groupBy({
      by:    ['channel', 'stage'],
      where: {
        createdAt: { gte: from, lte: to },
        ...(channel ? { channel } : {}),
      },
      _count: { id: true },
    })
    return result.map((r: { channel: string | null; stage: string; _count: { id: number } }) => ({
      channel: r.channel,
      stage:   r.stage,
      count:   r._count.id,
    }))
  }

  const records = await client.assessment.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(channel ? { channel } : {}),
    },
    select:  { channel: true, stage: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  function getPeriodStart(date: Date, g: FunnelGranularity): Date {
    const d = new Date(date)
    if (g === 'day') {
      d.setHours(0, 0, 0, 0)
    } else if (g === 'week') {
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      d.setHours(0, 0, 0, 0)
    } else if (g === 'month') {
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
    }
    return d
  }

  const buckets = new Map<string, FunnelStatsItem>()
  for (const r of records) {
    const periodStart = getPeriodStart(r.createdAt, granularity)
    const key = `${r.channel ?? '__none__'}|${r.stage}|${periodStart.toISOString()}`
    if (!buckets.has(key)) {
      buckets.set(key, { channel: r.channel, stage: r.stage, count: 0, periodStart })
    }
    buckets.get(key)!.count++
  }

  return Array.from(buckets.values()).sort(
    (a, b) => (a.periodStart?.getTime() ?? 0) - (b.periodStart?.getTime() ?? 0)
  )
}

// ─────────────────────────────────────────────
// 渠道转化率
// ─────────────────────────────────────────────

export type ChannelConversionRate = {
  channel:            string | null
  totalAssessed:      number
  reportViewed:       number
  campSignup:         number
  courseSignup:       number
  reportViewRate:     number
  campConversionRate: number
  overallConvRate:    number
}

export async function getChannelConversionRates(
  from: Date,
  to:   Date
): Promise<ChannelConversionRate[]> {
  const client = ensurePrisma()
  const result = await client.assessment.groupBy({
    by:    ['channel', 'stage'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })

  const channelMap = new Map<string | null, Record<string, number>>()

  for (const r of result as { channel: string | null; stage: string; _count: { id: number } }[]) {
    const ch = r.channel
    if (!channelMap.has(ch)) {
      channelMap.set(ch, { assessed: 0, report_viewed: 0, camp_signup: 0, course_signup: 0 })
    }
    const stages = channelMap.get(ch)!
    stages[r.stage] = (stages[r.stage] ?? 0) + r._count.id
  }

  const rates: ChannelConversionRate[] = []

  for (const [channel, stages] of channelMap.entries()) {
    const totalAssessed = Object.values(stages).reduce((a, b) => a + b, 0)
    const reportViewed  = (stages.report_viewed ?? 0) + (stages.camp_signup ?? 0) + (stages.course_signup ?? 0)
    const campSignup    = (stages.camp_signup   ?? 0) + (stages.course_signup ?? 0)
    const courseSignup  =  stages.course_signup ?? 0

    rates.push({
      channel,
      totalAssessed,
      reportViewed,
      campSignup,
      courseSignup,
      reportViewRate:     totalAssessed > 0 ? parseFloat((reportViewed  / totalAssessed).toFixed(3)) : 0,
      campConversionRate: reportViewed  > 0 ? parseFloat((campSignup    / reportViewed ).toFixed(3)) : 0,
      overallConvRate:    totalAssessed > 0 ? parseFloat((courseSignup  / totalAssessed).toFixed(3)) : 0,
    })
  }

  return rates.sort((a, b) => b.totalAssessed - a.totalAssessed)
}

// ─────────────────────────────────────────────
// 报告质量复盘
// ─────────────────────────────────────────────

export type QualityReviewFilter = {
  grade?:         Grade
  weakestDim?:    string
  contradiction?: string
  reliability?:   string
  hasReport?:     boolean
  from?:          Date
  to?:            Date
  limit?:         number
}

export async function getAssessmentQualityReview(filter: QualityReviewFilter = {}) {
  const client = ensurePrisma()
  const { Prisma: P } = require('@prisma/client')
  const {
    grade, weakestDim, contradiction, reliability, hasReport,
    from, to, limit = 50,
  } = filter

  return client.assessment.findMany({
    where: {
      ...(grade         ? { grade }         : {}),
      ...(weakestDim    ? { weakestDim }    : {}),
      ...(contradiction ? { contradiction } : {}),
      ...(reliability   ? { reliability }   : {}),
      ...(hasReport === true ? { report: { not: P.DbNull } } : {}),
      ...(hasReport === false ? { report: { equals: P.DbNull } } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    select: {
      id:              true,
      createdAt:       true,
      grade:           true,
      weakestDim:      true,
      contradiction:   true,
      reliability:     true,
      parentUserType:  true,
      parentPainpoint: true,
      scoreDefine:     true,
      scoreJudge:      true,
      scoreIntegrate:  true,
      report:          true,
      stage:           true,
      channel:         true,
    },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  })
}

// ─────────────────────────────────────────────
// 家长用户类型分布统计
// ─────────────────────────────────────────────

export async function getParentUserTypeDistribution(from: Date, to: Date) {
  const client = ensurePrisma()
  const result = await client.assessment.groupBy({
    by:    ['parentUserType', 'grade'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })
  return result.map((r: { parentUserType: string | null; grade: string; _count: { id: number } }) => ({
    parentUserType: r.parentUserType,
    grade: r.grade,
    count: r._count.id,
  }))
}
