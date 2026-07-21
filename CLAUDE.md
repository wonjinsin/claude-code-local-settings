# Language & Communication Rules

- Default response language: Korean
- Code comments: Write in English
- Commit messages: Write in English
- Documentation: Write in Korean (IMPORTANT)
- Variable/function names: English (follow code standards)
- Always follow guidelines: @rules/guidelines.md

# Agent Instruction Files (AGENTS.md / CLAUDE.md)

한 repo가 여러 agent(Claude·Codex 등)를 함께 쓸 때, 지침을 **한 곳에만** 둔다:

- **`AGENTS.md`가 단일 소스** — 공용 지침·스키마는 전부 여기에 쓰고, 수정도 항상 여기서 한다.
- **`CLAUDE.md`는 `@AGENTS.md` import만** — 직접 내용을 두지 않는다 (agent별로 정말 필요한
  규칙만 그 파일에 짧게 덧붙인다).
- 새 프로젝트에서 `CLAUDE.md`를 만들 때 이미 `AGENTS.md`가 있으면 중복 작성하지 말고
  `@AGENTS.md`로 참조한다. 반대로 지침이 `CLAUDE.md`에만 있으면 `AGENTS.md`로 옮기고
  `CLAUDE.md`는 import만 남긴다.
