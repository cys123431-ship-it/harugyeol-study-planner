import { Copy, Edit3, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatKoreanDate, plannedAndActualProgress } from '../lib/dates'
import { formatDday, getDday } from '../lib/deadlines'
import { usePlanner } from '../store/PlannerContext'
import type { Plan } from '../types'

const typeLabels: Record<string, string> = { single: '단일 할 일', recurring: '반복 계획', count: '횟수 완성형', cumulative: '누적 추가형', deadline: '시험·마감', habit: '습관', free: '자유 일정' }

export function PlansView({ onAdd, onEdit }: { onAdd: () => void; onEdit: (plan: Plan) => void }) {
  const { data, deletePlan, duplicatePlan } = usePlanner()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('active')
  const [menu, setMenu] = useState<string | null>(null)
  const plans = (data?.plans ?? []).filter((plan) => (status === 'all' || plan.status === status) && plan.title.toLowerCase().includes(query.toLowerCase()))

  const remove = (plan: Plan) => {
    if (window.confirm(`“${plan.title}” 계획과 관련 일정을 모두 삭제할까요? 완료 기록도 함께 삭제됩니다.`)) deletePlan(plan.id)
  }

  return <div className="page plans-page">
    <header className="page-header split-header"><div><span className="eyebrow">계획 관리</span><h1>내가 만든 계획</h1><p>계획의 규칙과 실제 진도를 나란히 확인하세요.</p></div><button className="primary-button" onClick={onAdd}><Plus size={18} /> 새 계획</button></header>
    <div className="plan-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="계획 이름 검색" aria-label="계획 이름 검색" />{query && <button onClick={() => setQuery('')}>지우기</button>}</label><div className="status-tabs">{[['active', '진행 중'], ['upcoming', '예정'], ['completed', '완료'], ['archived', '보관'], ['all', '전체']].map(([value, label]) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{label}</button>)}</div></div>
    {plans.length ? <div className="plans-list"><div className="plans-list-head"><span>계획</span><span>기간·규칙</span><span>진도</span><span>관리</span></div>{plans.map((plan) => {
      const progress = plannedAndActualProgress(plan.id, data?.items ?? [])
      return <article key={plan.id} className="plan-list-row">
        <div className="plan-identity"><i style={{ background: plan.color }} /><div><span className="plan-type">{typeLabels[plan.planType]}</span><strong>{plan.title}</strong><small>{plan.description || '설명이 없습니다.'}</small></div></div>
        <div className="plan-rule"><strong>{formatKoreanDate(plan.startDate, 'yyyy.MM.dd')} — {plan.endDate ? formatKoreanDate(plan.endDate, 'yyyy.MM.dd') : '계속'}{plan.planType === 'deadline' && <span className="dday-badge">{formatDday(getDday(plan))}</span>}</strong><small>{plan.planType === 'count' ? `휴식일 제외 · 총 ${plan.targetCount}회` : plan.planType === 'cumulative' ? '실제 학습일 기준 단계 누적' : plan.planType === 'deadline' ? '마감 다음 날 자동 보관' : '설정한 규칙으로 반복'}</small></div>
        <div className="plan-progress-cell"><div><span style={{ width: `${progress.percent}%`, background: plan.color }} /></div><strong>{progress.percent}%</strong><small>계획 {progress.planned} · 완료 {progress.actual}</small></div>
        <div className="plan-menu-wrap"><button className="icon-button" onClick={() => setMenu(menu === plan.id ? null : plan.id)} aria-label={`${plan.title} 관리 메뉴`}><MoreHorizontal /></button>{menu === plan.id && <div className="context-menu"><button onClick={() => { onEdit(plan); setMenu(null) }}><Edit3 size={15} /> 수정</button><button onClick={() => { duplicatePlan(plan.id); setMenu(null) }}><Copy size={15} /> 복제</button><button className="danger" onClick={() => { remove(plan); setMenu(null) }}><Trash2 size={15} /> 삭제</button></div>}</div>
      </article>
    })}</div> : <div className="empty-state"><Search /><h3>조건에 맞는 계획이 없습니다.</h3><p>검색이나 상태 필터를 바꾸거나 새 계획을 만들어 보세요.</p><button className="primary-button" onClick={onAdd}>계획 추가</button></div>}
  </div>
}
