// lib/questions.ts
// 三个学段的完整问卷题目数据

export type Option = { label: string; value: 'A' | 'B' | 'C' | 'D' }
export type Question = { id: string; text: string; options: Option[] }
export type GradeQuestions = { partA: Question[]; partB: Question[] }

// ===== 初级版（4-6年级）=====
const primaryPartA: Question[] = [
  {
    id: 'P1',
    text: '关于孩子使用AI这件事，您目前的态度更接近哪一种？',
    options: [
      { label: '我主动引导孩子使用AI，但会和他讨论怎么用、用在哪里', value: 'A' },
      { label: '我允许孩子用，但没有具体的引导规则，走一步看一步', value: 'B' },
      { label: '我觉得这个年龄接触AI还早，尽量不让孩子用', value: 'C' },
      { label: '我没怎么想过这个问题，孩子用不用AI我不太清楚', value: 'D' },
    ],
  },
  {
    id: 'P2',
    text: '您觉得AI对小学生的最大影响是什么？',
    options: [
      { label: '如果引导得当，AI可以成为孩子探索和学习的助手，关键是"怎么用"', value: 'A' },
      { label: '可能会让孩子变懒，遇到困难不愿意自己动脑了', value: 'B' },
      { label: '主要担心孩子接触不好的内容，比如安全问题', value: 'C' },
      { label: '说不好，我对AI能做什么也不太了解', value: 'D' },
    ],
  },
  {
    id: 'P3',
    text: '以下哪句话最接近您内心的真实想法？',
    options: [
      { label: '我担心孩子如果现在不学会用AI，将来会落后于同龄人', value: 'A' },
      { label: '我更担心孩子太早依赖AI，基础能力还没建立就被绕过了', value: 'B' },
      { label: '两个都担心——既怕不会用落伍，又怕太依赖丢了基本功', value: 'C' },
      { label: '我觉得小学生谈竞争力还早，先把基础学好就行', value: 'D' },
    ],
  },
  {
    id: 'P4',
    text: '您希望孩子在AI时代具备的最重要的能力是什么？',
    options: [
      { label: '能熟练操作AI工具，用AI提高学习和做事的效率', value: 'A' },
      { label: '能在用AI的同时保持自己的想法和判断力，不被工具带着走', value: 'B' },
      { label: '能分清什么时候该用AI、什么时候该自己来，有这个判断力', value: 'C' },
      { label: '说实话，我还没想清楚孩子具体需要什么能力', value: 'D' },
    ],
  },
  {
    id: 'P5',
    text: '孩子打开AI工具后，通常的第一个动作是什么？',
    options: [
      { label: '先跟我说他想做什么，然后再去问AI', value: 'A' },
      { label: '直接把作业题目或要求发给AI，让AI帮他做', value: 'B' },
      { label: '随便问AI一些有趣的问题，比较像聊天探索', value: 'C' },
      { label: '我没注意过 / 孩子还没用过AI', value: 'D' },
    ],
  },
  {
    id: 'P6',
    text: '孩子用AI帮忙完成作业或创作后，他通常会怎么处理AI给的内容？',
    options: [
      { label: '会根据自己的想法修改一部分，然后再提交', value: 'A' },
      { label: '基本直接用，可能改改别字或格式就交了', value: 'B' },
      { label: '有时候修改有时候直接用，看心情和时间', value: 'C' },
      { label: '我不太清楚孩子具体怎么操作的', value: 'D' },
    ],
  },
  {
    id: 'P7',
    text: '如果让孩子不用AI，独立完成一份以前用AI做过的作业，您觉得会怎样？',
    options: [
      { label: '能完成，只是慢一些或质量差一些，基本能力还在', value: 'A' },
      { label: '可能会发愁不知道怎么开始，但引导一下应该可以', value: 'B' },
      { label: '估计很难完成，孩子已经习惯了用AI来做这类事', value: 'C' },
      { label: '没试过，不好说', value: 'D' },
    ],
  },
  {
    id: 'P8',
    text: '孩子能不能用自己的话解释他用AI做出的作品是怎么想的、为什么这么做？',
    options: [
      { label: '能说清楚，比如"我想写这个是因为...""我让AI改了这里因为..."', value: 'A' },
      { label: '能说一部分，但比较笼统，像"就是让AI帮我做的"', value: 'B' },
      { label: '说不太清楚，问多了会不耐烦', value: 'C' },
      { label: '没问过孩子这个问题', value: 'D' },
    ],
  },
  {
    id: 'P9',
    text: '当孩子说作业太难做不出来时，您的第一反应更接近哪个？',
    options: [
      { label: '先让孩子自己再想想，实在不行我们一起想办法，最后才考虑用工具', value: 'A' },
      { label: '建议孩子用AI查一下或问AI怎么做，效率高', value: 'B' },
      { label: '帮孩子问AI把答案找出来，然后让孩子学着理解', value: 'C' },
      { label: '看情况，没有固定的做法', value: 'D' },
    ],
  },
  {
    id: 'P10',
    text: '您自己在日常生活和工作中使用AI的情况怎么样？',
    options: [
      { label: '经常用，而且我会有意识地判断AI给的内容靠不靠谱', value: 'A' },
      { label: '经常用，AI给什么我基本就用什么，挺好用的', value: 'B' },
      { label: '偶尔用，不太依赖', value: 'C' },
      { label: '基本不用，对AI不太熟悉', value: 'D' },
    ],
  },
]

const primaryPartB: Question[] = [
  {
    id: 'S1',
    text: '你平时用AI（比如ChatGPT、文心一言、豆包等）来做什么？',
    options: [
      { label: '写作文、做手抄报、查资料——主要用来帮我完成作业和任务', value: 'A' },
      { label: '问各种有趣的问题、让它编故事——主要是好玩', value: 'B' },
      { label: '两种都有，有时写作业用，有时就是随便玩', value: 'C' },
      { label: '我还没怎么用过AI', value: 'D' },
    ],
  },
  {
    id: 'S2',
    text: '你觉得AI厉害还是你厉害？',
    options: [
      { label: 'AI知道的比我多，但有些事情它做不到，比如真正理解我的感受', value: 'A' },
      { label: 'AI比我厉害多了，它什么都知道', value: 'B' },
      { label: '我觉得差不多，各有各的本事', value: 'C' },
      { label: '我比AI厉害，AI只是个工具', value: 'D' },
    ],
  },
  {
    id: 'S3',
    text: '老师让你写一篇关于"我最喜欢的季节"的作文。你打开AI，接下来你会——',
    options: [
      { label: '先在脑子里想好写哪个季节、写哪些内容，然后让AI帮我查一些素材或给建议', value: 'A' },
      { label: '告诉AI"帮我写一篇我最喜欢的季节的作文"，看看它写得怎么样再说', value: 'B' },
      { label: '让AI先给我几个思路，我从里面挑一个喜欢的再开始写', value: 'C' },
      { label: '直接把作文要求发给AI，用它写的内容交上去', value: 'D' },
    ],
  },
  {
    id: 'S4',
    text: 'AI帮你写了一段文字，你读完之后通常会——',
    options: [
      { label: '仔细看一遍，觉得哪里不像我自己说的话就改掉，再加一些自己的想法', value: 'A' },
      { label: '大概看一下，觉得还行就用了', value: 'B' },
      { label: '主要检查有没有别字和格式问题，内容上一般不怎么改', value: 'C' },
      { label: '我觉得AI写得比我好，没必要改', value: 'D' },
    ],
  },
  {
    id: 'S5',
    text: '你让AI帮你做了一张手抄报的内容，但你发现里面有一个信息跟你知道的不一样。你会——',
    options: [
      { label: '去查一下到底谁对谁错，如果是AI错了就改过来', value: 'A' },
      { label: '去问AI"你确定吗"，如果AI坚持它的答案我就信它的', value: 'B' },
      { label: '差不多就行了，反正是手抄报又不是考试', value: 'C' },
      { label: '一般不会发现这种问题，因为我不太仔细看内容', value: 'D' },
    ],
  },
  {
    id: 'S6',
    text: '如果老师让你做一个小项目（比如调查班级同学最喜欢的课外活动），你会怎么用AI？',
    options: [
      { label: '先自己想好要调查什么、怎么调查，然后让AI帮我整理数据或做图表', value: 'A' },
      { label: '问AI"怎么做这个调查"，让它给我一个完整的方案我照着做', value: 'B' },
      { label: '让AI把整个项目都做好，我负责打印和提交', value: 'C' },
      { label: '不确定怎么用AI做这种事', value: 'D' },
    ],
  },
  {
    id: 'S7',
    text: 'AI帮你写了一篇作文，老师以为是你写的，给了你高分。你心里会——',
    options: [
      { label: '觉得有点不对劲，那不是我写的，这个分不算数', value: 'A' },
      { label: '开心，但也想试试自己写能不能也拿高分', value: 'B' },
      { label: '很开心，反正结果好就行了', value: 'C' },
      { label: '没什么特别的感觉，大家都这样', value: 'D' },
    ],
  },
  {
    id: 'S8',
    text: '你觉得AI有没有可能搞错？',
    options: [
      { label: '当然会，我就遇到过AI说的东西是错的或者很奇怪的', value: 'A' },
      { label: '有时候会，但大部分时候它说的都挺对的', value: 'B' },
      { label: '应该不太会吧，AI比我们知道得多', value: 'C' },
      { label: '我没想过这个问题', value: 'D' },
    ],
  },
  {
    id: 'S9',
    text: '如果明天所有的AI都消失了，不能用了，你觉得会怎样？',
    options: [
      { label: '会有点不方便，但我还是能自己完成大部分事情', value: 'A' },
      { label: '会很不习惯，有些事情可能得花很久才能搞定', value: 'B' },
      { label: '会很麻烦，很多事我都不知道该怎么做了', value: 'C' },
      { label: '无所谓，我本来就不怎么用AI', value: 'D' },
    ],
  },
  {
    id: 'S10',
    text: '如果有人教你怎么让AI"听你的"而不是你"听AI的"，你觉得——',
    options: [
      { label: '听起来很酷，我想学学看', value: 'A' },
      { label: '有点意思，但得看具体是什么内容', value: 'B' },
      { label: '感觉无所谓，我现在用AI用得挺好的', value: 'C' },
      { label: '不太感兴趣', value: 'D' },
    ],
  },
  {
    id: 'S11',
    text: '你觉得"学会驾驭AI"这件事重要吗？',
    options: [
      { label: '重要，因为如果不会驾驭它，就变成了被它带着走了', value: 'A' },
      { label: '可能重要吧，但我还没仔细想过', value: 'B' },
      { label: '不太重要，能用就行了', value: 'C' },
      { label: '不知道"驾驭AI"是什么意思', value: 'D' },
    ],
  },
]

// ===== 中级版（7-9年级）=====
const middlePartA: Question[] = [
  {
    id: 'P1',
    text: '孩子用AI已经是日常了。关于这件事，您目前更接近哪种状态？',
    options: [
      { label: '我已经和孩子建立了一些使用规则，比如什么情况可以用、什么情况不该用', value: 'A' },
      { label: '我知道孩子在用，但不确定该怎么管——管太严孩子反感，不管又不放心', value: 'B' },
      { label: '很难管，孩子用AI的方式我已经控制不了了', value: 'C' },
      { label: '我觉得不需要特意管，这就是时代趋势', value: 'D' },
    ],
  },
  {
    id: 'P2',
    text: '您觉得AI对初中生最值得警惕的影响是什么？',
    options: [
      { label: '孩子的独立思考能力在退化——表面上作业做得很好，但真正理解了多少很难说', value: 'A' },
      { label: '孩子越来越不愿意花时间思考难题，习惯了"有困难找AI"', value: 'B' },
      { label: '主要担心学业诚信问题，作业到底是不是自己做的', value: 'C' },
      { label: '目前还没感觉到明显的负面影响', value: 'D' },
    ],
  },
  {
    id: 'P3',
    text: '关于AI与孩子未来竞争力的关系，您最大的纠结是什么？',
    options: [
      { label: '不用AI的孩子肯定会落后，但只会用AI而没有自己想法的孩子可能更危险', value: 'A' },
      { label: '周围孩子都在用AI提效，我家孩子不用就是吃亏', value: 'B' },
      { label: '担心AI让孩子变懒，长远来看不是好事', value: 'C' },
      { label: '没有特别纠结，顺其自然就好', value: 'D' },
    ],
  },
  {
    id: 'P4',
    text: '您认为初中阶段最应该培养孩子的AI相关能力是什么？',
    options: [
      { label: '能判断AI给的信息靠不靠谱，不会被它误导', value: 'A' },
      { label: '能在用AI的同时形成自己的观点，而不是拼贴AI的观点', value: 'B' },
      { label: '能用AI提高学习效率，特别是应对繁重的作业', value: 'C' },
      { label: '还没想清楚，觉得孩子自己会慢慢摸索', value: 'D' },
    ],
  },
  {
    id: 'P5',
    text: '孩子交上来的作文或作业，您能分辨哪些是AI写的、哪些是自己写的吗？',
    options: [
      { label: '能分辨一部分，因为AI写的和孩子自己的风格明显不一样', value: 'A' },
      { label: '很难分辨，现在孩子交的东西越来越"完美"，但不确定是不是他自己的', value: 'B' },
      { label: '没怎么注意过这个问题', value: 'C' },
      { label: '孩子会主动告诉我哪些是用了AI的，我们会讨论', value: 'D' },
    ],
  },
  {
    id: 'P6',
    text: '孩子在讨论一个问题时（比如新闻、社会现象），他的观点通常是——',
    options: [
      { label: '有自己的看法，能说出理由，偶尔会参考AI但不是照搬', value: 'A' },
      { label: '说得头头是道但比较表面，像是在复述某个来源的观点', value: 'B' },
      { label: '不太愿意讨论，觉得"问AI就知道了"', value: 'C' },
      { label: '没注意观察过', value: 'D' },
    ],
  },
  {
    id: 'P7',
    text: '孩子遇到一道不会做的题目时，他的第一反应是什么？',
    options: [
      { label: '先自己想一想，实在不会再问AI或查资料', value: 'A' },
      { label: '直接问AI，拿到答案后有时会看看解题过程', value: 'B' },
      { label: '直接问AI拿答案，不怎么看过程', value: 'C' },
      { label: '不确定，没留意过', value: 'D' },
    ],
  },
  {
    id: 'P8',
    text: '孩子能不能清晰地说出自己用AI做的作品里，哪些是AI的、哪些是自己的、为什么这么做？',
    options: [
      { label: '能说清楚，而且能解释为什么某些部分让AI做、某些自己来', value: 'A' },
      { label: '能说个大概，但说不清具体的决策理由', value: 'B' },
      { label: '说不清楚，或者觉得"都是我做的"但其实大部分是AI的', value: 'C' },
      { label: '没问过', value: 'D' },
    ],
  },
  {
    id: 'P9',
    text: '关于孩子用AI写作业这件事，您在家里的做法更接近哪个？',
    options: [
      { label: '我和孩子约定了规则：哪些作业可以用AI辅助，哪些必须自己做', value: 'A' },
      { label: '没有明确规则，但会时不时提醒孩子不要太依赖', value: 'B' },
      { label: '基本不管，孩子自己决定怎么用', value: 'C' },
      { label: '我也经常建议孩子用AI来提高效率', value: 'D' },
    ],
  },
  {
    id: 'P10',
    text: '您自己使用AI时，会不会判断它给的内容是否正确或合理？',
    options: [
      { label: '会，我习惯核实重要信息，不会直接照搬', value: 'A' },
      { label: '大多时候会，但如果看起来很合理就不会特意去查', value: 'B' },
      { label: '一般不会，AI给什么我基本就用什么', value: 'C' },
      { label: '我基本不用AI', value: 'D' },
    ],
  },
]

const middlePartB: Question[] = [
  {
    id: 'S1',
    text: '你目前主要用AI做什么？',
    options: [
      { label: '写作文、做作业、查资料——主要是学习相关的', value: 'A' },
      { label: '学习和生活都用，比如查信息、写东西、学新技能', value: 'B' },
      { label: '主要是课业任务太多时拿来帮忙赶工', value: 'C' },
      { label: '偶尔用用，不是很依赖', value: 'D' },
    ],
  },
  {
    id: 'S2',
    text: '如果用一句话形容你和AI的关系，你觉得哪个最像？',
    options: [
      { label: '它是我的助手，我告诉它做什么、怎么做', value: 'A' },
      { label: '它是我的参谋，我会参考它的建议但自己做决定', value: 'B' },
      { label: '它是我的"枪手"，很多事情它来做我来交', value: 'C' },
      { label: '它就是个工具，谈不上什么关系', value: 'D' },
    ],
  },
  {
    id: 'S3',
    text: '老师布置了一篇800字的议论文，要求有明确观点和论据。你会怎么用AI？',
    options: [
      { label: '先自己想清楚观点是什么，然后用AI帮我查资料、整理论据，最后自己写', value: 'A' },
      { label: '让AI先生成一篇，然后我在它的基础上修改成自己的风格', value: 'B' },
      { label: '直接让AI写，我检查一下通不通顺、字数够不够就交了', value: 'C' },
      { label: '看心情和时间，有时自己写有时让AI写', value: 'D' },
    ],
  },
  {
    id: 'S4',
    text: 'AI帮你写了一段关于"手机对青少年的影响"的论述。你读完后会——',
    options: [
      { label: '看它的论据是不是真的，逻辑有没有漏洞，和我自己的看法比较一下', value: 'A' },
      { label: '看看整体说得有没有道理，觉得行就用了', value: 'B' },
      { label: '主要看格式和字数够不够，内容方面AI写的一般都没问题', value: 'C' },
      { label: '直接用，AI的论述能力比我强', value: 'D' },
    ],
  },
  {
    id: 'S5',
    text: '你用AI查了一个历史事件的资料，但和你在书本上看到的不一样。你会——',
    options: [
      { label: '再查其他来源（搜索引擎、别的书）来交叉验证，看谁说得对', value: 'A' },
      { label: '再问AI一次，如果它给了同样的答案我就信它', value: 'B' },
      { label: '以书本为准，老师认的是书本', value: 'C' },
      { label: '无所谓，作业能交就行', value: 'D' },
    ],
  },
  {
    id: 'S6',
    text: '完成一篇用AI辅助写的文章后，你觉得这篇文章是"你的"还是"AI的"？',
    options: [
      { label: '是我的——观点是我想的，结构是我定的，AI只是帮我查了资料或润色', value: 'A' },
      { label: '一半一半——有些是我的想法，但也有不少是AI的', value: 'B' },
      { label: '说实话大部分是AI的，我主要是改了改', value: 'C' },
      { label: '没想过这个问题，作业完成就行', value: 'D' },
    ],
  },
  {
    id: 'S7',
    text: '你觉得AI最大的问题是什么？',
    options: [
      { label: '它给的信息不一定对，而且它会很自信地说错话，让人难以分辨', value: 'A' },
      { label: '它没有真正的理解和感受，所以写出来的东西缺少"人味"', value: 'B' },
      { label: '没什么大问题，它已经很强了', value: 'C' },
      { label: '没认真想过这个问题', value: 'D' },
    ],
  },
  {
    id: 'S8',
    text: '如果老师禁止使用AI完成一篇重要的作文，你的感受是——',
    options: [
      { label: '没问题，我本来就能自己写，AI只是让我更快', value: 'A' },
      { label: '有点不习惯，但努力一下应该可以', value: 'B' },
      { label: '会很困难，我已经不太习惯从头到尾自己写一篇完整的文章了', value: 'C' },
      { label: '觉得不公平，为什么不让用', value: 'D' },
    ],
  },
  {
    id: 'S9',
    text: '你觉得现在学会"自己拿主意而不是让AI拿主意"这件事重要吗？',
    options: [
      { label: '重要——如果现在习惯了依赖AI思考，以后会越来越难改', value: 'A' },
      { label: '可能重要，但现在学业压力大，先把AI用好再说', value: 'B' },
      { label: '不太重要，AI以后会越来越强，会用就行', value: 'C' },
      { label: '没想过', value: 'D' },
    ],
  },
  {
    id: 'S10',
    text: '如果有一个课程教你怎么在用AI的同时保持自己的判断力和创造力，你会——',
    options: [
      { label: '很感兴趣，我觉得这个能力很重要', value: 'A' },
      { label: '有点意思，但得看是不是真的有用', value: 'B' },
      { label: '不确定，我觉得我现在用AI用得挺好的', value: 'C' },
      { label: '不感兴趣', value: 'D' },
    ],
  },
]

// ===== 高级版（10-12年级）=====
const seniorPartA: Question[] = [
  {
    id: 'P1',
    text: '关于高中生使用AI，您的基本判断是什么？',
    options: [
      { label: 'AI能力必须培养，但前提是孩子先有独立思考的基础，否则就是在用AI代替思考', value: 'A' },
      { label: '高中学业压力大，能用AI提效就应该用，效率优先', value: 'B' },
      { label: '很纠结——既担心不用落后于人，又担心用多了影响独立性', value: 'C' },
      { label: '这个阶段孩子已经有自己的判断了，不需要家长太操心', value: 'D' },
    ],
  },
  {
    id: 'P2',
    text: '您认为AI对高中生最深层的影响是什么？',
    options: [
      { label: '影响的是思维的深度——孩子习惯了"快速获取答案"，不愿意花时间深入思考', value: 'A' },
      { label: '影响的是学业诚信——很难判断孩子的作业和考试是否反映真实水平', value: 'B' },
      { label: '影响的是自信心——孩子开始觉得"反正AI比我强"，不相信自己能做好', value: 'C' },
      { label: '目前看不出明显负面影响', value: 'D' },
    ],
  },
  {
    id: 'P3',
    text: '关于AI与孩子升学及未来发展的关系，您最关心的是什么？',
    options: [
      { label: '大学和未来职场都会要求AI能力，但每个人都会用AI时，真正的区分度在于独立思考和创造力', value: 'A' },
      { label: '担心孩子如果现在不精通AI，大学申请和未来就业都会吃亏', value: 'B' },
      { label: '担心孩子在高中阶段过度依赖AI，到了大学需要独立思考时会很吃力', value: 'C' },
      { label: '顺其自然，孩子大了会自己调整', value: 'D' },
    ],
  },
  {
    id: 'P4',
    text: '您认为高中生现在最需要培养的AI相关能力是什么？',
    options: [
      { label: '能用AI做深度研究和分析，但最终的观点和结论是自己的', value: 'A' },
      { label: '能识别AI的局限性，知道什么时候AI不可靠', value: 'B' },
      { label: '精通各种AI工具的使用，能用AI高效完成各种任务', value: 'C' },
      { label: '没想清楚，觉得孩子在学校会学到的', value: 'D' },
    ],
  },
  {
    id: 'P5',
    text: '孩子写论文或做研究性作业时，AI在其中扮演的角色是什么？',
    options: [
      { label: '孩子先有自己的研究框架和观点，用AI辅助查文献、整理数据', value: 'A' },
      { label: '孩子让AI生成初稿，然后在上面修改和补充', value: 'B' },
      { label: '孩子大量依赖AI生成内容，自己的投入比较少', value: 'C' },
      { label: '不清楚孩子具体怎么用的', value: 'D' },
    ],
  },
  {
    id: 'P6',
    text: '孩子在讨论复杂问题时，他的观点表达质量如何？',
    options: [
      { label: '有独立观点，能多角度分析，论据和逻辑都比较清晰', value: 'A' },
      { label: '有观点但比较浅，或者像是在复述某个来源的说法', value: 'B' },
      { label: '不太愿意表达观点，觉得"AI分析得更好"', value: 'C' },
      { label: '没注意观察过', value: 'D' },
    ],
  },
  {
    id: 'P7',
    text: '孩子能否清晰地阐述自己的思考过程——比如为什么选这个视角、为什么得出这个结论？',
    options: [
      { label: '能清晰地说出自己的思考链路，包括哪些是自己的判断、哪些参考了AI', value: 'A' },
      { label: '能说个大概，但深入问就说不上来了', value: 'B' },
      { label: '说不清楚，或者不觉得需要说清楚', value: 'C' },
      { label: '没试过问孩子', value: 'D' },
    ],
  },
  {
    id: 'P8',
    text: '如果完全不用AI，孩子能否独立完成一篇有质量的论文或研究报告？',
    options: [
      { label: '能，只是效率低一些，核心能力是有的', value: 'A' },
      { label: '能完成，但质量会明显下降，特别是在查找资料和组织论述方面', value: 'B' },
      { label: '很难独立完成，孩子已经习惯了AI参与每个环节', value: 'C' },
      { label: '不确定，没有试过', value: 'D' },
    ],
  },
  {
    id: 'P9',
    text: '关于孩子用AI写作业和论文，您在家里的做法是什么？',
    options: [
      { label: '我和孩子讨论过AI使用的边界，达成了共识：工具可以用，但思考必须是自己的', value: 'A' },
      { label: '有时提醒孩子不要太依赖，但没有系统的规则', value: 'B' },
      { label: '基本不管，觉得高中生应该有自己的判断了', value: 'C' },
      { label: '我主动鼓励孩子用AI提效，成绩好最重要', value: 'D' },
    ],
  },
  {
    id: 'P10',
    text: '您自己在工作中使用AI时，是否会反思自己的思维过程是否被影响？',
    options: [
      { label: '会，我意识到自己有时也会无意识地依赖AI，所以更理解孩子的处境', value: 'A' },
      { label: '偶尔会想，但没有深入思考过', value: 'B' },
      { label: '不会，AI对我来说就是工具，谈不上影响思维', value: 'C' },
      { label: '我基本不用AI', value: 'D' },
    ],
  },
]

const seniorPartB: Question[] = [
  {
    id: 'S1',
    text: '你目前使用AI的主要方式是什么？',
    options: [
      { label: '我有明确的使用策略——知道什么情况让AI做、什么情况自己来', value: 'A' },
      { label: '主要用来提效——写初稿、查资料、整理笔记等', value: 'B' },
      { label: '重度依赖——大部分学业任务都会用AI参与', value: 'C' },
      { label: '偶尔使用，不是必需品', value: 'D' },
    ],
  },
  {
    id: 'S2',
    text: '如果用一个比喻来描述你和AI的关系，你觉得哪个最准确？',
    options: [
      { label: '我是导演，AI是执行团队——我定方向和标准，AI帮我实现', value: 'A' },
      { label: '我是编辑，AI是记者——AI写初稿，我来判断和修改', value: 'B' },
      { label: '我和AI是"搭档"——很难说谁主导谁', value: 'C' },
      { label: '说实话，很多时候AI在主导，我在执行', value: 'D' },
    ],
  },
  {
    id: 'S3',
    text: '老师布置了一篇需要独立论证的议论文或研究报告。你通常怎么做？',
    options: [
      { label: '先确定自己的核心观点和论证结构，然后用AI辅助查找资料和论据，最终完全自己写', value: 'A' },
      { label: '让AI生成一个框架和初稿，我在这个基础上大幅修改，融入自己的观点', value: 'B' },
      { label: '让AI写大部分内容，我主要负责调整和完善', value: 'C' },
      { label: '看情况，有时自己写有时用AI，取决于时间和难度', value: 'D' },
    ],
  },
  {
    id: 'S4',
    text: 'AI为你生成了一段关于某个社会议题的分析。你会怎么处理？',
    options: [
      { label: '审视它的论证结构：前提假设是否成立、论据是否可靠、推理是否严密，然后决定取舍', value: 'A' },
      { label: '看看有没有明显的错误或偏见，没有的话基本采纳', value: 'B' },
      { label: '觉得AI分析得比我好，直接用了', value: 'C' },
      { label: '主要看字数和格式合不合要求', value: 'D' },
    ],
  },
  {
    id: 'S5',
    text: '你用AI查了一个学术观点的资料，但发现不同来源的说法矛盾。你会——',
    options: [
      { label: '继续查原始文献或权威来源，分析矛盾的原因，形成自己的判断', value: 'A' },
      { label: '再问AI一次，让它综合各方观点给我一个结论', value: 'B' },
      { label: '选一个看起来最可信的用就行', value: 'C' },
      { label: '这种矛盾很少遇到，因为我一般只用一个来源', value: 'D' },
    ],
  },
  {
    id: 'S6',
    text: '完成一篇重要的论文或报告后，你能否清晰地说出其中每个核心观点的来源？',
    options: [
      { label: '能——我会有意识地记录自己的思考过程和AI的贡献', value: 'A' },
      { label: '大致能说，但有些细节已经分不清了', value: 'B' },
      { label: '说实话很难分清，写的过程中我和AI的边界很模糊', value: 'C' },
      { label: '不觉得需要分清，结果好就行', value: 'D' },
    ],
  },
  {
    id: 'S7',
    text: '你认为AI最大的局限性是什么？',
    options: [
      { label: '它没有真正的理解和判断力——它能生成"像样"的内容但不能保证正确和深度', value: 'A' },
      { label: '它的知识有滞后性，而且会"幻觉"——自信地编造不存在的信息', value: 'B' },
      { label: '没什么明显的局限，现在的AI已经很强了', value: 'C' },
      { label: '没认真想过这个问题', value: 'D' },
    ],
  },
  {
    id: 'S8',
    text: '如果老师规定最重要的那篇论文必须完全自己写，不能用AI，你的真实感受是——',
    options: [
      { label: '没问题，我有能力独立完成高质量的作品，AI只是让我更快', value: 'A' },
      { label: '有点紧张，但努力一下应该能行，只是质量可能不如平时', value: 'B' },
      { label: '会很困难——我已经不太习惯完全独立地从头到尾写一篇东西了', value: 'C' },
      { label: '觉得不合理——AI时代为什么还要这样做', value: 'D' },
    ],
  },
  {
    id: 'S9',
    text: '你觉得在AI时代，什么样的人会有竞争力？',
    options: [
      { label: '能用AI做出有自己判断和创造性的成果的人——AI操作是基础，思维深度才是壁垒', value: 'A' },
      { label: '精通AI工具、能用AI实现高效产出的人', value: 'B' },
      { label: '谁知道呢，技术变化太快了，说不准', value: 'C' },
      { label: '没认真想过', value: 'D' },
    ],
  },
  {
    id: 'S10',
    text: '如果有一个课程专门训练你在用AI的同时保持独立思考和深度分析的能力，你会——',
    options: [
      { label: '很感兴趣——我觉得这是真正重要的能力，而且我也想测试自己在哪个水平', value: 'A' },
      { label: '有点兴趣，但得看具体内容和时间投入', value: 'B' },
      { label: '不确定——我觉得我用AI用得挺好的，不确定还需要什么', value: 'C' },
      { label: '不感兴趣', value: 'D' },
    ],
  },
]

export const QUESTIONS: Record<'primary' | 'middle' | 'senior', GradeQuestions> = {
  primary: { partA: primaryPartA, partB: primaryPartB },
  middle: { partA: middlePartA, partB: middlePartB },
  senior: { partA: seniorPartA, partB: seniorPartB },
}

export const GRADE_LABELS = {
  primary: '小学（4-6年级）',
  middle: '初中（7-9年级）',
  senior: '高中（10-12年级）',
}
