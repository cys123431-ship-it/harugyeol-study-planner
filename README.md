# 하루결 스터디 플래너

학습일과 휴식일의 흐름을 구분하고, 계획된 진도와 실제 완료 진도를 따로 기록하는 로컬 우선 반응형 플래너입니다. 기본 UI는 한국어이며, IndexedDB 오프라인 저장과 D1 계정 동기화를 함께 지원합니다.

## 주요 기능

- 최초 실행 시 `예시 계획으로 시작` 또는 `빈 플래너로 시작`
- 정보처리기사 실기 24회, 7월 전공 누적, 8월 4과목 실제 목차 미시 학습 예시
- 일요일 휴식일 제외, 학습 가능일 순번 기반 일정 계산
- 단일·반복·횟수·누적·시험·습관·자유 계획 생성 및 수정
- 오늘 체크리스트/타임라인, 주간 7일 플래너, 월간 달력
- 일정 완료/완료 취소, 이월, 건너뛰기, 날짜 이동, 메모
- 반복 일정의 현재 회차·현재 이후·전체 범위 수정과 완료 기록 보호
- D-day 표시 및 마감 다음 날 자동 보관
- 카테고리 생성, 수정, 삭제와 기존 일정 재분류
- 계획 진도, 실제 학습 시간, 휴식일 제외 달성률
- 오늘·주간·월간 회고
- 카운트다운/스톱워치 집중 타이머와 새로고침 복구
- IndexedDB 자동 저장, D1 계정 동기화, JSON 백업/복원
- 반응형 레이아웃과 모바일 하단 내비게이션

## 실행

Node.js 20 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 로컬 실행에서는 IndexedDB만 사용하며, 계정 동기화는 인증 헤더와 D1 바인딩이 제공되는 배포 환경에서 활성화됩니다.

`.openai/hosting.json`에는 공개 가능한 바인딩 이름만 포함되어 있습니다. 실제 Sites 프로젝트 ID와 배포 자격 증명은 저장소에 커밋하지 마세요.

## 검증 명령

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

## 데이터 계산 원칙

날짜 전용 값은 `yyyy-MM-dd` 문자열로 관리하고, 정오 기준 로컬 날짜로 파싱해 UTC 변환에 따른 하루 밀림을 피합니다. `src/lib/dates.ts`의 계산 엔진이 휴식 요일과 제외 날짜를 건너뛰며 N번째 학습 가능일을 찾습니다. 누적형 계획의 단계는 달력 날짜가 아닌 실제 학습 가능일 인덱스에 따라 열립니다. 완료 기록과 수동 일정은 휴식일 변경 후 재계산에서도 보존됩니다.

## 프로젝트 구조

- `src/lib/dates.ts`: 날짜·반복·누적·진도 계산 엔진
- `src/data/database.ts`: IndexedDB 저장 및 백업 검증
- `src/data/cloudSync.ts`, `app/api/sync/route.ts`: D1 계정 동기화
- `src/data/seed.ts`: 예시 계획과 정확한 초기 일정
- `src/store/PlannerContext.tsx`: 전역 상태와 CRUD 동작
- `src/views`: 오늘, 주간, 월간, 계획, 진도, 회고, 설정 화면
- `src/components`: 계획 마법사, 일정 행, 타이머, 온보딩
- `src/lib/*.test.ts`, `src/data/*.test.ts`: 계산·백업 단위 테스트
- `src/components/*.test.tsx`: 컴포넌트 테스트
- `e2e`: Playwright 핵심 흐름 테스트
