// lib/db.ts
// 核心目标：支撑三件事
// 1. 训练营前后的思维主导权对比（需要关联同一个孩子的多次测评）
// 2. 漏斗追踪（从哪个渠道进来、测评→训练营→正式课的转化）
// 3. 报告质量迭代（存完整答案和报告，便于复盘哪类孩子的分析效果好）

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
//   // 渠道追踪（漏斗分析用）
//   channel       String?   // 从哪个入口进来，如 "douyin_video_42" / "xiaohongshu" / "direct"
//   utmSource     String?
//   utmCampaign   String?
//
//   // 学段
//   grade         String    // "primary" | "middle" | "senior"
//
//   // 孩子关联 token（用于前后对比，不存真实信息）
//   // 生成规则：家长手机号后4位 + 孩子出生年份，如 "38762014"
//   // 不强制唯一，允许重复（家长可能重测），按 createdAt 排序取最新
//   childToken    String?   @index
//
//   // 完整答题内容（JSON 存储，方便后期分析）
//   parentAnswers  Json     // { PA1: "B", PA2: "C", ... }
//   studentAnswers Json     // { PB1: "A", PB2: "D", ... }
//   parentOpen     String?  // 家长开放题
//   studentOpen    String?  // 学生开放题
//
//   // 评分结果
//   scoreDefine    Float    // active_define raw score
//   scoreJudge     Float    // active_judge raw score
//   scoreIntegrate Float    // active_integrate raw score
//   defLevel       String   // DimensionLevel 枚举值
//   judgeLevel     String
//   intLevel       String
//   weakestDim     String   // 最弱维度
//   contradiction  String   // ContradictionType
//   reliability    String   // "high" | "medium" | "low"
//
//   // AI 生成的报告（JSON 存储）
//   report         Json?    // 七个字段完整存储
//   reportGenAt    DateTime?
//
//   // 转化状态
//   stage          String   @default("assessed")
//   // assessed → report_viewed → camp_signup → course_signup
//   stageUpdatedAt DateTime?
//
//   // 关联的训练营和课程记录
//   enrollments    Enrollment[]
// }
//
// model Enrollment {
//   id           String    @id @default(cuid())
//   createdAt    DateTime  @default(now())
//   assessmentId String?
//   assessment   Assessment? @relation(fields: [assessmentId], references: [id])
//   childToken   String?   // 即使 assessment 被删除也能关联
//   productType  String    // "camp_f1" | "course_primary" | "course_middle" | "course_senior"
//   grade        String
// }
//
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 类型定义（与 schema 对齐）
// ─────────────────────────────────────────────

export type AssessmentCreateInput = {
  grade:          'primary' | 'middle' | 'senior'
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
}

export type ReportUpdateInput = {
  report:        Record<string, string>
  reportGenAt:   Date
}

// ─────────────────────────────────────────────
// 数据访问函数
// ─────────────────────────────────────────────

/** 创建一条测评记录（答题完成时调用） */
export async function createAssessment(data: AssessmentCreateInput) {
  return prisma.assessment.create({ data })
}

/** 把 AI 报告写入测评记录 */
export async function saveReport(assessmentId: string, report: Record<string, string>) {
  return prisma.assessment.update({
    where: { id: assessmentId },
    data:  {
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
  stage: 'assessed' | 'report_viewed' | 'camp_signup' | 'course_signup'
) {
  return prisma.assessment.update({
    where: { id: assessmentId },
    data:  { stage, stageUpdatedAt: new Date() },
  })
}

/**
 * 查找同一个孩子的历史测评记录
 * 用于「训练营前后对比」——拿最早一条 vs 最新一条
 */
export async function getAssessmentsByChild(childToken: string) {
  return prisma.assessment.findMany({
    where:   { childToken },
    orderBy: { createdAt: 'asc' },
    select: {
      id:            true,
      createdAt:     true,
      grade:         true,
      scoreDefine:   true,
      scoreJudge:    true,
      scoreIntegrate: true,
      defLevel:      true,
      judgeLevel:    true,
      intLevel:      true,
      weakestDim:    true,
      report:        true,
      stage:         true,
    },
  })
}

/**
 * 生成前后对比摘要
 * 供训练营结营报告和续报 F2 时使用
 */
export async function buildProgressSummary(childToken: string): Promise<{
  hasHistory:   boolean
  before?:      { date: Date; define: number; judge: number; integrate: number }
  after?:       { date: Date; define: number; judge: number; integrate: number }
  improvement?: { define: number; judge: number; integrate: number }
} | null> {
  const records = await getAssessmentsByChild(childToken)
  if (records.length < 2) {
    return { hasHistory: false }
  }

  const first = records[0]
  const last  = records[records.length - 1]

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
    improvement: {
      define:    parseFloat((last.scoreDefine    - first.scoreDefine).toFixed(2)),
      judge:     parseFloat((last.scoreJudge     - first.scoreJudge).toFixed(2)),
      integrate: parseFloat((last.scoreIntegrate - first.scoreIntegrate).toFixed(2)),
    },
  }
}

/**
 * 漏斗数据查询（运营复盘用）
 * 返回各渠道的测评数、报告查看数、训练营转化数
 */
export async function getFunnelStats(from: Date, to: Date) {
  const result = await prisma.assessment.groupBy({
    by:     ['channel', 'stage'],
    where:  { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  })
  return result
}
