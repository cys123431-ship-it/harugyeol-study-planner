import type { Plan, PlanStage, ScheduleItem } from '../types'

interface CurriculumDay {
  date: string
  c: string
  architecture: string
  dataStructures: string
  network: string
}

export const augustCurriculum: CurriculumDay[] = [
  { date: '2026-08-01', c: '1~2장 압축 복습: 프로그래밍·작성 과정', architecture: '혼공 1-1 / 박 L1 컴퓨터 발전 / Patterson 1장 도입', dataStructures: '코드 없는 1장 개요 / Do it 1-1 세 값의 최댓값', network: 'L58 전송 형식 1회독' },
  { date: '2026-08-03', c: '3장: 프로그램 구성, printf, scanf / 사칙연산 코드', architecture: '혼공 1-2 / 박 L2 부울대수', dataStructures: '자료형·함수 개념 / 조건 판단 코드', network: 'L58 책 덮고 회상·OX' },
  { date: '2026-08-04', c: '4장: 변수·상수·자료형 / 자료형 표 작성', architecture: '혼공 2-1 이진법 / 박 L3 논리식 간소화', dataStructures: '재귀와 반복 개념 / 순서도 기호', network: 'L59 전송 방식 1회독' },
  { date: '2026-08-05', c: '5장: 산술·관계·논리 연산 / 결과 예측 5개', architecture: '혼공 2-1 십육진법 / 박 L4 논리회로', dataStructures: '빅오 표기법 입문 / 1부터 n까지 합', network: 'L59 회상·비교표' },
  { date: '2026-08-06', c: '6장 if, if-else, 다중 if / 계산기 코드', architecture: '박 L5 조합논리회로 / 핵심부품 그림 복습', dataStructures: '선형 자료구조·메모리 / 양수 입력 반복', network: 'L60 OSI 7계층 1회독' },
  { date: '2026-08-07', c: '6장 switch / 조건문 문제 2개', architecture: '혼공 2-2 문자 / 박 L6 순서논리회로', dataStructures: '배열 개념 / 다중 반복문', network: 'L60 7계층 빈 종이에 작성' },
  { date: '2026-08-08', c: '7장 while, do-while / 최대공약수 코드', architecture: '박 L1~6 복습 / Patterson 1장 성능 부분', dataStructures: '1장 총복습 / 반복문 연습 2개', network: 'L61 교환 방식 1회독' },
  { date: '2026-08-10', c: '7장 for, 중첩 반복, break / 별 출력', architecture: '혼공 2-1 복습 / 박 L7 자료 구성·진법', dataStructures: '리스트 개념 / Do it 배열 기본', network: 'L61 회선·패킷 교환 비교' },
  { date: '2026-08-11', c: '8.1~8.2 함수 개념·정의 / 함수 2개 작성', architecture: '혼공 보수 표현 / 박 L8 고정소수점', dataStructures: '스택 개념 / 배열 최댓값', network: 'L62 LAN 1회독' },
  { date: '2026-08-12', c: '8.3 매개변수·반환값 / add, max 함수', architecture: '박 L9 부동소수점 / Patterson 3장 관련 절', dataStructures: '큐·우선순위 큐 / 배열 역순', network: 'L62 LAN 종류·방식 회상' },
  { date: '2026-08-13', c: '8.4 함수 원형, 8.5 난수 / 동전 던지기', architecture: '혼공 2-2 / 박 L10 문자 표현', dataStructures: '트리 용어 / 기수 변환', network: 'L63 멀티미디어 한 번에 정리' },
  { date: '2026-08-14', c: '8.6 수학함수, 8.7 함수 사용 이유', architecture: '혼공 4-1 ALU / 박 L11 연산 / Patterson 3장', dataStructures: '이진트리·BST / 소수 나열', network: 'L64 TCP/IP 1회독' },
  { date: '2026-08-15', c: '8장 종합: 작은 계산기 프로그램', architecture: '혼공 1-2 복습 / 박 L12 시스템 구성요소', dataStructures: 'AVL·RB·B트리 그림 / 다차원 배열', network: 'L64 TCP/IP 계층 회상' },
  { date: '2026-08-17', c: '9.1~9.4 지역·전역변수, 생존시간', architecture: '혼공 4-1 / 박 L13 제어·연산장치', dataStructures: '힙 개념 / 배열 연습 2개', network: 'L65 IPv4 1회독' },
  { date: '2026-08-18', c: '9.5~9.7 연결·저장 유형·가변 인수는 개념 위주', architecture: '혼공 3-1 / 박 L14 명령어 / Patterson 2장 도입', dataStructures: '해시·해시함수 / 배열 누적 복습', network: 'L65 주소·서브넷 기본 회상' },
  { date: '2026-08-19', c: '9.8 재귀: 팩토리얼 코드와 호출 그림', architecture: '혼공 3-2 / 박 L15 주소지정 방식', dataStructures: '해시테이블·충돌 / Do it 검색 개요', network: 'L66 IPv6 1회독' },
  { date: '2026-08-20', c: '재귀: 최대공약수 코드·호출 추적', architecture: '혼공 4-3 / 박 L16 명령 실행·제어 / Patterson 4장', dataStructures: '그래프 기본 용어 / 선형검색', network: 'L66 IPv4·IPv6 비교' },
  { date: '2026-08-21', c: '9장 총복습: 범위·수명·재귀 표 작성', architecture: '혼공 4-2 / 박 L17 마이크로 오퍼레이션', dataStructures: '무향·유향·가중 그래프 / 보초법', network: 'L67 인터넷 접속 서비스 1회독' },
  { date: '2026-08-22', c: '10.1~10.2 배열·초기화 / 최솟값 코드', architecture: '혼공 5-1·5-2 / 박 L7~17 누적 복습', dataStructures: '그래프와 트리 비교 / 이진검색 입문', network: 'L67 접속 방식 회상' },
  { date: '2026-08-24', c: '10.3 배열과 함수 / 배열 전달 코드', architecture: '혼공 6-1 RAM / 박 L18 기억장치', dataStructures: '선형·이진검색 비교 / 이진검색 코드', network: 'L68 IT 신기술 용어 정리' },
  { date: '2026-08-25', c: '10.4 정렬 / 버블정렬 손으로 추적', architecture: '혼공 6-3 캐시 / 박 L19 특수기억장치 / Patterson 5장', dataStructures: '시간복잡도 비교 / 이진검색 복잡도', network: 'L69 웹 서비스·스크립트 1회독' },
  { date: '2026-08-26', c: '10.5 탐색 / 선형·이진탐색 비교', architecture: '혼공 7-1·7-2 / 박 L20 보조기억장치', dataStructures: 'bsearch 기본 배열 예제 / 검색 복습', network: 'L69 웹 관련 용어 회상' },
  { date: '2026-08-27', c: '10.6 2차원 배열 / 행렬 합 코드', architecture: '혼공 8-2 DMA / 박 L21 DMA·채널', dataStructures: 'Do it 검색 연습문제 2개', network: 'L70 인터넷 보안 1회독' },
  { date: '2026-08-28', c: '10장 종합 / 배열 미니 프로그램', architecture: '혼공 인터럽트 / 박 L22 인터럽트', dataStructures: '스택 개념·배열 구조 코드 읽기', network: 'L70 공격·보안 개념 회상' },
  { date: '2026-08-29', c: '11.1~11.2 포인터·간접참조 / 주소 출력', architecture: '혼공 8-1 / 박 L23 입출력 인터페이스', dataStructures: '큐 개념·배열 큐 코드 읽기', network: 'L71 보안 기술 1회독' },
  { date: '2026-08-31', c: '11.3~11.5 포인터 주의점·연산·함수 / swap 작성', architecture: '혼공 5-2·5-3 / 박 L24 병렬구조 / Patterson 6장 도입', dataStructures: '스택·큐 중 하나를 책 없이 재작성 / 링버퍼 개념', network: 'L71 회상 후 L58~71 전체 목차 복원' },
]

const subjectConfig = {
  c: { title: 'C언어', minutes: 40, outcome: '직접 입력한 .c 파일 1개' },
  architecture: { title: '컴퓨터구조', minutes: 40, outcome: '핵심 그림 또는 표 1개' },
  dataStructures: { title: '자료구조', minutes: 40, outcome: '동작 순서 그림 또는 코드 추적 1개' },
  network: { title: '네트워크', minutes: 25, outcome: '핵심 키워드 5개 또는 OX 3개' },
} as const

export function createAugustCurriculumItems(plan: Plan, stages: PlanStage[]): ScheduleItem[] {
  const now = '2026-07-15T09:00:00+09:00'
  const stageByTitle = new Map(stages.map((stage) => [stage.title, stage]))

  return augustCurriculum.flatMap((day, dayIndex) =>
    (Object.keys(subjectConfig) as Array<keyof typeof subjectConfig>).map((key) => {
      const config = subjectConfig[key]
      const detail = day[key]
      const summary = detail.split(' / ')[0]
      return {
        id: `item-august-${day.date}-${key}`,
        planId: plan.id,
        stageId: stageByTitle.get(config.title)?.id,
        title: `${config.title} · ${summary}`,
        date: day.date,
        allDay: true,
        plannedSequence: dayIndex + 1,
        status: 'scheduled',
        isAutoGenerated: true,
        isRestDayOverride: false,
        estimatedMinutes: config.minutes,
        notes: `${detail}\n\n오늘 남길 결과: ${config.outcome}`,
        priority: 'normal',
        categoryId: plan.categoryId,
        createdAt: now,
        updatedAt: now,
      } satisfies ScheduleItem
    }),
  )
}
