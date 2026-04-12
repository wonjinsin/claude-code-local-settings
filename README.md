# Claude Code Local Settings

A personal collection of Claude Code local configuration files stored in `~/.claude`.

## Settings

### ccstatusline.json

[ccstatusline](https://github.com/sirmalloc/ccstatusline) is a status line renderer for Claude Code that displays contextual information in the terminal.

**Installation (first-time setup):**

```bash
npx -y ccstatusline@latest
```

Put file `ccstatusline.json` content into path `~/.config/ccstatusline/ccstatusline.json`.
Put file `ccstatusline-settings.json` content into path `~/.config/ccstatusline/settings.json`.

### CLAUDE.md

`~/.claude/CLAUDE.md` defines the communication rules for Claude Code.

### settings.json

`~/.claude/settings.json` defines the settings for Claude Code.

Plugins listed in `enabledPlugins` must be installed separately via:

```bash
/plugin install {plugin-name}@{marketplace}
```

### keybindings.json

`~/.claude/keybindings.json` defines custom key bindings.

### .mcp.json

Add the `mcpServers` entries from `.mcp.json` into `~/.claude.json` to enable MCP servers globally.
