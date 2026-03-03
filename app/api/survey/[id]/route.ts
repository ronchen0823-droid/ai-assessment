// app/api/survey/[id]/route.ts
// 根据ID查询已保存的报告，用于分享链接访问

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: params.id },
    })

    if (!survey) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    return NextResponse.json(survey)
  } catch (error) {
    console.error('查询报告失败:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
