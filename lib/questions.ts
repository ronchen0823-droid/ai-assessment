// lib/questions.ts
// 设计原则：每道题都是镜子，不是试卷
// 1. 用具体场景还原代替抽象态度询问，降低社会期望偏差
// 2. 家长/学生镜像题：同一场景两人各描述，差距本身是最有价值的数据
// 3. 每道题标注所属维度，方便 scoring.ts 维护
// 4. 开放题不进评分，只进 prompt，让报告有"专属感"

export type Dimension = 'active_define' | 'active_judge' | 'active_integrate' | 'context' | 'open'
export type Option = { label: string; value: 'A' | 'B' | 'C' | 'D'; score: 1 | 2 | 3 | 4 }
export type Question = {
  id: string
  text: string
  dimension: Dimension   // 明确归属维度，scoring.ts 以此为准
  mirror?: string        // 对应的镜像题 ID（家长题↔学生题）
  options: Option[]
}
export type OpenQuestion = { id: string; text: string; dimension: 'open' }
export type GradeQuestions = {
  partA: Question[]
  partB: Question[]
  openA: OpenQuestion   // 家长开放题
  openB: OpenQuestion   // 学生开放题
}

// ─────────────────────────────────────────────
// 初级版（4-6 年级）
// ─────────────────────────────────────────────

const primaryPartA: Question[] = [
  // --- context：家庭 AI 氛围 ---
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'PA1',
    text: '在你们家，孩子用 AI 这件事更接近哪种状态？',
    dimension: 'context',
    options: [
      { label: '我们聊过哪些情况可以用、哪些最好自己做', value: 'A', score: 3 },
      { label: '基本没规则，孩子想用就用，我不太管', value: 'B', score: 1 },
      { label: '我会主动跟他一起用，讨论 AI 给的内容对不对', value: 'C', score: 4 },
      { label: '我会偶尔提醒他别太依赖，但没有具体规定', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=4 B=2 C=1 D=3
  {
    id: 'PA2',
    text: '您自己平时用 AI 工具吗？',
    dimension: 'context',
    options: [
      { label: '经常用，基本知道 AI 能做什么、不能做什么', value: 'A', score: 3 },
      { label: '几乎不用，不太会', value: 'B', score: 1 },
      { label: '偶尔用用，比如查个信息', value: 'C', score: 2 },
      { label: '深度使用，自己也在摸索怎么用好它', value: 'D', score: 4 },
    ],
  },

  // --- active_define 镜像题（对应 PB3）---
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'PA3',
    text: '孩子打开 AI 做作业时，您观察到他通常第一步做什么？',
    dimension: 'active_define',
    mirror: 'PB3',
    options: [
      { label: '他会先自己写或画一些，再让 AI 补充他不会的', value: 'A', score: 4 },
      { label: '直接把题目或要求发给 AI', value: 'B', score: 2 },
      { label: '没注意过 / 不太清楚', value: 'C', score: 1 },
      { label: '先想一想，再问 AI 要某个具体的部分', value: 'D', score: 3 },
    ],
  },

  // --- active_judge 镜像题（对应 PB5）---
  // 分值分布: A=3 B=4 C=2 D=1
  {
    id: 'PA4',
    text: 'AI 给孩子内容之后，您观察到他通常怎么处理？',
    dimension: 'active_judge',
    mirror: 'PB5',
    options: [
      { label: '会读一遍，把他觉得不对的地方改掉', value: 'A', score: 3 },
      { label: '会认真对比，有时候他会说「这个 AI 写得不是我的感觉」', value: 'B', score: 4 },
      { label: '有时候改有时候不改，看他有没有时间', value: 'C', score: 2 },
      { label: '基本直接用，可能改改格式就交了', value: 'D', score: 1 },
    ],
  },

  // --- active_integrate 镜像题（对应 PB7）---
  // 分值分布: A=2 B=1 C=4 D=3
  {
    id: 'PA5',
    text: '孩子把用 AI 做的作品拿给您看，您问他「这里为什么这么写」，他通常能回答吗？',
    dimension: 'active_integrate',
    mirror: 'PB7',
    options: [
      { label: '说不太清楚，或者就说「AI 帮我写的」', value: 'A', score: 2 },
      { label: '没问过这个问题', value: 'B', score: 1 },
      { label: '能说清楚哪些是自己想的、哪些是 AI 补的、为什么', value: 'C', score: 4 },
      { label: '能说个大概，但比较笼统', value: 'D', score: 3 },
    ],
  },

  // --- active_judge：家长自身行为，检验「说担心」和「实际做」的矛盾 ---
  // 分值分布: A=4 B=1 C=3 D=2
  {
    id: 'PA6',
    text: '孩子把用 AI 完成的作业交给您看，您通常的第一反应是？',
    dimension: 'active_judge',
    options: [
      { label: '问他「哪些是你自己的想法，哪些是 AI 给的？」', value: 'A', score: 4 },
      { label: '一般不细问，做出来就好', value: 'B', score: 1 },
      { label: '顺带问一句「下次能不能多自己想想」', value: 'C', score: 3 },
      { label: '夸他效率高，会用工具', value: 'D', score: 2 },
    ],
  },

  // --- context：独立能力基线 ---
  // 分值分布: A=3 B=2 C=4 D=1
  {
    id: 'PA7',
    text: '如果让孩子不用 AI，独立完成一份他平时用 AI 做的作业，您觉得？',
    dimension: 'context',
    options: [
      { label: '估计很难，他已经习惯 AI 了', value: 'A', score: 1 },
      { label: '可能需要引导，但基本能力应该还在', value: 'B', score: 3 },
      { label: '没试过，不好说', value: 'C', score: 2 },
      { label: '没问题，AI 只是让他更快，能力本身是有的', value: 'D', score: 4 },
    ],
  },
]

const primaryPartB: Question[] = [
  // --- context：AI 使用频率和场景 ---
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'PB1',
    text: '你平时用 AI（比如豆包、Deepseek 等）最多用来做什么？',
    dimension: 'context',
    options: [
      { label: '主要拿来写作业——把题目发给它，看它怎么做', value: 'A', score: 2 },
      { label: '还没怎么用过', value: 'B', score: 1 },
      { label: '两种都有，有时写作业，有时就是好奇随便问问', value: 'C', score: 3 },
      { label: '会用它帮我查东西、出主意，但我自己来决定用哪个', value: 'D', score: 4 },
    ],
  },

  // --- active_judge：对 AI 能力边界的认知 ---
  // 分值分布: A=4 B=1 C=3 D=2
  {
    id: 'PB2',
    text: '你有没有发现过 AI 说错了什么？',
    dimension: 'active_judge',
    options: [
      { label: '遇到过，我发现它说的和我知道的不一样，去查了才知道它错了', value: 'A', score: 4 },
      { label: '没注意过，AI 说的应该都对吧', value: 'B', score: 1 },
      { label: '好像遇到过，但不确定是它错了还是我记错了', value: 'C', score: 3 },
      { label: '没遇到过，也没想过这个问题', value: 'D', score: 2 },
    ],
  },

  // --- active_define 镜像题（对应 PA3）---
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'PB3',
    text: '老师让你写一篇作文，你打开 AI，你的第一步通常是？',
    dimension: 'active_define',
    mirror: 'PA3',
    options: [
      { label: '直接把作文题目发给 AI，看它怎么写', value: 'A', score: 1 },
      { label: '先在脑子里想好写什么，再让 AI 帮我找素材', value: 'B', score: 3 },
      { label: '让 AI 给我几个思路，从里面选一个', value: 'C', score: 2 },
      { label: '先自己写一段，再让 AI 帮我看看还缺什么', value: 'D', score: 4 },
    ],
  },

  // --- active_define：主动规划 ---
  // 分值分布: A=4 B=2 C=1 D=3
  {
    id: 'PB4',
    text: '老师让你做一个小项目，你会怎么用 AI？',
    dimension: 'active_define',
    options: [
      { label: '先自己想好要做什么、怎么做，然后让 AI 帮忙我不会的部分', value: 'A', score: 4 },
      { label: '不确定怎么用 AI 做这种事', value: 'B', score: 1 },
      { label: '问 AI「这个项目怎么做」，让它给我一个方案照着做', value: 'C', score: 1 },
      { label: '让 AI 帮我整理资料，步骤和思路我自己想', value: 'D', score: 3 },
    ],
  },

  // --- active_judge 镜像题（对应 PA4）---
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'PB5',
    text: 'AI 帮你写了一段文字，你拿到之后通常怎么做？',
    dimension: 'active_judge',
    mirror: 'PA4',
    options: [
      { label: '大概看一眼，没有明显错误就用了', value: 'A', score: 2 },
      { label: '认真读，把我觉得不对的或者不喜欢的都改掉，有时候改很多', value: 'B', score: 4 },
      { label: '觉得 AI 写得比我好，直接用', value: 'C', score: 1 },
      { label: '会读一遍，把感觉不像我自己写的地方改掉', value: 'D', score: 3 },
    ],
  },

  // --- active_judge：遇到矛盾信息的处理 ---
  // 分值分布: A=4 B=2 C=1 D=2
  {
    id: 'PB6',
    text: 'AI 告诉你一个信息，但你觉得和你知道的不一样，你会？',
    dimension: 'active_judge',
    options: [
      { label: '去查一下到底谁对，如果是 AI 错了就改过来', value: 'A', score: 4 },
      { label: '再问 AI 一次，如果它坚持就信它', value: 'B', score: 2 },
      { label: '差不多就行了，懒得细究', value: 'C', score: 1 },
      { label: '觉得可能是我记错了，就用 AI 的', value: 'D', score: 2 },
    ],
  },

  // --- active_integrate 镜像题（对应 PA5）---
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'PB7',
    text: 'AI 帮你做完一件作品，如果有人问你「这里你为什么这么做」，你能回答吗？',
    dimension: 'active_integrate',
    mirror: 'PA5',
    options: [
      { label: '大部分能说清楚，除了 AI 帮我补的部分', value: 'A', score: 3 },
      { label: '说不清楚，反正是 AI 帮我做的', value: 'B', score: 1 },
      { label: '能说清楚，我知道哪些是我自己想的、哪些是让 AI 做的、为什么这么分', value: 'C', score: 4 },
      { label: '能说个大概，但细节说不清楚', value: 'D', score: 2 },
    ],
  },

  // --- active_integrate：成果归属感 ---
  // 分值分布: A=4 B=2 C=1 D=3
  {
    id: 'PB8',
    text: 'AI 帮你写了一篇作文，老师给了高分，你心里会？',
    dimension: 'active_integrate',
    options: [
      { label: '很开心，反正高分就行', value: 'A', score: 1 },
      { label: '开心，但想下次试试自己写能不能也得高分', value: 'B', score: 3 },
      { label: '开心，但有一点点奇怪的感觉', value: 'C', score: 2 },
      { label: '觉得这分不算数，那不是我写的', value: 'D', score: 4 },
    ],
  },
]

const primaryOpenA: OpenQuestion = {
  id: 'POA',
  text: '关于孩子用 AI 这件事，您现在心里最担心的一件具体的事是什么？（一句话就够，不用写完整）',
  dimension: 'open',
}

const primaryOpenB: OpenQuestion = {
  id: 'POB',
  text: '用 AI 这件事，有没有哪次让你觉得不太对劲，或者让你有点骄傲？说一件真实的事就行。',
  dimension: 'open',
}

// ─────────────────────────────────────────────
// 中级版（7-9 年级）
// ─────────────────────────────────────────────

const middlePartA: Question[] = [
  // 分值分布: A=4 B=1 C=2 D=3
  {
    id: 'MA1',
    text: '在你们家，孩子用 AI 完成作业这件事更接近哪种状态？',
    dimension: 'context',
    options: [
      { label: '我们商量过规则，哪些作业可以用、哪些要自己来', value: 'A', score: 4 },
      { label: '我不太了解孩子具体怎么用，没关注过', value: 'B', score: 1 },
      { label: '知道在用，但不确定该不该管、怎么管', value: 'C', score: 2 },
      { label: '我会时不时提醒，但没有明确规则', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'MA2',
    text: '孩子遇到不会做的题，他的第一反应通常是？',
    dimension: 'active_define',
    options: [
      { label: '先自己想一想，不会再去搜或者问 AI', value: 'A', score: 3 },
      { label: '直接问 AI 拿答案，不太看过程', value: 'B', score: 1 },
      { label: '先自己努力一段时间，实在卡住了才找工具', value: 'C', score: 4 },
      { label: '问 AI，拿到答案后有时会看看解题思路', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=1 B=4 C=2 D=3
  {
    id: 'MA3',
    text: '孩子写完一篇用 AI 辅助的文章，您问他「这个观点是你自己的吗」，他通常怎么回应？',
    dimension: 'active_integrate',
    mirror: 'MB6',
    options: [
      { label: '没问过这个问题', value: 'A', score: 1 },
      { label: '能清楚说出观点是自己的，AI 只帮他查了论据', value: 'B', score: 4 },
      { label: '说不太清楚，或者说「也有 AI 的东西」', value: 'C', score: 2 },
      { label: '能说出哪些是自己的，但解释不了为什么这么取舍', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'MA4',
    text: '孩子在讨论一个新闻或社会现象时，他的观点通常是？',
    dimension: 'active_judge',
    options: [
      { label: '有观点，能说出理由，有时候还会提出反驳', value: 'A', score: 4 },
      { label: '说得头头是道，但感觉像是在复述某个来源', value: 'B', score: 2 },
      { label: '不太愿意讨论，觉得「问 AI 就知道了」', value: 'C', score: 1 },
      { label: '有自己的看法，说不一定多深，但是他的', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=3 B=2 C=4 D=1
  {
    id: 'MA5',
    text: '孩子把用 AI 做的作业拿给您看，您通常怎么回应？',
    dimension: 'active_judge',
    options: [
      { label: '顺带问一句下次能不能更多自己来', value: 'A', score: 3 },
      { label: '夸他效率高，会用工具', value: 'B', score: 2 },
      { label: '会问「这里哪些是你自己的判断？」', value: 'C', score: 4 },
      { label: '一般不细问，做出来就行', value: 'D', score: 1 },
    ],
  },
  // 分值分布: A=4 B=3 C=1 D=2
  {
    id: 'MA6',
    text: '您担心孩子用 AI 最核心的那个担心是什么？',
    dimension: 'context',
    options: [
      { label: '目前没有特别担心的', value: 'A', score: 1 },
      { label: '担心落后，但又怕太依赖——夹在中间不知道怎么办', value: 'B', score: 3 },
      { label: '影响学业诚信，老师发现会有麻烦', value: 'C', score: 2 },
      { label: '遇到困难越来越习惯「先问 AI」，自己思考的时间越来越少', value: 'D', score: 4 },
    ],
  },
]

const middlePartB: Question[] = [
  // 分值分布: A=1 B=4 C=2 D=3
  {
    id: 'MB1',
    text: '如果用一句话描述你和 AI 的关系，哪个最像？',
    dimension: 'active_define',
    options: [
      { label: 'AI 是我的「枪手」，很多事它来做，我来交', value: 'A', score: 1 },
      { label: 'AI 是助手，我告诉它做什么、怎么做', value: 'B', score: 4 },
      { label: '很多时候是 AI 在带着我走，我跟着它', value: 'C', score: 2 },
      { label: 'AI 是参谋，我会参考它的建议，但自己做决定', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'MB2',
    text: '老师布置了一篇关于某个社会话题的文章，你通常怎么开始？',
    dimension: 'active_define',
    options: [
      { label: '看心情，有时自己写，有时用 AI，取决于时间', value: 'A', score: 2 },
      { label: '直接把要求发给 AI，让它写，我改改就交', value: 'B', score: 1 },
      { label: '先想清楚我的观点是什么，再让 AI 帮我查资料，最后自己写', value: 'C', score: 4 },
      { label: '让 AI 列几个角度，我选一个再写', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=4 B=1 C=3 D=2
  {
    id: 'MB3',
    text: 'AI 帮你写了一段话，你拿到之后会怎么做？',
    dimension: 'active_judge',
    options: [
      { label: '认真读，把逻辑有问题的、和我观点不符的都改，改完才是我的', value: 'A', score: 4 },
      { label: '觉得 AI 写得比我强，直接用', value: 'B', score: 1 },
      { label: '会读一遍，把跟我想法不一样的地方改掉', value: 'C', score: 3 },
      { label: '主要看字数和格式够不够', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=3 B=1 C=2 D=4
  {
    id: 'MB4',
    text: '你用 AI 查了一个知识点，但和课本上说的不一样，你会？',
    dimension: 'active_judge',
    options: [
      { label: '以课本为准，老师考的是课本', value: 'A', score: 3 },
      { label: '无所谓，作业能完成就行', value: 'B', score: 1 },
      { label: '再问 AI 一次，如果还是一样就信它', value: 'C', score: 2 },
      { label: '去查其他来源看看谁说得对，自己判断', value: 'D', score: 4 },
    ],
  },
  // 分值分布: A=3 B=4 C=1 D=1
  {
    id: 'MB5',
    text: '你觉得 AI 最大的问题是什么？',
    dimension: 'active_judge',
    options: [
      { label: '它写出来的东西缺少「人味」', value: 'A', score: 3 },
      { label: '它会很自信地说错话，让人很难分辨——这才是最危险的', value: 'B', score: 4 },
      { label: '没什么大问题，已经很强了', value: 'C', score: 1 },
      { label: '没认真想过', value: 'D', score: 1 },
    ],
  },
  // 分值分布: A=2 B=1 C=4 D=3
  {
    id: 'MB6',
    text: '写完一篇 AI 辅助的文章，你觉得里面的观点是「你的」还是「AI 的」？',
    dimension: 'active_integrate',
    mirror: 'MA3',
    options: [
      { label: '说实话大部分是 AI 的，我主要是改了改', value: 'A', score: 2 },
      { label: '没想过这个问题，完成就行', value: 'B', score: 1 },
      { label: '是我的——观点是我想的，AI 只是帮我查了资料', value: 'C', score: 4 },
      { label: '一半一半，有些是我的想法，有些是 AI 的', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=3 B=4 C=2 D=1
  {
    id: 'MB7',
    text: '如果老师说某篇重要作文必须完全自己写，不能用 AI，你的感受是？',
    dimension: 'active_integrate',
    options: [
      { label: '有点不习惯，但努力一下应该可以', value: 'A', score: 3 },
      { label: '没问题，AI 只是让我更快，我本来就能写', value: 'B', score: 4 },
      { label: '会很困难，我已经不太习惯从头到尾自己写了', value: 'C', score: 2 },
      { label: '觉得不公平，为什么不让用', value: 'D', score: 1 },
    ],
  },
]

const middleOpenA: OpenQuestion = {
  id: 'MOA',
  text: '关于孩子用 AI 做作业这件事，您最纠结的是什么？（不用写完整，说真实想法就行）',
  dimension: 'open',
}

const middleOpenB: OpenQuestion = {
  id: 'MOB',
  text: '用 AI 做作业，你有没有哪次觉得「这不算我做的」？或者哪次觉得「这才是我真正做的」？随便说一件真实的事。',
  dimension: 'open',
}

// ─────────────────────────────────────────────
// 高级版（10-12 年级）
// ─────────────────────────────────────────────

const seniorPartA: Question[] = [
  // 分值分布: A=4 B=3 C=1 D=2
  {
    id: 'SA1',
    text: '对于高中生用 AI 这件事，您的基本判断是？',
    dimension: 'context',
    options: [
      { label: '高中压力大，能用 AI 提效就应该用', value: 'A', score: 2 },
      { label: 'AI 工具必须用，但前提是孩子有独立思考的基础，否则是在用 AI 代替思考', value: 'B', score: 4 },
      { label: '孩子大了有判断，不需要家长太操心', value: 'C', score: 1 },
      { label: '既担心不用落后，又担心用多了影响独立性，夹在中间', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'SA2',
    text: '孩子写论文或做研究作业时，AI 在其中的角色大概是？',
    dimension: 'active_define',
    mirror: 'SB3',
    options: [
      { label: '孩子用 AI 生成初稿，然后在上面修改和补充', value: 'A', score: 3 },
      { label: '不清楚孩子怎么用的', value: 'B', score: 1 },
      { label: '孩子先有自己的框架和观点，用 AI 辅助查资料和整理', value: 'C', score: 4 },
      { label: '孩子大量依赖 AI 生成内容，自己的投入比较少', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=2 B=4 C=3 D=1
  {
    id: 'SA3',
    text: '孩子完成一篇重要论文后，您问他「这个结论是你自己推导的吗」，他通常能回答清楚吗？',
    dimension: 'active_integrate',
    mirror: 'SB6',
    options: [
      { label: '说不清楚，或者不觉得需要分清', value: 'A', score: 2 },
      { label: '能清楚说出哪些是自己的判断、哪些参考了 AI，为什么这么取舍', value: 'B', score: 4 },
      { label: '能大致说，但深入追问就说不上来了', value: 'C', score: 3 },
      { label: '没问过这个问题', value: 'D', score: 1 },
    ],
  },
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'SA4',
    text: '您认为人人都会用 AI 的时候，孩子真正的竞争力来自什么？',
    dimension: 'context',
    options: [
      { label: '用 AI 做出有自己判断和创造性成果的人——思维深度才是壁垒', value: 'A', score: 4 },
      { label: '还没想清楚，顺其自然', value: 'B', score: 1 },
      { label: '谁用 AI 用得更熟练、产出更快', value: 'C', score: 2 },
      { label: '能识别 AI 的局限，不被它误导', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=1 B=4 C=2 D=3
  {
    id: 'SA5',
    text: '如果完全不用 AI，孩子能独立完成一篇有质量的论文或研究报告吗？',
    dimension: 'context',
    options: [
      { label: '很难，孩子已经习惯 AI 参与每个环节了', value: 'A', score: 1 },
      { label: '能，只是慢一些，核心写作和思考能力是有的', value: 'B', score: 4 },
      { label: '不确定，没有试过', value: 'C', score: 2 },
      { label: '能完成，但质量会明显下降，特别是查资料和组织论述', value: 'D', score: 3 },
    ],
  },
]

const seniorPartB: Question[] = [
  // 分值分布: A=2 B=1 C=4 D=3
  {
    id: 'SB1',
    text: '如果用一个比喻描述你和 AI 的关系，哪个最准确？',
    dimension: 'active_define',
    options: [
      { label: '我和 AI 是搭档，很难说谁主导谁', value: 'A', score: 2 },
      { label: '说实话，很多时候 AI 在主导，我在执行', value: 'B', score: 1 },
      { label: '我是导演，AI 是执行团队——我定方向和标准，AI 帮我实现', value: 'C', score: 4 },
      { label: '我是编辑，AI 是写手——AI 出初稿，我来判断和修改', value: 'D', score: 3 },
    ],
  },
  // 分值分布: A=4 B=1 C=3 D=1
  {
    id: 'SB2',
    text: '你认为 AI 最大的危险是什么？',
    dimension: 'active_judge',
    options: [
      { label: '它能生成「看起来不错」的内容，但不能保证正确和有深度——这才是最危险的', value: 'A', score: 4 },
      { label: '没认真想过', value: 'B', score: 1 },
      { label: '知识有滞后性，而且会「幻觉」——编造信息', value: 'C', score: 3 },
      { label: '没什么明显危险，现在的 AI 已经很强了', value: 'D', score: 1 },
    ],
  },
  // 分值分布: A=2 B=4 C=1 D=3
  {
    id: 'SB3',
    text: '老师布置了一篇需要独立论证的论文，你通常怎么做？',
    dimension: 'active_define',
    mirror: 'SA2',
    options: [
      { label: '让 AI 写大部分，我主要负责调整完善', value: 'A', score: 1 },
      { label: '让 AI 生成框架和初稿，我大幅修改，融入自己的观点', value: 'B', score: 3 },
      { label: '看时间，有时自己写，有时让 AI 写，取决于难度', value: 'C', score: 2 },
      { label: '先确定自己的核心观点和结构，用 AI 辅助查资料，最后完全自己写', value: 'D', score: 4 },
    ],
  },
  // 分值分布: A=2 B=4 C=1 D=1
  {
    id: 'SB4',
    text: 'AI 为你生成了一段关于某个议题的分析，你会怎么处理？',
    dimension: 'active_judge',
    options: [
      { label: '看有没有明显的错误，没有的话基本直接用', value: 'A', score: 2 },
      { label: '看它的论证结构：前提是否成立、论据是否可靠、逻辑是否严密，然后决定取舍', value: 'B', score: 4 },
      { label: '觉得 AI 分析得比我好，直接用', value: 'C', score: 1 },
      { label: '主要看字数和格式合不合要求', value: 'D', score: 1 },
    ],
  },
  // 分值分布: A=1 B=4 C=2 D=2
  {
    id: 'SB5',
    text: '你用 AI 查了一个观点，发现不同来源说法矛盾，你会？',
    dimension: 'active_judge',
    options: [
      { label: '再问 AI 一次，让它综合各方给我一个结论', value: 'A', score: 2 },
      { label: '这种情况很少，我一般只用一个来源', value: 'B', score: 1 },
      { label: '继续查原始文献或权威来源，分析矛盾原因，形成自己的判断', value: 'C', score: 4 },
      { label: '选一个看起来最可信的用就行', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=3 B=1 C=4 D=2
  {
    id: 'SB6',
    text: '完成一篇重要论文后，你能说清楚其中每个核心观点的来源吗？',
    dimension: 'active_integrate',
    mirror: 'SA3',
    options: [
      { label: '能——我会有意识地区分自己的思考和 AI 的贡献', value: 'A', score: 4 },
      { label: '不觉得需要分清，结果好就行', value: 'B', score: 1 },
      { label: '大致能说，但有些细节已经分不清了', value: 'C', score: 3 },
      { label: '说实话很难分清，写的过程中我和 AI 的边界很模糊', value: 'D', score: 2 },
    ],
  },
  // 分值分布: A=4 B=3 C=2 D=1
  {
    id: 'SB7',
    text: '如果最重要的那篇论文必须完全自己写，不能用 AI，你的真实感受是？',
    dimension: 'active_integrate',
    options: [
      { label: '有点紧张，但努力一下应该能行，只是质量可能不如平时', value: 'A', score: 3 },
      { label: '觉得不合理，AI 时代为什么还这样', value: 'B', score: 1 },
      { label: '没问题，AI 只是让我更快，我有能力独立完成', value: 'C', score: 4 },
      { label: '会很困难，我已经不太习惯完全独立从头到尾写了', value: 'D', score: 2 },
    ],
  },
]

const seniorOpenA: OpenQuestion = {
  id: 'SOA',
  text: '关于孩子在 AI 时代的竞争力，您现在最真实的担心是什么？（说具体的事，不用写完整）',
  dimension: 'open',
}

const seniorOpenB: OpenQuestion = {
  id: 'SOB',
  text: '你有没有想过：如果有一天 AI 消失了，你现在做的这些事，有多少是真正你自己的能力？',
  dimension: 'open',
}

// ─────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────

export const QUESTIONS: Record<'primary' | 'middle' | 'senior', GradeQuestions> = {
  primary: { partA: primaryPartA, partB: primaryPartB, openA: primaryOpenA, openB: primaryOpenB },
  middle:  { partA: middlePartA,  partB: middlePartB,  openA: middleOpenA,  openB: middleOpenB  },
  senior:  { partA: seniorPartA,  partB: seniorPartB,  openA: seniorOpenA,  openB: seniorOpenB  },
}

export const GRADE_LABELS = {
  primary: '小学（4-6年级）',
  middle:  '初中（7-9年级）',
  senior:  '高中（10-12年级）',
}
