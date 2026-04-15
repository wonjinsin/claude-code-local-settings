# Dimensions Reference — Part 2 작성 가이드

Part 2는 **보조 참조**다. Part 1(다이어그램+서술)에서 이미 설명된 것은 반복하지 말고, 수치·경로·테이블 같은 보조 정보 위주로 1-3 문장 이내로 채운다.

각 차원마다: **어디서 찾나** + **무엇을 기록하나**

---

## 2-1. Entry Points

**어디서 찾나**: 어댑터 디렉토리(`adapters/`, `platforms/`), HTTP 라우트 파일, `main.py`/`index.ts`, CLI 진입점

**기록할 것**: 진입점 종류(채팅/HTTP/CLI 등), 공통 디스패처 위치, 각 진입점의 conversation ID 식별 방식, 인증 방식

---

## 2-2. Concurrency

**어디서 찾나**: `*lock*.ts`, `*queue*.ts`, `Semaphore`/`Mutex`, `Promise.all`, 워크플로우 executor

**기록할 것**: 동시 처리 한도(숫자), 단위(전역/대화별/워크플로우별), 한도 초과 시 동작(큐 대기/즉시 거절)

---

## 2-3. Routing

**어디서 찾나**: `command-handler`, `router.ts`, `parseCommand`, `/invoke-` 패턴 grep, AI 라우팅 프롬프트

**기록할 것**: 결정론 vs AI 라우팅 계층 구분, 화이트리스트 전체 목록, AI 라우팅 프롬프트 위치, 스트림 중 번복 가능 여부

---

## 2-4. Context Assembly

**어디서 찾나**: LLM 호출(`sendQuery`, `createMessage`, `complete`) 직전 100줄, `buildPrompt`/`buildContext` 함수

**기록할 것**: 조립 항목 전체 목록, 조립 지점이 단일인지 분산인지, 변수 치환 규칙(`$ARGUMENTS` 등)

---

## 2-5. Provider Abstraction

**어디서 찾나**: `types.ts`(인터페이스 정의), `providers/` 디렉토리, `IAgentProvider`/`AgentProvider` 패턴

**기록할 것**: 인터페이스 위치와 주요 메서드, SDK 의존성 격리 전략, 새 공급자 추가 시 필요한 파일

---

## 2-6. Worker / Execution

**어디서 찾나**: `executor.ts`, `dag-executor.ts`, `worker.ts`, 노드 실행 함수

**기록할 것**: 실행 단위(노드/스텝/태스크), 옵션 전달 경로(상위→실행 단위), abort/timeout 신호 전파 방식

---

## 2-7. Message Loop

**어디서 찾나**: `for await` 루프, `stream`, 이벤트 타입 enum, `ContentBlock` 타입

**기록할 것**: 스트림 vs 배치 방식, 청크 타입 종류, 라우팅 토큰(`/invoke-`) 감지 위치

---

## 2-8. Session / State

**어디서 찾나**: `sessions` 테이블/컬렉션, `TransitionTrigger` enum, `session-state-machine`

**기록할 것**: 세션 가변/불변 모델, 전환 트리거 목록, 만료/정리 정책

---

## 2-9. Isolation

**어디서 찾나**: `isolation/`, `worktree.ts`, `IsolationResolver`, `factory.ts`

**기록할 것**: 격리 기술(worktree/Docker/proc), resolver 우선순위(요청→existing→create), 권한 경계(어느 경로까지 접근 가능)

---

## 2-10. Tool / Capability

**어디서 찾나**: `tools/` 디렉토리, MCP 설정 파일, `hooks/`, `skills/`, `allowed_tools`/`denied_tools`

**기록할 것**: 내장 도구 종류, 외부 확장점(MCP/hooks/skills), per-노드 오버라이드 가능 여부

---

## 2-11. Workflow Engine

**어디서 찾나**: `workflows/`, `executor.ts`, `loader.ts`, YAML 스키마 정의

**기록할 것**: 존재 여부. 있으면 — 노드 타입 목록, 실행 모델(DAG/순차), 조건 분기 구문, 결과 참조(`$nodeId.output`) 방식

---

## 2-12. Configuration

**어디서 찾나**: `config.yaml`, `.env.example`, `loadConfig`/`parseConfig`, 환경변수 목록

**기록할 것**: 설정 계층 우선순위(환경변수 > 파일 > 기본값 순), 병합 전략(덮어쓰기/딥머지), 런타임 재로드 가능 여부

---

## 2-13. Error Handling

**어디서 찾나**: `classify*Error`, `try/catch` 집중 구간, 에러 타입 정의, 재시도 로직

**기록할 것**: Fail Fast 여부, 분류 함수 위치와 반환 타입, 재시도 정책(횟수/지연/조건)

---

## 2-14. Observability

**어디서 찾나**: `logger.ts`, `createLogger`, 이벤트 enum, `workflow_events` 테이블, 외부 연동(OpenTelemetry 등)

**기록할 것**: 로거 구현체, 이벤트 네이밍 규칙(`domain.action_state`), 로그 저장 위치, 외부 통합 여부

---

## 2-15. Platform Adapters

**어디서 찾나**: `IPlatformAdapter` 인터페이스, 각 어댑터 구현체(`slack/`, `telegram/`, `github/`)

**기록할 것**: 인터페이스 주요 메서드, 지원 플랫폼 목록, 스트리밍 모드(SSE/WebSocket/polling/webhook)

---

## 2-16. Persistence

**어디서 찾나**: `migrations/`, `schema.ts`, ORM 설정, DB 초기화 코드

**기록할 것**: DB 종류(SQLite/PostgreSQL 등), 주요 테이블과 역할, 민감 정보 취급 방식(암호화/마스킹)

---

## 2-17. Security Model

**어디서 찾나**: `auth.ts`, `verify*Signature`, whitelist 환경변수, secrets 처리 코드

**기록할 것**: 신뢰 모델(누구를 믿는가), 인증 지점(어댑터별/중앙), 시크릿 저장 방식(환경변수/vault)

---

## 2-18. Key Design Decisions & Tradeoffs

**형식**: 표를 쓴다. 표 위에 한 문단 서문으로 이 하네스의 결정적인 선택이 무엇인지 방향 제시.

| 결정 | 선택 | 대안 | 근거 (추론) | 트레이드오프 |
|------|------|------|-------------|-------------|
|      |      |      |             |             |

**어디서 찾나**: README의 "Why" 섹션, CLAUDE.md 원칙, 코드에서 non-obvious한 구조적 선택들

---

## 2-19. Open Questions

확인하지 못한 것들. 각 질문 뒤에 "확인하려면 어디를 보면 되는지" 힌트 한 줄.

예: "루프 노드의 최대 반복 횟수 — `executor.ts`의 loop 처리 구간 또는 스키마 정의에서 확인"
