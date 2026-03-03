import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getCorePrompt, getAgePatch } from '@/lib/prompts'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, scores } = body

    if (!grade_level || !parent_answers || !student_answers || !scores) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const systemPrompt = getCorePrompt() + getAgePatch(grade_level)
    const userMessage = JSON.stringify({ grade_level, parent_answers, student_answers, scores }, null, 2)

    const response = await client.chat.completions.create({
      model: process.env.MODEL_NAME || 'deepseek-chat',
      max_tokens: 1500,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const rawText = response.choices[0]?.message?.content || ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('AI未返回有效JSON:', rawText)
      return NextResponse.json({ error: 'AI返回格式异常' }, { status: 500 })
    }

    const reportData = JSON.parse(jsonMatch[0])
    return NextResponse.json(reportData)

  } catch (error) {
    console.error('生成报告失败:', error)
    return NextResponse.json({ error: '生成失败，请稍后重试' }, { status: 500 })
  }
}