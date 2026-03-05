// lib/scoring.ts
// 核心目标：产出可操作的信号，而不是假精确的数字
//
// 设计决策：
// 1. 三维度用5级描述性标签而非100分，避免虚假精确感
// 2. 专门计算家长-孩子「镜像题矛盾」，这是报告最有穿透力的材料
// 3. 输出「最弱维度」和「最显著矛盾类型」，让 prompt 有针对性而非通用
// 4. 输出「自我报告可靠性」，让 AI 知道是否需要温和质疑答案的真实性

import { QUESTIONS } from './questions'

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

export type DimensionLevel =
  | 'not_established'   // 尚未建立
  | 'emerging'          // 初步出现
  | 'developing'        // 发展中
  | 'established'       // 基本稳定
  | 'strong'            // 稳定内化

export type ContradictionType =
  | 'none'                        // 无显著矛盾
  | 'parent_overestimates'        // 家长高估孩子的主动性
  | 'child_overestimates_self'    // 孩子高估自己的主动性
  | 'parent_says_worry_acts_passive' // 家长说担心但行为被动
  | 'child_knows_but_doesnt_do'   // 孩子认知到位但行为落后

export type Reliability = 'high' | 'medium' | 'low'

export type ScoringResult = {
  // 三维度
  active_define:    { raw: number; level: DimensionLevel }
  active_judge:     { raw: number; level: DimensionLevel }
  active_integrate: { raw: number; level: DimensionLevel }

  // 最弱维度（prompt 优先针对这个给建议）
  weakest_dimension: 'active_define' | 'active_judge' | 'active_integrate'
  weakest_label: string

  // 矛盾信号
  contradiction: {
    type: ContradictionType
    description: string   // 给 prompt 用的具体描述，说明矛盾在哪里
    evidence: string      // 具体是哪两题的答案产生了矛盾
  }

  // 可靠性（答案是否过于理想化）
  reliability: Reliability
  reliability_note: string  // 如果可靠性低，给 prompt 的提示语
}

// ─────────────────────────────────────────────
// 维度题目映射
// ─────────────────────────────────────────────

const DIMENSION_MAP: Record<string, Record<string, string[]>> = {
  primary: {
    active_define:    ['PB3', 'PB4'],
    active_judge:     ['PB2', 'PB5', 'PB6'],
    active_integrate: ['PB7', 'PB8'],
  },
  middle: {
    active_define:    ['MB1', 'MB2'],
    active_judge:     ['MB3', 'MB4', 'MB5'],
    active_integrate: ['MB6', 'MB7'],
  },
  senior: {
    active_define:    ['SB1', 'SB3'],
    active_judge:     ['SB2', 'SB4', 'SB5'],
    active_integrate: ['SB6', 'SB7'],
  },
}

// 镜像题对（家长题ID → 学生题ID），用于矛盾检测
const MIRROR_PAIRS: Record<string, Array<[string, string]>> = {
  primary: [
    ['PA3', 'PB3'],  // 家长观察 vs 孩子自述：打开AI第一步
    ['PA4', 'PB5'],  // 家长观察 vs 孩子自述：拿到AI内容后怎么做
    ['PA5', 'PB7'],  // 家长观察 vs 孩子自述：能否解释自己的决策
  ],
  middle: [
    ['MA3', 'MB6'],  // 家长观察 vs 孩子自述：观点归属感
  ],
  senior: [
    ['SA2', 'SB3'],  // 家长观察 vs 孩子自述：论文中AI的角色
    ['SA3', 'SB6'],  // 家长观察 vs 孩子自述：能否说清楚来源
  ],
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

function getOptionScore(
  grade: 'primary' | 'middle' | 'senior',
  part: 'A' | 'B',
  questionId: string,
  answerValue: string
): number {
  const questions = part === 'A'
    ? QUESTIONS[grade].partA
    : QUESTIONS[grade].partB
  const question = questions.find(q => q.id === questionId)
  if (!question) return 2
  const option = question.options.find(o => o.value === answerValue)
  return option?.score ?? 2
}

function getOptionLabel(
  grade: 'primary' | 'middle' | 'senior',
  part: 'A' | 'B',
  questionId: string,
  answerValue: string
): string {
  const questions = part === 'A'
    ? QUESTIONS[grade].partA
    : QUESTIONS[grade].partB
  const question = questions.find(q => q.id === questionId)
  if (!question) return ''
  return question.options.find(o => o.value === answerValue)?.label ?? ''
}

function rawToLevel(raw: number): DimensionLevel {
  if (raw <= 1.5) return 'not_established'
  if (raw <= 2.2) return 'emerging'
  if (raw <= 2.9) return 'developing'
  if (raw <= 3.5) return 'established'
  return 'strong'
}

const LEVEL_LABELS: Record<DimensionLevel, string> = {
  not_established: '尚未建立',
  emerging:        '初步出现',
  developing:      '发展中',
  established:     '基本稳定',
  strong:          '稳定内化',
}

const DIMENSION_CHINESE: Record<string, string> = {
  active_define:    '主动定义（用AI前先想清楚要做什么）',
  active_judge:     '主动判断（评估AI给的内容对不对）',
  active_integrate: '主动整合（最终成果有没有自己的思考）',
}

// ─────────────────────────────────────────────
// 矛盾检测
// ─────────────────────────────────────────────

function detectContradiction(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>,
  studentAnswers: Record<string, string>
): ScoringResult['contradiction'] {

  const pairs = MIRROR_PAIRS[grade] ?? []
  let maxGap = 0
  let gapParentId = ''
  let gapStudentId = ''

  // 找出分数差距最大的镜像题对
  for (const [parentId, studentId] of pairs) {
    const parentScore  = getOptionScore(grade, 'A', parentId,  parentAnswers[parentId]  ?? '')
    const studentScore = getOptionScore(grade, 'B', studentId, studentAnswers[studentId] ?? '')
    const gap = Math.abs(parentScore - studentScore)
    if (gap > maxGap) {
      maxGap = gap
      gapParentId  = parentId
      gapStudentId = studentId
    }
  }

  // 家长对自身行为的「说担心 vs 实际被动」矛盾
  // 用家长的「担心AI」题 vs 家长的「行为反应」题
  const worryAnswerMap: Record<string, string> = { primary: 'PA2', middle: 'MA6', senior: 'SA1' }
  const actionAnswerMap: Record<string, string> = { primary: 'PA6', middle: 'MA5', senior: '' }
  const worryId  = worryAnswerMap[grade]
  const actionId = actionAnswerMap[grade]
  const worryScore  = worryId  ? getOptionScore(grade, 'A', worryId,  parentAnswers[worryId]  ?? '') : 0
  const actionScore = actionId ? getOptionScore(grade, 'A', actionId, parentAnswers[actionId] ?? '') : 0
  const parentInternalGap = worryScore - actionScore  // 正数 = 担心程度 > 实际行为积极程度

  // 孩子「认知到位但行为落后」检测
  // 认知题（觉得AI可能出错）vs 行为题（遇到矛盾信息怎么做）
  const awarenessMap: Record<string, string> = { primary: 'PB2', middle: 'MB5', senior: 'SB2' }
  const behaviorMap:  Record<string, string> = { primary: 'PB6', middle: 'MB4', senior: 'SB5' }
  const awarenessId = awarenessMap[grade]
  const behaviorId  = behaviorMap[grade]
  const awarenessScore = awarenessId ? getOptionScore(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '') : 0
  const behaviorScore  = behaviorId  ? getOptionScore(grade, 'B', behaviorId,  studentAnswers[behaviorId]  ?? '') : 0
  const childInternalGap = awarenessScore - behaviorScore  // 正数 = 知道但没做到

  // 综合判断最显著的矛盾
  if (maxGap >= 2) {
    const parentScore  = getOptionScore(grade, 'A', gapParentId,  parentAnswers[gapParentId]  ?? '')
    const studentScore = getOptionScore(grade, 'B', gapStudentId, studentAnswers[gapStudentId] ?? '')
    const parentLabel  = getOptionLabel(grade, 'A', gapParentId,  parentAnswers[gapParentId]  ?? '')
    const studentLabel = getOptionLabel(grade, 'B', gapStudentId, studentAnswers[gapStudentId] ?? '')

    if (parentScore > studentScore) {
      return {
        type: 'parent_overestimates',
        description: '家长认为孩子比较主动，孩子自述的实际情况更为被动',
        evidence: `家长选：「${parentLabel}」；孩子选：「${studentLabel}」`,
      }
    } else {
      return {
        type: 'child_overestimates_self',
        description: '孩子自我评价较高，但家长观察到的实际情况比较被动',
        evidence: `孩子选：「${studentLabel}」；家长观察：「${parentLabel}」`,
      }
    }
  }

  if (parentInternalGap >= 2 && actionId) {
    const worryLabel  = getOptionLabel(grade, 'A', worryId,  parentAnswers[worryId]  ?? '')
    const actionLabel = getOptionLabel(grade, 'A', actionId, parentAnswers[actionId] ?? '')
    return {
      type: 'parent_says_worry_acts_passive',
      description: '家长表达了对孩子依赖AI的担心，但自己面对孩子AI作品时的实际行为却比较被动',
      evidence: `家长担心程度：「${worryLabel}」；家长实际行为：「${actionLabel}」`,
    }
  }

  if (childInternalGap >= 2 && awarenessId && behaviorId) {
    const awarenessLabel = getOptionLabel(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '')
    const behaviorLabel  = getOptionLabel(grade, 'B', behaviorId,  studentAnswers[behaviorId]  ?? '')
    return {
      type: 'child_knows_but_doesnt_do',
      description: '孩子知道AI可能出错，但遇到矛盾信息时的实际行为并不一致',
      evidence: `孩子对AI认知：「${awarenessLabel}」；遇到矛盾时的行为：「${behaviorLabel}」`,
    }
  }

  return {
    type: 'none',
    description: '家长和孩子的答案基本一致，无显著矛盾',
    evidence: '',
  }
}

// ─────────────────────────────────────────────
// 可靠性检测（答案是否过于理想化）
// ─────────────────────────────────────────────

function detectReliability(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>,
  studentAnswers: Record<string, string>
): { reliability: Reliability; note: string } {

  const dims = DIMENSION_MAP[grade]
  const allStudentIds = Object.values(dims).flat()
  const studentScores = allStudentIds.map(id =>
    getOptionScore(grade, 'B', id, studentAnswers[id] ?? '')
  )
  const studentAvg = studentScores.reduce((a, b) => a + b, 0) / studentScores.length

  // 全部题目都选最高分 → 可能存在表演性作答
  const allMax = studentScores.every(s => s >= 3.5)

  if (allMax || studentAvg >= 3.7) {
    return {
      reliability: 'low',
      note: '孩子的答案整体偏高，接近全部最优选项。报告中应温和提示家长，建议用一个具体场景来验证。',
    }
  }
  if (studentAvg >= 3.2) {
    return {
      reliability: 'medium',
      note: '孩子的答案整体偏乐观，诊断结论可以给出，但建议家长观察具体行为来印证。',
    }
  }
  return {
    reliability: 'high',
    note: '',
  }
}

// ─────────────────────────────────────────────
// 主函数
// ─────────────────────────────────────────────

export function calculateScores(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers:  Record<string, string>,
  studentAnswers: Record<string, string>
): ScoringResult {

  const dims = DIMENSION_MAP[grade]
  const dimResults: Record<string, { raw: number; level: DimensionLevel }> = {}

  for (const [dim, questionIds] of Object.entries(dims)) {
    const scores = questionIds.map(id =>
      getOptionScore(grade, 'B', id, studentAnswers[id] ?? '')
    ).filter(s => s > 0)

    const raw = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 2

    dimResults[dim] = { raw, level: rawToLevel(raw) }
  }

  // 最弱维度
  const sorted = Object.entries(dimResults).sort((a, b) => a[1].raw - b[1].raw)
  const weakestKey = sorted[0][0] as 'active_define' | 'active_judge' | 'active_integrate'

  const contradiction = detectContradiction(grade, parentAnswers, studentAnswers)
  const { reliability, note } = detectReliability(grade, parentAnswers, studentAnswers)

  return {
    active_define:    dimResults.active_define    ?? { raw: 2, level: 'emerging' },
    active_judge:     dimResults.active_judge     ?? { raw: 2, level: 'emerging' },
    active_integrate: dimResults.active_integrate ?? { raw: 2, level: 'emerging' },

    weakest_dimension: weakestKey,
    weakest_label:     DIMENSION_CHINESE[weakestKey] ?? weakestKey,

    contradiction,

    reliability,
    reliability_note: note,
  }
}

// 供前端展示用的标签
export { LEVEL_LABELS, DIMENSION_CHINESE }
