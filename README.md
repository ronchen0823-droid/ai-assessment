/# AI 思维状态测评系统

家长与孩子各完成一份问卷，AI 实时生成个性化分析报告，评估孩子在 AI 时代的「思维主导权」状态。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript (strict)
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL + Prisma ORM
- **AI**: OpenAI / 兼容 API（DeepSeek 等）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接串和 API Key

# 3. 数据库迁移
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

## 项目结构

```
app/
  page.tsx              # 首页（学段选择）
  survey/[grade]/       # 问卷填写（家长 → 学生 → 开放题）
  report/[id]/          # 报告展示
  api/
    save-survey/        # POST 保存问卷
    survey/[id]/        # GET 查询 / PATCH 更新报告
    generate-report/    # POST 调用 AI 生成报告
lib/
  questions.ts          # 三学段题目定义
  scoring.ts            # 计分 + 矛盾检测 + 可靠性判定
  prompts.ts            # AI prompt 模板 + 报告上下文构建
  db.ts                 # Prisma 数据访问层
prisma/schema.prisma    # 数据模型
components/
  RadarChart.tsx        # 三维度雷达图
```

## 核心流程

1. 家长在首页选择学段
2. 家长完成 Part A（8 题选择 + 1 题开放）
3. 学生完成 Part B（8-9 题选择 + 1 题开放）
4. 系统计算三维度分数 + 矛盾检测 + 可靠性判定
5. AI 生成 7 字段个性化报告
6. 报告持久化到数据库，生成可分享链接

## 三维度模型

| 维度 | 说明 |
|---|---|
| 主动定义 | 用 AI 前先想清楚要做什么 |
| 主动判断 | 评估 AI 给的内容对不对 |
| 主动整合 | 最终成果有没有自己的思考 |

## 环境变量

参见 `.env.example`。

## 构建部署

```bash
npm run build
npm start
```
