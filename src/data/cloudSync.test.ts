import { describe, expect, it } from 'vitest'
import { createEmptyData } from './seed'
import { chooseNewestPlannerData } from './cloudSync'

describe('클라우드와 기기 사본 병합', () => {
  it('마지막 수정 시각이 더 최신인 사본을 선택한다', () => {
    const local = createEmptyData()
    const cloud = createEmptyData()
    local.settings.lastModifiedAt = '2026-07-15T09:00:00.000Z'
    cloud.settings.lastModifiedAt = '2026-07-15T09:01:00.000Z'
    expect(chooseNewestPlannerData(local, cloud)).toBe(cloud)
  })

  it('한쪽 사본이 없으면 남아 있는 사본을 사용한다', () => {
    const local = createEmptyData()
    expect(chooseNewestPlannerData(local, null)).toBe(local)
    expect(chooseNewestPlannerData(null, local)).toBe(local)
  })
})
