import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlannerProvider } from '../store/PlannerContext'
import { Onboarding } from './Onboarding'

describe('Onboarding', () => {
  it('두 가지 시작 경로와 로컬 저장 안내를 제공한다', () => {
    render(<PlannerProvider><Onboarding /></PlannerProvider>)
    expect(screen.getByRole('heading', { name: /오늘의 흐름/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /예시 계획으로 시작/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /빈 플래너로 시작/ })).toBeInTheDocument()
    expect(screen.getByText(/오프라인 사용 가능/)).toBeInTheDocument()
  })
})
