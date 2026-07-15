import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    indexedDB.deleteDatabase('haru-planner')
    localStorage.clear()
  })
  await page.reload()
})

test('예시 계획으로 시작해 오늘 일정과 주간 화면을 확인한다', async ({ page }) => {
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await expect(page.getByRole('heading', { name: /오늘의 흐름을 가볍게 시작해요/ })).toBeVisible()
  await expect(page.getByText('정보처리기사 실기 · Day 1').first()).toBeVisible()
  const weekButton = page.getByRole('button', { name: '주간' }).first()
  await weekButton.click()
  await expect(page.getByRole('heading', { name: /7월 13일/ })).toBeVisible()
})

test('일정을 추가하고 완료 상태를 되돌릴 수 있다', async ({ page }) => {
  await page.getByRole('button', { name: /빈 플래너로 시작/ }).click()
  await page.locator('#main-content').getByRole('button', { name: '일정 추가', exact: true }).click()
  await page.getByLabel('일정 이름').fill('테스트 공부')
  const dialog = page.getByRole('dialog', { name: '오늘의 흐름에 더하기' })
  await dialog.getByRole('button', { name: '일정 추가', exact: true }).click()
  await expect(page.getByText('테스트 공부')).toBeVisible()
  const check = page.getByRole('button', { name: '테스트 공부 완료' })
  await check.click()
  await expect(page.getByRole('button', { name: '테스트 공부 완료 취소' })).toBeVisible()
})

test('반복 일정의 현재 회차와 이후 일정을 한 번에 수정한다', async ({ page }) => {
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await page.getByRole('button', { name: /정보처리기사 실기 · Day 1 자격증/ }).click()
  await page.getByLabel('수정 범위').selectOption('future')
  await page.getByLabel('시작 시각').fill('09:00')
  await page.getByRole('button', { name: '변경 적용' }).click()

  await expect(page.getByText('자격증 · 09:00 · 1시간 10분').first()).toBeVisible()
  await expect(page.getByText(/이 일정과 이후 일정.*수정했습니다/)).toBeVisible()
})

test('시작·종료 시각으로 공부량을 계산하고 기간별 대시보드에 반영한다', async ({ page, isMobile }) => {
  await page.getByRole('button', { name: /빈 플래너로 시작/ }).click()
  await page.locator('#main-content').getByRole('button', { name: '일정 추가', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '오늘의 흐름에 더하기' })
  await dialog.getByLabel('일정 이름').fill('시간 계산 공부')
  await dialog.getByLabel(/시작 시간/).fill('09:00')
  await dialog.getByLabel(/종료 시간/).fill('10:30')
  await expect(dialog.getByLabel(/공부 시간/)).toHaveValue('90')
  await dialog.getByRole('button', { name: '일정 추가', exact: true }).click()

  await expect(page.getByText(/09:00–10:30 · 1시간 30분/)).toBeVisible()
  await page.getByRole('button', { name: '시간 계산 공부 완료' }).click()
  if (isMobile) {
    await page.getByRole('button', { name: '더보기' }).click()
    await page.getByRole('button', { name: '진도' }).last().click()
  } else {
    await page.getByRole('button', { name: '진도' }).first().click()
  }
  await page.getByRole('group', { name: '공부량 조회 기간' }).getByRole('button', { name: '일간' }).click()
  const dashboard = page.getByRole('region', { name: '기간별 공부량 대시보드' })
  await expect(dashboard.getByText('1시간 30분').first()).toBeVisible()
  await expect(dashboard.getByText('100%')).toBeVisible()
})

test('모바일 하단 메뉴와 더보기 메뉴가 작동한다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트 전용')
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await page.getByRole('button', { name: '더보기' }).click()
  await page.getByRole('button', { name: '설정' }).last().click()
  await expect(page.getByRole('heading', { name: /내 리듬에 맞게/ })).toBeVisible()
})
