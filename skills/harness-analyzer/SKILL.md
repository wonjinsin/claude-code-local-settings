---
name: harness-analyzer
description: Use this skill whenever the user asks to analyze, document, reverse-engineer, or compare how an "agent harness" works — meaning any system that turns a user request into LLM-driven actions. This covers full backend harnesses (Archon, OpenHands, Aider, Cline), in-model skill/plugin systems (superpowers, gtd, gstack), CLI coding agents (Claude Code, Codex CLI), and hybrid frameworks. Triggers on phrases like "분석해줘", "어떻게 도는지", "하네스 분석", "compare these harnesses", "how does X agent work", "document the architecture". Produces a **diagram-first, story-first** Korean markdown document per harness — the core of the output is a series of diagrams (main flow, alternate paths, state transitions, key decisions) each paired with natural-language narration so a human reader can understand the system in one pass. Dimensional details are a supporting reference, not the main event.
---

# Harness Analyzer

이 스킬은 **에이전트 하네스의 동작을 이야기로 들려주는 문서**를 만든다. 독자가 처음 펼쳤을 때 **"아, 이렇게 도는구나"가 바로 머릿속에 그려져야** 한다.

## 이 스킬의 원칙 — 다이어그램과 이야기가 심장이다

분석 문서는 두 파트로 나뉜다:

- **Part 1: The Story (플로우 + 차트 + 서술)** — 문서의 절반 이상, **핵심 산출물**. 다이어그램 여러 장과 각 다이어그램을 풀어주는 내러티브로 구성. 이 파트만 읽어도 시스템이 어떻게 돌아가는지 이해되어야 한다.
- **Part 2: Reference Details (차원별 상세)** — 참조용. 18차원 체크리스트를 간결하게 채워서 비교용 자료로 남긴다. 각 차원은 **짧게** — 이미 Part 1에서 그려진 그림을 구체 수치·파일 경로로 보강하는 역할.

이 순서가 뒤집히면 안 된다. "Part 2를 쓰고 남은 힘으로 Part 1을 채우면" 기능 명세서가 되어버린다. **항상 Part 1부터 쓴다.**

### 왜 이렇게 하는가

기존 접근은 "18차원을 꼼꼼히 채우면 비교 가능한 자료가 된다"였다. 하지만 결과물이 **읽히지 않았다** — 항목이 많고 각 항목이 짧은 bullet이라 독자는 스캔만 하고 그림을 조립하지 못했다.

사람이 시스템을 이해하는 방식은 사실 "전체 모양 → 주요 동선 → 엣지 케이스 → 세부"로 내려오는 구조다. 문서도 그 순서를 따라야 한다. **다이어그램이 전체 모양을 보여주고, 내러티브가 그 위를 걷게 해주고, 그 다음에야 세부가 의미를 가진다.**

---

## Part 1: The Story — 어떻게 쓰는가

Part 1은 **여러 장의 다이어그램 + 각 다이어그램을 풀어주는 서술**로 구성된다. 다이어그램 하나당 최소 2-3 문단 narration. 다이어그램이 없는 서술은 허용하되, 서술 없는 다이어그램은 금지(있다면 다 아는 척 하는 허세다).

### 필수 다이어그램

모든 분석은 **최소 이 세 장**을 포함한다:

1. **Main Flow** — 유저가 요청을 보냈을 때 응답이 나올 때까지의 **주된 경로**. 진입점, 라우팅 분기, 컨텍스트 조립, LLM 호출, 응답 반환까지. ASCII 박스+화살표 기본.
2. **Alternate Paths** — 주 경로에서 갈라지는 분기들을 따로 그린다. 슬래시 커맨드, 워크플로우 디스패치, 승인 재개, 에러 경로 등 **대안 흐름이 두 개 이상이면** 별도 다이어그램으로 분리한다. 메인 한 장에 모두 욱여넣지 말 것 — 오히려 이해가 안 된다.
3. **핵심 결정/상태 다이어그램 하나 이상** — 이 하네스의 **특징적인 결정·상태 전이**를 한 장. 예를 들면:
   - **Session state transitions** (상태 다이어그램): 세션이 언제 생기고 언제 죽는지
   - **Isolation resolver decision tree** (결정 트리): 새 worktree를 만들지, 재사용할지 어떻게 고르는지
   - **Workflow DAG execution** (시퀀스): 노드가 어떤 순서로 돌아가는지
   - **Routing decision** (결정 트리): 결정론 vs AI 라우터 선택 로직
   - **Context assembly sequence** (시퀀스): 컨텍스트가 어떤 순서로 쌓이는지

한 하네스에 **3-5 장의 다이어그램**이 적당하다. 하나만 있으면 부족, 열 장 넘으면 스캔만 당한다.

### 다이어그램 선택 가이드

하네스마다 **어떤 측면이 특별한가**를 먼저 생각하고 그걸 보여줄 다이어그램을 고른다. 모든 하네스에 똑같은 5장을 그리려 하지 말 것.

- **세션 전환이 복잡한 하네스** → 상태 다이어그램
- **격리·resolver가 특이한 하네스** → 결정 트리
- **워크플로우 엔진이 있는 하네스** → DAG 실행 시퀀스
- **플랫폼 어댑터가 많은 하네스** → 컴포넌트 아키텍처
- **AI 라우팅이 스트림 중간에 번복되는 하네스** → 시퀀스 다이어그램(시간축 있어야 '번복'이 보임)
- **스킬/플러그인 네트워크가 본체인 하네스** (superpowers 류) → 네트워크·의존 그래프

### 다이어그램 형식

- **ASCII 아트를 기본으로** — 마크다운 어디서나 렌더링되고 터미널에서도 보인다. 80자 폭 이내.
- 복잡하면 **Mermaid** (`graph TD`, `sequenceDiagram`, `stateDiagram-v2`, `flowchart`)도 허용. **단, GitHub 외에서도 읽히도록 ASCII 버전을 함께** 쓸지 결정. 상태/시퀀스는 Mermaid가 우월하므로 ASCII 병기 없이 Mermaid만 써도 OK, 대신 아래 narration이 꼼꼼해야 한다.
- 화살표 레이블은 상태 변화나 조건을 적는다 ("slash cmd 감지", "AI routed", "tool call detected").

**박스 작성 규칙 — 한국어 설명 + 코드 참조를 둘 다 넣는다:**

각 박스의 첫 줄은 **무슨 일이 일어나는지 한국어**로, 두 번째 줄 이하는 **어디서 일어나는지 코드/함수명**으로. 둘 중 하나만 있으면 안 된다. 코드만 있으면 "뭘 하는 코드인지" 모르고, 한국어만 있으면 "어디서 찾는지" 모른다.

```
┌────────────────────────────────────────────────────┐
│  무슨 일인지 한국어 한 줄 (가장 중요)                 │
│  (필요하면 부연 설명 한 줄 더)                        │
│  FunctionName()  ·  file:line                      │
└────────────────────────────────────────────────────┘
```

**나쁜 예** (코드만):
```
│  ConversationLockManager.acquireLock(conversationId) │
│  packages/core/src/utils/conversation-lock.ts:59    │
```

**좋은 예** (한국어 + 코드):
```
│  순서 보장 — 같은 대화는 한 번에 하나씩만 처리한다     │
│  (동시에 두 메시지가 오면 세션 상태가 꼬이기 때문)      │
│  ConversationLockManager.acquireLock()               │
│  conversation-lock.ts:59                             │
```

**분기 박스도 동일하게** — "YES/NO"나 "슬래시 커맨드?" 같은 레이블 대신, "슬래시 커맨드이면 AI 건너뜀 · :649"처럼 **조건의 의미까지** 적는다.

**Mermaid sequenceDiagram의 경우** — participant 이름에 `<br/>` 줄바꿈으로 한국어 역할 + 코드 경로를 같이 넣는다:
```
participant D as DAG 실행기<br/>(dag-executor.ts)
```
화살표 레이블도 `코드호출()` 대신 `무슨 일인지 설명<br/>코드호출()` 형태로.

### Narration 쓰기 — 이게 제일 중요하다

각 다이어그램 **바로 아래에 2-4 문단** narration. 구조:

1. **이 그림이 보여주는 이야기** (한 문단): "이 다이어그램은 유저 메시지 하나가 들어와서 응답이 나갈 때까지 거치는 주 경로다. 핵심 분기 세 군데가 있고…"
2. **주요 순간들을 밟아가며 서술** (1-2 문단): 순서대로 박스/상태를 짚으면서 "여기선 무슨 일이 일어나고, 왜 그렇게 되어 있고, 다음엔 어디로 가는가"를 이어간다. 파일 인용은 괄호로 흘려 넣기 — `handleMessage`가 먼저 슬래시 커맨드인지 본다(`orchestrator-agent.ts:649`) 식.
3. **덧붙일 맥락/트레이드오프** (선택): 왜 이렇게 설계했는지, 무엇을 포기했는지 한 문장.

**나쁜 예** (다이어그램 아래에 숫자 목록만):
> 1. Entry `:364`
> 2. Lock `:59`
> 3. Handler `:498`

이건 다이어그램 캡션 반복일 뿐 이야기가 아니다.

**좋은 예**:
> 유저 메시지는 먼저 플랫폼 어댑터의 `onMessage` 콜백을 친다 — Slack이면 SDK polling이, GitHub이면 webhook이 이 지점을 촉발한다. 여기서 재미있는 건 **여섯 플랫폼이 모두 같은 콜백으로 수렴**한다는 점이다. 어댑터별 인증 체크가 이 단계에서 끝나고, 미인가 유저는 조용히 잘려나간다.
>
> 콜백이 하는 첫 일은 `ConversationLockManager.acquireLock()`이다(`conversation-lock.ts:59`). 같은 대화에 메시지가 겹쳐 들어오면 세션 상태가 꼬이기 때문에 대화별 FIFO로 직렬화한다. 락을 얻은 순간 플랫폼 webhook에 200을 돌려주는 fire-and-forget 패턴이라, Slack의 3초 timeout 제약 안에서도 여유롭다. 초과 시엔 거절이 아니라 대기 — 싱글 유저 도구라는 전제 하에 합리적인 선택이다.
>
> 이후 `handleMessage`(`orchestrator-agent.ts:498`)가 오케스트레이션의 본체인데, 내부에서 세 갈래 분기가 일어난다 — 다음 다이어그램에서 자세히 본다.

---

## Part 2: Reference Details — 간결하게

18차원 체크리스트는 **참조용**이다. 각 차원 1-3 문장이면 충분하다 — Part 1에서 이미 그림으로 보여준 것을 **구체 수치/파일 경로로 보강**하는 수준. 길게 쓰지 않는다.

각 차원은 이 형식:
> **N. 차원 이름** — 짧은 서술 한두 문장. 주장마다 `file:line`.
> (해당 없으면 "해당 없음 — (왜 없는지)" 한 문장으로 종료)

표·bullet 목록은 진짜 **나열 가치가 있을 때만** (세션 전환 트리거 6개, DB 테이블 8개, 설계 결정 트레이드오프 표 등). 제목만 남은 bullet 나열은 금지.

자세한 차원별 질문 목록과 어디서 찾는지는 `references/dimensions.md`에 있다. 그걸 **체크리스트로 쓰되 그대로 복사하지 말 것** — Part 1에서 이미 말한 걸 반복할 필요는 없다. Part 1에서 안 나온 것만 Part 2에서 채운다.

---

## What counts as a "harness"

유저 요청을 LLM 호출로 바꾸는 **모든 중간 계층**:

- **외부 래퍼** (external wrapper): Archon, OpenHands, Aider, Cline, Goose
- **CLI 에이전트**: Claude Code, Codex CLI
- **인-하네스 시스템**: superpowers, gtd, gstack — Claude Code 내부에서 스킬/플러그인으로 동작
- **하이브리드**: 위 조합

하네스마다 레이어가 다르므로 **모든 차원을 다 채울 필요는 없다**. 해당 없으면 "없음 — 왜 없는지" 한 문장이면 충분하다. 특히 in-harness skill 시스템은 워커/격리/워크플로우 같은 차원이 대부분 빠지고, 대신 스킬 간 참조 네트워크가 본체이므로 **Part 1 다이어그램이 '스킬 의존 그래프'가 된다**.

---

## Core Workflow

1. **대상 파악** — 분석 대상이 git 저장소인지, 설치된 플러그인 디렉토리인지, URL인지 확인. 모르겠으면 물어본다.
2. **프레임 숙지** — `references/analysis-template.md`(Part 1/2 구조), `references/dimensions.md`(차원별 질문), `references/examples/archon.md`(기준점)를 훑는다.
3. **탐색** — 큰 코드베이스는 `Agent`의 `Explore` subagent로 "진입점 찾기", "라우터 위치", "LLM 호출 지점" 같은 **구체적 질문**을 병렬 dispatch. 주의: **차원별로 나누지 말고 플로우 추적에 필요한 질문으로 나눈다**.
4. **Main flow부터 그린다** — 진입점에서 LLM 호출을 거쳐 응답까지의 콜 체인을 추적하면서 ASCII 다이어그램을 그리고, 그 아래에 narration을 쓴다. 이 과정에서 라우터/컨텍스트 조립/루프 위치가 저절로 잡힌다.
5. **특징적 측면 2-3개 골라 추가 다이어그램** — 세션 전환, resolver, DAG 실행 같은 것 중 **이 하네스의 특별한 지점**을 고른다. 각각 narration 포함.
6. **Alternate paths 묶어서 한 장 또는 여러 장** — 슬래시 커맨드, 승인 재개 같은 분기들. 개수가 많으면 따로따로.
7. **Part 2 채우기** — 18차원 짧게. 이미 Part 1에서 말한 건 반복하지 말고, 구체 수치·파일·테이블 같은 보조 정보 위주로.
8. **통독** — 처음부터 끝까지 한 번 읽어본다. 다이어그램만 보고 narration 없이는 이해 안 되는 지점이 있으면 narration을 강화하고, 반대로 narration이 다이어그램 없이도 충분하면 그 다이어그램은 빼거나 합친다.
9. **출력** — 단일 마크다운 파일. 기본 경로: `./harness-analysis/<harness-name>.md`.

## Output quality checklist

초고를 쓴 후 스스로 점검:

- [ ] **Part 1이 문서의 절반 이상**인가? (분량·에너지 모두)
- [ ] **다이어그램이 3장 이상**인가?
- [ ] 각 다이어그램 아래에 **2-4 문단 narration**이 있는가?
- [ ] Narration이 **숫자 목록 캡션 반복이 아니라 이야기**인가?
- [ ] `file:line` 인용이 **괄호로 흘려 들어간 서술** 안에 있는가? (별도 "위치:" 필드로 떼지 않았나)
- [ ] **Part 2가 간결**한가? 각 차원 1-3 문장?
- [ ] Part 1과 Part 2가 **같은 내용을 반복**하지 않는가?
- [ ] 처음 읽는 사람이 **Part 1만으로** 시스템을 이해할 수 있는가?

## Depth — "최대한 자세하게"의 재정의

"자세하게"는 **항목을 많이 쓰는 것**이 아니라 **동선을 정확히 보여주는 것**이다:

- 라우터가 "있다"가 아니라, **어떤 입력이 어떤 분기를 거치는지 다이어그램에 다 나오는가**
- 격리가 "worktree다"가 아니라, **어떤 조건에서 재사용하고 어떤 조건에서 새로 만드는지 결정 트리에 보이는가**
- 에러 처리가 "Fail Fast다"가 아니라, **어떤 에러가 어떻게 분류되어 어느 경로로 유저에게 보이는지 순서가 서술되어 있는가**

다이어그램·narration이 이 일을 해내면, 세부 수치는 Part 2에서 짧게만 적어도 충분하다.

## When analysis spans multiple harnesses

비교 요청 시:
1. 각 하네스마다 **별도 파일**로 완성 (각자 Part 1 + Part 2)
2. 마지막에 **`comparison.md`** — **각 하네스의 Main flow 다이어그램을 한 페이지에 나란히 배치**(제일 중요한 비교 자료) + 18차원을 행, 하네스를 열로 한 테이블 + 차이 큰 축에 서술 단락

비교 테이블만 있고 다이어그램 병치가 없는 comparison.md는 의미가 적다 — 비교의 본질은 "흐름이 어떻게 다른가"다.

## Tool strategy

- **Subagent 사용 원칙**: `Agent`의 `Explore` subagent를 쓸 때 **플로우 추적에 필요한 질문**으로 나눈다. "차원 1-6 분석"이 아니라 "유저 메시지가 LLM 호출까지 가는 콜 체인 추적", "세션 전환이 일어나는 모든 지점 찾기" 같은 식. 결과를 받아서는 **본인이 직접 서술로 재조립**한다 — subagent가 넘긴 bullet을 그대로 붙여넣지 말 것.
- **빠른 확인**: 단일 파일 조회는 `Read`/`Grep` 직접.
- **문서 기반 하네스** (superpowers 류): 모든 `.md` 파일을 읽고 스킬 간 참조 네트워크를 파악. Main flow 다이어그램은 "유저 메시지 → 어떤 스킬이 트리거 → 그 스킬이 어떤 다른 스킬을 부르나 → 어떻게 동작이 바뀌나" 형태로.
- **context7**: 의존하는 SDK/라이브러리의 현재 버전 문서가 필요할 때.

## Not in scope

- 성능 벤치마킹 (다른 스킬)
- 보안 감사 (부분적으로만)
- 코드 품질 리뷰 (다른 스킬)
- 기능 제안/개선 (분석 스킬은 "있는 그대로" 기록)

## References

- `references/analysis-template.md` — 빈 템플릿 (Part 1/2 구조)
- `references/dimensions.md` — 차원별 질문·탐색 가이드 (Part 2에서 체크리스트로 사용)
- `references/examples/archon.md` — Archon 완성 분석 (다이어그램·narration 기준점)
