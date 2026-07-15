import type { PlannerData } from '../types'

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error'

interface CloudSnapshot {
  data: PlannerData | null
  revision: number
  updatedAt: string | null
}

export async function readCloudSnapshot(): Promise<CloudSnapshot> {
  const response = await fetch('/api/sync', { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(response.status === 401 ? '로그인 정보가 없습니다.' : '클라우드 데이터를 불러오지 못했습니다.')
  return response.json() as Promise<CloudSnapshot>
}

export async function writeCloudSnapshot(data: PlannerData): Promise<CloudSnapshot> {
  const response = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!response.ok) throw new Error(response.status === 401 ? '로그인 정보가 없습니다.' : '클라우드 저장에 실패했습니다.')
  return response.json() as Promise<CloudSnapshot>
}

export function chooseNewestPlannerData(local: PlannerData | null, cloud: PlannerData | null): PlannerData | null {
  if (!local) return cloud
  if (!cloud) return local
  const localTime = Date.parse(local.settings.lastModifiedAt || '') || 0
  const cloudTime = Date.parse(cloud.settings.lastModifiedAt || '') || 0
  return cloudTime >= localTime ? cloud : local
}
