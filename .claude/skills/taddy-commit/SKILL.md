---
name: taddy-commit
description: Commit in a Taddy product repo under an SR&ED project. Use this skill whenever the user asks to commit, "commit this", "commit this to AI Tools", "commit under TP-04", "commit and push", "wrap this up in a commit", "commit what's sitting uncommitted", "split this into two commits", or otherwise wants work turned into one or more git commits (two topics make two commits) in a repo that has the Taddy SR&ED MCP server (tools such as list_projects, pick_project). The work may be from this conversation or from earlier ones whose files are still uncommitted. It resolves the project named in the request against list_projects, writes the commit message (the work's recap as the body), shows it for approval, stamps the SRED-Project and Work-Session trailers, and stops on a secret or a dropped .gitignore line until the user keeps or unstages each finding by number. Not for reverting, rebasing, amending only the author, answering git log or diff questions, or opening a PR when nothing new is being committed.
metadata:
  version: "0.1.0"
  updated: "2026-09-23"
  source: "https://github.com/taddyorg/taddy-internal-skills"
---

# Taddy commit skill

Applied when the user asks Claude to commit: either at the end of the conversation that did the
work, or in a fresh conversation whose only job is to commit files changed earlier. It finds the
work, resolves the project, scans what is staged, writes each commit's message, shows it for
approval and commits. It never creates tasks, never classifies the work, needs no configuration
and touches the SR&ED app through one MCP call: `list_projects`, once per request. The weekly
pass (`taddy-weekly-tasks`) later reads the trailers off `git log` into the weekly report the
SR&ED admin works from. Every commit is scanned for a dropped `.gitignore` line or a secret
added or removed before its message is written, and each finding needs the user's own word.

## Does this apply?

- The user wants a new commit of work done in this conversation, alone or finishing work begun
  in earlier sessions → yes: Step 0, the Project step, then Steps 1–5 per commit.
- The first human message *is* the commit request and no work was done here (the files are
  already changed on disk: a commit-only conversation) → yes, the same steps; this
  conversation's own id is then not a `Work-Session`.
- Sessions and commits are many-to-many: one commit is often several sessions (a run of
  styling sessions, three attempts at one change) and one request can yield several commits.
- Revert, rebase, cherry-pick, `git log` or diff questions, a PR for commits that already exist →
  not this skill; do the ordinary git work without trailers.

## Step 0: find the sessions (every commit)

1. `git status --porcelain` and `git diff --stat HEAD` — what is uncommitted, staged or not.
2. `python3 .claude/skills/taddy-commit/scripts/work-sessions.py --cwd "$PWD"` — the Claude Code
   sessions in this repo that edited one of those files since the file's last commit
   (`touched`, subagent edits included), named one in a Bash command (`mentioned`) or ran
   after the last commit (`afterLastCommit`). The session marked `current: true` is this
   conversation (`$CLAUDE_CODE_SESSION_ID`, which the script reads itself): never dump it, its
   recap is in context; when `currentSession` is null it is the session whose
   `firstHumanMessage` is this conversation's first message, and say so. Drop any other
   session with empty `touched` and `mentioned` and no commit after the last commit: a session
   is allowed to stay linked to nothing. For each remaining session run `--dump <sessionId>`
   and, before the next dump, write a summary of at most 200 words: the first human message,
   what was tried, what happened, what was decided, files touched. Never open a `.jsonl`
   directly. A working conversation may find no other session: then nothing is dumped and its
   own id is the commit's only `Work-Session`. Fields and grammar: `references/work-sessions.md`.
3. Plan the commits. As the user directed; else one commit per unit of work: a change a
   reviewer could review or revert on its own, judged by what the work is
   (`references/splitting.md`), not by which session did it. Several sessions on one change
   are one commit; a conversation that did two things gives two commits even on "commit
   this", and a subject that would need "and" to cover the work means two. A session whose
   files fall in two units gives each file, or each hunk, to the commit its work belongs to.
   Files this conversation edited are its own even when the digest lists them under
   `unmatchedFiles` (a worktree, a Bash script); the rest of `unmatchedFiles` (edited by hand
   or in another tool) → ask the user which commit they belong to or what they are. Show the
   table commit → files → sessions and get a confirmation when there is more than one commit,
   more than one session behind a commit, or any unmatched file.
4. Then, per commit: `git add -- <its files>` whole, or only that unit's hunks by patch with
   `git apply --cached` when another commit changed the same file
   (`references/splitting.md`), and Steps 1–5 below. Its sessions' ids, plus this
   conversation's own when it did any of the commit's work, become its `Work-Session`
   trailers in Step 3. Commit one before staging the next.

## Project (once per request)

The request names the SR&ED project: a name or a `TP-NN` code, after "to", "under", "for" or
"project", or on its own ("commit this to AI Tools", "commit under TP-04"). Call
`list_projects()` once (active projects) and drop the time-off rows (`sortOrder` ≥ 900). Match
the user's words against `code` and `name`, case-insensitively, ignoring surrounding whitespace
and punctuation: an exact code, else an exact name, else the one name that contains every word
given. Exactly one hit → its `id`; say `code`, `name` and `id`. No hit, several hits, or no name
in the request → show the candidates (code, name, id) and ask which one. Never guess and never
call `pick_project`. The answer applies to every commit of the request; at any approval the
user may name another project or code, re-matched against the same list without a second call.
Shapes, matching examples and errors: `references/project.md`.

## Workflow (per commit)

1. **Scan.** `python3 .claude/skills/taddy-commit/scripts/secret-scan.py` reads the index
   (what this commit holds, hunks included). Exit 0: clean. Exit 2: stop and say why. Exit 1:
   before any message, show `findings` as a numbered table (kind, file:line, the masked
   `excerpt`, `recommend`) and stop. The reply must name every number with `keep` or
   `unstage` (`keep 1, unstage 2`, `keep all`); a bare yes, approved or lgtm while a finding
   is open settles nothing: ask again. `unstage` means the `recommend` command, nothing else;
   then re-run the scan until it is clean or every finding left was kept, and note that run's
   `approvalId`. A kept `secret-removed` is not a cleanup: the value sits in the `inHistory`
   commits and must be rotated, say so. Kinds, grammar, examples: `references/security.md`.
2. **Write the message.** Subject: what changed, imperative, at most 72 characters, naming
   one change. Then the body: one paragraph, at most 8 lines wrapped by hand at 72 characters
   (about 100 words), in plain sentences: one idea per sentence, no semicolons, no slashes,
   nothing compressed into clauses. It says what was done, the key result or failed attempt
   with its numbers, what was decided and why. In
   this conversation that is the recap you close a turn with, cut to size; in a commit-only
   conversation it is drawn from the sessions' dumps, their closing recaps and your summaries
   merged into one recap in start order, never from the diff alone. No list, no headings,
   nothing not stated in the conversation(s) behind the commit. A small change (a bug fix, a
   config bump) gets one or two sentences. Files with no session behind them get a body that
   says only what changed. Rules and examples: `references/message-format.md`.
3. **Approve.** After a blank line, `SRED-Project: <id>` from the Project step, then one
   `Work-Session: <id>` per session behind the commit, in start order: the digest's
   `sessionId` for each earlier session and, last, this conversation's own id when it did any
   of the work (`echo $CLAUDE_CODE_SESSION_ID`, equal to the digest's `currentSession`). A
   commit-only conversation lists the earlier sessions and not itself. They all go before the
   usual attribution trailers (`Co-Authored-By`, `Claude-Session`), which stay. Show the whole
   message (subject, body, trailers), the files staged for it and a `Scan:` line outside the
   message, `clean` or `kept: #n kind file:line excerpt` per kept finding, then stop and wait:
   the user approves or edits it. An edit to the subject or body is applied verbatim; a new
   project name or code is re-matched against the list already fetched
   (`references/project.md`). Commit only after an explicit yes, behind the scan:

   ```
   M=$(mktemp); cat > "$M" <<'EOF'
   <subject>

   <body>

   SRED-Project: 5
   Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
   Co-Authored-By: ...
   EOF
   python3 .claude/skills/taddy-commit/scripts/secret-scan.py --message-file "$M" \
     --approved "<approvalId, omitted when the scan was clean>" && git commit -F "$M"
   ```

   Exit 1 here means the index changed since the reviewed scan or the message holds a
   value: back to Step 1, never `git commit` on its own.
4. **Verify:** `git log -1 --format='%(trailers:key=SRED-Project)%(trailers:key=Work-Session)'`
   prints `SRED-Project: <id>`, then one `Work-Session:` line per session, at least one on
   every commit. Nothing printed, or a line missing, means the trailer block was not the last
   paragraph or a line was dropped: fix with `git commit --amend -F -`.
5. **Print the commit message and trailers:** the same `git log -1` as Step 4.
   With several commits, go back to Step 0.4 for the next one: stage it, then Steps 1–5 again,
   so an approved message never goes stale against a changed staging area.

## Trailers

Every commit gets `SRED-Project: <id>` and one `Work-Session: <id>` per session behind it, this
conversation included when it did the work. Neither is a classification: this skill never writes
an `SRED:` or `SRED-Exclusion:` line; if the user wants it noted, it goes in the body in their
words and the admin decides from the weekly report.

## Rules

- Never run `git commit` on a message the user has not seen and approved in this conversation.
- Never commit without `SRED-Project`. The id comes from `list_projects` matched against the
  user's words (or their answer to the candidates), never from `pick_project`, the diff or
  memory of an earlier conversation.
- Never `git add -f`, `git commit -a`, `-m` or `--no-verify`; never edit a `.gitignore`,
  unstage a finding or pass `--approved` without the user's `keep` or `unstage` for that
  number, and never take "approved" for the message as the answer to a finding.
- Never show a value: the script's masked excerpt only, never `git diff --cached` of a
  flagged file, never a value the user pasted.
- Never invent a result or an attempt. A failed attempt still goes in the recap: what was tried
  and that it did not work. Over 8 lines or 72 columns: drop a whole sentence, never a
  number, a failed attempt or a decision. Never pack two sentences into one to fit.

## Gotchas

- The weekly report prints the body off `git log` verbatim under the commit, so the recap
  must stand on its own without the conversation. Plain is what matters: the admin reads it
  without the conversation, so a longer clear sentence beats a packed short one. The report
  carries a recap of each session too; what must survive is the number, the failed attempt
  and the decision.
- Transcripts live under `~/.claude/projects` (a session's subagents under `<id>/subagents/`);
  `work-sessions.py` only reads them and never uploads. A work session that already committed part of its work (an entry in `commits` with
  `ok: true`) still counts for the files it edited that remain uncommitted.
- Git trailer tokens allow letters, digits and `-` only, hence `SRED-Project` and
  `Work-Session`, never `SRED_Project`. Trailers must form the final paragraph of the message,
  separated by a blank line from the body.
- `git commit --amend` keeps the trailers as they were.
- The `Work-Session` uuid is the transcript's file name, the `sessionId` on its every line and
  the id the weekly pass archives it under (`PUT /sred/api/files/<id>`, the `list_files` id):
  the commit is how the archived transcript is found later. It comes
  from the digest or `$CLAUDE_CODE_SESSION_ID`, never typed from memory. The harness's
  `Claude-Session:` URL carries a different id (`session_…`) and is never a `Work-Session`.
- The scan only knows the patterns in `secret-scan.py`; an unfamiliar long string in a
  config is still worth a question.
- A resumed conversation (`claude --resume`) keeps its id, so the same id in an earlier
  commit's trailer is correct, not a mistake.
- A member only sees the projects they are assigned to, so a name with no hit may be a project
  they are not assigned to: say so, show what `list_projects` returned and ask.
- If `list_projects` is unavailable (no MCP server, auth error), say so and ask the user for the
  numeric id from the app's Projects page; do not commit without `SRED-Project`.

## Reference routing

| Need | File |
| --- | --- |
| The body (recap) rules, the full examples, where the trailers go | `references/message-format.md` |
| `list_projects` shape, the matching rules with examples, the no-name and ambiguous cases, overrides | `references/project.md` |
| Units of work, the "and" test, staging a shared file by hunk, a worked two-commit example | `references/splitting.md` |
| `work-sessions.py` usage and fields, the dump, grouping sessions into commits, three worked examples | `references/work-sessions.md` |
| Finding kinds, the keep/unstage grammar, unstaging, rotation, `approvalId`, two worked examples | `references/security.md` |
| The digest and the dump; the staged-change scan | `scripts/work-sessions.py`, `scripts/secret-scan.py` |
