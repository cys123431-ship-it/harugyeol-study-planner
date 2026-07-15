import { Save, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { formatKoreanDate, todayKey } from '../lib/dates'
import { usePlanner } from '../store/PlannerContext'
import type { PeriodType, Reflection } from '../types'

export function ReflectionView() {
  const { data, saveReflection } = usePlanner()
  const [period, setPeriod] = useState<PeriodType>('daily')
  const [date, setDate] = useState(todayKey())
  const existing = data?.reflections.find((item) => item.date === date && item.periodType === period)

  return <div className="page reflection-page">
    <header className="page-header"><span className="eyebrow">선택형 회고</span><h1>잠깐 멈춰 오늘을 정리해요.</h1><p>모든 칸을 채울 필요는 없습니다. 남기고 싶은 만큼만 적어도 충분해요.</p></header>
    <div className="reflection-controls"><div className="status-tabs">{([['daily', '오늘'], ['weekly', '주간'], ['monthly', '월간']] as const).map(([value, label]) => <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{label}</button>)}</div><label><span className="sr-only">회고 날짜</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div>
    <ReflectionEditor key={`${date}-${period}-${existing?.id ?? 'new'}`} date={date} period={period} existing={existing} onSave={saveReflection} />
  </div>
}

function ReflectionEditor({ date, period, existing, onSave }: { date: string; period: PeriodType; existing?: Reflection; onSave: (reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [good, setGood] = useState(existing?.good ?? '')
  const [difficult, setDifficult] = useState(existing?.difficult ?? '')
  const [improvement, setImprovement] = useState(existing?.improvement ?? '')
  const [freeText, setFreeText] = useState(existing?.freeText ?? '')
  const save = () => onSave({ date, periodType: period, good, difficult, improvement, freeText })

  return <>
    <section className="reflection-paper">
      <header><Sparkles size={18} /><span>{formatKoreanDate(date, 'yyyy년 M월 d일 EEEE')}</span><small>{period === 'daily' ? '오늘의 기록' : period === 'weekly' ? '이번 주의 기록' : '이번 달의 기록'}</small></header>
      <div className="reflection-prompts">
        <label><span>01</span><strong>잘한 점</strong><small>작은 진전도 놓치지 마세요.</small><textarea value={good} onChange={(event) => setGood(event.target.value)} placeholder="오늘 내가 잘해낸 것은…" /></label>
        <label><span>02</span><strong>어려웠던 점</strong><small>판단하지 않고 사실만 적어 보세요.</small><textarea value={difficult} onChange={(event) => setDifficult(event.target.value)} placeholder="집중하기 어려웠던 순간은…" /></label>
        <label><span>03</span><strong>다음에 개선할 점</strong><small>실행 가능한 한 가지면 충분해요.</small><textarea value={improvement} onChange={(event) => setImprovement(event.target.value)} placeholder="다음에는 이렇게 해볼래요…" /></label>
      </div>
      <label className="free-note"><span>자유 메모</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} placeholder="형식 없이 자유롭게 적어 보세요." /></label>
      <footer><span>{existing ? `마지막 저장 ${new Date(existing.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : '아직 저장하지 않았어요'}</span><button className="secondary-button" onClick={save}>저장하기</button></footer>
    </section>
    <button className="primary-button reflection-save" onClick={save}><Save size={17} /> 회고 저장</button>
  </>
}
