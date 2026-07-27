import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { buildFullPrompt, buildReportContext } from '@/lib/prompts'
import { withRateLimit, REPORT_MAX_REQUESTS } from '@/lib/rate-limit'

const VALID_GRADES = ['primary', 'middle', 'senior']
const VALID_ANSWER_VALUES = ['A', 'B', 'C', 'D']
const REPORT_TIMEOUT_MS = 30_000
const REQUIRED_REPORT_FIELDS = [
  'diagnosis', 'mirror', 'insight',
  'solution_essence', 'solution_why_usual_fails', 'solution_method', 'bridge',
]

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: REPORT_TIMEOUT_MS,
  })
}

function validateAnswers(answers: unknown): boolean {
  if (!answers || typeof answers !== 'object') return false
  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof key !== 'string' || typeof value !== 'string') return false
    if (!VALID_ANSWER_VALUES.includes(value)) return false
  }
  return true
}

function validateReport(data: Record<string, string>): boolean {
  for (const field of REQUIRED_REPORT_FIELDS) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
      return false
    }
  }
  return true
}

function parseAndValidate(
  fullText: string,
  streamController: ReadableStreamDefaultController
): Record<string, string> | null {
  let reportData: Record<string, string>
  try {
    reportData = JSON.parse(fullText)
  } catch {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      streamController.enqueue(new TextEncoder().encode('\n__ERROR__:AI返回格式异常'))
      streamController.close()
      return null
    }
    reportData = JSON.parse(jsonMatch[0])
  }

  if (!validateReport(reportData)) {
    streamController.enqueue(new TextEncoder().encode('\n__ERROR__:报告生成不完整'))
    streamController.close()
    return null
  }

  return reportData
}

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade_level, parent_answers, student_answers, parent_open, student_open, scores } = body

    if (!grade_level || !VALID_GRADES.includes(grade_level)) {
      return new Response(JSON.stringify({ error: '学段参数无效' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!validateAnswers(parent_answers)) {
      return new Response(JSON.stringify({ error: '家长答案格式无效' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!validateAnswers(student_answers)) {
      return new Response(JSON.stringify({ error: '学生答案格式无效' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (parent_open && (typeof parent_open !== 'string' || parent_open.length > 2000)) {
      return new Response(JSON.stringify({ error: '家长开放题回答过长' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (student_open && (typeof student_open !== 'string' || student_open.length > 2000)) {
      return new Response(JSON.stringify({ error: '学生开放题回答过长' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const context = buildReportContext({
      grade: grade_level,
      parentAnswers: parent_answers,
      studentAnswers: student_answers,
      parentOpen: parent_open || '',
      studentOpen: student_open || '',
      scores,
    })

    const systemPrompt = buildFullPrompt(grade_level)
    const userMessage = context
    const model = process.env.MODEL_NAME || 'deepseek-chat'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS)

    const stream = new ReadableStream({
      async start(streamController) {
        try {
          // 部分兼容 API（如 DeepSeek）在 streaming 模式下可能不支持
          // response_format: { type: 'json_object' }，降级为非流式请求
          const useStream = model !== 'deepseek-chat'

          if (useStream) {
            const response = await getClient().chat.completions.create({
              model,
              max_tokens: 2000,
              stream: true,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
            }, { signal: controller.signal })

            let fullText = ''
            for await (const chunk of response as any) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                fullText += content
                streamController.enqueue(new TextEncoder().encode(content))
              }
            }

            clearTimeout(timeoutId)
            const reportData = parseAndValidate(fullText, streamController)
            if (!reportData) return
          } else {
            // DeepSeek: 非流式 + json_object
            const response = await getClient().chat.completions.create({
              model,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
            }, { signal: controller.signal })

            clearTimeout(timeoutId)

            const fullText = response.choices[0]?.message?.content || ''
            // 非流式下也逐字符发送，保持前端 UI 一致
            for (const char of fullText) {
              streamController.enqueue(new TextEncoder().encode(char))
              // 让前端有时间渲染
              await new Promise(r => setTimeout(r, 5))
            }

            const reportData = parseAndValidate(fullText, streamController)
            if (!reportData) return
          }

          streamController.close()
        } catch (err: any) {
          clearTimeout(timeoutId)
          if (err?.name === 'AbortError') {
            streamController.enqueue(new TextEncoder().encode('\n__ERROR__:报告生成超时'))
          } else {
            streamController.enqueue(new TextEncoder().encode('\n__ERROR__:生成失败'))
          }
          streamController.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })

  } catch (error) {
    console.error('生成报告失败:', error)
    return new Response(JSON.stringify({ error: '生成失败，请稍后重试' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export const POST = withRateLimit(handlePOST, { maxRequests: REPORT_MAX_REQUESTS })