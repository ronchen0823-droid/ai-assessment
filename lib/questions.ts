// lib/questions.ts  V2.0
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 设计原则（基于理论体系纲领 + 运营方案 + 报告生成需求）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 1. 每道题是镜子，不是试卷
//    用具体场景还原，不问抽象态度。降低社会期望偏差。
//
// 2. 家长题的三重目标：
//    ① 诊断：通过行为观察间接评估孩子状态
//    ② 喂报告：每个选项文本都可被 AI 直接引用到 mirror/insight 段落
//    ③ 测家长：检测家长自身的认知状态和行为模式，
//       用于识别用户类型（A=已发现问题 / B=主动对比 / C=潜在需求）
//       以及检测「说担心但行为被动」的矛盾
//
// 3. 学生题的两重目标：
//    ① 三维度评分（active_define / active_judge / active_integrate）
//    ② 与家长镜像题产生对比张力，矛盾本身是报告最有穿透力的材料
//
// 4. 每道题四个选项严格覆盖 1/2/3/4 分，不允许两个选项同分
//    （修复原版 PB4 的 B=1 和 C=1 问题）
//
// 5. 开放题引导具体事件而非抽象思考，给 AI 报告提供「专属感」素材
//
// 6. 三个学段结构对齐：
//    Part A（家长）：8 题选择 + 1 题开放 = 9
//    Part B（学生）：9 题选择 + 1 题开放 = 10
//    总计约 10 分钟完成
//
// 7. 维度映射一致性（供 scoring.ts 使用）：
//    active_define:    2 道学生题
//    active_judge:     3 道学生题
//    active_integrate: 3 道学生题（原版只有 2 道，增加 1 道提高信度）
//    context / parent_behavior / pain_point：家长题不进维度评分，
//    但进矛盾检测和报告上下文
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type Dimension =
  | 'active_define'
  | 'active_judge'
  | 'active_integrate'
  | 'context'
  | 'parent_behavior'    // 家长自身行为（矛盾检测用）
  | 'pain_point'         // 家长痛点/担忧（报告个性化用）
  | 'open'

export type Option = {
  label: string
  value: 'A' | 'B' | 'C' | 'D'
  score: 1 | 2 | 3 | 4
}

export type Question = {
  id: string
  text: string
  dimension: Dimension
  mirror?: string        // 对应的镜像题 ID
  options: Option[]
}

export type OpenQuestion = {
  id: string
  text: string
  dimension: 'open'
}

export type GradeQuestions = {
  partA: Question[]      // 家长题
  partB: Question[]      // 学生题
  openA: OpenQuestion    // 家长开放题
  openB: OpenQuestion    // 学生开放题
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初级版（4–6 年级）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const primaryPartA: Question[] = [
  // ── PA1 · 家长认知状态（识别用户类型 A/B/C）──
  {
    id: 'PA1',
    text: '关于孩子使用AI这件事，下面哪个最像您现在的状态？',
    dimension: 'context',
    options: [
      { label: '已经觉得不太对劲，但不确定问题出在哪里、该怎么办', value: 'A', score: 3 },
      { label: '在主动了解各种AI教育的方法，想找一个真正有用的', value: 'B', score: 4 },
      { label: '没怎么想过这件事，孩子学习没出问题就行', value: 'C', score: 1 },
      { label: '知道AI很重要，提醒过孩子别太依赖，但没有具体做什么', value: 'D', score: 2 },
    ],
  },

  // ── PA2 · 家长自己的AI使用行为（检测家长是否也在无意识依赖）──
  {
    id: 'PA2',
    text: '您自己用AI（比如问AI写东西、查信息）时，拿到AI的回复后通常怎么处理？',
    dimension: 'parent_behavior',
    options: [
      { label: '会仔细看一遍，把不准确的或者不适合的地方改掉再用', value: 'A', score: 4 },
      { label: '大概扫一眼，觉得差不多就直接用了', value: 'B', score: 2 },
      { label: '基本不用AI，或者用得很少，不太了解', value: 'C', score: 1 },
      { label: '会看一下，偶尔改改，但大部分时候直接用', value: 'D', score: 3 },
    ],
  },

  // ── PA3 · 主动定义观察（镜像 → PB3）──
  {
    id: 'PA3',
    text: '孩子用AI做作业时，您观察到他打开AI后的第一个动作通常是？',
    dimension: 'active_define',
    mirror: 'PB3',
    options: [
      { label: '把作业要求直接拍照或复制粘贴发给AI，等AI给结果', value: 'A', score: 1 },
      { label: '先自己做一部分或者想一想，再把不会的部分问AI', value: 'B', score: 4 },
      { label: '跟AI说「帮我做一个xx」，让AI先出一个版本看看', value: 'C', score: 2 },
      { label: '先跟AI说自己大概想怎么做，再让AI帮忙补充某个部分', value: 'D', score: 3 },
    ],
  },

  // ── PA4 · 主动判断观察（镜像 → PB5）──
  {
    id: 'PA4',
    text: 'AI给了孩子一段内容之后，您观察到孩子通常怎么做？',
    dimension: 'active_judge',
    mirror: 'PB5',
    options: [
      { label: '会读一遍，遇到觉得不对的地方会改，有时还会让AI重写', value: 'A', score: 4 },
      { label: '基本直接用，很少看到他修改什么', value: 'B', score: 1 },
      { label: '会浏览一下，把明显的错别字或格式改改', value: 'C', score: 2 },
      { label: '会读一遍，把不太像自己写的地方换个说法', value: 'D', score: 3 },
    ],
  },

  // ── PA5 · 主动整合观察（镜像 → PB7）──
  {
    id: 'PA5',
    text: '如果您问孩子「这篇作业里哪些是你自己想的？」，他通常怎么回答？',
    dimension: 'active_integrate',
    mirror: 'PB7',
    options: [
      { label: '能清楚地告诉我哪些是自己的想法、哪些让AI帮的、为什么这么分', value: 'A', score: 4 },
      { label: '说不上来，或者直接说「AI帮我做的」', value: 'B', score: 1 },
      { label: '能说个大概，但问细了就含糊了', value: 'C', score: 3 },
      { label: '没问过这个问题', value: 'D', score: 2 },
    ],
  },

  // ── PA6 · 家长实际干预行为（与 PA1 构成「说 vs 做」矛盾检测）──
  {
    id: 'PA6',
    text: '孩子把用AI完成的作业给您看时，您第一反应通常是？',
    dimension: 'parent_behavior',
    options: [
      { label: '问他「这里面哪些是你自己想的？你做了什么决定？」', value: 'A', score: 4 },
      { label: '看一下做完了就行，不太细问过程', value: 'B', score: 1 },
      { label: '夸他效率高、会用工具，提醒他别太依赖', value: 'C', score: 2 },
      { label: '会让他给我讲讲思路，但不是每次都问', value: 'D', score: 3 },
    ],
  },

  // ── PA7 · 独立能力基线 ──
  {
    id: 'PA7',
    text: '如果老师要求一次作业完全不能用AI，您觉得孩子会怎样？',
    dimension: 'context',
    options: [
      { label: '应该没问题，他本来就有基础，AI只是让他更快', value: 'A', score: 4 },
      { label: '估计要花很长时间，而且质量会差不少', value: 'B', score: 2 },
      { label: '可能会很吃力，他现在做什么都习惯先问AI了', value: 'C', score: 1 },
      { label: '应该能做，但需要人引导一下，不然不知道从哪开始', value: 'D', score: 3 },
    ],
  },

  // ── PA8 · 家长痛点捕捉（为报告 bridge 段提供精准切入点）──
  {
    id: 'PA8',
    text: '关于孩子用AI，下面哪件事是您最真实的感受？',
    dimension: 'pain_point',
    options: [
      { label: '孩子用AI越来越顺手，但我说不清这到底是好事还是坏事', value: 'A', score: 3 },
      { label: '有时候觉得孩子做出来的东西不像他的水平，但又没有证据', value: 'B', score: 4 },
      { label: '想管但不知道管什么，总不能不让他用吧', value: 'C', score: 2 },
      { label: '觉得这些都是学校该操心的事，我管不了那么多', value: 'D', score: 1 },
    ],
  },
]

const primaryPartB: Question[] = [
  // ── PB1 · AI使用场景（上下文）──
  {
    id: 'PB1',
    text: '你平时最常用AI（比如豆包、DeepSeek、Kimi 等）做什么？',
    dimension: 'context',
    options: [
      { label: '主要写作业，把题目发过去看它怎么做', value: 'A', score: 2 },
      { label: '会用它帮我查东西、出主意，但最后我自己来决定怎么用', value: 'B', score: 4 },
      { label: '还没怎么用过，不太熟', value: 'C', score: 1 },
      { label: '有时写作业有时随便聊，什么都问问', value: 'D', score: 3 },
    ],
  },

  // ── PB2 · 主动判断：AI出错认知 ──
  {
    id: 'PB2',
    text: '你有没有发现过AI说错了什么？',
    dimension: 'active_judge',
    options: [
      { label: '遇到过好几次，我发现它说的和事实不一样，查了才确认是它错了', value: 'A', score: 4 },
      { label: '没注意过，我觉得AI应该不会错吧', value: 'B', score: 1 },
      { label: '好像遇到过，但不确定到底是它错了还是我记错了', value: 'C', score: 3 },
      { label: '没遇到过，也没特别想过这个问题', value: 'D', score: 2 },
    ],
  },

  // ── PB3 · 主动定义：写作文的第一步（镜像 → PA3）──
  {
    id: 'PB3',
    text: '老师布置一篇作文，你如果打算用AI帮忙，你的第一步是？',
    dimension: 'active_define',
    mirror: 'PA3',
    options: [
      { label: '直接把题目发给AI，看它写出来什么', value: 'A', score: 1 },
      { label: '先在脑子里想好要写什么方向，再让AI帮我找素材或展开', value: 'B', score: 3 },
      { label: '让AI先给我几个思路，我从里面选一个', value: 'C', score: 2 },
      { label: '先自己写一段开头或列个提纲，再让AI帮我补充不会的部分', value: 'D', score: 4 },
    ],
  },

  // ── PB4 · 主动定义：项目规划 ──
  {
    id: 'PB4',
    text: '老师让你做一个小项目（比如手抄报、调查报告），你会怎么用AI？',
    dimension: 'active_define',
    options: [
      { label: '先自己想好要做什么主题、大概怎么做，再让AI帮我不擅长的部分', value: 'A', score: 4 },
      { label: '让AI帮我整理资料，但步骤和思路我自己想', value: 'B', score: 3 },
      { label: '问AI「这个项目怎么做」，让它给我一个方案我照着做', value: 'C', score: 1 },
      { label: '有时候自己想，有时候直接让AI出方案，看情况', value: 'D', score: 2 },
    ],
  },

  // ── PB5 · 主动判断：处理AI文字输出（镜像 → PA4）──
  {
    id: 'PB5',
    text: 'AI帮你写了一段内容，你拿到之后通常怎么做？',
    dimension: 'active_judge',
    mirror: 'PA4',
    options: [
      { label: '认真看一遍，把我觉得不对的、不喜欢的都改掉，有时让它重写', value: 'A', score: 4 },
      { label: '觉得AI写得比我好，直接用', value: 'B', score: 1 },
      { label: '会读一遍，把感觉不像我自己说的地方换个说法', value: 'C', score: 3 },
      { label: '大概看一眼，没有明显错误就用了', value: 'D', score: 2 },
    ],
  },

  // ── PB6 · 主动判断：矛盾信息处理 ──
  {
    id: 'PB6',
    text: 'AI告诉你一个东西，但你觉得好像和你知道的不一样，你会？',
    dimension: 'active_judge',
    options: [
      { label: '去查一下到底谁对，如果AI错了就用我自己的', value: 'A', score: 4 },
      { label: '再问AI一次，如果它还是这么说就信它吧', value: 'B', score: 2 },
      { label: '觉得差不多就行了，不想那么多', value: 'C', score: 1 },
      { label: '觉得可能是我记错了，用AI的答案比较保险', value: 'D', score: 3 },
    ],
  },

  // ── PB7 · 主动整合：解释决策能力（镜像 → PA5）──
  {
    id: 'PB7',
    text: '用AI帮忙做完一个作品，如果有人问你「这里为什么这么写」，你能回答吗？',
    dimension: 'active_integrate',
    mirror: 'PA5',
    options: [
      { label: '能说清楚——我知道哪些是我决定的、哪些是AI做的、为什么', value: 'A', score: 4 },
      { label: '说不清楚，大部分是AI帮我做的，我也不太记得过程', value: 'B', score: 1 },
      { label: '能说个大概方向，但细节讲不太清楚', value: 'C', score: 2 },
      { label: '大部分能说清楚，除了AI帮我补的那些部分', value: 'D', score: 3 },
    ],
  },

  // ── PB8 · 主动整合：成果归属感 ──
  {
    id: 'PB8',
    text: 'AI帮你写了一篇作文，老师给了很高的分，你心里是什么感觉？',
    dimension: 'active_integrate',
    options: [
      { label: '觉得这个分不完全算我的，下次想试试自己写能不能也行', value: 'A', score: 4 },
      { label: '开心，但心里有点奇怪的感觉，说不上来', value: 'B', score: 2 },
      { label: '很开心，分数高就好', value: 'C', score: 1 },
      { label: '开心，但也想知道自己真实的水平到底怎么样', value: 'D', score: 3 },
    ],
  },

  // ── PB9 · 主动整合：离开AI的独立信心 ──
  {
    id: 'PB9',
    text: '如果有一次考试或作业完全不能用AI，你的真实感受是？',
    dimension: 'active_integrate',
    options: [
      { label: '没问题，AI只是让我更快，我本来就能做', value: 'A', score: 4 },
      { label: '有点紧张，但努力一下应该可以', value: 'B', score: 3 },
      { label: '会很吃力，我已经习惯有AI帮忙了', value: 'C', score: 2 },
      { label: '觉得不公平，为什么不让用', value: 'D', score: 1 },
    ],
  },
]

const primaryOpenA: OpenQuestion = {
  id: 'POA',
  text: '最近有没有一件具体的事，让您对孩子用AI产生了担心或困惑？请简单描述那个场景。',
  dimension: 'open',
}

const primaryOpenB: OpenQuestion = {
  id: 'POB',
  text: '用AI做过的事情里，有没有哪一次让你觉得「这个确实是我自己做的」？或者哪一次让你觉得有点心虚？说一件真实的事。',
  dimension: 'open',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 中级版（7–9 年级）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const middlePartA: Question[] = [
  // ── MA1 · 家长认知状态 ──
  {
    id: 'MA1',
    text: '关于孩子用AI做作业这件事，您目前的状态是？',
    dimension: 'context',
    options: [
      { label: '我们商量过规则——什么情况用、怎么用、我怎么检查', value: 'A', score: 4 },
      { label: '知道孩子在用，提醒过别太依赖，但没有具体的约定', value: 'B', score: 2 },
      { label: '不太了解孩子怎么用的，也不确定该不该管', value: 'C', score: 1 },
      { label: '时不时会问一下，但孩子大了不太愿意细说', value: 'D', score: 3 },
    ],
  },

  // ── MA2 · 家长自身AI使用行为 ──
  {
    id: 'MA2',
    text: '您自己平时用AI工具时（比如工作写方案、查资料），通常怎么对待AI给的内容？',
    dimension: 'parent_behavior',
    options: [
      { label: '会判断哪些能用、哪些需要改，最后输出的东西是经过我筛选的', value: 'A', score: 4 },
      { label: '看着差不多就直接用了，没太仔细看', value: 'B', score: 2 },
      { label: '基本不怎么用AI，或者只是偶尔问问简单问题', value: 'C', score: 1 },
      { label: '会看一遍，大问题改改，小问题就算了', value: 'D', score: 3 },
    ],
  },

  // ── MA3 · 主动定义观察（镜像 → MB2）──
  {
    id: 'MA3',
    text: '孩子遇到不会的作业题时，您观察到他的第一反应通常是？',
    dimension: 'active_define',
    mirror: 'MB2',
    options: [
      { label: '直接打开AI问答案，拿到就抄上去', value: 'A', score: 1 },
      { label: '先自己想一想，不会再查资料或者问AI', value: 'B', score: 3 },
      { label: '先自己尽力做，实在不会的才问AI，而且会看解题思路', value: 'C', score: 4 },
      { label: '问AI拿到答案后，有时候会看看解题过程', value: 'D', score: 2 },
    ],
  },

  // ── MA4 · 主动整合观察（镜像 → MB6）──
  {
    id: 'MA4',
    text: '孩子写完一篇用AI辅助的文章，您问他「怎么写出来的」，他通常？',
    dimension: 'active_integrate',
    mirror: 'MB6',
    options: [
      { label: '能清楚说出哪些观点是他自己的、AI帮了什么、为什么这么安排', value: 'A', score: 4 },
      { label: '说不太清楚，含糊带过', value: 'B', score: 2 },
      { label: '没问过这个问题', value: 'C', score: 1 },
      { label: '能说出大致过程，但追问细节就不太顺畅了', value: 'D', score: 3 },
    ],
  },

  // ── MA5 · 主动判断观察（镜像 → MB3）──
  {
    id: 'MA5',
    text: '孩子在讨论一个话题或者展示作品时，他的表达给您的感觉是？',
    dimension: 'active_judge',
    mirror: 'MB3',
    options: [
      { label: '有自己的看法，能说出理由，有时还会质疑别人的观点', value: 'A', score: 4 },
      { label: '说得挺好的，但感觉像在背一段什么东西，不太像他自己的话', value: 'B', score: 2 },
      { label: '不太爱表达，觉得「问AI就知道了」', value: 'C', score: 1 },
      { label: '有想法，可能不太深，但确实是他自己想的', value: 'D', score: 3 },
    ],
  },

  // ── MA6 · 家长实际干预行为（与 MA1 构成矛盾检测）──
  {
    id: 'MA6',
    text: '孩子拿用AI做的作业给您看时，您通常的实际做法是？',
    dimension: 'parent_behavior',
    options: [
      { label: '问「哪些是你自己的判断？为什么这么写？」让他讲讲过程', value: 'A', score: 4 },
      { label: '看了完成就行，平时作业太多不可能每次都细看', value: 'B', score: 1 },
      { label: '夸他会用工具，顺便叮嘱几句「别太依赖」', value: 'C', score: 2 },
      { label: '有时间的时候会问问过程，忙的时候就看一眼结果', value: 'D', score: 3 },
    ],
  },

  // ── MA7 · 独立能力基线 ──
  {
    id: 'MA7',
    text: '如果完全不用AI，孩子能独立完成一篇有质量的作文或报告吗？',
    dimension: 'context',
    options: [
      { label: '没问题，AI只是让他更快，独立写作能力是有的', value: 'A', score: 4 },
      { label: '估计很吃力，他已经习惯让AI帮忙构思和写大纲了', value: 'B', score: 1 },
      { label: '能完成，但质量会下降不少，特别是组织论述的部分', value: 'C', score: 3 },
      { label: '不确定，没有试过完全不用AI的情况', value: 'D', score: 2 },
    ],
  },

  // ── MA8 · 家长痛点捕捉 ──
  {
    id: 'MA8',
    text: '关于孩子用AI，下面哪句话最像您心里真实的想法？',
    dimension: 'pain_point',
    options: [
      { label: '作业做得又快又好，但我心里总有一个疑问：这到底是他的能力还是AI的', value: 'A', score: 4 },
      { label: '担心不让用会落后，又怕用多了有依赖——左右为难', value: 'B', score: 3 },
      { label: '初中学业压力大，能用工具提效率是好事，没必要太纠结', value: 'C', score: 1 },
      { label: '想引导但不知道具体怎么做，说多了孩子还嫌烦', value: 'D', score: 2 },
    ],
  },
]

const middlePartB: Question[] = [
  // ── MB1 · 主动定义：与AI的关系认知 ──
  {
    id: 'MB1',
    text: '如果用一句话描述你和AI的关系，哪个最像？',
    dimension: 'active_define',
    options: [
      { label: '我是指挥，AI是工具——我的计划我做主，AI帮我执行', value: 'A', score: 4 },
      { label: 'AI是参谋，我会参考它的建议，但最后我来定', value: 'B', score: 3 },
      { label: '很多时候AI在出主意，我在执行它的方案', value: 'C', score: 2 },
      { label: 'AI是我的手——我出题，它来答，我来交差', value: 'D', score: 1 },
    ],
  },

  // ── MB2 · 主动定义：任务启动方式（镜像 → MA3）──
  {
    id: 'MB2',
    text: '老师布置了一篇关于某个话题的文章，你通常怎么开始？',
    dimension: 'active_define',
    mirror: 'MA3',
    options: [
      { label: '先想清楚我对这个话题的看法，再让AI帮我查资料，最后我来写', value: 'A', score: 4 },
      { label: '让AI列出几个不同角度，我选一个再写', value: 'B', score: 3 },
      { label: '直接把要求发给AI让它写，我改改再交', value: 'C', score: 1 },
      { label: '看情况，有想法的时候自己写，没想法就让AI先写个梗概', value: 'D', score: 2 },
    ],
  },

  // ── MB3 · 主动判断：处理AI文段（镜像 → MA5）──
  {
    id: 'MB3',
    text: 'AI帮你写了一段话，你拿到之后通常怎么处理？',
    dimension: 'active_judge',
    mirror: 'MA5',
    options: [
      { label: '认真读，把逻辑有问题的、和我观点不符的都改成我自己的', value: 'A', score: 4 },
      { label: '会读一遍，把明显跟我想法不同的地方改掉', value: 'B', score: 3 },
      { label: '觉得AI写得比我好，直接用', value: 'C', score: 1 },
      { label: '主要看格式和字数达不达标，能交就行', value: 'D', score: 2 },
    ],
  },

  // ── MB4 · 主动判断：矛盾信息处理 ──
  {
    id: 'MB4',
    text: '用AI查了一个知识点，发现和课本说的不一样，你会？',
    dimension: 'active_judge',
    options: [
      { label: '去查其他来源，对比之后自己判断谁说得对', value: 'A', score: 4 },
      { label: '以课本为准，毕竟考试考的是课本', value: 'B', score: 3 },
      { label: '再问AI一次，如果它还这么说就信它', value: 'C', score: 2 },
      { label: '无所谓，作业能交就行', value: 'D', score: 1 },
    ],
  },

  // ── MB5 · 主动判断：对AI局限的认知 ──
  {
    id: 'MB5',
    text: '你觉得AI最大的问题是什么？',
    dimension: 'active_judge',
    options: [
      { label: '它会很自信地说错话，看起来像对的但其实有问题——这最危险', value: 'A', score: 4 },
      { label: '写出来的东西缺少「人味」，像模板', value: 'B', score: 3 },
      { label: '没什么大问题，现在的AI已经很强了', value: 'C', score: 1 },
      { label: '没认真想过这个', value: 'D', score: 2 },
    ],
  },

  // ── MB6 · 主动整合：观点归属感（镜像 → MA4）──
  {
    id: 'MB6',
    text: '写完一篇AI辅助的文章，你觉得里面的观点是「你的」还是「AI的」？',
    dimension: 'active_integrate',
    mirror: 'MA4',
    options: [
      { label: '是我的——核心观点我自己想的，AI只是帮我查资料和润色', value: 'A', score: 4 },
      { label: '一半一半吧，有些是我的想法，有些是AI的', value: 'B', score: 3 },
      { label: '说实话大部分是AI的，我主要改了改词句', value: 'C', score: 2 },
      { label: '没想过这个问题，完成就行', value: 'D', score: 1 },
    ],
  },

  // ── MB7 · 主动整合：离开AI的独立信心 ──
  {
    id: 'MB7',
    text: '如果老师说某次考试的作文不能用AI，必须完全自己写，你的真实感受是？',
    dimension: 'active_integrate',
    options: [
      { label: '没问题，AI只是让我更快，我本来就能写', value: 'A', score: 4 },
      { label: '有点麻烦，但努力一下应该能搞定', value: 'B', score: 3 },
      { label: '会比较困难，我现在不太习惯完全自己构思了', value: 'C', score: 2 },
      { label: '觉得不合理，现在都什么时代了还不让用工具', value: 'D', score: 1 },
    ],
  },

  // ── MB8 · 主动整合：过程还原能力 ──
  {
    id: 'MB8',
    text: '如果要你在全班面前介绍一件用AI做的作品——你做了什么决定、AI帮了什么——你能讲清楚吗？',
    dimension: 'active_integrate',
    options: [
      { label: '完全可以，我清楚每一步的选择和理由', value: 'A', score: 4 },
      { label: '大方向能说，但有些步骤确实记不太清了', value: 'B', score: 3 },
      { label: '有点难，很多环节是AI做的，我也说不清界限', value: 'C', score: 2 },
      { label: '不太行，因为大部分就是AI做的，我不知道该怎么讲', value: 'D', score: 1 },
    ],
  },
]

const middleOpenA: OpenQuestion = {
  id: 'MOA',
  text: '最近有没有一个瞬间，让您对孩子使用AI感到不安或者纠结？请简单描述那个场景。',
  dimension: 'open',
}

const middleOpenB: OpenQuestion = {
  id: 'MOB',
  text: '用AI做过的事情里，有没有哪次让你觉得「这不算我做的」？或者哪次让你觉得「这才是我真正做的」？说一件真实的事。',
  dimension: 'open',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 高级版（10–12 年级）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const seniorPartA: Question[] = [
  // ── SA1 · 家长认知状态 ──
  {
    id: 'SA1',
    text: '对于高中生使用AI，您的基本判断是？',
    dimension: 'context',
    options: [
      { label: 'AI必须会用，但前提是孩子有独立思考的基础，两者不能偏废', value: 'A', score: 4 },
      { label: '既担心不会用未来竞争力不够，又怕用太多丢了独立思考——很矛盾', value: 'B', score: 3 },
      { label: '高中课业压力大，用AI能提效就用，先把成绩搞好再说', value: 'C', score: 2 },
      { label: '孩子大了有自己的判断，我不太操心这件事', value: 'D', score: 1 },
    ],
  },

  // ── SA2 · 家长自身AI使用行为 ──
  {
    id: 'SA2',
    text: '您自己在工作中使用AI时，如何处理AI生成的内容？',
    dimension: 'parent_behavior',
    options: [
      { label: '会审视逻辑和准确性，不合适的部分一定会改，最终输出是我把关的', value: 'A', score: 4 },
      { label: '大体看看没大问题就用了，细节没精力一一核实', value: 'B', score: 2 },
      { label: '目前工作中用AI不多，没有太多经验', value: 'C', score: 1 },
      { label: '会看一遍做些调整，但不会每段都仔细审', value: 'D', score: 3 },
    ],
  },

  // ── SA3 · 主动定义观察（镜像 → SB3）──
  {
    id: 'SA3',
    text: '您观察过孩子写论文或做研究类作业时，AI在其中扮演什么角色？',
    dimension: 'active_define',
    mirror: 'SB3',
    options: [
      { label: '孩子先有自己的框架和核心观点，用AI辅助查资料和整理素材', value: 'A', score: 4 },
      { label: '孩子用AI生成初稿，然后在上面做修改和补充', value: 'B', score: 3 },
      { label: '孩子比较依赖AI生成主要内容，自己改动不太多', value: 'C', score: 2 },
      { label: '不太清楚孩子具体怎么用的', value: 'D', score: 1 },
    ],
  },

  // ── SA4 · 主动整合观察（镜像 → SB6）──
  {
    id: 'SA4',
    text: '孩子完成一篇重要文章后，您问他「这个核心观点是你自己想出来的吗」，他通常？',
    dimension: 'active_integrate',
    mirror: 'SB6',
    options: [
      { label: '能清楚说出自己的判断过程——哪些是他的、哪些参考了AI、为什么', value: 'A', score: 4 },
      { label: '能大致分清，但追问深层理由就说不上来了', value: 'B', score: 3 },
      { label: '说不太清楚，或者不觉得需要分清', value: 'C', score: 2 },
      { label: '没问过这个问题', value: 'D', score: 1 },
    ],
  },

  // ── SA5 · 主动判断观察（镜像 → SB2）──
  {
    id: 'SA5',
    text: '孩子讨论新闻或社会话题时，他的观点质量让您感觉？',
    dimension: 'active_judge',
    mirror: 'SB2',
    options: [
      { label: '有独立见解，能给出理由，有时还能看到问题的另一面', value: 'A', score: 4 },
      { label: '分析得还可以，但有些论点像是从什么地方搬来的，不太像他自己的', value: 'B', score: 2 },
      { label: '有自己的看法，深度一般但确实是他自己想的', value: 'C', score: 3 },
      { label: '不太爱讨论，或者觉得「问AI就知道了」', value: 'D', score: 1 },
    ],
  },

  // ── SA6 · 家长实际干预行为（与 SA1 构成矛盾检测）──
  //    ** 原版高中缺失的关键题，导致 parent_says_worry_acts_passive 在高中永远不触发 **
  {
    id: 'SA6',
    text: '孩子把用AI做的重要作品拿给您看时，您实际上通常怎么做？',
    dimension: 'parent_behavior',
    options: [
      { label: '认真看，会问「哪些判断是你自己的？AI起了什么作用？」', value: 'A', score: 4 },
      { label: '基本不看过程，他自己安排就好，我看结果', value: 'B', score: 1 },
      { label: '简单看一下，夸一句「做得不错」，不深入追问', value: 'C', score: 2 },
      { label: '有空的时候会聊聊他的思路，但大多数时候只看完成没有', value: 'D', score: 3 },
    ],
  },

  // ── SA7 · 独立能力基线 ──
  {
    id: 'SA7',
    text: '如果一次重要考试的作文不能使用任何AI辅助，您觉得孩子能应对吗？',
    dimension: 'context',
    options: [
      { label: '能，他的核心写作和思考能力是有的，AI只是提效', value: 'A', score: 4 },
      { label: '能完成，但质量会下降，特别是论述深度和资料支撑', value: 'B', score: 3 },
      { label: '有点悬，他现在很多思路都是在和AI对话中形成的', value: 'C', score: 2 },
      { label: '不确定，平时都在用AI，很久没看到他完全独立写的东西了', value: 'D', score: 1 },
    ],
  },

  // ── SA8 · 家长痛点捕捉 ──
  {
    id: 'SA8',
    text: '关于孩子和AI的关系，下面哪个最让您在意？',
    dimension: 'pain_point',
    options: [
      { label: '人人都会用AI的未来，如果孩子只是用得熟练而没有自己的思维深度，竞争力在哪', value: 'A', score: 4 },
      { label: '现阶段先保证成绩和升学，思维能力的事以后再说', value: 'B', score: 1 },
      { label: '孩子写出来的东西越来越「AI味」，他自己的声音越来越弱', value: 'C', score: 3 },
      { label: '我既不确定该怎么引导，也不确定自己说的对不对', value: 'D', score: 2 },
    ],
  },
]

const seniorPartB: Question[] = [
  // ── SB1 · 主动定义：与AI的关系定位 ──
  {
    id: 'SB1',
    text: '如果用一个比喻描述你和AI的关系，哪个最准确？',
    dimension: 'active_define',
    options: [
      { label: '我是导演，AI是执行团队——我定方向和标准，AI帮我实现', value: 'A', score: 4 },
      { label: '我和AI是搭档——AI出初稿，我来判断和修改', value: 'B', score: 3 },
      { label: 'AI更像辅导老师——很多时候AI告诉我怎么做，我执行', value: 'C', score: 2 },
      { label: 'AI是工具人——我出题它来答，效率高就好', value: 'D', score: 1 },
    ],
  },

  // ── SB2 · 主动判断：对AI局限的理解深度（镜像 → SA5）──
  {
    id: 'SB2',
    text: '你认为AI最大的危险或不足是什么？',
    dimension: 'active_judge',
    mirror: 'SA5',
    options: [
      { label: '它能生成「看起来专业」的内容，但不能保证正确和有深度——这才最容易让人掉坑', value: 'A', score: 4 },
      { label: '知识有滞后性，有时会编造信息', value: 'B', score: 3 },
      { label: '没什么明显不足，现在的AI已经很强了', value: 'C', score: 1 },
      { label: '没认真想过这个问题', value: 'D', score: 2 },
    ],
  },

  // ── SB3 · 主动定义：论文/重要写作的启动方式（镜像 → SA3）──
  {
    id: 'SB3',
    text: '老师布置了一篇需要独立论证的文章，你通常怎么做？',
    dimension: 'active_define',
    mirror: 'SA3',
    options: [
      { label: '先确定自己的核心观点和论证结构，用AI辅助查资料，最后完全自己写', value: 'A', score: 4 },
      { label: '让AI生成框架和初稿，我在上面大幅修改并融入自己的观点', value: 'B', score: 3 },
      { label: '看时间和难度，有时候自己写，有时候让AI先写', value: 'C', score: 2 },
      { label: '让AI写大部分，我主要负责调整完善和查漏补缺', value: 'D', score: 1 },
    ],
  },

  // ── SB4 · 主动判断：深度审视能力 ──
  {
    id: 'SB4',
    text: 'AI为你生成了一段关于某个议题的分析，你怎么处理？',
    dimension: 'active_judge',
    options: [
      { label: '审它的论证结构：前提是否成立、论据是否可靠、有没有逻辑漏洞', value: 'A', score: 4 },
      { label: '看有没有明显的事实错误，没有的话大体能用', value: 'B', score: 2 },
      { label: '主要看字数和格式合不合要求', value: 'C', score: 1 },
      { label: '对照我自己的判断，把不认同的部分改掉', value: 'D', score: 3 },
    ],
  },

  // ── SB5 · 主动判断：多源矛盾处理 ──
  {
    id: 'SB5',
    text: '你用AI查了一个观点，发现不同来源说法矛盾，你会？',
    dimension: 'active_judge',
    options: [
      { label: '继续查原始文献或权威来源，分析矛盾原因，形成自己的判断', value: 'A', score: 4 },
      { label: '再问AI一次，让它综合各方给我一个结论', value: 'B', score: 2 },
      { label: '选看起来最可信的那个用就行', value: 'C', score: 3 },
      { label: '这种情况很少遇到，我一般只用一个来源', value: 'D', score: 1 },
    ],
  },

  // ── SB6 · 主动整合：核心观点归属（镜像 → SA4）──
  {
    id: 'SB6',
    text: '用AI协助完成一篇重要文章后，你能说清楚其中每个核心观点的来源吗？',
    dimension: 'active_integrate',
    mirror: 'SA4',
    options: [
      { label: '能——我有意识地区分自己的思考和AI的贡献，每个决策我都清楚', value: 'A', score: 4 },
      { label: '大致能说，但有些细节已经分不清是我的还是AI的了', value: 'B', score: 3 },
      { label: '说实话很难分清，我和AI的边界在写作过程中越来越模糊', value: 'C', score: 2 },
      { label: '不觉得需要分清，最终结果好就行', value: 'D', score: 1 },
    ],
  },

  // ── SB7 · 主动整合：独立信心 ──
  {
    id: 'SB7',
    text: '如果大学自主招生面试要你现场写一篇分析文章，完全不能用AI，你的真实感受？',
    dimension: 'active_integrate',
    options: [
      { label: '没问题，AI只是让我更高效，我有能力独立完成有质量的文章', value: 'A', score: 4 },
      { label: '有点紧张，质量可能不如有AI辅助时，但应该能过关', value: 'B', score: 3 },
      { label: '会比较困难，我很多思路和论述习惯都是在AI帮助下形成的', value: 'C', score: 2 },
      { label: '觉得这种考核方式不合理，AI时代应该允许使用工具', value: 'D', score: 1 },
    ],
  },

  // ── SB8 · 主动整合：过程还原能力 ──
  {
    id: 'SB8',
    text: '如果要你做一场关于自己研究项目的答辩，面对老师的追问，你有信心说清楚思路吗？',
    dimension: 'active_integrate',
    options: [
      { label: '完全可以，每个选择和判断背后的理由我都清楚', value: 'A', score: 4 },
      { label: '核心论点能讲，但涉及某些数据分析和论证细节可能答不上来', value: 'B', score: 3 },
      { label: '有点心虚，有些环节是AI帮我做的，深入追问可能露怯', value: 'C', score: 2 },
      { label: '不太行，项目里很多部分我也说不清是怎么来的', value: 'D', score: 1 },
    ],
  },
]

const seniorOpenA: OpenQuestion = {
  id: 'SOA',
  text: '最近有没有一件事让您开始思考「孩子在AI时代的竞争力到底是什么」？请简单描述那个触动您的场景。',
  dimension: 'open',
}

const seniorOpenB: OpenQuestion = {
  id: 'SOB',
  text: '用AI做过的事情里，有没有哪一次你自己觉得「这篇东西虽然分数高，但不是我真正的水平」？或者哪一次你觉得「AI只是工具，这才是我的作品」？说一件真实的事。',
  dimension: 'open',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 导出
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QUESTIONS: Record<'primary' | 'middle' | 'senior', GradeQuestions> = {
  primary: { partA: primaryPartA, partB: primaryPartB, openA: primaryOpenA, openB: primaryOpenB },
  middle:  { partA: middlePartA,  partB: middlePartB,  openA: middleOpenA,  openB: middleOpenB },
  senior:  { partA: seniorPartA,  partB: seniorPartB,  openA: seniorOpenA,  openB: seniorOpenB },
}

export const GRADE_LABELS = {
  primary: '小学（4-6年级）',
  middle:  '初中（7-9年级）',
  senior:  '高中（10-12年级）',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 供 scoring.ts 使用的维度映射说明
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// DIMENSION_MAP（只使用学生题 Part B 计算维度分数）:
//
// primary: {
//   active_define:    ['PB3', 'PB4'],
//   active_judge:     ['PB2', 'PB5', 'PB6'],
//   active_integrate: ['PB7', 'PB8', 'PB9'],
// }
// middle: {
//   active_define:    ['MB1', 'MB2'],
//   active_judge:     ['MB3', 'MB4', 'MB5'],
//   active_integrate: ['MB6', 'MB7', 'MB8'],
// }
// senior: {
//   active_define:    ['SB1', 'SB3'],
//   active_judge:     ['SB2', 'SB4', 'SB5'],
//   active_integrate: ['SB6', 'SB7', 'SB8'],
// }
//
// MIRROR_PAIRS（家长题 → 学生题，用于矛盾检测）:
//
// primary: [['PA3', 'PB3'], ['PA4', 'PB5'], ['PA5', 'PB7']]
// middle:  [['MA3', 'MB2'], ['MA5', 'MB3'], ['MA4', 'MB6']]
// senior:  [['SA3', 'SB3'], ['SA5', 'SB2'], ['SA4', 'SB6']]
//
// 家长「说 vs 做」矛盾检测（worry → action）:
//
// primary: PA1 (worry/context) vs PA6 (actual behavior)
// middle:  MA1 (worry/context) vs MA6 (actual behavior)
// senior:  SA1 (worry/context) vs SA6 (actual behavior)
//    ** SA6 是本次新增的关键题，修复原版高中无法触发此矛盾类型的bug **
//
// 学生「知道但没做到」检测（awareness → behavior）:
//
// primary: PB2 (awareness) vs PB6 (behavior)
// middle:  MB5 (awareness) vs MB4 (behavior)
// senior:  SB2 (awareness) vs SB5 (behavior)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
