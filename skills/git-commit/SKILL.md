---
name: git-commit
description: Use this skill when creating git commit messages from staged changes and committing them. Triggers when the user asks to write a commit message, commit staged code, or just says "commit". Analyzes only staged changes (`git diff --cached`), generates an accurate conventional commits message, and runs `git commit` automatically — even when CI/workflow files appear first in the diff.
---

# Git Commit

Analyze staged changes, generate a commit message in conventional commits format, and run `git commit`.

## Format

`<type>[optional scope]: <description>` (English, max 80 characters)

## Commit Types

| Type       | Use when                                   |
| ---------- | ------------------------------------------ |
| `feat`     | New user-facing functionality              |
| `fix`      | Bug corrections                            |
| `refactor` | Code restructuring without behavior change |
| `perf`     | Performance improvements                   |
| `docs`     | Documentation only                         |
| `style`    | Formatting/whitespace only                 |
| `test`     | Adding/updating tests                      |
| `build`    | Build system, dependencies                 |
| `ci`       | CI/CD, workflow automation                 |
| `chore`    | Maintenance, cleanup                       |
| `revert`   | Reverting previous changes                 |

## Analysis Process

**Critical:** Staged diffs often show `.github/`, `.circleci/`, and other workflow files first — these are rarely the primary change. Always scan all staged files before deciding on a type.

1. Run `git diff --cached` and read all staged files from start to finish
2. Categorize each change:
   - **Business logic**: features, APIs, auth, data processing, bug fixes → `feat`/`fix`/`refactor`
   - **Infrastructure**: CI/CD, build config, deployment → `ci`/`build`/`chore`
3. When both exist, lead with business impact (feature + CI setup → `feat:`, not `ci:`)

## Writing Guidelines

- Imperative mood: "add", "implement", "fix", "update", "extract"
- Lowercase first letter, no trailing period
- Be specific about technologies used

## Examples

```
feat: implement JWT authentication with role-based access control
fix: resolve race condition in payment processing
refactor: extract shared validation utilities
feat: add user dashboard with analytics and CI pipeline setup
fix: correct data export bug and update deployment workflow
```

## Workflow

1. Run `git diff --cached` to analyze staged changes
2. Generate the commit message following the rules above
3. Run `git commit -m "<generated message>"` immediately — do not ask for confirmation
4. Report the result to the user
