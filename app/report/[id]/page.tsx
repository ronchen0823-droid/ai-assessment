'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const ThinkingRadarChart = dynamic(() => import('@/components/RadarChart'), {
  ssr: false,
  loading: () => <div style={{ height: 220, background: '#f8f9fc', borderRadius: 16 }} />,
})

const CAMP_URL = '#'
const CONSULT_URL = '#'

const GRADE_LABELS: Record<string, string> = {
  primary: '小学（4-6年级）',
  middle: '初中（7-9年级）',
  senior: '高中（10-12年级）',
}

interface ReportData {
  diagnosis: string
  child_para1: string
  child_para2: string
  parent_insight: string
  window: string
  suggestion: string
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
        if (!res.ok) throw new Error('not found')
        const data = await res.json()
        setSurveyData(data)
        setLoading(false)
        if (data.reportContent) {
          try { setReport(JSON.parse(data.reportContent)) }
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
      if (!res.ok) throw new Error('failed')
      const reportData = await res.json()
      setReport(reportData)
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

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f7f8fc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 15 }}>{error}</p>
        <a href="/" style={{ background: '#1e293b', color: '#fff', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 14 }}>重新测评</a>
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
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(247,248,252,0.93)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '11px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>AI思维状态测评报告</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{surveyData ? GRADE_LABELS[surveyData.gradeLevel] : ''}</div>
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
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 3, fontFamily: "'Noto Serif SC',serif" }}>思维主导权雷达图</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>三个维度综合反映孩子当前的AI协作模式</div>
            <ThinkingRadarChart scores={surveyData.scores} />
            {report && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500, background: '#eef2ff', padding: '5px 16px', borderRadius: 20 }}>
                  {report.diagnosis}
                </span>
              </div>
            )}
          </div>
        )}

        {generating && (
          <div className="rc" style={{ textAlign: 'center', padding: '44px 24px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>AI 分析中，约需 15 秒...</p>
          </div>
        )}

        {report && (
          <>
            <div className="rc" style={{ animationDelay: '0.1s' }}>
              <div className="slabel">孩子的状态</div>
              <p className="btext">{report.child_para1}</p>
              <p className="btext" style={{ marginTop: 14 }}>{report.child_para2}</p>
            </div>

            <div className="rc" style={{ animationDelay: '0.15s' }}>
              <div className="slabel">有件事您可能没注意到</div>
              <div className="ibox">
                <p className="btext">{report.parent_insight}</p>
              </div>
            </div>

            <div className="rc" style={{ animationDelay: '0.2s' }}>
              <div className="slabel">现在是什么时机</div>
              <div className="wbox">
                <p className="btext" style={{ color: '#065f46' }}>{report.window}</p>
              </div>
            </div>

            <div className="rc" style={{ animationDelay: '0.25s' }}>
              <div className="slabel">综合建议</div>
              <p className="btext">{report.suggestion}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <a href={CAMP_URL} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 600, textDecoration: 'none', background: '#1e293b', color: '#fff' }}>
                  了解 7 天思维训练营 →
                </a>
                <a href={CONSULT_URL} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', borderRadius: 14, fontSize: 14, fontWeight: 500, textDecoration: 'none', background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0' }}>
                  预约一对一咨询
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