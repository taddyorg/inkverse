# Claude Code transcripts

Where they are, what a line looks like, and what `scripts/sessions.py` reads. The skill never
opens a transcript itself: the digest and the dump are the only views it uses.

## Location

`~/.claude/projects/<encoded cwd>/<session id>.jsonl`, where the encoded cwd is the working
directory's absolute path with every character that is not a letter or digit replaced by `-`
(`/Users/me/Projects/taddy` → `-Users-me-Projects-taddy`). A session started in a subdirectory
lands in its own directory (`…-taddy-apps-web`), so the digest scans every directory whose name is
the encoded repo path or starts with it followed by `-`, and keeps a file only when its first
message's `cwd` is the repo or a path under it (a sibling such as `…-taddy-other` is skipped as
`other-cwd`). Subagent transcripts live in `<session id>/subagents/*.jsonl`: the work a session
delegated. Their commands and commits are folded into the session's `commits` and `toolUses`
(`subagentFiles` counts them), their lines go after the parent's in the archived copy, and the
dump shows the report each Agent call returned. Turns, dates and the first human message stay
the parent's.

## Line shapes

One JSON object per line. Only lines with a `timestamp` are messages; the rest is bookkeeping
(`mode`, `permission-mode`, `atis-latch`, `bridge-session`, `file-history-snapshot`, `last-prompt`,
`cost-state`, `system`, `attachment`, …) except `ai-title`, whose `aiTitle` names the session.

| Line | Fields the digest reads |
| --- | --- |
| every message | `type`, `timestamp` (ISO, UTC), `sessionId`, `cwd`, `gitBranch`, `version`, `slug` |
| a human turn | `type: "user"`, `origin.kind: "human"`, no `isMeta`; `message.content` is a string or `text` blocks |
| an injected line | `type: "user"` with `isMeta: true`, or `origin.kind: "task-notification"` — not a human turn |
| an assistant turn | `type: "assistant"`; `message.content` blocks of `text`, `thinking`, `tool_use` (`id`, `name`, `input`) |
| a tool result | `type: "user"` with a `tool_result` block (`tool_use_id`, `content`) and, for Bash, `toolUseResult.stdout` |
| the title | `type: "ai-title"`, `aiTitle` |

## What the digest derives per session

- `date` — the local day of the first message; a session belongs to the range by that day.
- `weekStart` — that day's Monday, shown on the conversation's `Date` line.
- `firstHumanMessage` — the first human turn: what the conversation was about, the recap's
  opening and the report heading's fallback when the session has no title.
- `commits` — every Bash `tool_use` whose command runs `git commit`, subagent transcripts
  included, paired with its result. Git
  prints `[<branch> <sha>] <subject>` on success, which gives `sha` and `subject`; when the output
  is missing the subject comes from `-m "…"` or the heredoc's first line and `sha` stays null
  (`commits.py --join` then matches on the subject). `ok` is false on `Exit code` / `nothing to
  commit`; `suspect` is true when the command also runs `git init` or `cd`s outside the repo.
  `commits.py --join` also reads each commit's `Work-Session` trailers, the session ids
  `taddy-commit` stamps on every commit (the sessions that did the work, the committing
  conversation included when it did any of it), and joins those first (`matchedBy:
  trailer`), warning on an id that is not in the digest. It also reads the `Taddy-Project`
  trailer into the commit's `projectId`, falling back to the `SRED-Project` trailer older
  commits carry (null when absent, with a warning when it is not a
  positive integer). It walks every local and remote-tracking branch, and lists a commit
  authored after the range whose trailers name a session of the range under `laterCommits`.
- `archiveName` — `<date>-<slug>.jsonl`, the slug from `aiTitle` (else the session `slug`, else the
  first words of the first human message), for the upload's `name` and the report's `Archived` line.
- `humanTurns`, `assistantTurns`, `toolUses`, `hasSubagents`, `subagentFiles`, `bytes`.

Sessions from other days or sibling repos are only counted (`skippedCounts`); `skipped` lists the
ones worth a look: `no-messages`, `parse-error` (and `already-filed` when `--exclude` is passed,
which the report pass does not do: every session in the range is reported).

Nothing about time is measured; timestamps only order the turns.

## The dump

`sessions.py --cwd "$PWD" --dump <session id>` prints the session's turns in order, bounded:

```
session <id> | <date> | branch <branch> | <title> | <n> turns
[H 09:14] <human turn, up to --max-chars>
[A 09:15] <assistant text, up to --max-chars> …(+N chars)
[tools 09:16] Bash×3 Edit×2
[agent 09:17] <the report an Agent call returned, up to --max-chars>
[… skipped N turns …]
```

It skips `thinking`, tool inputs, attachments, injected lines and every tool result except the
report an Agent call returned (what a delegated subagent did, in its own words), read from
the call's result or from the task notification that delivered it. The last
`--keep-tail` assistant messages get three times the cap so the closing summary survives; beyond
`--max-turns` it keeps the first third and the last two thirds. Write each session's recap from
its dump right after printing it, then move on; do not keep dumps around.
