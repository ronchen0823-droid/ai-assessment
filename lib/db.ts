import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ─────────────────────────────────────────────
// Prisma Schema（对应 schema.prisma）
// ─────────────────────────────────────────────
//
// model Assessment {
//   id            String    @id @default(cuid())
//   createdAt     DateTime  @default(now())
//
//   channel       String?
//   utmSource     String?
//   utmCampaign   String?
//
//   grade         String    // "primary" | "middle" | "senior"
//
//   // childToken 生成规则：手机后4位 + 出生年份 + 孩子姓名拼音首字母（大写）
//   // 示例："38762014Z"（后4位3876，2014年，姓张）
//   // 不强制唯一，按 createdAt 排序取最新（允许重测）
//   childToken      String?   @index
//
//   parentAnswers   Json      // { PA1: "B", PA2: "C", ... }
//   studentAnswers  Json      // { PB1: "A", PB2: "D", ... }
//   parentOpen      String?
//   studentOpen     String?
//
//   scoreDefine     Float
//   scoreJudge      Float
//   scoreIntegrate  Float
//   defLevel        String
//   judgeLevel      String
//   intLevel        String
//   weakestDim      String
//   contradiction   String    // 主矛盾类型（ScoringResult.contradiction.type）
//   reliability     String    // "high" | "medium" | "low"
//
//   parentUserType  String?   // "A" | "B" | "C" | "unknown"
//   parentPainpoint String?
//
//   report          Json?
//   reportGenAt     DateTime?
//
//   // assessed → report_viewed → camp_signup → course_signup
//   stage           String    @default("assessed")
//   stageUpdatedAt  DateTime?
//
//   enrollments     Enrollment[]
// }
//
// model Enrollment {
//   id           String      @id @default(cuid())
//   createdAt    DateTime    @default(now())
//   assessmentId String?
//   assessment   Assessment? @relation(fields: [assessmentId], references: [id])
//   childToken   String?
//   productType  String      // "camp_f1" | "course_primary" | "course_middle" | "course_senior"
//   grade        String
// }

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
// 用法：generateChildToken("3876", "2014", "Zhang") → "38762014Z"
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
// 数据访问
// ─────────────────────────────────────────────

export async function createAssessment(data: AssessmentCreateInput) {
  return prisma.assessment.create({ data })
}

export async function saveReport(
  assessmentId: string,
  report:       Record<string, string>
) {
  return prisma.assessment.update({
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
  return prisma.assessment.update({
    where: { id: assessmentId },
    data:  { stage, stageUpdatedAt: new Date() },
  })
}

export async function getAssessmentsByChild(childToken: string) {
  return prisma.assessment.findMany({
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
// 漏斗数据查询（支持按天/周/月聚合）
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
  const { from, to, granularity = 'total', channel } = params

  if (granularity === 'total') {
    const result = await prisma.assessment.groupBy({
      by:    ['channel', 'stage'],
      where: {
        createdAt: { gte: from, lte: to },
        ...(channel ? { channel } : {}),
      },
      _count: { id: true },
    })
    return result.map(r => ({
      channel: r.channel,
      stage:   r.stage,
      count:   r._count.id,
    }))
  }

  const records = await prisma.assessment.findMany({
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
      // 以周一为周起始（中国标准）
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
//
// 每条 Assessment 只存最新 stage，所以：
// totalAssessed = 各阶段数量之和
// reportViewed  = report_viewed + camp_signup + course_signup
// campSignup    = camp_signup   + course_signup
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
  const result = await prisma.assessment.groupBy({
    by:    ['channel', 'stage'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })

  const channelMap = new Map<string | null, Record<string, number>>()

  for (const r of result) {
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
// 报告质量复盘（按弱维度/矛盾类型/可靠性分组看样本）
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
  const {
    grade, weakestDim, contradiction, reliability, hasReport,
    from, to, limit = 50,
  } = filter

  return prisma.assessment.findMany({
    where: {
      ...(grade         ? { grade }         : {}),
      ...(weakestDim    ? { weakestDim }    : {}),
      ...(contradiction ? { contradiction } : {}),
      ...(reliability   ? { reliability }   : {}),
      ...(hasReport !== undefined
        ? { report: hasReport ? { not: null } : null }
        : {}),
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
  return prisma.assessment.groupBy({
    by:    ['parentUserType', 'grade'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })
}
