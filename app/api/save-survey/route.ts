import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { calculateScores } from '@/lib/scoring'
import type { ScoringResult } from '@/lib/scoring'
import { withRateLimit } from '@/lib/rate-limit'
import { QUESTIONS } from '@/lib/questions'

const VALID_GRADES = ['primary', 'middle', 'senior'] as const
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

function validateAnswerKeysBelong(
  grade: string,
  answers: Record<string, string>
): boolean {
  const validKeys = new Set<string>()
  for (const q of QUESTIONS[grade as keyof typeof QUESTIONS].partA) validKeys.add(q.id)
  for (const q of QUESTIONS[grade as keyof typeof QUESTIONS].partB) validKeys.add(q.id)
  for (const key of Object.keys(answers)) {
    if (!validKeys.has(key)) return false
  }
  return true
}

const handlePOST = async function (req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, parent_open, student_open } = body

    if (!grade_level || !VALID_GRADES.includes(grade_level)) {
      return NextResponse.json({ error: '学段参数无效' }, { status: 400 })
    }
    if (!validateAnswers(parent_answers)) {
      return NextResponse.json({ error: '家长答案格式无效' }, { status: 400 })
    }
    if (!validateAnswers(student_answers)) {
      return NextResponse.json({ error: '学生答案格式无效' }, { status: 400 })
    }
    if (!validateAnswerKeysBelong(grade_level, parent_answers)) {
      return NextResponse.json({ error: '家长答案包含无效题目ID' }, { status: 400 })
    }
    if (!validateAnswerKeysBelong(grade_level, student_answers)) {
      return NextResponse.json({ error: '学生答案包含无效题目ID' }, { status: 400 })
    }
    if (parent_open && (typeof parent_open !== 'string' || parent_open.length > 2000)) {
      return NextResponse.json({ error: '家长开放题回答过长' }, { status: 400 })
    }
    if (student_open && (typeof student_open !== 'string' || student_open.length > 2000)) {
      return NextResponse.json({ error: '学生开放题回答过长' }, { status: 400 })
    }

    // 服务端重算评分，防止客户端篡改
    const typeSafeGrade = grade_level as 'primary' | 'middle' | 'senior'
    const scores = calculateScores(typeSafeGrade, parent_answers, student_answers)

    if (!validateScores(scores)) {
      return NextResponse.json({ error: '服务端评分计算异常' }, { status: 500 })
    }

    const store = getStore()

    const assessment = await store.assessment.create({
      data: {
        grade: grade_level,
        parentAnswers: parent_answers,
        studentAnswers: student_answers,
        parentOpen: parent_open || null,
        studentOpen: student_open || null,
        scores: scores,
        scoreDefine: scores.active_define.raw,
        scoreJudge: scores.active_judge.raw,
        scoreIntegrate: scores.active_integrate.raw,
        defLevel: scores.active_define.level,
        judgeLevel: scores.active_judge.level,
        intLevel: scores.active_integrate.level,
        weakestDim: scores.weakest_dimension,
        contradiction: scores.contradiction.type,
        reliability: scores.reliability,
        parentUserType: scores.parentUserType,
        parentPainpoint: scores.parentPainpoint || null,
      },
    })

    return NextResponse.json({ id: assessment.id })
  } catch (error) {
    console.error('保存数据失败:', error)
    return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePOST)
