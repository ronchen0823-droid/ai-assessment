// app/page.tsx
// 首页：选择学段，引导进入问卷

import Link from 'next/link'

const grades = [
  {
    id: 'primary',
    label: '小学',
    sub: '4—6年级',
    desc: '了解孩子AI使用习惯的形成阶段',
    color: 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'middle',
    label: '初中',
    sub: '7—9年级',
    desc: '评估AI高频使用期的思维独立性',
    color: 'from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'senior',
    label: '高中',
    sub: '10—12年级',
    desc: '分析升学关键期的AI协作深度',
    color: 'from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400',
    badge: 'bg-violet-100 text-violet-700',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">

        {/* 标题区 */}
        <div className="text-center mb-12">
          <div className="inline-block bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            AI思维课程 · 免费测评
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            孩子的AI思维状态<br />
            <span className="text-indigo-600">现在什么水平？</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            家长和孩子各完成一份问卷（共约10分钟）<br />
            AI实时生成个性化诊断报告，含三维度雷达图
          </p>
        </div>

        {/* 学段选择 */}
        <div className="mb-8">
          <p className="text-center text-slate-500 text-sm mb-4 font-medium">选择孩子的学段</p>
          <div className="grid gap-4">
            {grades.map((grade) => (
              <Link
                key={grade.id}
                href={`/survey/${grade.id}`}
                className={`
                  block p-5 rounded-2xl border-2 bg-gradient-to-r transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5 cursor-pointer
                  ${grade.color}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-bold text-slate-800">{grade.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${grade.badge}`}>
                        {grade.sub}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{grade.desc}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">测评说明</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>家长问卷 10题，约3分钟</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>学生问卷 10题，约5分钟</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>AI实时生成个性化报告</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>报告可保存和分享</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
