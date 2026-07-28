import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { withRateLimit } from '@/lib/rate-limit'

const REQUIRED_REPORT_FIELDS = [
  'diagnosis', 'mirror', 'insight',
  'solution_essence', 'solution_why_usual_fails', 'solution_method', 'bridge',
]

const handleGET = async function (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getStore()
    const assessment = await store.assessment.findUnique({
      where: { id: params.id },
    })

    if (!assessment) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('查询报告失败:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

const handlePATCH = async function (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getStore()
    const body = await req.json()
    const { report, clientReportHash } = body

    if (!report || typeof report !== 'object') {
      return NextResponse.json({ error: '缺少 report 字段' }, { status: 400 })
    }

    for (const field of REQUIRED_REPORT_FIELDS) {
      if (!report[field] || typeof report[field] !== 'string' || report[field].trim().length === 0) {
        return NextResponse.json({ error: `报告字段 ${field} 缺失或无效` }, { status: 400 })
      }
    }

    const existing = await store.assessment.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    if (existing.report) {
      return NextResponse.json({ error: '报告已生成，不允许覆盖' }, { status: 409 })
    }

    const now = new Date()
    const assessment = await store.assessment.update({
      where: { id: params.id },
      data: {
        report: report as Record<string, string>,
        reportGenAt: now,
        stage: 'report_viewed',
        stageUpdatedAt: now,
      },
    })

    return NextResponse.json({
      id: assessment.id,
      report: assessment.report,
      reportGenAt: assessment.reportGenAt,
    })
  } catch (error) {
    console.error('更新报告失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET)
export const PATCH = withRateLimit(handlePATCH)