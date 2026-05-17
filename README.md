# Claude Code Local Settings

A personal collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) configuration files kept under `~/.claude`. Use it to quickly restore your environment on a new machine, or as a reference for reproducing the same workflow.

> [!IMPORTANT]
> **Working with `CLAUDE.md`? Use [`wonjinsin/harness-flow`](https://github.com/wonjinsin/harness-flow).**
>
> Almost every `CLAUDE.md` in my projects is driven by [harness-flow](https://github.com/wonjinsin/harness-flow) — a Claude Code plugin that enforces a structured spec → plan → TDD → review workflow with gated checkpoints. If you are adopting any of the conventions in this repository, install harness-flow first; the rules and skills here assume that workflow is in place.
>
> ```bash
> /plugin install harness-flow@wonjinsin
> ```

> [!NOTE]
> This repository is a personal backup. Rather than cloning the files as-is, pick the parts that fit your own environment.

## Components

| Category | File / Directory | Description |
| --- | --- | --- |
| Core settings | `settings.json` | Global Claude Code settings: permissions, env vars, hooks, plugins |
| Behavior rules | `CLAUDE.md`, `rules/` | Response language, code style, and LLM behavior guidelines |
| MCP servers | `.mcp.json` | Registration for `context7` and `sequential-thinking` MCP servers |
| Hooks | `hooks/notify-slack.sh` | Sends a Slack Block Kit notification on session stop |
| Skills | `skills/` | User-defined skills that encapsulate common workflows |
| Status line | `ccstatusline.json`, `ccstatusline-settings.json` | `ccstatusline` renderer configuration |
| Key bindings | `keybindings.json` | Custom keyboard shortcuts |

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) CLI
- [`jq`](https://jqlang.github.io/jq/) — used by the Slack hook to parse JSON
- Node.js (npx) — required to run MCP servers and `ccstatusline`
- (Optional) Slack Incoming Webhook URL — only if you want stop notifications

## Installation

```bash
git clone https://github.com/wonjinsin/claude-code-local-settings.git ~/.claude-settings
cd ~/.claude-settings
```

Copy only the files you need into `~/.claude/`. Back up your existing configuration before overwriting.

```bash
cp settings.json     ~/.claude/settings.json
cp CLAUDE.md         ~/.claude/CLAUDE.md
cp keybindings.json  ~/.claude/keybindings.json
cp -R rules          ~/.claude/rules
cp -R skills         ~/.claude/skills
cp -R hooks          ~/.claude/hooks
```

> [!WARNING]
> The `permissions.allow` / `deny` / `ask` lists in `settings.json` directly affect what Claude Code can do in your environment. Do not use them verbatim — adjust them to match your own security policy.

## Configuration Details

### `settings.json`

- `permissions`: allow / deny / ask rules for the `Bash`, `Read`, `Edit`, and `Write` tools
- `hooks.Stop`: runs `~/.claude/hooks/notify-slack.sh` when a session ends
- `statusLine`: renders the status line via `npx -y ccstatusline@2.2.12`
- `enabledPlugins`: official plugins in use (each must be installed separately with `/plugin install`)

```bash
/plugin install {plugin-name}@{marketplace}
```

### `CLAUDE.md` and `rules/`

- `CLAUDE.md`: shared communication rules — response language (Korean), comments and commit messages in English, etc.
- `rules/guidelines.md`: LLM coding guidelines — "Think Before Coding", "Simplicity First", "Surgical Changes", "Goal-Driven Execution"
- `rules/context7.md`: workflow for using the `context7` MCP when working with library documentation

### `.mcp.json`

Merge the entries under `mcpServers` into the same key in `~/.claude.json` to make these servers available globally across projects.

> [!IMPORTANT]
> Replace the `--api-key YOUR_API_KEY` value for `context7` with your real key. Keep the key out of version control by sourcing it from an environment variable or a secret manager.

### `hooks/notify-slack.sh`

Invoked on session stop. The hook posts the following to a Slack channel:

- Project path, completion time, session ID
- Last user question (truncated to 30 characters)
- Last assistant response (truncated to 500 characters)

Provide the webhook URL via a `.env` file (kept outside the repository):

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

If `SLACK_WEBHOOK_URL` is empty, the hook exits silently.

### `skills/`

| Skill | Purpose |
| --- | --- |
| `create-readme` | Analyzes a project and drafts a `README.md` |
| `git-commit` | Inspects staged changes, writes a Conventional Commits message, and commits |
| `writing-skills` | Meta-skill used when authoring, editing, or validating other skills |
| `improve-token-efficiency` | Improves the token efficiency of skills and prompts |
| `ai-readiness-cartography` | Maps a codebase's AI-readiness surface |

Each skill is triggered automatically based on its `description` frontmatter in `SKILL.md`.

### `ccstatusline`

[ccstatusline](https://github.com/sirmalloc/ccstatusline) is a status line renderer for Claude Code. Warm the cache once with:

```bash
npx -y ccstatusline@2.2.12
```

Then place the configuration files from this repository in their expected locations:

```bash
mkdir -p ~/.config/ccstatusline
cp ccstatusline.json          ~/.config/ccstatusline/ccstatusline.json
cp ccstatusline-settings.json ~/.config/ccstatusline/settings.json
```

### `keybindings.json`

- Unbinds the default `Ctrl+O`
- Maps `Ctrl+U` to `app:toggleTranscript`

## Repository Layout

```
.
├── CLAUDE.md              # Global behavior rules
├── settings.json          # Permissions, hooks, plugins
├── keybindings.json       # Key bindings
├── .mcp.json              # MCP server definitions
├── ccstatusline*.json     # Status line configuration
├── hooks/                 # Stop-hook scripts
├── rules/                 # Guidelines and documentation rules
└── skills/                # User-defined skills
```

> [!TIP]
> `.gitignore` whitelists only the files and directories above. To share a new configuration file, add it explicitly to the allow-list in `.gitignore`.
