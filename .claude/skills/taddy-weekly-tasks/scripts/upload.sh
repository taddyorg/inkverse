#!/usr/bin/env bash
# Archive one Claude Code session transcript in the SR&ED app (PUT /sred/api/files/<session id>)
# for the taddy-weekly-tasks skill. bash + curl + python3. A redacted copy is uploaded, never the
# original (see redact.py); the token is never printed.
#
# Usage:
#   upload.sh --session <id> --file <path.jsonl> --date <YYYY-MM-DD> --name <name.jsonl> --project <projectId> --repo <product repo>
#             [--base-url https://console.taddy.org] [--no-redact] [--dry-run]
#
# Token, in order: $SRED_TOKEN; the Authorization header of the `sred` MCP server (`claude mcp get sred`,
# then ~/.claude.json); otherwise exit 2. Use the 180-day exchange token from the Settings page, not the
# 2-hour access token. Exit codes: 0 uploaded (prints {"ok":true,"file":…}); 2 no token; 3 file too
# large; 4 token rejected; 5 the server refused the upload (prints its error); 6 other HTTP status.
set -euo pipefail

MAX_BYTES=$((25 * 1024 * 1024))
base_url="https://console.taddy.org"
redact=1
dry_run=0
session=""; file=""; date=""; name=""; project=""; repo=""

usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --session) session="$2"; shift 2 ;;
    --file) file="$2"; shift 2 ;;
    --date) date="$2"; shift 2 ;;
    --name) name="$2"; shift 2 ;;
    --project) project="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    --base-url) base_url="${2%/}"; shift 2 ;;
    --no-redact) redact=0; shift ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage ;;
    *) echo "unknown argument: $1" >&2; usage ;;
  esac
done
[ -n "$session" ] && [ -n "$file" ] && [ -n "$date" ] && [ -n "$name" ] && [ -n "$project" ] && [ -n "$repo" ] || usage
[ -f "$file" ] || { echo "error: no such file: $file" >&2; exit 2; }
[[ "$session" =~ ^[A-Za-z0-9._-]{1,200}$ ]] || { echo "error: session id may only contain letters, digits, '.', '_' and '-'" >&2; exit 2; }
[[ "$project" =~ ^[0-9]+$ ]] || { echo "error: --project must be a project id" >&2; exit 2; }

here="$(cd "$(dirname "$0")" && pwd)"

# Reads the sred server's bearer token out of ~/.claude.json (top level, then any project entry).
read -r -d '' CLAUDE_JSON_TOKEN_PY <<'PY' || true
import json, sys
cfg = json.load(open(sys.argv[1]))
def header(server):
    h = (server or {}).get("headers") or {}
    a = h.get("Authorization") or h.get("authorization") or ""
    return a[7:].strip() if a.lower().startswith("bearer ") else ""
cands = [(cfg.get("mcpServers") or {}).get("sred")]
cands += [((p or {}).get("mcpServers") or {}).get("sred") for p in (cfg.get("projects") or {}).values()]
for c in cands:
    t = header(c)
    if t and not t.startswith("$" + "{"):
        print(t)
        break
PY

token_source=""
# Prints the token; sets token_source to where it came from. Never echoes it anywhere else.
resolve_token() {
  if [ -n "${SRED_TOKEN:-}" ]; then token_source="SRED_TOKEN"; printf '%s' "$SRED_TOKEN"; return 0; fi
  local t
  if command -v claude >/dev/null 2>&1; then
    t="$(claude mcp get sred 2>/dev/null | sed -n 's/.*Authorization: *Bearer *\([^ "]*\).*/\1/p' | head -1 || true)"
    if [ -n "$t" ]; then token_source="claude mcp get sred"; printf '%s' "$t"; return 0; fi
  fi
  if [ -f "$HOME/.claude.json" ]; then
    t="$(python3 -c "$CLAUDE_JSON_TOKEN_PY" "$HOME/.claude.json" 2>/dev/null || true)"
    if [ -n "$t" ]; then token_source="~/.claude.json mcpServers.sred"; printf '%s' "$t"; return 0; fi
  fi
  return 1
}

tmp=""
cleanup() { [ -n "$tmp" ] && rm -f "$tmp" "$tmp.body" 2>/dev/null || true; }
trap cleanup EXIT

if [ "$redact" -eq 1 ]; then
  tmp="$(mktemp "${TMPDIR:-/tmp}/sred-upload.XXXXXX")"
  python3 "$here/redact.py" --repo "$repo" --in "$file" --out "$tmp"
  body_file="$tmp"
else
  body_file="$file"
fi

bytes="$(wc -c < "$body_file" | tr -d ' ')"
if [ "$bytes" -gt "$MAX_BYTES" ]; then
  echo "error: $body_file is $bytes bytes; the archive takes at most 25 MB" >&2
  exit 3
fi
if [ "$bytes" -eq 0 ]; then echo "error: the file is empty" >&2; exit 3; fi

meta="$(python3 -c 'import json,sys; print(json.dumps({"type":"transcript","name":sys.argv[1],"date":sys.argv[2],"projectId":int(sys.argv[3])}))' "$name" "$date" "$project")"
url="$base_url/sred/api/files/$session"

if [ "$dry_run" -eq 1 ]; then
  if resolve_token >/dev/null; then tok="found via $token_source"; else tok="none (export SRED_TOKEN or connect the sred MCP server)"; fi
  echo "dry run: would PUT $bytes bytes ($([ "$redact" -eq 1 ] && echo redacted || echo original)) to $url"
  echo "  -H 'Content-Type: application/x-ndjson' -H 'X-File-Meta: $meta' --data-binary @<file>"
  echo "  token: $tok"
  exit 0
fi

token="$(resolve_token)" || {
  echo "No token: export SRED_TOKEN=<exchange token> or run the 'claude mcp add … sred …' command from the Settings page" >&2
  exit 2
}
[ -n "$tmp" ] || tmp="$(mktemp "${TMPDIR:-/tmp}/sred-upload.XXXXXX")"
status="$(curl -sS -o "$tmp.body" -w '%{http_code}' -X PUT "$url" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/x-ndjson" \
  -H "X-File-Meta: $meta" \
  --data-binary @"$body_file")"
response="$(cat "$tmp.body" 2>/dev/null || true)"
case "$status" in
  201) python3 -c 'import json,sys; r=json.loads(sys.argv[1]); print(json.dumps({"ok": True, "id": sys.argv[2], "file": r.get("file")}))' "$response" "$session"; exit 0 ;;
  401) echo "error: token rejected or expired (HTTP 401) — use the 180-day exchange token from the Settings page" >&2; exit 4 ;;
  400|403|413|415) echo "error: the server refused the upload (HTTP $status): $response" >&2; exit 5 ;;
  *) echo "error: HTTP $status: $response" >&2; exit 6 ;;
esac
