'use client'
// app/survey/[grade]/page.tsx
// 问卷填写页面：分Part A（家长）和Part B（学生）两个阶段

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QUESTIONS, GRADE_LABELS } from '@/lib/questions'
import { calculateScores } from '@/lib/scoring'

type Grade = 'primary' | 'middle' | 'senior'
type Answers = Record<string, string>

export default function SurveyPage() {
  const params = useParams()
  const router = useRouter()
  const grade = params.grade as Grade

  const [phase, setPhase] = useState<'intro-a' | 'part-a' | 'intro-b' | 'part-b' | 'submitting'>('intro-a')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [parentAnswers, setParentAnswers] = useState<Answers>({})
  const [studentAnswers, setStudentAnswers] = useState<Answers>({})

  const questions = QUESTIONS[grade]
  const gradeLabel = GRADE_LABELS[grade]

  if (!questions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">学段参数错误</p>
      </div>
    )
  }

  const isPartA = phase === 'part-a'
  const currentQuestions = isPartA ? questions.partA : questions.partB
  const currentAnswers = isPartA ? parentAnswers : studentAnswers
  const totalQuestions = currentQuestions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  function handleAnswer(questionId: string, value: string) {
    if (isPartA) {
      setParentAnswers(prev => ({ ...prev, [questionId]: value }))
    } else {
      setStudentAnswers(prev => ({ ...prev, [questionId]: value }))
    }
  }

  function handleNext() {
    const currentQ = currentQuestions[currentQuestion]
    const hasAnswer = currentAnswers[currentQ.id]

    if (!hasAnswer) {
      alert('请先选择一个选项')
      return
    }

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // 当前部分完成
      if (phase === 'part-a') {
        setPhase('intro-b')
        setCurrentQuestion(0)
      } else {
        handleSubmit()
      }
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  async function handleSubmit() {
    setPhase('submitting')

    const scores = calculateScores(grade, studentAnswers)

    // 保存到数据库，获取报告ID
    try {
      const saveRes = await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_level: grade,
          parent_answers: parentAnswers,
          student_answers: studentAnswers,
          scores,
        }),
      })

      const { id } = await saveRes.json()
      router.push(`/report/${id}`)
    } catch {
      alert('提交失败，请检查网络后重试')
      setPhase('part-b')
    }
  }

  // 介绍页：Part A
  if (phase === 'intro-a') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Part A · 家长问卷</h2>
              <p className="text-slate-500 text-sm">
                {gradeLabel}版 · 共{questions.partA.length}题 · 约3分钟
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
              <strong>请家长独立完成</strong>，无需孩子参与。<br />
              选择最接近您实际情况的选项，没有对错之分。
            </div>

            <button
              onClick={() => setPhase('part-a')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              开始家长问卷 →
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-3 text-slate-400 text-sm py-2 hover:text-slate-600 transition-colors"
            >
              ← 返回重新选择学段
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 介绍页：Part B
  if (phase === 'intro-b') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧒</span>
              </div>
              <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
                家长问卷已完成 ✓
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Part B · 学生问卷</h2>
              <p className="text-slate-500 text-sm">
                {gradeLabel}版 · 共{questions.partB.length}题 · 约5分钟
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm text-emerald-700">
              <strong>请把设备交给孩子</strong>，让他/她独立完成。<br />
              这不是考试，选最像自己的那个就好。
            </div>

            <button
              onClick={() => setPhase('part-b')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              开始学生问卷 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 提交中
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">正在生成专属报告...</p>
          <p className="text-slate-400 text-sm mt-2">通常需要3-8秒</p>
        </div>
      </div>
    )
  }

  // 问题页面
  const currentQ = currentQuestions[currentQuestion]
  const selectedAnswer = currentAnswers[currentQ.id]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {isPartA ? '👨‍👩‍👧 家长问卷' : '🧒 学生问卷'}
            </span>
            <span className="text-xs text-slate-400">
              {currentQuestion + 1} / {totalQuestions}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPartA ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 问题区域 */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-20 pb-32">
        <div className="flex-1 flex flex-col justify-center py-8">
          <div className="mb-8">
            <p className="text-xs text-slate-400 mb-3 font-medium">
              第 {currentQuestion + 1} 题
            </p>
            <h2 className="text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQ.text}
            </h2>
          </div>

          {/* 选项 */}
          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = selectedAnswer === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                  className={`
                    w-full text-left p-4 rounded-2xl border-2 transition-all duration-150
                    ${isSelected
                      ? isPartA
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className={`
                      flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5
                      ${isSelected
                        ? isPartA ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 text-slate-400'
                      }
                    `}>
                      {option.value}
                    </span>
                    <span className="text-sm leading-relaxed">{option.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentQuestion > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 border-2 border-slate-200 text-slate-600 font-medium py-3.5 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              上一题
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`
              flex-1 font-semibold py-3.5 rounded-2xl transition-all
              ${selectedAnswer
                ? isPartA
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {currentQuestion === totalQuestions - 1
              ? (isPartA ? '完成，继续学生问卷 →' : '提交，生成报告 →')
              : '下一题 →'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
