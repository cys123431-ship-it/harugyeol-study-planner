import { describe, expect, it } from 'vitest'
import { createEmptyData } from './seed'
import { createBackup, validateBackup } from './database'

describe('백업 검증', () => {
  it('스키마 버전과 데이터를 포함한 백업을 검증한다', () => {
    const backup = createBackup(createEmptyData())
    expect(validateBackup(backup).schemaVersion).toBe(1)
  })

  it('잘못된 파일과 지원하지 않는 버전을 거부한다', () => {
    expect(() => validateBackup(null)).toThrow('JSON 객체')
    expect(() => validateBackup({ schemaVersion: 2, data: {} })).toThrow('지원하지 않는')
    expect(() => validateBackup({ schemaVersion: 1, data: {} })).toThrow('계획, 일정 또는 설정')
  })
})
