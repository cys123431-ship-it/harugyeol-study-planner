import { getD1 } from '../../../db'
import type { PlannerData } from '../../../src/types'
import { getChatGPTUser } from '../../chatgpt-auth'

export const dynamic = 'force-dynamic'

async function requireUser() {
  const user = await getChatGPTUser()
  if (!user) return null
  return user.email.toLowerCase()
}

async function ensureSchema() {
  const database = await getD1()
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS planner_snapshots (
      user_id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare('CREATE INDEX IF NOT EXISTS planner_snapshots_updated_at_idx ON planner_snapshots(updated_at)'),
  ])
  return database
}

export async function GET() {
  const userId = await requireUser()
  if (!userId) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const database = await ensureSchema()
  const row = await database.prepare('SELECT payload, revision, updated_at FROM planner_snapshots WHERE user_id = ?').bind(userId).first<{ payload: string; revision: number; updated_at: string }>()
  if (!row) return Response.json({ data: null, revision: 0, updatedAt: null })
  try {
    return Response.json({ data: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updated_at }, { headers: { 'cache-control': 'no-store' } })
  } catch {
    return Response.json({ error: '저장된 클라우드 데이터 형식이 올바르지 않습니다.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const userId = await requireUser()
  if (!userId) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const raw = await request.text()
  if (raw.length > 5_000_000) return Response.json({ error: '동기화 데이터가 5MB를 초과합니다.' }, { status: 413 })

  let data: PlannerData
  try {
    const body = JSON.parse(raw) as { data?: PlannerData }
    if (!body.data || !Array.isArray(body.data.plans) || !Array.isArray(body.data.items) || !body.data.settings) throw new Error('invalid')
    data = body.data
  } catch {
    return Response.json({ error: '동기화 데이터 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const database = await ensureSchema()
  const result = await database.prepare(`INSERT INTO planner_snapshots (user_id, payload, revision, updated_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      payload = excluded.payload,
      revision = planner_snapshots.revision + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING revision, updated_at`).bind(userId, JSON.stringify(data)).first<{ revision: number; updated_at: string }>()

  return Response.json({ data, revision: result?.revision ?? 1, updatedAt: result?.updated_at ?? new Date().toISOString() })
}
