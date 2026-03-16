import { QUESTIONS } from './questions'
import type { ParentUserType } from './questions'

export type { ParentUserType }

export type DimensionLevel =
  | 'not_established'
  | 'emerging'
  | 'developing'
  | 'established'
  | 'strong'

export type ContradictionType =
  | 'none'
  | 'parent_overestimates'
  | 'child_overestimates_self'
  | 'parent_says_worry_acts_passive'
  | 'child_knows_but_doesnt_do'
  | 'parent_self_dependency'

export type Reliability = 'high' | 'medium' | 'low'

export type ContradictionResult = {
  type: ContradictionType
  description: string
  evidence: string
}

export type ScoringResult = {
  active_define:    { raw: number; level: DimensionLevel }
  active_judge:     { raw: number; level: DimensionLevel }
  active_integrate: { raw: number; level: DimensionLevel }

  weakest_dimension: 'active_define' | 'active_judge' | 'active_integrate'
  weakest_label: string

  contradiction:  ContradictionResult
  contradictions: ContradictionResult[]

  reliability:      Reliability
  reliability_note: string

  parentUserType:  ParentUserType
  parentPainpoint: string
}

// ─────────────────────────────────────────────
// 维度题目映射
//
// primary:
//   active_define:    PB3, PB4
//   active_judge:     PB2, PB5, PB6
//   active_integrate: PB7, PB8, PB9
//
// middle:
//   active_define:    MB1, MB2
//   active_judge:     MB3, MB4, MB5
//   active_integrate: MB6, MB7, MB8
//
// senior:
//   active_define:    SB1, SB3
//   active_judge:     SB2, SB4, SB5
//   active_integrate: SB6, SB7, SB8
// ─────────────────────────────────────────────

const DIMENSION_MAP: Record<string, Record<string, string[]>> = {
  primary: {
    active_define:    ['PB3', 'PB4'],
    active_judge:     ['PB2', 'PB5', 'PB6'],
    active_integrate: ['PB7', 'PB8', 'PB9'],
  },
  middle: {
    active_define:    ['MB1', 'MB2'],
    active_judge:     ['MB3', 'MB4', 'MB5'],
    active_integrate: ['MB6', 'MB7', 'MB8'],
  },
  senior: {
    active_define:    ['SB1', 'SB3'],
    active_judge:     ['SB2', 'SB4', 'SB5'],
    active_integrate: ['SB6', 'SB7', 'SB8'],
  },
}

// 镜像题对从 questions.ts 的 mirror 字段自动生成，不手动维护
function buildMirrorPairs(
  grade: 'primary' | 'middle' | 'senior'
): Array<[parentId: string, studentId: string]> {
  const pairs: Array<[string, string]> = []
  for (const q of QUESTIONS[grade].partA) {
    if (q.mirror) pairs.push([q.id, q.mirror])
  }
  return pairs
}

// ─────────────────────────────────────────────
// 家长特殊题 ID
// ─────────────────────────────────────────────

const USER_TYPE_QUESTION: Record<string, string> = {
  primary: 'PA1',
  middle:  'MA1',
  senior:  'SA1',
}

const ACTION_QUESTION: Record<string, string> = {
  primary: 'PA6',
  middle:  'MA6',
  senior:  'SA6',
}

const PARENT_AI_BEHAVIOR_QUESTION: Record<string, string> = {
  primary: 'PA2',
  middle:  'MA2',
  senior:  'SA2',
}

const PAINPOINT_QUESTION: Record<string, string> = {
  primary: 'PA8',
  middle:  'MA8',
  senior:  'SA8',
}

const CHILD_AWARENESS_QUESTION: Record<string, string> = {
  primary: 'PB2',
  middle:  'MB5',
  senior:  'SB2',
}

const CHILD_BEHAVIOR_QUESTION: Record<string, string> = {
  primary: 'PB6',
  middle:  'MB4',
  senior:  'SB5',
}

// ─────────────────────────────────────────────
// 矛盾检测阈值
// 1-4 量表中，gap=1.5 约等于量程的 50%，是有实际意义的落差
// ─────────────────────────────────────────────

const CONTRADICTION_GAP_THRESHOLD = 1.5

// 最弱维度同分时：define > judge > integrate（思维链起点被干预效果最好）
const WEAKEST_PRIORITY: Record<string, number> = {
  active_define:    0,
  active_judge:     1,
  active_integrate: 2,
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

function getOptionScore(
  grade:      'primary' | 'middle' | 'senior',
  part:       'A' | 'B',
  questionId: string,
  answerValue: string
): number {
  if (!answerValue) return 0
  const questions = part === 'A' ? QUESTIONS[grade].partA : QUESTIONS[grade].partB
  const question  = questions.find(q => q.id === questionId)
  if (!question) return 0
  return question.options.find(o => o.value === answerValue)?.score ?? 0
}

function getOptionLabel(
  grade:      'primary' | 'middle' | 'senior',
  part:       'A' | 'B',
  questionId: string,
  answerValue: string
): string {
  if (!answerValue) return '（未作答）'
  const questions = part === 'A' ? QUESTIONS[grade].partA : QUESTIONS[grade].partB
  const question  = questions.find(q => q.id === questionId)
  if (!question) return '（题目未找到）'
  return question.options.find(o => o.value === answerValue)?.label ?? '（选项未找到）'
}

function rawToLevel(raw: number): DimensionLevel {
  if (raw <= 1.5) return 'not_established'
  if (raw <= 2.2) return 'emerging'
  if (raw <= 2.9) return 'developing'
  if (raw <= 3.5) return 'established'
  return 'strong'
}

// ─────────────────────────────────────────────
// 常量表（供前端展示）
// ─────────────────────────────────────────────

export const LEVEL_LABELS: Record<DimensionLevel, string> = {
  not_established: '尚未建立',
  emerging:        '初步出现',
  developing:      '发展中',
  established:     '基本稳定',
  strong:          '稳定内化',
}

export const DIMENSION_CHINESE: Record<string, string> = {
  active_define:    '主动定义（用 AI 前先想清楚要做什么）',
  active_judge:     '主动判断（评估 AI 给的内容对不对）',
  active_integrate: '主动整合（最终成果有没有自己的思考）',
}

// ─────────────────────────────────────────────
// 家长用户类型检测
// 直接读 option.userType 字段，不依赖选项字母与类型的隐式对应关系
// （三学段的 PA1/MA1/SA1 选项字母含义各不相同，依赖字母会错判）
// ─────────────────────────────────────────────

function detectParentUserType(
  grade:         'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>
): ParentUserType {
  const qId        = USER_TYPE_QUESTION[grade]
  const answerValue = parentAnswers[qId]
  if (!answerValue) return 'unknown'
  const question = QUESTIONS[grade].partA.find(q => q.id === qId)
  const option   = question?.options.find(o => o.value === answerValue)
  return option?.userType ?? 'unknown'
}

// ─────────────────────────────────────────────
// 家长痛点提取
// ─────────────────────────────────────────────

function extractParentPainpoint(
  grade:         'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>
): string {
  const qId    = PAINPOINT_QUESTION[grade]
  const answer = parentAnswers[qId]
  if (!answer) return ''
  return getOptionLabel(grade, 'A', qId, answer)
}

// ─────────────────────────────────────────────
// 矛盾全量检测（按优先级排序返回所有命中的矛盾）
//
// 优先级：
// ① 家长-孩子认知落差（镜像题，最可观察，报告穿透力最强）
// ② 家长"说担心但行为被动"
// ③ 家长自身 AI 依赖
// ④ 孩子"认知到位但行为落后"
// ─────────────────────────────────────────────

function detectAllContradictions(
  grade:          'primary' | 'middle' | 'senior',
  parentAnswers:  Record<string, string>,
  studentAnswers: Record<string, string>
): ContradictionResult[] {
  const results: ContradictionResult[] = []

  // ① 家长-孩子镜像落差（自动从 mirror 字段取对）
  const pairs = buildMirrorPairs(grade)
  let maxGap        = 0
  let bestParentId  = ''
  let bestStudentId = ''

  for (const [parentId, studentId] of pairs) {
    const pScore = getOptionScore(grade, 'A', parentId,  parentAnswers[parentId]  ?? '')
    const sScore = getOptionScore(grade, 'B', studentId, studentAnswers[studentId] ?? '')
    if (pScore === 0 || sScore === 0) continue
    const gap = Math.abs(pScore - sScore)
    if (gap > maxGap) {
      maxGap        = gap
      bestParentId  = parentId
      bestStudentId = studentId
    }
  }

  if (maxGap >= CONTRADICTION_GAP_THRESHOLD && bestParentId && bestStudentId) {
    const pScore = getOptionScore(grade, 'A', bestParentId,  parentAnswers[bestParentId]  ?? '')
    const sScore = getOptionScore(grade, 'B', bestStudentId, studentAnswers[bestStudentId] ?? '')
    const pLabel = getOptionLabel(grade, 'A', bestParentId,  parentAnswers[bestParentId]  ?? '')
    const sLabel = getOptionLabel(grade, 'B', bestStudentId, studentAnswers[bestStudentId] ?? '')

    if (pScore > sScore) {
      results.push({
        type:        'parent_overestimates',
        description: '家长认为孩子比较主动，孩子自述的实际情况更为被动',
        evidence:    `家长选：「${pLabel}」；孩子选：「${sLabel}」`,
      })
    } else {
      results.push({
        type:        'child_overestimates_self',
        description: '孩子自我评价较高，但家长观察到的实际表现相对被动',
        evidence:    `孩子选：「${sLabel}」；家长观察：「${pLabel}」`,
      })
    }
  }

  // ② 家长"说担心但行为被动"
  const worryId  = USER_TYPE_QUESTION[grade]
  const actionId = ACTION_QUESTION[grade]
  if (worryId && actionId) {
    const worryScore  = getOptionScore(grade, 'A', worryId,  parentAnswers[worryId]  ?? '')
    const actionScore = getOptionScore(grade, 'A', actionId, parentAnswers[actionId] ?? '')
    if (
      worryScore  > 0 &&
      actionScore > 0 &&
      (worryScore - actionScore) >= CONTRADICTION_GAP_THRESHOLD
    ) {
      results.push({
        type:        'parent_says_worry_acts_passive',
        description: '家长表达了对孩子依赖 AI 的担心，但面对孩子 AI 作品时的实际行为比较被动',
        evidence:    `担心程度：「${getOptionLabel(grade, 'A', worryId, parentAnswers[worryId] ?? '')}」；实际行为：「${getOptionLabel(grade, 'A', actionId, parentAnswers[actionId] ?? '')}」`,
      })
    }
  }

  // ③ 家长自身 AI 依赖
  const parentAIId = PARENT_AI_BEHAVIOR_QUESTION[grade]
  if (worryId && parentAIId) {
    const worryScore    = getOptionScore(grade, 'A', worryId,    parentAnswers[worryId]    ?? '')
    const parentAIScore = getOptionScore(grade, 'A', parentAIId, parentAnswers[parentAIId] ?? '')
    if (worryScore >= 3 && parentAIScore > 0 && parentAIScore <= 2) {
      results.push({
        type:        'parent_self_dependency',
        description: '家长担心孩子依赖 AI，但自己使用 AI 时也存在类似的无意识依赖模式',
        evidence:    `家长对孩子的担心：「${getOptionLabel(grade, 'A', worryId, parentAnswers[worryId] ?? '')}」；家长自身 AI 使用方式：「${getOptionLabel(grade, 'A', parentAIId, parentAnswers[parentAIId] ?? '')}」`,
      })
    }
  }

  // ④ 孩子"认知到位但行为落后"
  const awarenessId = CHILD_AWARENESS_QUESTION[grade]
  const behaviorId  = CHILD_BEHAVIOR_QUESTION[grade]
  if (awarenessId && behaviorId) {
    const awarenessScore = getOptionScore(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '')
    const behaviorScore  = getOptionScore(grade, 'B', behaviorId,  studentAnswers[behaviorId]  ?? '')
    if (
      awarenessScore > 0 &&
      behaviorScore  > 0 &&
      (awarenessScore - behaviorScore) >= CONTRADICTION_GAP_THRESHOLD
    ) {
      results.push({
        type:        'child_knows_but_doesnt_do',
        description: '孩子知道 AI 可能出错，但遇到矛盾信息时的实际行为并不一致',
        evidence:    `孩子对 AI 的认知：「${getOptionLabel(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '')}」；实际遇到矛盾时：「${getOptionLabel(grade, 'B', behaviorId, studentAnswers[behaviorId] ?? '')}」`,
      })
    }
  }

  return results
}

// ─────────────────────────────────────────────
// 可靠性检测
// ─────────────────────────────────────────────

function detectReliability(
  grade:          'primary' | 'middle' | 'senior',
  studentAnswers: Record<string, string>
): { reliability: Reliability; note: string } {
  const allIds = Object.values(DIMENSION_MAP[grade]).flat()
  const scores = allIds
    .map(id => getOptionScore(grade, 'B', id, studentAnswers[id] ?? ''))
    .filter(s => s > 0)

  if (scores.length === 0) {
    return { reliability: 'medium', note: '题目作答不完整，评估结果仅供参考。' }
  }

  const avg    = scores.reduce((a, b) => a + b, 0) / scores.length
  const allMax = scores.every(s => s >= 3.5)

  if (allMax || avg >= 3.7) {
    return {
      reliability: 'low',
      note: '孩子的答案整体接近全部最优选项，可能存在表演性作答。评分已做部分校正，报告结论偏乐观，建议家长用具体场景验证。',
    }
  }
  if (avg >= 3.2) {
    return {
      reliability: 'medium',
      note: '孩子的答案整体偏乐观，结论有参考价值，建议配合实际行为观察来印证。',
    }
  }
  return { reliability: 'high', note: '' }
}

// ─────────────────────────────────────────────
// 低可靠性时的家长镜像校正
//
// 家长 AI 行为分（PA2/MA2/SA2）作为家长数据可信度系数：
//   > 2：观察相对可信，权重 0.40
//   ≤ 2：家长自身也有依赖倾向，可信度下降，权重 0.20
//
// 只对 raw > 3.2 的维度做校正，不拉低真实偏高的分数
// ─────────────────────────────────────────────

function applyParentMirrorCorrection(
  grade:        'primary' | 'middle' | 'senior',
  dimResults:   Record<string, { raw: number; level: DimensionLevel }>,
  parentAnswers: Record<string, string>
): Record<string, { raw: number; level: DimensionLevel }> {
  const pairs = buildMirrorPairs(grade)
  if (pairs.length === 0) return dimResults

  const parentMirrorScores: number[] = []
  for (const [parentId] of pairs) {
    const s = getOptionScore(grade, 'A', parentId, parentAnswers[parentId] ?? '')
    if (s > 0) parentMirrorScores.push(s)
  }
  if (parentMirrorScores.length === 0) return dimResults

  const parentMirrorAvg = parentMirrorScores.reduce((a, b) => a + b, 0) / parentMirrorScores.length

  const parentAIId    = PARENT_AI_BEHAVIOR_QUESTION[grade]
  const parentAIScore = getOptionScore(grade, 'A', parentAIId, parentAnswers[parentAIId] ?? '')
  const parentWeight  = (parentAIScore > 0 && parentAIScore <= 2) ? 0.20 : 0.40

  const corrected: typeof dimResults = {}
  for (const [dim, result] of Object.entries(dimResults)) {
    if (result.raw > 3.2) {
      const adjustedRaw = parseFloat(
        (result.raw * (1 - parentWeight) + parentMirrorAvg * parentWeight).toFixed(3)
      )
      corrected[dim] = { raw: adjustedRaw, level: rawToLevel(adjustedRaw) }
    } else {
      corrected[dim] = result
    }
  }
  return corrected
}

// ─────────────────────────────────────────────
// 主函数
// ─────────────────────────────────────────────

export function calculateScores(
  grade:          'primary' | 'middle' | 'senior',
  parentAnswers:  Record<string, string>,
  studentAnswers: Record<string, string>
): ScoringResult {

  // Step 1：各维度原始均分
  const rawResults: Record<string, { raw: number; level: DimensionLevel }> = {}

  for (const [dim, questionIds] of Object.entries(DIMENSION_MAP[grade])) {
    const scores = questionIds
      .map(id => getOptionScore(grade, 'B', id, studentAnswers[id] ?? ''))
      .filter(s => s > 0)

    const raw = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 2.0

    rawResults[dim] = { raw, level: rawToLevel(raw) }
  }

  // Step 2：可靠性检测
  const { reliability, note } = detectReliability(grade, studentAnswers)

  // Step 3：低可靠性时家长镜像校正（权重动态）
  const dimResults = reliability === 'low'
    ? applyParentMirrorCorrection(grade, rawResults, parentAnswers)
    : rawResults

  // Step 4：最弱维度（同分时 define > judge > integrate）
  const sorted = Object.entries(dimResults).sort((a, b) => {
    const rawDiff = a[1].raw - b[1].raw
    if (Math.abs(rawDiff) > 0.001) return rawDiff
    return (WEAKEST_PRIORITY[a[0]] ?? 99) - (WEAKEST_PRIORITY[b[0]] ?? 99)
  })
  const weakestKey = sorted[0][0] as 'active_define' | 'active_judge' | 'active_integrate'

  // Step 5：全量矛盾检测
  const contradictions = detectAllContradictions(grade, parentAnswers, studentAnswers)
  const contradiction: ContradictionResult = contradictions.length > 0
    ? contradictions[0]
    : { type: 'none', description: '家长和孩子的描述基本一致，无显著认知落差', evidence: '' }

  // Step 6：家长画像信号
  const parentUserType  = detectParentUserType(grade, parentAnswers)
  const parentPainpoint = extractParentPainpoint(grade, parentAnswers)

  return {
    active_define:    dimResults.active_define    ?? { raw: 2.0, level: 'emerging' },
    active_judge:     dimResults.active_judge     ?? { raw: 2.0, level: 'emerging' },
    active_integrate: dimResults.active_integrate ?? { raw: 2.0, level: 'emerging' },

    weakest_dimension: weakestKey,
    weakest_label:     DIMENSION_CHINESE[weakestKey] ?? weakestKey,

    contradiction,
    contradictions,

    reliability,
    reliability_note: note,

    parentUserType,
    parentPainpoint,
  }
}
