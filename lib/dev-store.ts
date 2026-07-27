// lib/dev-store.ts
// 本地开发用 JSON 文件存储，无需 PostgreSQL
// 生产环境 Vercel 部署时不调用此文件（Prisma 可用）

import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'dev-db.json')

interface DevRecord {
  id: string
  createdAt: string
  grade: string
  parentAnswers: Record<string, string>
  studentAnswers: Record<string, string>
  parentOpen: string | null
  studentOpen: string | null
  scores: any
  scoreDefine: number
  scoreJudge: number
  scoreIntegrate: number
  defLevel: string
  judgeLevel: string
  intLevel: string
  weakestDim: string
  contradiction: string
  reliability: string
  parentUserType: string | null
  parentPainpoint: string | null
  report: Record<string, string> | null
  reportGenAt: string | null
  stage: string
  stageUpdatedAt: string | null
}

class DevStore {
  private data: Map<string, DevRecord> = new Map()
  private loaded = false

  private load() {
    if (this.loaded) return
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        const records: DevRecord[] = JSON.parse(raw)
        for (const r of records) {
          this.data.set(r.id, r)
        }
      }
    } catch {
      // 首次启动，无文件
    }
    this.loaded = true
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(DATA_FILE, JSON.stringify([...this.data.values()], null, 2))
    } catch {
      console.error('[dev-store] 写入失败')
    }
  }

  private nextId(): string {
    return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  assessment = {
    create: async (input: { data: any }): Promise<DevRecord> => {
      this.load()
      const record: DevRecord = {
        id: this.nextId(),
        createdAt: new Date().toISOString(),
        ...input.data,
        report: null,
        reportGenAt: null,
        stage: input.data.stage || 'assessed',
        stageUpdatedAt: input.data.stage ? new Date().toISOString() : null,
      }
      this.data.set(record.id, record)
      this.save()
      return record
    },

    findUnique: async (opts: { where: { id: string }; select?: any }): Promise<DevRecord | null> => {
      this.load()
      const record = this.data.get(opts.where.id)
      return record || null
    },

    update: async (opts: { where: { id: string }; data: any }): Promise<DevRecord> => {
      this.load()
      const existing = this.data.get(opts.where.id)
      if (!existing) throw new Error(`记录不存在: ${opts.where.id}`)
      const updated = { ...existing, ...opts.data }
      this.data.set(opts.where.id, updated)
      this.save()
      return updated
    },
  }
}

// 检测 Prisma 是否可用
let prismaAvailable = false
try {
  const { PrismaClient } = require('@prisma/client')
  const p = new PrismaClient({ log: ['error'] })
  p.$connect().then(() => {
    prismaAvailable = true
    console.log('[db] Prisma + PostgreSQL 已连接')
  }).catch(() => {
    console.warn('[db] PostgreSQL 不可用，降级为本地 JSON 文件存储')
  })
} catch {
  console.warn('[db] Prisma 不可用，降级为本地 JSON 文件存储')
}

export const devStore = new DevStore()
export { prismaAvailable }
