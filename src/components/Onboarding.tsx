import { ArrowRight, CalendarCheck2, Leaf } from 'lucide-react'
import { usePlanner } from '../store/PlannerContext'

export function Onboarding() {
  const { initialize, cloudUser } = usePlanner()
  return (
    <div className="modal-backdrop onboarding-backdrop">
      <section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-copy">
          <span className="eyebrow"><Leaf size={15} /> 나의 리듬을 담는 플래너</span>
          <h1 id="onboarding-title">해야 할 일보다<br /><em>오늘의 흐름</em>을 먼저 보세요.</h1>
          <p>학습일과 휴식일을 구분하고, 실제로 공부한 만큼만 진도를 기록합니다. {cloudUser ? '계획과 기록은 같은 ChatGPT 계정의 기기에서 자동으로 동기화됩니다.' : '이 화면에서는 기기 사본으로 안전하게 시작할 수 있습니다.'}</p>
        </div>
        <div className="onboarding-options">
          <button className="start-option sample" onClick={() => initialize('sample')}>
            <span className="option-icon"><CalendarCheck2 /></span>
            <span><strong>예시 계획으로 시작</strong><small>정보처리기사 24일 + 7월 누적 + 8월 4과목 미시 계획</small></span>
            <ArrowRight />
          </button>
          <button className="start-option" onClick={() => initialize('empty')}>
            <span className="option-icon"><Leaf /></span>
            <span><strong>빈 플래너로 시작</strong><small>나만의 규칙을 처음부터 직접 만들기</small></span>
            <ArrowRight />
          </button>
          <p className="local-note">ChatGPT 계정으로 기기 동기화 · 오프라인 사용 가능 · 언제든 JSON 백업</p>
        </div>
      </section>
    </div>
  )
}
