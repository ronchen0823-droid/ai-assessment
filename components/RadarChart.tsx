'use client'

import type { ScoringResult } from '@/lib/scoring'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts'

interface Props {
  scores: Pick<ScoringResult, 'active_define' | 'active_judge' | 'active_integrate'>
}

export default function ThinkingRadarChart({ scores }: Props) {
  const data = [
    { dimension: '主动定义', value: scores.active_define.raw * 25, fullMark: 100 },
    { dimension: '主动判断', value: scores.active_judge.raw * 25, fullMark: 100 },
    { dimension: '主动整合', value: scores.active_integrate.raw * 25, fullMark: 100 },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            tickCount={4}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            fill="#6366f1"
            fillOpacity={0.2}
            stroke="#6366f1"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
