import { Bell, Cloud, Database, Download, RotateCcw, ShieldCheck, SlidersHorizontal, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { CategoryEditor } from '../components/CategoryEditor'
import { usePlanner } from '../store/PlannerContext'

export function SettingsView() {
  const { data, cloudUser, syncStatus, updateSettings, exportBackup, restoreBackup, resetData } = usePlanner()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  if (!data) return null

  const exportData = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `haru-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (!window.confirm('복원 전에 현재 데이터를 내보내 백업하는 것을 권장합니다. 계속할까요?')) return
      restoreBackup(JSON.parse(await file.text()))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '파일을 읽지 못했습니다. JSON 백업 파일인지 확인해 주세요.')
    } finally { event.target.value = '' }
  }
  const reset = () => {
    if (!window.confirm('전체 데이터를 초기화할까요? 이 작업은 되돌릴 수 없습니다.')) return
    if (!window.confirm('한 번 더 확인합니다. 모든 계획과 완료 기록을 지울까요?')) return
    resetData('empty')
  }

  return <div className="page settings-page">
    <header className="page-header"><span className="eyebrow">환경 설정</span><h1>내 리듬에 맞게 조정해요.</h1><p>날짜 규칙과 화면 표시, 데이터 보관 방식을 관리합니다.</p></header>
    <section className="settings-group"><header><span><SlidersHorizontal /></span><div><h2>플래너 기본값</h2><p>새로 만드는 계획과 화면에 적용됩니다.</p></div></header><div className="settings-rows">
      <label><span><strong>주 시작 요일</strong><small>주간 플래너의 첫 번째 요일</small></span><select value={data.settings.weekStartsOn} onChange={(event) => updateSettings({ weekStartsOn: Number(event.target.value) as 0 | 1 })}><option value={1}>월요일</option><option value={0}>일요일</option></select></label>
      <label><span><strong>기본 휴식일</strong><small>변경 시 미래 자동 일정만 다시 계산합니다.</small></span><select value={data.settings.defaultRestWeekdays[0] ?? 0} onChange={(event) => { const day = Number(event.target.value); if (window.confirm('완료 기록을 보존하고 미래 자동 일정을 새 휴식일 기준으로 계산할까요?')) updateSettings({ defaultRestWeekdays: [day] }, true) }}><option value={0}>일요일</option><option value={6}>토요일</option><option value={1}>월요일</option></select></label>
      <label><span><strong>기본 오늘 보기</strong><small>체크리스트 또는 시간순</small></span><select value={data.settings.defaultView} onChange={(event) => updateSettings({ defaultView: event.target.value as 'checklist' | 'timeline' })}><option value="checklist">체크리스트</option><option value="timeline">시간순 타임라인</option></select></label>
      <label><span><strong>시간 표시</strong><small>일정과 완료 시각에 사용</small></span><select value={data.settings.timeFormat} onChange={(event) => updateSettings({ timeFormat: event.target.value as '12' | '24' })}><option value="24">24시간제</option><option value="12">12시간제</option></select></label>
    </div></section>
    <CategoryEditor />
    <section className="settings-group"><header><span><Cloud /></span><div><h2>클라우드 동기화</h2><p>같은 ChatGPT 계정으로 접속한 기기에서 계획과 기록을 이어서 사용합니다.</p></div></header><div className="sync-settings-card"><span className={`sync-dot ${syncStatus}`} /><div><strong>{syncStatus === 'synced' ? '동기화됨' : syncStatus === 'syncing' ? '동기화 중' : syncStatus === 'offline' ? '오프라인 · 기기에 임시 저장 중' : syncStatus === 'error' ? '동기화 재시도 대기 중' : '이 기기에만 저장 중'}</strong><small>{cloudUser ? `${cloudUser} · 변경 내용은 클라우드와 IndexedDB에 함께 저장됩니다.` : '배포된 비공개 사이트에서 로그인하면 기기 간 동기화가 켜집니다.'}</small></div></div></section>
    <section className="settings-group"><header><span><Bell /></span><div><h2>접근성과 알림</h2><p>편안하게 읽고 사용할 수 있도록 조정합니다.</p></div></header><div className="settings-rows">
      <label className="toggle-row"><span><strong>애니메이션 줄이기</strong><small>화면 전환 움직임을 최소화합니다.</small></span><input type="checkbox" checked={data.settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
      <label><span><strong>글자 크기</strong><small>레이아웃을 유지하며 전체 글자를 확대합니다.</small></span><select value={data.settings.fontScale} onChange={(event) => updateSettings({ fontScale: Number(event.target.value) })}><option value={0.94}>작게</option><option value={1}>기본</option><option value={1.08}>크게</option><option value={1.16}>아주 크게</option></select></label>
      <label className="toggle-row"><span><strong>타이머 종료 알림</strong><small>브라우저 권한이 허용된 경우에만 표시합니다.</small></span><input type="checkbox" checked={data.settings.notificationsEnabled} onChange={async (event) => { if (event.target.checked && 'Notification' in window) await Notification.requestPermission(); updateSettings({ notificationsEnabled: event.target.checked }) }} /></label>
    </div></section>
    <section className="settings-group"><header><span><Database /></span><div><h2>데이터와 백업</h2><p>클라우드 동기화와 별도로 이 브라우저에도 오프라인 사본을 보관합니다.</p></div></header><div className="data-actions"><button onClick={exportData}><Download /><span><strong>전체 데이터 내보내기</strong><small>스키마 버전을 포함한 JSON 파일</small></span></button><button onClick={() => fileRef.current?.click()}><Upload /><span><strong>백업에서 복원</strong><small>복원 전 파일 구조를 검증합니다.</small></span></button><input ref={fileRef} type="file" accept="application/json,.json" onChange={importData} hidden /><button onClick={() => resetData('sample')}><RotateCcw /><span><strong>예시 계획 다시 불러오기</strong><small>현재 데이터를 예시 데이터로 교체합니다.</small></span></button></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="storage-note"><ShieldCheck /><span><strong>오프라인에서도 안전하게</strong><small>인터넷이 끊겨도 기기 사본을 사용하고, 연결이 돌아오면 최신 변경을 다시 동기화합니다.</small></span></div></section>
    <section className="danger-zone"><div><strong>전체 초기화</strong><p>모든 계획, 일정, 회고, 설정을 삭제하고 빈 플래너로 돌아갑니다.</p></div><button onClick={reset}>전체 데이터 지우기</button></section>
  </div>
}
