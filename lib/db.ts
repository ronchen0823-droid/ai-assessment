// lib/db.ts
// v2 完整重构
//
// 核心改动：
// 1. 新增 parentUserType 和 parentPainpoint 字段（接收 scoring.ts v2 新输出）
// 2. childToken 生成维度优化：加入 childNameInitial 降低碰撞率
//    原版：手机后4位 + 出生年份 ≈ 13 万种组合，万级用户时碰撞率不可忽视
//    新版：手机后4位 + 出生年份 + 孩子姓名首字母 ≈ 338 万种组合
// 3. getFunnelStats 新增时间粒度参数（按天/周/月聚合），原版只能看总量
// 4. 新增 getAssessmentQualityReview：供运营按维度、矛盾类型复盘报告质量
// 5. 新增 getChannelConversionRates：计算各渠道的转化率而非只看数量
// 6. 所有类型定义与新 schema 完全对齐

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ─────────────────────────────────────────────
// Prisma Schema 设计说明（对应 schema.prisma）
// ─────────────────────────────────────────────
//
// model Assessment {
//   id            String    @id @default(cuid())
//   createdAt     DateTime  @default(now())
//
//   // 渠道追踪
//   channel       String?
//   utmSource     String?
//   utmCampaign   String?
//
//   // 学段
//   grade         String    // "primary" | "middle" | "senior"
//
//   // 孩子关联 token
//   // 生成规则：手机后4位 + 出生年份 + 孩子姓名拼音首字母（大写）
//   // 示例："38762014Z"（后4位3876，2014年，姓张）
//   // 不强制唯一，按 createdAt 排序取最新（允许重测）
//   childToken      String?   @index
//
//   // 完整答题内容
//   parentAnswers   Json      // { PA1: "B", PA2: "C", ... }
//   studentAnswers  Json      // { PB1: "A", PB2: "D", ... }
//   parentOpen      String?
//   studentOpen     String?
//
//   // 评分结果
//   scoreDefine     Float
//   scoreJudge      Float
//   scoreIntegrate  Float
//   defLevel        String
//   judgeLevel      String
//   intLevel        String
//   weakestDim      String
//   contradiction   String
//   reliability     String    // "high" | "medium" | "low"
//
//   // 【新增】家长画像信号
//   parentUserType  String?   // "A" | "B" | "C" | "unknown"
//   parentPainpoint String?   // 痛点题选项文本
//
//   // AI 报告
//   report          Json?
//   reportGenAt     DateTime?
//
//   // 转化阶段
//   stage           String    @default("assessed")
//   // assessed → report_viewed → camp_signup → course_signup
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
//
// ─────────────────────────────────────────────

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

  // v2：childToken 建议用新生成规则（见 generateChildToken 工具函数）
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

  // 【新增】
  parentUserType?:  string
  parentPainpoint?: string
}

// ─────────────────────────────────────────────
// childToken 生成工具函数
// ─────────────────────────────────────────────
// 原版只用「手机后4位 + 出生年份」，约 13 万种组合
// 新版加入孩子姓名拼音首字母（大写），约 338 万种组合，碰撞率降低 26 倍
//
// 用法：generateChildToken("3876", "2014", "Zhang") → "38762014Z"
// 如果没有姓名信息，退化为原版格式（仍然向下兼容）

export function generateChildToken(
  phoneLast4: string,
  birthYear: string,
  nameInitial?: string
): string {
  const initial = nameInitial
    ? nameInitial.trim().charAt(0).toUpperCase().replace(/[^A-Z]/g, '')
    : ''
  return `${phoneLast4}${birthYear}${initial}`
}

// ─────────────────────────────────────────────
// 数据访问函数
// ─────────────────────────────────────────────

/** 创建测评记录 */
export async function createAssessment(data: AssessmentCreateInput) {
  return prisma.assessment.create({ data })
}

/** 写入 AI 报告 */
export async function saveReport(
  assessmentId: string,
  report: Record<string, string>
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

/** 更新转化阶段 */
export async function updateStage(
  assessmentId: string,
  stage: AssessmentStage
) {
  return prisma.assessment.update({
    where: { id: assessmentId },
    data:  { stage, stageUpdatedAt: new Date() },
  })
}

/** 查找同一孩子的所有测评记录（用于训练营前后对比） */
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
      // 每个维度的提升是否显著（均分提升 ≥ 0.5 认为显著）
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
// 漏斗数据查询（运营复盘）
// ─────────────────────────────────────────────
// v2 新增 granularity 参数：支持按天/周/月分组
// 原版只能看总量，无法观察趋势

export type FunnelGranularity = 'day' | 'week' | 'month' | 'total'

export type FunnelStatsItem = {
  channel:    string | null
  stage:      string
  count:      number
  // 以下字段在 granularity !== 'total' 时有值
  periodStart?: Date
}

export async function getFunnelStats(params: {
  from:        Date
  to:          Date
  granularity?: FunnelGranularity
  channel?:    string   // 可选：只看某个渠道
}): Promise<FunnelStatsItem[]> {
  const { from, to, granularity = 'total', channel } = params

  // total 模式：直接用 groupBy（与原版一致）
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

  // day/week/month 模式：用原始查询 + 内存聚合
  // （Prisma 目前不支持 date_trunc，用 JS 处理）
  const records = await prisma.assessment.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(channel ? { channel } : {}),
    },
    select: {
      channel:   true,
      stage:     true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // 按时间粒度取区间起点
  function getPeriodStart(date: Date, g: FunnelGranularity): Date {
    const d = new Date(date)
    if (g === 'day') {
      d.setHours(0, 0, 0, 0)
    } else if (g === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
      d.setHours(0, 0, 0, 0)
    } else if (g === 'month') {
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
    }
    return d
  }

  // 内存聚合
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
// 渠道转化率计算（原版缺失）
// ─────────────────────────────────────────────
// 原版只有数量，无法判断哪个渠道质量更好
// 新版计算各渠道：测评数、报告查看数、训练营转化数、及对应转化率

export type ChannelConversionRate = {
  channel:            string | null
  totalAssessed:      number
  reportViewed:       number
  campSignup:         number
  courseSignup:       number
  reportViewRate:     number   // reportViewed / totalAssessed
  campConversionRate: number   // campSignup / reportViewed
  overallConvRate:    number   // courseSignup / totalAssessed
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

  // 按渠道聚合各阶段数量
  const channelMap = new Map<string | null, Record<string, number>>()

  for (const r of result) {
    const ch = r.channel
    if (!channelMap.has(ch)) {
      channelMap.set(ch, {
        assessed: 0, report_viewed: 0, camp_signup: 0, course_signup: 0,
      })
    }
    const stages = channelMap.get(ch)!
    stages[r.stage] = (stages[r.stage] ?? 0) + r._count.id
    // 所有阶段都算入 assessed 总数（包括 report_viewed 等后续阶段）
    if (r.stage !== 'assessed') {
      stages.assessed = (stages.assessed ?? 0) + r._count.id
    }
  }

  // 重新计算：totalAssessed = 所有阶段之和（每条记录只存最新阶段）
  // 所以直接用各阶段数量，不重复计算
  const rates: ChannelConversionRate[] = []

  for (const [channel, stages] of channelMap.entries()) {
    const totalAssessed  = Object.values(stages).reduce((a, b) => a + b, 0)
    const reportViewed   = (stages.report_viewed ?? 0) + (stages.camp_signup ?? 0) + (stages.course_signup ?? 0)
    const campSignup     = (stages.camp_signup ?? 0) + (stages.course_signup ?? 0)
    const courseSignup   = stages.course_signup ?? 0

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
// 报告质量复盘查询（原版缺失）
// ─────────────────────────────────────────────
// 供运营和产品按「弱维度」「矛盾类型」「可靠性」分组看样本，
// 便于判断哪类孩子的报告质量高、哪类需要改进 prompt

export type QualityReviewFilter = {
  grade?:        Grade
  weakestDim?:   string
  contradiction?: string
  reliability?:  string
  hasReport?:    boolean
  from?:         Date
  to?:           Date
  limit?:        number
}

export async function getAssessmentQualityReview(filter: QualityReviewFilter = {}) {
  const {
    grade, weakestDim, contradiction, reliability, hasReport,
    from, to, limit = 50,
  } = filter

  return prisma.assessment.findMany({
    where: {
      ...(grade        ? { grade }         : {}),
      ...(weakestDim   ? { weakestDim }    : {}),
      ...(contradiction? { contradiction } : {}),
      ...(reliability  ? { reliability }   : {}),
      ...(hasReport !== undefined ? { report: hasReport ? { not: null } : null } : {}),
      ...(from || to   ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    select: {
      id:             true,
      createdAt:      true,
      grade:          true,
      weakestDim:     true,
      contradiction:  true,
      reliability:    true,
      parentUserType: true,
      parentPainpoint:true,
      scoreDefine:    true,
      scoreJudge:     true,
      scoreIntegrate: true,
      report:         true,
      stage:          true,
      channel:        true,
    },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  })
}

// ─────────────────────────────────────────────
// 家长用户类型分布统计（新增）
// ─────────────────────────────────────────────
// 用于验证运营方案中 A/B/C 类用户的实际分布是否符合预期

export async function getParentUserTypeDistribution(from: Date, to: Date) {
  return prisma.assessment.groupBy({
    by:    ['parentUserType', 'grade'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })
}
