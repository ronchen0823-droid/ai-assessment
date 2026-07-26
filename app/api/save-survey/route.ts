import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { ScoringResult } from '@/lib/scoring'
import { withRateLimit } from '@/lib/rate-limit'

const VALID_GRADES = ['primary', 'middle', 'senior']
const VALID_ANSWER_VALUES = ['A', 'B', 'C', 'D']
const VALID_DIMENSION_LEVELS = ['not_established', 'emerging', 'developing', 'established', 'strong']
const VALID_CONTRADICTION_TYPES = [
  'none', 'parent_overestimates', 'child_overestimates_self',
  'parent_says_worry_acts_passive', 'child_knows_but_doesnt_do', 'parent_self_dependency',
]
const VALID_RELIABILITY = ['high', 'medium', 'low']

function validateAnswers(answers: unknown): boolean {
  if (!answers || typeof answers !== 'object') return false
  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof key !== 'string' || typeof value !== 'string') return false
    if (!VALID_ANSWER_VALUES.includes(value)) return false
  }
  return true
}

function validateScores(scores: ScoringResult): boolean {
  if (!scores || typeof scores !== 'object') return false
  for (const dim of ['active_define', 'active_judge', 'active_integrate'] as const) {
    const d = scores[dim]
    if (!d || typeof d.raw !== 'number' || d.raw < 1 || d.raw > 4) return false
    if (!VALID_DIMENSION_LEVELS.includes(d.level)) return false
  }
  if (!VALID_CONTRADICTION_TYPES.includes(scores.contradiction?.type)) return false
  if (!VALID_RELIABILITY.includes(scores.reliability)) return false
  return true
}

const handlePOST = async function (req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, parent_open, student_open, scores } = body

    if (!grade_level || !VALID_GRADES.includes(grade_level)) {
      return NextResponse.json({ error: '学段参数无效' }, { status: 400 })
    }
    if (!validateAnswers(parent_answers)) {
      return NextResponse.json({ error: '家长答案格式无效' }, { status: 400 })
    }
    if (!validateAnswers(student_answers)) {
      return NextResponse.json({ error: '学生答案格式无效' }, { status: 400 })
    }
    if (!validateScores(scores)) {
      return NextResponse.json({ error: '评分结果无效' }, { status: 400 })
    }
    if (parent_open && (typeof parent_open !== 'string' || parent_open.length > 2000)) {
      return NextResponse.json({ error: '家长开放题回答过长' }, { status: 400 })
    }
    if (student_open && (typeof student_open !== 'string' || student_open.length > 2000)) {
      return NextResponse.json({ error: '学生开放题回答过长' }, { status: 400 })
    }

    const s = scores as ScoringResult

    const assessment = await prisma.assessment.create({
      data: {
        grade: grade_level,
        parentAnswers: parent_answers,
        studentAnswers: student_answers,
        parentOpen: parent_open || null,
        studentOpen: student_open || null,
        scores: s as unknown as Prisma.InputJsonValue,
        scoreDefine: s.active_define.raw,
        scoreJudge: s.active_judge.raw,
        scoreIntegrate: s.active_integrate.raw,
        defLevel: s.active_define.level,
        judgeLevel: s.active_judge.level,
        intLevel: s.active_integrate.level,
        weakestDim: s.weakest_dimension,
        contradiction: s.contradiction.type,
        reliability: s.reliability,
        parentUserType: s.parentUserType,
        parentPainpoint: s.parentPainpoint || null,
      },
    })

    return NextResponse.json({ id: assessment.id })
  } catch (error) {
    console.error('保存数据失败:', error)
    return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePOST)
