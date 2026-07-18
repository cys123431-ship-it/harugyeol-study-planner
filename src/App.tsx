'use client'

import { useEffect, useState } from 'react'
import { BarChart3, BookOpenCheck, CalendarDays, CalendarRange, CheckCircle2, ClipboardList, CloudOff, LoaderCircle, Plus, Settings, Sparkles } from 'lucide-react'
import { AddItemDialog } from './components/AddItemDialog'
import { AddPlanWizard } from './components/AddPlanWizard'
import { FocusTimer } from './components/FocusTimer'
import { Onboarding } from './components/Onboarding'
import { Toast } from './components/Toast'
import { MonthView } from './views/MonthView'
import { PlansView } from './views/PlansView'
import { ProgressView } from './views/ProgressView'
import { ReflectionView } from './views/ReflectionView'
import { SettingsView } from './views/SettingsView'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import { usePlanner } from './store/PlannerContext'
import type { Plan } from './types'

export type ViewId = 'today' | 'week' | 'month' | 'plans' | 'progress' | 'reflection' | 'settings'

const navItems = [
  { id: 'today' as const, label: '오늘', icon: BookOpenCheck },
  { id: 'week' as const, label: '주간', icon: CalendarRange },
  { id: 'month' as const, label: '월간', icon: CalendarDays },
  { id: 'plans' as const, label: '계획', icon: ClipboardList },
  { id: 'progress' as const, label: '진도', icon: BarChart3 },
  { id: 'reflection' as const, label: '회고', icon: Sparkles },
  { id: 'settings' as const, label: '설정', icon: Settings },
]

export default function App() {
  const { data, loading, needsOnboarding, cloudUser, syncStatus } = usePlanner()
  const [view, setView] = useState<ViewId>('today')
  const [showPlanWizard, setShowPlanWizard] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [timerItemId, setTimerItemId] = useState<string | undefined>()
  const [mobileMore, setMobileMore] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: data?.settings.reducedMotion ? 'auto' : 'smooth' })
  }, [view, data?.settings.reducedMotion])

  if (loading) return <div className="app-loading"><span className="loading-mark" />플래너를 정리하고 있어요</div>

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setShowPlanWizard(true)
  }

  return (
    <div className="app-shell" style={{ fontSize: `${data?.settings.fontScale ?? 1}rem` }}>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <aside className="sidebar" aria-label="주 메뉴">
        <button className="brand" onClick={() => setView('today')} aria-label="하루결 오늘 화면">
          <span className="brand-mark">ㅎ</span>
          <span><strong>하루결</strong><small>study planner</small></span>
        </button>
        <nav>
          {navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><item.icon size={19} />{item.label}</button>)}
        </nav>
        <div className="sidebar-foot">
          <div className={`sidebar-sync ${syncStatus}`} title={cloudUser ?? '로컬 저장'}>{syncStatus === 'synced' ? <CheckCircle2 size={15} /> : syncStatus === 'syncing' ? <LoaderCircle size={15} /> : <CloudOff size={15} />}<span>{syncStatus === 'synced' ? '클라우드 동기화됨' : syncStatus === 'syncing' ? '동기화 중' : syncStatus === 'local' ? '로컬 개발 모드' : '오프라인 저장 중'}</span></div>
          <p>계획은 선명하게,<br />하루는 가볍게.</p>
          <button className="primary-button wide" onClick={() => { setEditingPlan(null); setShowPlanWizard(true) }}><Plus size={18} /> 새 계획</button>
        </div>
      </aside>

      <main id="main-content" className="main-content">
        {view === 'today' && <TodayView onOpenTimer={(itemId) => { setTimerItemId(itemId); setShowTimer(true) }} onAddItem={() => setShowItemDialog(true)} onAddPlan={() => setShowPlanWizard(true)} />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
        {view === 'plans' && <PlansView onAdd={() => { setEditingPlan(null); setShowPlanWizard(true) }} onEdit={openEdit} />}
        {view === 'progress' && <ProgressView />}
        {view === 'reflection' && <ReflectionView />}
        {view === 'settings' && <SettingsView />}
      </main>

      <button className="floating-add" onClick={() => setShowItemDialog(true)} aria-label="빠른 일정 추가"><Plus size={24} /></button>
      <nav className="mobile-nav" aria-label="모바일 주 메뉴">
        {navItems.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileMore(false) }}><item.icon size={21} /><span>{item.label}</span></button>)}
        <button className={['progress', 'reflection', 'settings'].includes(view) ? 'active' : ''} onClick={() => setMobileMore((open) => !open)}><Settings size={21} /><span>더보기</span></button>
      </nav>
      {mobileMore && <div className="mobile-more" role="menu">{navItems.slice(4).map((item) => <button key={item.id} onClick={() => { setView(item.id); setMobileMore(false) }}><item.icon size={18} />{item.label}</button>)}</div>}

      {needsOnboarding && <Onboarding />}
      {showPlanWizard && <AddPlanWizard plan={editingPlan} onClose={() => { setShowPlanWizard(false); setEditingPlan(null) }} />}
      {showItemDialog && <AddItemDialog onClose={() => setShowItemDialog(false)} />}
      {showTimer && <FocusTimer initialItemId={timerItemId} onClose={() => { setShowTimer(false); setTimerItemId(undefined) }} />}
      <Toast />
    </div>
  )
}
