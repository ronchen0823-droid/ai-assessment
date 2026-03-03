// app/api/save-survey/route.ts
// 保存问卷数据和报告到数据库，返回唯一ID用于分享

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, scores, report_content } = body

    if (!grade_level || !parent_answers || !student_answers || !scores) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const survey = await prisma.survey.create({
      data: {
        gradeLevel: grade_level,
        parentAnswers: parent_answers,
        studentAnswers: student_answers,
        scores: scores,
        reportContent: report_content || null,
      },
    })

    return NextResponse.json({ id: survey.id })
  } catch (error) {
    console.error('保存数据失败:', error)
    return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
  }
}
