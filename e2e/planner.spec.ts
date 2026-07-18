import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('haru-planner')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => resolve()
    })
    localStorage.clear()
  })
  await page.reload()
})

test('예시 계획으로 시작해 오늘 일정과 주간 화면을 확인한다', async ({ page }) => {
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await expect(page.getByRole('heading', { name: /오늘의 흐름을 가볍게 시작해요/ })).toBeVisible()
  await expect(page.getByText('탄방역 지하보도 운동').first()).toBeVisible()
  await expect(page.getByText(/스터디카페 적응/).first()).toBeVisible()
  const weekButton = page.getByRole('button', { name: '주간' }).first()
  await weekButton.click()
  await expect(page.locator('.paper-week > article')).toHaveCount(7)
  await expect(page.getByText('탄방역 지하보도 운동').first()).toBeVisible()
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
  await page.getByRole('button', { name: '월간' }).first().click()
  await page.getByRole('button', { name: /7월 27일 월요일, 일정/ }).click()
  await page.locator('.date-detail').getByRole('button', { name: /정보처리기사 실기 · Day 1 자격증/ }).evaluate((button) => (button as HTMLButtonElement).click())
  await page.getByLabel('수정 범위').selectOption('future')
  await page.getByLabel('시작 시각').fill('09:00')
  await page.getByRole('button', { name: '변경 적용' }).evaluate((button) => (button as HTMLButtonElement).click())

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

test('오늘 일정 타이머를 재접속 후 이어서 정지하고 목표 시간을 설정한다', async ({ page }) => {
  await page.locator('.start-option.sample').click()
  await page.locator('.schedule-timer-launch').first().click()
  let dialog = page.getByRole('dialog', { name: '시작과 정지를 자동으로 기록해요' })
  await dialog.getByRole('button', { name: '시작', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '정지하고 기록' })).toBeVisible()
  await page.waitForTimeout(1200)
  await dialog.getByRole('button', { name: '닫기' }).click()

  await page.waitForTimeout(300)
  await page.reload()
  const runningTimer = page.locator('.schedule-timer-launch.timer-running').first()
  await expect(runningTimer).toBeVisible()
  await runningTimer.click()
  dialog = page.getByRole('dialog', { name: '시작과 정지를 자동으로 기록해요' })
  await dialog.getByRole('button', { name: '정지하고 기록' }).click()
  await expect(dialog.locator('.timer-record-summary span').nth(1)).toContainText('1분')

  await dialog.getByRole('button', { name: /목표 타이머/ }).click()
  await dialog.getByLabel('목표 시간(분)').fill('90')
  await expect(dialog.getByLabel('목표 시간(분)')).toHaveValue('90')
  await expect(dialog.locator('.timer-face')).toContainText('90:00')
  await dialog.getByRole('button', { name: '닫기' }).click()
  await expect(page.locator('.summary-meta')).toContainText('기록 공부 1분')
})

test('모바일 하단 메뉴와 더보기 메뉴가 작동한다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트 전용')
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await page.getByRole('button', { name: '더보기' }).click()
  await page.getByRole('button', { name: '설정' }).last().click()
  await expect(page.getByRole('heading', { name: /내 리듬에 맞게/ })).toBeVisible()
})

test('모바일 월간 화면에서도 하단 메뉴 다섯 개가 화면 안에 보인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트 전용')
  await page.getByRole('button', { name: /예시 계획으로 시작/ }).click()
  await page.getByRole('button', { name: '월간' }).click()
  await expect(page.getByRole('button', { name: '더보기' })).toBeVisible()

  const layout = await page.evaluate(() => {
    const moreButton = document.querySelector<HTMLButtonElement>('.mobile-nav button:last-child')
    const calendar = document.querySelector<HTMLElement>('.calendar-grid')
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      moreButtonRight: moreButton?.getBoundingClientRect().right ?? Infinity,
      calendarRight: calendar?.getBoundingClientRect().right ?? Infinity,
    }
  })
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(layout.moreButtonRight).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(layout.calendarRight).toBeLessThanOrEqual(layout.viewportWidth + 1)
})

test('모바일 주간 화면은 월화수, 목금토, 일요일 순서의 세 줄로 보인다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트 전용')
  await page.locator('.start-option.sample').click()
  await page.locator('.mobile-nav button').nth(1).click()

  const layout = await page.evaluate(() => {
    const articles = [...document.querySelectorAll<HTMLElement>('.paper-week > article')]
    const boxes = articles.map((article) => article.getBoundingClientRect())
    const grid = document.querySelector<HTMLElement>('.paper-week')?.getBoundingClientRect()
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      tops: boxes.map((box) => Math.round(box.top)),
      lastWidth: boxes[6]?.width ?? 0,
      gridWidth: grid?.width ?? 0,
      gridRight: grid?.right ?? Infinity,
    }
  })

  expect(layout.tops[0]).toBe(layout.tops[1])
  expect(layout.tops[1]).toBe(layout.tops[2])
  expect(layout.tops[3]).toBe(layout.tops[4])
  expect(layout.tops[4]).toBe(layout.tops[5])
  expect(layout.tops[3]).toBeGreaterThan(layout.tops[0])
  expect(layout.tops[6]).toBeGreaterThan(layout.tops[3])
  expect(layout.lastWidth).toBeGreaterThanOrEqual(layout.gridWidth - 2)
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(layout.gridRight).toBeLessThanOrEqual(layout.viewportWidth + 1)
})
