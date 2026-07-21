# Language & Communication Rules

- Default response language: Korean
- Code comments: Write in English
- Commit messages: Write in English
- Documentation: Write in Korean (IMPORTANT)
- Variable/function names: English (follow code standards)
- Always follow guidelines: @rules/guidelines.md

# Agent Instruction Files (AGENTS.md / CLAUDE.md)

When a repo is shared by multiple agents (Claude, Codex, etc.), keep the instructions in **one place only**:

- **`AGENTS.md` is the single source** — write all shared instructions and schemas here, and always make edits here.
- **`CLAUDE.md` only imports `@AGENTS.md`** — do not put content directly in it (append only the
  few rules that a specific agent genuinely needs, kept short).
- When creating a `CLAUDE.md` in a new project where `AGENTS.md` already exists, don't duplicate content —
  reference it with `@AGENTS.md`. Conversely, if instructions live only in `CLAUDE.md`, move them to `AGENTS.md`
  and leave `CLAUDE.md` with just the import.
