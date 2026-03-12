// lib/scoring.ts
// v2 完整重构
//
// 核心改动：
// 1. 三维度各增至 3 题，提升评分信度
// 2. 新增家长用户类型检测（A/B/C），供 prompts.ts bridge 段个性化
// 3. 新增家长痛点信号提取，供 bridge 精准切入
// 4. 修复 senior 版 parent_says_worry_acts_passive 矛盾检测缺失（原版空字符串 bug）
// 5. 矛盾检测阈值从硬编码 gap≥2 改为基于量表范围的动态判断（gap≥1.5）
// 6. 最弱维度 tie-breaking：同分时优先报思维链起点（define → judge → integrate）
// 7. 低可靠性时用家长镜像题做部分加权校正，不只是在报告里温和质疑
// 8. 新增矛盾类型 parent_self_dependency：家长自身也有无意识 AI 依赖

import { QUESTIONS } from './questions'

// ─────────────────────────────────────────────
// 题目 ID 对照说明（必须与 questions.ts 保持同步）
// ─────────────────────────────────────────────
//
// ★ 维度题目映射（学生题 Part B）
//                      primary           middle            senior
// active_define        PB1, PB3, PB4     MB1, MB2, MB9     SB1, SB2, SB9
// active_judge         PB2, PB5, PB6     MB3, MB4, MB5     SB3, SB4, SB5
// active_integrate     PB7, PB8, PB9     MB6, MB7, MB8     SB6, SB7, SB8
//
// ★ 家长特殊题映射（Part A）
//                      primary   middle   senior
// 用户类型题            PA1       MA1      SA1
// 家长自身 AI 行为题     PA2       MA2      SA2
// 家长担心程度题         PA6       MA6      SA7   ← senior 旧 SA1 改为用户类型题，新增 SA7
// 家长实际应对行为题     PA5       MA5      SA6   ← senior 旧为空字符串 bug，新增 SA6 修复
// 家长痛点题            PA8       MA8      SA8
//
// ★ 镜像题对（家长观察 vs 孩子自述）
//                      家长题   学生题   对应维度
// primary              PA3      PB3      define
//                      PA4      PB5      judge
//                      PA5      PB8      integrate
// middle               MA3      MB1      define
//                      MA4      MB4      judge
//                      MA7      MB7      integrate
// senior               SA3      SB1      define
//                      SA4      SB4      judge
//                      SA5      SB7      integrate
//
// ─────────────────────────────────────────────

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
  | 'none'
  | 'parent_overestimates'             // 家长高估孩子主动性
  | 'child_overestimates_self'         // 孩子高估自己主动性
  | 'parent_says_worry_acts_passive'   // 家长说担心但行为被动
  | 'child_knows_but_doesnt_do'        // 孩子认知到位但行为落后
  | 'parent_self_dependency'           // 【新增】家长自身也有无意识 AI 依赖

export type Reliability = 'high' | 'medium' | 'low'

export type ParentUserType = 'A' | 'B' | 'C' | 'unknown'
// A: 已发现问题，在找解决方案
// B: 主动对比，在看哪家方案更好
// C: 潜在需求，还未意识到有问题
// unknown: 未作答或未识别

export type ScoringResult = {
  // 三维度评分
  active_define:    { raw: number; level: DimensionLevel }
  active_judge:     { raw: number; level: DimensionLevel }
  active_integrate: { raw: number; level: DimensionLevel }

  // 最弱维度
  weakest_dimension: 'active_define' | 'active_judge' | 'active_integrate'
  weakest_label: string

  // 矛盾信号
  contradiction: {
    type: ContradictionType
    description: string
    evidence: string
  }

  // 答案可靠性
  reliability: Reliability
  reliability_note: string

  // 【新增】家长画像信号（供 prompts.ts 个性化使用）
  parentUserType: ParentUserType
  parentPainpoint: string   // PA8/MA8/SA8 选项文本；空字符串表示未填
}

// ─────────────────────────────────────────────
// 维度题目映射
// ─────────────────────────────────────────────

const DIMENSION_MAP: Record<string, Record<string, string[]>> = {
  primary: {
    active_define:    ['PB1', 'PB3', 'PB4'],
    active_judge:     ['PB2', 'PB5', 'PB6'],
    active_integrate: ['PB7', 'PB8', 'PB9'],
  },
  middle: {
    active_define:    ['MB1', 'MB2', 'MB9'],
    active_judge:     ['MB3', 'MB4', 'MB5'],
    active_integrate: ['MB6', 'MB7', 'MB8'],
  },
  senior: {
    active_define:    ['SB1', 'SB2', 'SB9'],
    active_judge:     ['SB3', 'SB4', 'SB5'],
    active_integrate: ['SB6', 'SB7', 'SB8'],
  },
}

// ─────────────────────────────────────────────
// 镜像题对配置
// ─────────────────────────────────────────────

const MIRROR_PAIRS: Record<string, Array<[parentId: string, studentId: string]>> = {
  primary: [
    ['PA3', 'PB3'],   // define：用 AI 前有没有自己的思路
    ['PA4', 'PB5'],   // judge：拿到 AI 内容后怎么处理
    ['PA5', 'PB8'],   // integrate：能否解释自己的决策
  ],
  middle: [
    ['MA3', 'MB1'],   // define
    ['MA4', 'MB4'],   // judge
    ['MA7', 'MB7'],   // integrate
  ],
  senior: [
    ['SA3', 'SB1'],   // define
    ['SA4', 'SB4'],   // judge
    ['SA5', 'SB7'],   // integrate
  ],
}

// ─────────────────────────────────────────────
// 家长特殊题 ID 配置
// ─────────────────────────────────────────────

/** PA1/MA1/SA1：识别家长认知状态（A/B/C） */
const USER_TYPE_QUESTION: Record<string, string> = {
  primary: 'PA1',
  middle:  'MA1',
  senior:  'SA1',
}

/** PA2/MA2/SA2：家长自身 AI 使用行为 */
const PARENT_AI_BEHAVIOR_QUESTION: Record<string, string> = {
  primary: 'PA2',
  middle:  'MA2',
  senior:  'SA2',
}

/** 家长对孩子依赖 AI 的担心程度 */
const WORRY_QUESTION: Record<string, string> = {
  primary: 'PA6',
  middle:  'MA6',
  senior:  'SA7',   // senior 旧 SA1 已变用户类型题，新增 SA7
}

/** 家长面对孩子 AI 作品时的实际应对行为 */
const ACTION_QUESTION: Record<string, string> = {
  primary: 'PA5',
  middle:  'MA5',
  senior:  'SA6',   // 修复原版空字符串 bug
}

/** 家长痛点题 */
const PAINPOINT_QUESTION: Record<string, string> = {
  primary: 'PA8',
  middle:  'MA8',
  senior:  'SA8',
}

/** 孩子对「AI 可能出错」的认知题 */
const CHILD_AWARENESS_QUESTION: Record<string, string> = {
  primary: 'PB2',
  middle:  'MB5',
  senior:  'SB5',
}

/** 孩子遇到矛盾信息的实际行为题 */
const CHILD_BEHAVIOR_QUESTION: Record<string, string> = {
  primary: 'PB6',
  middle:  'MB4',
  senior:  'SB4',
}

// ─────────────────────────────────────────────
// 矛盾检测阈值
// 从硬编码 gap≥2 改为基于量表范围的动态判断
// 1-4 量表中，gap=1.5 约等于量程的 50%，是有实际意义的落差
// 旧版 gap≥2 的问题：当答案集中在 2-3 分区间时永远不会触发
// ─────────────────────────────────────────────

const CONTRADICTION_GAP_THRESHOLD = 1.5

// ─────────────────────────────────────────────
// 最弱维度 tie-breaking 优先级
// 同分时优先报思维链起点（define 最先被干预效果最好）
// ─────────────────────────────────────────────

const WEAKEST_PRIORITY: Record<string, number> = {
  active_define:    0,
  active_judge:     1,
  active_integrate: 2,
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
  if (!answerValue) return 0
  const questions = part === 'A' ? QUESTIONS[grade].partA : QUESTIONS[grade].partB
  const question  = questions.find(q => q.id === questionId)
  if (!question) return 0
  return question.options.find(o => o.value === answerValue)?.score ?? 0
}

function getOptionLabel(
  grade: 'primary' | 'middle' | 'senior',
  part: 'A' | 'B',
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
// 常量表（供前端展示使用）
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
// ─────────────────────────────────────────────
// questions.ts 中 PA1/MA1/SA1 的选项 value 约定：
//   "A" = 孩子已经有明显问题，我在找解决方案
//   "B" = 在对比不同方案，看哪家更合适
//   "C" = 只是随便看看 / 还不确定孩子是否有问题

function detectParentUserType(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>
): ParentUserType {
  const answer = parentAnswers[USER_TYPE_QUESTION[grade]]
  if (answer === 'A' || answer === 'B' || answer === 'C') return answer
  return 'unknown'
}

// ─────────────────────────────────────────────
// 家长痛点提取
// ─────────────────────────────────────────────

function extractParentPainpoint(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>
): string {
  const qId    = PAINPOINT_QUESTION[grade]
  const answer = parentAnswers[qId]
  if (!answer) return ''
  return getOptionLabel(grade, 'A', qId, answer)
}

// ─────────────────────────────────────────────
// 矛盾检测（四种类型 + 新增 parent_self_dependency）
// ─────────────────────────────────────────────

function detectContradiction(
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers: Record<string, string>,
  studentAnswers: Record<string, string>
): ScoringResult['contradiction'] {

  // ① 家长-孩子认知落差（镜像题对）
  const pairs = MIRROR_PAIRS[grade] ?? []
  let maxGap       = 0
  let bestParentId = ''
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
      return {
        type: 'parent_overestimates',
        description: '家长认为孩子比较主动，孩子自述的实际情况更为被动',
        evidence: `家长选：「${pLabel}」；孩子选：「${sLabel}」`,
      }
    } else {
      return {
        type: 'child_overestimates_self',
        description: '孩子自我评价较高，但家长观察到的实际表现相对被动',
        evidence: `孩子选：「${sLabel}」；家长观察：「${pLabel}」`,
      }
    }
  }

  // ② 家长「说担心但行为被动」矛盾
  const worryId  = WORRY_QUESTION[grade]
  const actionId = ACTION_QUESTION[grade]
  if (worryId && actionId) {
    const worryScore  = getOptionScore(grade, 'A', worryId,  parentAnswers[worryId]  ?? '')
    const actionScore = getOptionScore(grade, 'A', actionId, parentAnswers[actionId] ?? '')
    if (worryScore > 0 && actionScore > 0 && (worryScore - actionScore) >= CONTRADICTION_GAP_THRESHOLD) {
      return {
        type: 'parent_says_worry_acts_passive',
        description: '家长表达了对孩子依赖 AI 的担心，但面对孩子 AI 作品时的实际行为比较被动',
        evidence: `担心程度：「${getOptionLabel(grade, 'A', worryId, parentAnswers[worryId] ?? '')}」；实际行为：「${getOptionLabel(grade, 'A', actionId, parentAnswers[actionId] ?? '')}」`,
      }
    }
  }

  // ③ 家长自身 AI 依赖矛盾（新增）
  // 家长担心孩子依赖 AI，但自身 AI 使用评分也偏低（≤2），说明两者面对同一挑战
  const parentAIId = PARENT_AI_BEHAVIOR_QUESTION[grade]
  if (worryId && parentAIId) {
    const worryScore      = getOptionScore(grade, 'A', worryId,    parentAnswers[worryId]    ?? '')
    const parentAIScore   = getOptionScore(grade, 'A', parentAIId, parentAnswers[parentAIId] ?? '')
    if (worryScore >= 3 && parentAIScore > 0 && parentAIScore <= 2) {
      return {
        type: 'parent_self_dependency',
        description: '家长担心孩子依赖 AI，但自己使用 AI 时也存在类似的无意识依赖模式',
        evidence: `家长对孩子的担心：「${getOptionLabel(grade, 'A', worryId, parentAnswers[worryId] ?? '')}」；家长自身 AI 使用方式：「${getOptionLabel(grade, 'A', parentAIId, parentAnswers[parentAIId] ?? '')}」`,
      }
    }
  }

  // ④ 孩子「认知到位但行为落后」矛盾
  const awarenessId = CHILD_AWARENESS_QUESTION[grade]
  const behaviorId  = CHILD_BEHAVIOR_QUESTION[grade]
  if (awarenessId && behaviorId) {
    const awarenessScore = getOptionScore(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '')
    const behaviorScore  = getOptionScore(grade, 'B', behaviorId,  studentAnswers[behaviorId]  ?? '')
    if (awarenessScore > 0 && behaviorScore > 0 && (awarenessScore - behaviorScore) >= CONTRADICTION_GAP_THRESHOLD) {
      return {
        type: 'child_knows_but_doesnt_do',
        description: '孩子知道 AI 可能出错，但遇到矛盾信息时的实际行为并不一致',
        evidence: `孩子对 AI 的认知：「${getOptionLabel(grade, 'B', awarenessId, studentAnswers[awarenessId] ?? '')}」；实际遇到矛盾时：「${getOptionLabel(grade, 'B', behaviorId, studentAnswers[behaviorId] ?? '')}」`,
      }
    }
  }

  return {
    type: 'none',
    description: '家长和孩子的描述基本一致，无显著认知落差',
    evidence: '',
  }
}

// ─────────────────────────────────────────────
// 可靠性检测
// ─────────────────────────────────────────────

function detectReliability(
  grade: 'primary' | 'middle' | 'senior',
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
// ─────────────────────────────────────────────
// 原版只在报告文字里「温和质疑」，但分数本身没有变化——这意味着即使孩子
// 全选最高分，最弱维度判断和报告建议方向也可能完全失准。
//
// 校正逻辑：
// - 只对 raw > 3.2 的维度做校正（避免把本来真实偏高的分数拉低）
// - 用该维度对应的家长镜像题均分做加权混合
// - 公式：adjusted = student_raw × 0.6 + parent_mirror_avg × 0.4

function applyParentMirrorCorrection(
  grade: 'primary' | 'middle' | 'senior',
  dimResults: Record<string, { raw: number; level: DimensionLevel }>,
  parentAnswers: Record<string, string>
): Record<string, { raw: number; level: DimensionLevel }> {

  const pairs = MIRROR_PAIRS[grade] ?? []
  if (pairs.length === 0) return dimResults

  // 收集家长镜像题分数
  const parentScores: number[] = []
  for (const [parentId] of pairs) {
    const s = getOptionScore(grade, 'A', parentId, parentAnswers[parentId] ?? '')
    if (s > 0) parentScores.push(s)
  }
  if (parentScores.length === 0) return dimResults

  const parentAvg = parentScores.reduce((a, b) => a + b, 0) / parentScores.length

  const corrected: typeof dimResults = {}
  for (const [dim, result] of Object.entries(dimResults)) {
    if (result.raw > 3.2) {
      const adjustedRaw = parseFloat((result.raw * 0.6 + parentAvg * 0.4).toFixed(3))
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
  grade: 'primary' | 'middle' | 'senior',
  parentAnswers:  Record<string, string>,
  studentAnswers: Record<string, string>
): ScoringResult {

  // Step 1：计算各维度原始均分
  const rawResults: Record<string, { raw: number; level: DimensionLevel }> = {}

  for (const [dim, questionIds] of Object.entries(DIMENSION_MAP[grade])) {
    const scores = questionIds
      .map(id => getOptionScore(grade, 'B', id, studentAnswers[id] ?? ''))
      .filter(s => s > 0)

    const raw = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 2.0   // 未作答给中间值，不让缺答拉低结果

    rawResults[dim] = { raw, level: rawToLevel(raw) }
  }

  // Step 2：可靠性检测
  const { reliability, note } = detectReliability(grade, studentAnswers)

  // Step 3：低可靠性时用家长镜像题做部分校正
  const dimResults = reliability === 'low'
    ? applyParentMirrorCorrection(grade, rawResults, parentAnswers)
    : rawResults

  // Step 4：最弱维度（同分时 define > judge > integrate 优先级 tie-break）
  const sorted = Object.entries(dimResults).sort((a, b) => {
    const rawDiff = a[1].raw - b[1].raw
    if (Math.abs(rawDiff) > 0.001) return rawDiff
    return (WEAKEST_PRIORITY[a[0]] ?? 99) - (WEAKEST_PRIORITY[b[0]] ?? 99)
  })
  const weakestKey = sorted[0][0] as 'active_define' | 'active_judge' | 'active_integrate'

  // Step 5：矛盾检测
  const contradiction = detectContradiction(grade, parentAnswers, studentAnswers)

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

    reliability,
    reliability_note: note,

    parentUserType,
    parentPainpoint,
  }
}
