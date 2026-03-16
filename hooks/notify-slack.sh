#!/usr/bin/env bash
# notify-slack.sh - Claude Code Stop hook: sends Slack Block Kit notification
# Triggered automatically by Claude Code Stop event via stdin JSON.

set -euo pipefail

# --- Load .env ---
ENV_FILE="$(dirname "$0")/../.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

# --- Guard: exit silently if no webhook URL configured ---
if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  exit 0
fi

# --- Read stdin JSON from Claude Code ---
STDIN_JSON=""
if [[ ! -t 0 ]]; then
  STDIN_JSON="$(cat)"
fi

# --- Parse stdin fields (requires jq) ---
if ! command -v jq &>/dev/null; then
  echo "[notify-slack] jq not found. Install with: brew install jq" >&2
  exit 0
fi

CWD="$(echo "$STDIN_JSON" | jq -r '.cwd // ""')"
SESSION_ID="$(echo "$STDIN_JSON" | jq -r '.session_id // ""')"
TRANSCRIPT_PATH="$(echo "$STDIN_JSON" | jq -r '.transcript_path // ""')"
LAST_MSG="$(echo "$STDIN_JSON" | jq -r '.last_assistant_message // ""')"

# --- Derive display values ---
PROJECT_NAME="$(basename "${CWD:-unknown}")"
COMPLETED_AT="$(date '+%Y-%m-%d %H:%M:%S %Z')"
SESSION_SHORT="${SESSION_ID:0:8}"

# Truncate last_assistant_message to 500 chars
if [[ "${#LAST_MSG}" -gt 500 ]]; then
  LAST_MSG="${LAST_MSG:0:500}..."
fi
if [[ -z "$LAST_MSG" ]]; then
  LAST_MSG="(no response)"
fi

# --- Read last user question from transcript (actual user messages) ---
LAST_QUESTION=""
if [[ -f "$TRANSCRIPT_PATH" ]]; then
  LAST_QUESTION="$(jq -Rr '
    try (fromjson |
      select(.type == "user" and (.isMeta // false) == false) |
      .message.content |
      if type == "string" then .
      elif type == "array" then (map(select(.type == "text") | .text) | join(""))
      else "" end
    ) // empty
  ' "$TRANSCRIPT_PATH" 2>/dev/null \
  | grep -v '^\[' | grep -v '^<' | grep -v '^$' \
  | tail -1 || true)"
fi
if [[ "${#LAST_QUESTION}" -gt 30 ]]; then
  LAST_QUESTION="${LAST_QUESTION:0:30}..."
fi
if [[ -z "$LAST_QUESTION" ]]; then
  LAST_QUESTION="(no question)"
fi

# --- Build Block Kit JSON payload ---
PAYLOAD="$(jq -n \
  --arg project  "$PROJECT_NAME" \
  --arg cwd      "$CWD" \
  --arg time     "$COMPLETED_AT" \
  --arg msg      "$LAST_MSG" \
  --arg session  "$SESSION_SHORT" \
  --arg question "$LAST_QUESTION" \
  '{
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: ("*" + $project + " — Completed ✅* ") }
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: ("📁 `" + $cwd + "`") }
        ]
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: ("🕐 " + $time) }
        ]
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: ("🔑 `" + $session + "...`") }
        ]
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: ("💬 " + $question) }
        ]
      },
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: ("```" + $msg + "```") }
      }
    ]
  }'
)"

# --- Send to Slack (retry up to 2 times) ---
MAX_RETRIES=2
HTTP_CODE="000"

for attempt in $(seq 1 $((MAX_RETRIES + 1))); do
  HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    --connect-timeout 5 \
    -X POST \
    -H 'Content-Type: application/json' \
    -d "$PAYLOAD" \
    "$SLACK_WEBHOOK_URL" 2>/dev/null || echo "000")"

  if [[ "$HTTP_CODE" == "200" ]]; then
    break
  fi

  if [[ "$attempt" -le "$MAX_RETRIES" ]]; then
    sleep 2
  fi
done

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "[notify-slack] Failed after $((MAX_RETRIES + 1)) attempts. HTTP $HTTP_CODE" >&2
fi

exit 0
