'use client'
// components/RadarChart.tsx
// 三维度雷达图可视化

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts'

interface Props {
  scores: {
    active_define: number
    active_judge: number
    active_integrate: number
  }
}

export default function ThinkingRadarChart({ scores }: Props) {
  const data = [
    { dimension: '主动定义', value: scores.active_define, fullMark: 100 },
    { dimension: '主动判断', value: scores.active_judge, fullMark: 100 },
    { dimension: '主动整合', value: scores.active_integrate, fullMark: 100 },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickCount={4}
          />
          <Radar
            dataKey="value"
            fill="#6366f1"
            fillOpacity={0.25}
            stroke="#6366f1"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* 得分数字展示 */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        {data.map((item) => (
          <div key={item.dimension} className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.dimension}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
