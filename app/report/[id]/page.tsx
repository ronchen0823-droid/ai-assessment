'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { ScoringResult } from '@/lib/scoring'

const CAMP_URL = 'https://example.com/camp'

const GRADE_LABELS: Record<string, string> = {
  primary: '小学（4-6年级）',
  middle: '初中（7-9年级）',
  senior: '高中（10-12年级）',
}

interface ReportData {
  diagnosis: string
  mirror: string
  insight: string
  solution_essence: string
  solution_why_usual_fails: string
  solution_method: string
  bridge: string
}

interface SurveyData {
  id: string
  grade: string
  parentAnswers: Record<string, string>
  studentAnswers: Record<string, string>
  parentOpen: string | null
  studentOpen: string | null
  scores: ScoringResult
  report: Record<string, string> | null
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
        if (!res.ok) throw new Error('not found')
        const data = await res.json()
        setSurveyData(data)
        setLoading(false)
        if (data.report) {
          try { setReport(typeof data.report === 'string' ? JSON.parse(data.report) : data.report) }
          catch { generateReport(data) }
        } else {
          generateReport(data)
        }
      } catch {
        setError('加载失败，请检查链接是否正确')
        setLoading(false)
      }
    }
    if (id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function generateReport(data: SurveyData) {
    setGenerating(true)
    let fullText = ''
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_level: data.grade,
          parent_answers: data.parentAnswers,
          student_answers: data.studentAnswers,
          parent_open: data.parentOpen || '',
          student_open: data.studentOpen || '',
          scores: data.scores,
        }),
      })
      if (!res.ok) throw new Error('failed')

      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('text/plain')) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            fullText += chunk
          }
        }

        const errorMatch = fullText.match(/__ERROR__:(.+)/)
        if (errorMatch) throw new Error(errorMatch[1])

        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('解析失败')
        const reportData = JSON.parse(jsonMatch[0])
        setReport(reportData)

        await fetch(`/api/survey/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report: reportData }),
        })
      } else {
        const reportData = await res.json()
        setReport(reportData)

        await fetch(`/api/survey/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report: reportData }),
        })
      }
    } catch {
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

  const dimLevelLabel: Record<string, string> = {
    not_established: '尚未建立',
    emerging: '初步出现',
    developing: '发展中',
    established: '基本稳定',
    strong: '稳定内化',
  }

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f7f8fc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 15 }}>{error}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => { setError(''); setLoading(true); window.location.reload() }}
            style={{ background: '#1e293b', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, cursor: 'pointer' }}
          >
            重试
          </button>
          <a href="/" style={{ background: '#fff', color: '#64748b', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 14, border: '1.5px solid #e2e8f0' }}>
            返回首页
          </a>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f7f8fc', minHeight: '100vh', fontFamily: "'Noto Sans SC',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .rc { background:#fff; border-radius:20px; padding:24px; margin-bottom:12px; border:1px solid #f1f5f9; animation:fadeUp 0.5s ease both; }
        .slabel { font-size:10px; font-weight:600; color:#94a3b8; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:12px; }
        .btext { font-size:15px; color:#374151; line-height:1.85; font-weight:400; margin:0; }
        .ibox { background:#fafafa; border-left:3px solid #6366f1; border-radius:0 12px 12px 0; padding:16px 18px; }
        .wbox { background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border-radius:14px; padding:16px 18px; border:1px solid #d1fae5; }
        .dim-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:16px; }
        .dim-card { min-width:0; padding:14px 10px; border:1px solid #eef2f7; border-radius:14px; background:#fcfdff; text-align:center; }
        .dim-card-label { color:#64748b; font-size:12px; line-height:1.5; white-space:nowrap; }
        .dim-card-status { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:9px; color:#1e293b; font-size:13px; font-weight:600; line-height:1.4; }
        .dim-card-dot { width:7px; height:7px; border-radius:50%; flex:0 0 auto; }
        @media (max-width: 380px) { .dim-card { padding-left:6px; padding-right:6px; } .dim-card-label { font-size:11px; } .dim-card-status { font-size:12px; } }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(247,248,252,0.93)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '11px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>AI思维状态测评报告</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{surveyData ? GRADE_LABELS[surveyData.grade] : ''}</div>
          </div>
          {report && (
            <button onClick={handleShare} style={{ background: copied ? '#f0fdf4' : '#f1f5f9', color: copied ? '#059669' : '#64748b', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {copied ? '✓ 已复制' : '分享报告'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 48px' }}>

        {surveyData && (
          <div className="rc" style={{ animationDelay: '0.05s' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 3, fontFamily: "'Noto Serif SC',serif" }}>思维主导权状态</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>三个维度分别反映孩子当前的思维使用状态</div>
            {(() => {
              const s = surveyData.scores
              const tone: Record<string, string> = {
                not_established: '#f97316',
                emerging: '#f59e0b',
                developing: '#3b82f6',
                established: '#10b981',
                strong: '#6366f1',
              }
              return (
                <div className="dim-grid">
                  {[
                    { label: '主动定义', level: s.active_define.level },
                    { label: '主动判断', level: s.active_judge.level },
                    { label: '主动整合', level: s.active_integrate.level },
                  ].map(d => (
                    <div className="dim-card" key={d.label}>
                      <div className="dim-card-label">{d.label}</div>
                      <div className="dim-card-status">
                        <span className="dim-card-dot" style={{ background: tone[d.level] ?? '#94a3b8' }} />
                        {dimLevelLabel[d.level] ?? d.level}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            {report && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 500, background: '#eef2ff', padding: '5px 20px', borderRadius: 20, lineHeight: 1.6, display: 'inline-block' }}>
                  {report.diagnosis}
                </span>
              </div>
            )}
          </div>
        )}

        {generating && !error && (
          <div className="rc" style={{ textAlign: 'center', padding: '44px 24px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>AI 分析中，约需 15 秒...</p>
          </div>
        )}

        {error && surveyData && !report && (
          <div className="rc" style={{ textAlign: 'center', padding: '24px' }}>
            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => { setError(''); generateReport(surveyData) }}
              style={{ background: '#6366f1', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, cursor: 'pointer' }}
            >
              重新生成报告
            </button>
          </div>
        )}

        {report && (
          <>
            <div className="rc" style={{ animationDelay: '0.1s' }}>
              <div className="slabel">孩子使用 AI 的真实画面</div>
              <p className="btext">{report.mirror}</p>
            </div>

            <div className="rc" style={{ animationDelay: '0.15s' }}>
              <div className="slabel">问题背后</div>
              <div className="ibox">
                <p className="btext">{report.insight}</p>
              </div>
            </div>

            <div className="rc" style={{ animationDelay: '0.2s' }}>
              <div className="slabel">核心问题</div>
              <p className="btext" style={{ fontWeight: 500, color: '#1e293b' }}>{report.solution_essence}</p>
              <div style={{ marginTop: 14, padding: '14px 16px', background: '#fefce8', borderRadius: 12, border: '1px solid #fef08a' }}>
                <p className="btext" style={{ fontSize: 13 }}>{report.solution_why_usual_fails}</p>
              </div>
            </div>

            <div className="rc" style={{ animationDelay: '0.25s' }}>
              <div className="slabel">具体建议</div>
              <p className="btext">{report.solution_method}</p>
            </div>

            <div className="rc" style={{ animationDelay: '0.3s' }}>
              <div className="slabel">下一步</div>
              <div className="wbox">
                <p className="btext" style={{ color: '#065f46' }}>{report.bridge}</p>
              </div>
              <div style={{ marginTop: 20 }}>
                <a href={CAMP_URL} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 600, textDecoration: 'none', background: '#1e293b', color: '#fff' }}>
                  了解 5 天思维训练营 →
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={handleShare} style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: 14, padding: '13px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {copied ? '已复制 ✓' : '分享给朋友'}
              </button>
              <a href="/" style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: 14, padding: '13px', fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                重新测评
              </a>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>AI思维课程 · 思维主导权测评系统</p>
        </div>
      </div>
    </div>
  )
}
