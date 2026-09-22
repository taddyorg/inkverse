---
name: taddy-commit
description: Commit in a Taddy product repo with an SR&ED classification. Use this skill whenever the user asks to commit, "commit this", "commit and push", "wrap this up in a commit", "save this as a commit", "commit what's sitting uncommitted", "commit the work from yesterday's session", "split this into two commits", or otherwise wants work turned into one or more git commits in a repo that has the Taddy SR&ED MCP server (tools such as classify_work, list_projects). The work may have been done in this conversation or in earlier ones whose files are still uncommitted. It classifies each commit's work with classify_work, writes the commit message (the work's recap as the body), shows it for approval, and stamps the SRED and SRED-Exclusion trailers. Not for reverting, rebasing, amending only the author, answering git log or diff questions, or opening a PR when nothing new is being committed.
metadata:
  version: "0.1.0"
  updated: "2026-09-22"
  source: "https://github.com/taddyorg/taddy-internal-skills"
---

# Taddy commit skill

CONFIDENCE_THRESHOLD = 0.6

Applied when the user asks Claude to commit: either at the end of the conversation that did the
work, or in a fresh conversation whose only job is to commit files changed earlier. It finds the
work, classifies each commit, writes its message, shows it for approval and commits. It never
creates tasks, needs no configuration and touches the SR&ED app through one MCP call per commit,
`classify_work`. The weekly pass (`taddy-weekly-tasks`) later reads the trailers off `git log`,
so every commit made here must carry them.

## Does this apply?

- The user wants a new commit of work done in this conversation → yes: Steps 1–5.
- The first human message *is* the commit request and no work was done here (the files are
  already changed on disk) → yes: Step 0 finds the work in the earlier sessions, then Steps 1–5
  per commit.
- Sessions and commits are many-to-many: one commit is often several sessions (a run of
  styling sessions, three attempts at one change) and one request can yield several commits.
  One `classify_work` per commit; commits backed by the same sessions reuse the answer.
- Revert, rebase, cherry-pick, `git log` or diff questions, a PR for commits that already exist →
  not this skill; do the ordinary git work without trailers.

## Step 0: find the work (commit-only conversation only)

1. `git status --porcelain` and `git diff --stat HEAD` — what is uncommitted, staged or not.
2. `python3 .claude/skills/taddy-commit/scripts/work-sessions.py --cwd "$PWD"` — the Claude Code
   sessions in this repo that edited one of those files since the file's last commit
   (`touched`), named one in a Bash command (`mentioned`) or ran after the last commit
   (`afterLastCommit`). Skip the session whose `firstHumanMessage` is this conversation's own
   request (this transcript is on disk too) and any session with empty `touched` and
   `mentioned` and no commit after the last commit. For each remaining session run
   `--dump <sessionId>` and, before the next dump, write a summary of at most 200 words: the
   first human message, what was tried, what happened, what was decided, files touched. Never
   open a `.jsonl` directly. Fields and grammar: `references/work-sessions.md`.
3. Plan the commits. As the user directed; else one commit per unit of work, where a unit is
   usually several sessions: sessions on the same topic or the same files go together, distinct
   work gets its own commit, and a session that touched files of two units gives each file to
   the commit its work belongs to. `unmatchedFiles` (edited by hand or in another tool) → ask
   the user which commit they belong to or what they are. Show the table commit → files → sessions
   and get a confirmation when there is more than one commit, more than one session behind a
   commit, or any unmatched file.
4. Then, per commit: `git add -- <its files>` (whole files; say so if the user wants a partial
   hunk) and Steps 1–5 below. Commit one before staging the next.

## Workflow (per commit)

1. **Classify.** The input is what the user asked for, never the diff. In the conversation that
   did the work: this conversation's first human message; if the session was resumed or
   compacted, the earliest human message still in context, and say so. In a commit-only
   conversation: the first human message of every session behind the commit, in start order,
   separated by a blank line, and say which sessions were used. Trim to 8 000 characters. Call
   `classify_work({ text })` and show the answer: `workClass`, the three probabilities and
   `confidence`.
   - `confidence` ≥ `CONFIDENCE_THRESHOLD` → the trailers follow the answer.
   - Below it → ask the user one question, exactly *Is this SR&ED viable?* Yes → `SRED: yes`. No →
     `SRED: no` with `SRED-Exclusion` = the more probable of `routine` / `production` in the
     answer, shown so the user can change it.
   - The user can override either trailer at any time; an override is not a reason to call
     `classify_work` again. Shapes and the full rule: `references/classify-work.md`.
2. **Write the message.** Subject: what changed, imperative, at most 500 characters. Then the
   body: the recap of the work being committed — what was done, what was found (results,
   numbers, failed attempts included), what was decided and why, what is next. In this
   conversation that is the recap you close a turn with; in a commit-only conversation it is
   drawn from the sessions' dumps, their closing recaps and your summaries merged into one recap
   in start order, never from the diff alone. Plain paragraphs or a short list, no headings,
   nothing not stated in the conversation(s) behind the commit. Same body for both trailers; a
   small `SRED: no` change gets one or two sentences. Files with no session behind them get a
   body that says only what changed. Rules and examples: `references/message-format.md`.
3. **Approve.** After a blank line, `SRED: yes` or `SRED: no`, and on `no` the line
   `SRED-Exclusion: routine` or `SRED-Exclusion: production`. They go before the usual attribution
   trailers (`Co-Authored-By`, `Claude-Session`), which stay. Show the whole message (subject,
   body, trailers) and the files staged for it, then stop and wait: the user approves or edits
   it. An edit to the subject or body is applied verbatim; an edit to a trailer is an override.
   Commit only after an explicit yes, with a heredoc:

   ```
   git commit -F - <<'EOF'
   <subject>

   <body>

   SRED: no
   SRED-Exclusion: production
   Co-Authored-By: ...
   EOF
   ```

4. **Verify:** `git log -1 --format='%(trailers:key=SRED)%(trailers:key=SRED-Exclusion)'` prints
   `SRED: yes`, or `SRED: no` followed by `SRED-Exclusion: routine` / `SRED-Exclusion: production`.
   Nothing printed means the trailer block was not the last paragraph: fix with
   `git commit --amend -F -`.
5. **Print the commit message and trailers:** `git log -1 --format='%(trailers:key=SRED)%(trailers:key=SRED-Exclusion)'`.
   With several commits, go back to Step 0.4 for the next one: stage it, then Steps 1–5 again,
   so an approved message never goes stale against a changed staging area.

## Trailer decision table

| `classify_work` answer | Confidence | Trailers |
| --- | --- | --- |
| `workClass: other` (`sred: true`) | ≥ threshold | `SRED: yes` |
| `workClass: routine` | ≥ threshold | `SRED: no` + `SRED-Exclusion: routine` |
| `workClass: production` | ≥ threshold | `SRED: no` + `SRED-Exclusion: production` |
| any | < threshold, user says yes | `SRED: yes` |
| any | < threshold, user says no | `SRED: no` + `SRED-Exclusion:` the likelier of routine / production |
| any | user overrides | whatever the user said |

## Rules

- Never run `git commit` on a message the user has not seen and approved in this conversation.
- The input to `classify_work` is what the user asked for (the first human message, or the
  sessions' first human messages), not the diff and not your summary of the work. Pass it
  verbatim. Only when no session and no in-context work stand behind the files, ask the user
  what the work was and classify their answer.
- Never invent a result or an attempt. A failed attempt still goes in the recap: what was tried
  and that it did not work.

## Gotchas

- The weekly pass reads the body off `git log` to seed the task and judge its kind, so the
  recap must stand on its own without the conversation.
- Transcripts live under `~/.claude/projects`; `work-sessions.py` only reads them and never
  uploads. A work session that already committed part of its work (an entry in `commits` with
  `ok: true`) still counts for the files it edited that remain uncommitted.
- Git trailer tokens allow letters, digits and `-` only, hence `SRED-Exclusion`, never
  `SRED_Exclusion`. Trailers must form the final paragraph of the message, separated by a blank
  line from the body.
- `git commit --amend` keeps the trailers as they were; re-run the classification only if the
  user says the work changed.
- If `classify_work` is unavailable (no MCP server, auth error), say so, ask *Is this SR&ED
  viable?* and stamp the trailers from the answer; do not commit without them.

## Reference routing

| Need | File |
| --- | --- |
| The body (recap) rules, both full examples, where the trailers go | `references/message-format.md` |
| `classify_work` input and output, the threshold rule, the one question, overrides | `references/classify-work.md` |
| `work-sessions.py` usage and fields, the dump, grouping sessions into commits, two worked examples | `references/work-sessions.md` |
| The digest and the dump | `scripts/work-sessions.py` |
