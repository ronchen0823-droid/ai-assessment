'use client'
// app/report/[id]/page.tsx
// 卡片式报告展示页

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const ThinkingRadarChart = dynamic(() => import('@/components/RadarChart'), {
  ssr: false,
  loading: () => <div style={{ height: 220, background: '#f8f9fc', borderRadius: 16 }} />,
})

const GRADE_LABELS: Record<string, string> = {
  primary: '小学（4-6年级）',
  middle: '初中（7-9年级）',
  senior: '高中（10-12年级）',
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  '良好': { color: '#059669', bg: '#f0fdf4', label: '良好' },
  '中等': { color: '#d97706', bg: '#fffbeb', label: '中等' },
  '待提升': { color: '#6366f1', bg: '#eef2ff', label: '待提升' },
}

interface ReportData {
  headline: string
  dimensions: { name: string; level: string; desc: string }[]
  findings: { title: string; body: string }[]
  action: string
  closing: string
}

interface SurveyData {
  id: string
  gradeLevel: string
  parentAnswers: Record<string, string>
  studentAnswers: Record<string, string>
  scores: { active_define: number; active_judge: number; active_integrate: number }
  reportContent: string | null
}

export default function ReportPage() {
  const params = useParams()
  const id = params.id as string

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/survey/${id}`)
        if (!res.ok) throw new Error('报告不存在')
        const data = await res.json()
        setSurveyData(data)
        setLoading(false)

        if (data.reportContent) {
          try {
            setReport(JSON.parse(data.reportContent))
          } catch {
            generateReport(data)
          }
        } else {
          generateReport(data)
        }
      } catch (e) {
        setError('加载失败，请检查链接是否正确')
        setLoading(false)
      }
    }
    if (id) loadData()
  }, [id])

  async function generateReport(data: SurveyData) {
    setGenerating(true)
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
      if (!res.ok) throw new Error('生成失败')
      const reportData = await res.json()
      setReport(reportData)

      // 保存报告
      await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_level: data.gradeLevel,
          parent_answers: data.parentAnswers,
          student_answers: data.studentAnswers,
          scores: data.scores,
          report_content: JSON.stringify(reportData),
        }),
      })
    } catch (e) {
      setError('报告生成失败，请刷新重试')
    } finally {
      setGenerating(false)
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
        <a href="/" style={{ background: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 14 }}>重新测评</a>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f7f8fc', minHeight: '100vh', fontFamily: "'Noto Sans SC', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .card { background: #fff; border-radius: 20px; padding: 24px; margin-bottom: 12px; border: 1px solid #f1f5f9; animation: fadeUp 0.4s ease both; }
        .dim-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
        .dim-item:last-child { border-bottom: none; padding-bottom: 0; }
        .finding-card { background: #f8f9fc; border-radius: 14px; padding: 16px; margin-bottom: 10px; }
        .finding-card:last-child { margin-bottom: 0; }
      `}</style>

      {/* 顶部导航 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(247,248,252,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f5f9', padding: '12px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>AI思维状态测评报告</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{surveyData ? GRADE_LABELS[surveyData.gradeLevel] : ''}</div>
          </div>
          {report && (
            <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#f0fdf4' : '#f1f5f9', color: copied ? '#059669' : '#64748b', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? '✓ 已复制' : '分享报告'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 40px' }}>

        {/* 雷达图卡片 */}
        {surveyData && (
          <div className="card" style={{ animationDelay: '0.05s' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4, fontFamily: "'Noto Serif SC', serif" }}>思维主导权雷达图</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>三个维度综合反映孩子当前的AI协作模式</div>
            <ThinkingRadarChart scores={surveyData.scores} />
          </div>
        )}

        {/* 生成中状态 */}
        {generating && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>AI 分析中，约需 10 秒...</p>
          </div>
        )}

        {report && (
          <>
            {/* 核心发现标题 */}
            <div className="card" style={{ animationDelay: '0.1s', background: '#1e293b' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, letterSpacing: '0.1em', color: '#94a3b8' }}>核心发现</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', lineHeight: 1.4, fontFamily: "'Noto Serif SC', serif" }}>
                {report.headline}
              </div>
            </div>

            {/* 三维度状态 */}
            <div className="card" style={{ animationDelay: '0.15s' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 16 }}>三个维度的状态</div>
              {report.dimensions?.map((dim, i) => {
                const cfg = LEVEL_CONFIG[dim.level] || LEVEL_CONFIG['中等']
                return (
                  <div key={i} className="dim-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{dim.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 20 }}>{dim.level}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, fontWeight: 300 }}>{dim.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 关键发现 */}
            <div className="card" style={{ animationDelay: '0.2s' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14 }}>关键发现</div>
              {report.findings?.map((f, i) => (
                <div key={i} className="finding-card">
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6, lineHeight: 1.4 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, fontWeight: 300 }}>{f.body}</div>
                </div>
              ))}
            </div>

            {/* 今天可以做的一件事 */}
            <div className="card" style={{ animationDelay: '0.25s', background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #e0e7ff' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 10 }}>今天就能做的一件事</div>
              <div style={{ fontSize: 15, color: '#3730a3', lineHeight: 1.7, fontWeight: 500 }}>{report.action}</div>
            </div>

            {/* 收尾 */}
            <div style={{ padding: '16px 4px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{report.closing}</p>
            </div>

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={handleShare} style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                {copied ? '链接已复制 ✓' : '分享给朋友'}
              </button>
              <a href="/" style={{ flex: 1, background: '#1e293b', color: '#fff', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 500, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                重新测评
              </a>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 8 }}>
          <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>AI思维课程 · 思维主导权测评</p>
        </div>

      </div>
    </div>
  )
}
