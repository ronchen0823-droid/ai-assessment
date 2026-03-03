// app/api/generate-report/route.ts
// 核心接口：接收问卷答案，调用AI生成报告（流式输出）

import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getCorePrompt, getAgePatch } from '@/lib/prompts'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL, // 你的中转站地址
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, scores } = body

    if (!grade_level || !parent_answers || !student_answers || !scores) {
      return new Response('缺少必要参数', { status: 400 })
    }

    const systemPrompt = getCorePrompt() + getAgePatch(grade_level)
    const userMessage = JSON.stringify(
      { grade_level, parent_answers, student_answers, scores },
      null,
      2
    )

    // 流式输出
    const stream = await client.chat.completions.create({
      model: process.env.MODEL_NAME || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('生成报告失败:', error)
    return new Response('生成报告失败，请稍后重试', { status: 500 })
  }
}
