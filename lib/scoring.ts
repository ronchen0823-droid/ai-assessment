// lib/scoring.ts
// 三维度得分计算逻辑
// 规则：A=4分 B=3分 C=2分 D=1分，按维度分组求平均后折算百分制

const SCORE_MAP: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }

// 每个维度对应的学生问卷题目编号
// 主动定义：使用AI前是否明确目标
// 主动判断：是否评估AI输出质量
// 主动整合：是否把AI融入自己的成果
const DIMENSION_MAP = {
  primary: {
    active_define: ['S3', 'S6'],
    active_judge: ['S4', 'S5', 'S7', 'S8'],
    active_integrate: ['S9'],
  },
  middle: {
    active_define: ['S3'],
    active_judge: ['S4', 'S5', 'S7', 'S8'],
    active_integrate: ['S6', 'S9'],
  },
  senior: {
    active_define: ['S3'],
    active_judge: ['S4', 'S5', 'S7', 'S8'],
    active_integrate: ['S6', 'S9'],
  },
}

export function calculateScores(
  grade: 'primary' | 'middle' | 'senior',
  studentAnswers: Record<string, string>
): { active_define: number; active_judge: number; active_integrate: number } {
  const dims = DIMENSION_MAP[grade]
  const result: Record<string, number> = {}

  for (const [dim, questions] of Object.entries(dims)) {
    const validAnswers = questions
      .map(q => SCORE_MAP[studentAnswers[q]])
      .filter(s => s !== undefined)

    if (validAnswers.length === 0) {
      result[dim] = 50 // 无数据时给中间值
    } else {
      const avg = validAnswers.reduce((a, b) => a + b, 0) / validAnswers.length
      result[dim] = Math.round((avg / 4) * 100)
    }
  }

  return {
    active_define: result.active_define ?? 50,
    active_judge: result.active_judge ?? 50,
    active_integrate: result.active_integrate ?? 50,
  }
}
