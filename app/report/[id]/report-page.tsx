'use client'
// app/report/[id]/page.tsx
// 报告展示页：加载已保存的数据，实时流式生成报告，支持分享

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// 雷达图只在客户端渲染（recharts不支持SSR）
const ThinkingRadarChart = dynamic(() => import('@/components/RadarChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 rounded-2xl animate-pulse" />,
})

const GRADE_LABELS: Record<string, string> = {
  primary: '小学（4-6年级）',
  middle: '初中（7-9年级）',
  senior: '高中（10-12年级）',
}

interface SurveyData {
  id: string
  gradeLevel: string
  parentAnswers: Record<string, string>
  studentAnswers: Record<string, string>
  scores: { active_define: number; active_judge: number; active_integrate: number }
  reportContent: string | null
  createdAt: string
}

export default function ReportPage() {
  const params = useParams()
  const id = params.id as string

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [reportText, setReportText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // 加载问卷数据
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/survey/${id}`)
        if (!res.ok) throw new Error('报告不存在')
        const data = await res.json()
        setSurveyData(data)

        // 如果已有缓存报告，直接展示
        if (data.reportContent) {
          setReportText(data.reportContent)
          setIsComplete(true)
        } else {
          // 生成新报告
          generateReport(data)
        }
      } catch (e) {
        setError('加载报告失败，请检查链接是否正确')
      }
    }

    if (id) loadData()
  }, [id])

  async function generateReport(data: SurveyData) {
    setIsStreaming(true)

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_level: data.gradeLevel,
          parent_answers: data.parentAnswers,
          student_answers: data.studentAnswers,
          scores: data.scores,
        }),
      })

      if (!res.ok) throw new Error('AI生成失败')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullText += chunk
        setReportText(fullText)
      }

      setIsComplete(true)
      setIsStreaming(false)

      // 把生成的报告存回数据库
      await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          grade_level: data.gradeLevel,
          parent_answers: data.parentAnswers,
          student_answers: data.studentAnswers,
          report_content: fullText,
        }),
      })

    } catch (e) {
      setError('报告生成失败，请刷新页面重试')
      setIsStreaming(false)
    }
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // 把Markdown文本转成HTML（简单处理）
  function renderMarkdown(text: string) {
    return text
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">出错了</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-indigo-700 transition-colors">
            重新测评
          </Link>
        </div>
      </div>
    )
  }

  if (!surveyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900 text-sm">AI思维状态测评报告</h1>
            <p className="text-xs text-slate-400">{GRADE_LABELS[surveyData.gradeLevel]}</p>
          </div>
          {isComplete && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.432-2.684M6.316 10.658a3 3 0 10-5.432 2.684" />
              </svg>
              {copied ? '链接已复制 ✓' : '分享报告'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* 雷达图卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 text-base mb-1">思维主导权雷达图</h2>
          <p className="text-slate-400 text-xs mb-6">三个维度综合反映孩子当前的AI协作模式</p>
          <ThinkingRadarChart scores={surveyData.scores} />

          {/* 维度说明 */}
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-50">
            {[
              { name: '主动定义', desc: '用AI前先想清楚目标' },
              { name: '主动判断', desc: '评估AI输出的质量' },
              { name: '主动整合', desc: '成果体现自己的思考' },
            ].map(item => (
              <div key={item.name} className="text-center">
                <div className="text-xs font-semibold mb-1 text-indigo-600">{item.name}</div>
                <div className="text-slate-400 text-xs leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 报告内容卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-base">个性化分析报告</h2>
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                AI生成中
              </span>
            )}
          </div>

          {reportText ? (
            <div
              ref={reportRef}
              className={`report-content text-sm leading-relaxed ${isStreaming ? 'cursor-blink' : ''}`}
              dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(reportText)}</p>` }}
            />
          ) : (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-slate-100 rounded animate-pulse ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 完成后的操作区 */}
        {isComplete && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-medium py-3 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-center"
              >
                {copied ? '链接已复制 ✓' : '分享报告'}
              </button>
              <a
                href="/"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-2xl transition-colors text-sm text-center"
              >
                重新测评
              </a>
            </div>
          </div>
        )}

        {/* 底部 */}
        <div className="text-center py-4">
          <p className="text-slate-300 text-xs">AI思维课程 · 思维主导权测评系统</p>
        </div>

      </div>
    </div>
  )
}
