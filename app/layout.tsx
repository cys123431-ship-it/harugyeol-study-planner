import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '../src/styles.css'

export const metadata: Metadata = {
  title: '하루결 · 스터디 플래너',
  description: '학습일과 휴식일의 흐름을 정돈하고 기기 간 동기화하는 개인 학습 플래너',
  icons: { icon: '/planner.svg', shortcut: '/planner.svg' },
}

export const viewport: Viewport = { themeColor: '#f7f8f4', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>
}
