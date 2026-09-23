# `work-sessions.py`

The only view of a transcript this skill uses, run before every commit: it lists the earlier
sessions behind the uncommitted files and marks the conversation running now. The script is
this skill's own copy of the transcript plumbing (the weekly skill has its own); it reads
`~/.claude/projects/<encoded cwd>*/<session id>.jsonl`, folds in `<session id>/subagents/*.jsonl`
(the edits and commands a session ran through a subagent) and prints JSON. It never uploads or
writes anything. Never open a `.jsonl` yourself.

## Digest

```
python3 .claude/skills/taddy-commit/scripts/work-sessions.py --cwd "$PWD" [--since ISO] [--files a,b,c] [--self ID]
```

Defaults: `--since` = the last commit's committer date (`git log -1 --format=%cI`; the epoch
when the repo has no commit); `--files` = the paths `git status --porcelain` lists (renames:
the new path); `--repo` = `--cwd`, where git runs; `--self` = `$CLAUDE_CODE_SESSION_ID`, this
conversation's id, which Claude Code sets in Bash. Pass them only to test, or when the repo is
not where the transcripts say it is.

A session belongs to the repo when its first message's `cwd` is the repo or a directory under
it (a session started in `apps/web` counts; a sibling repo does not). It is kept when

- `touched` is non-empty — it edited one of the uncommitted files with `Edit`, `Write`,
  `MultiEdit` or `NotebookEdit` (`file_path` / `notebook_path`, made relative to the repo)
  **after that file's last commit**; an edit older than the file's last commit lands in
  `touchedBeforeCommit` instead, because it is most likely already committed; or
- `mentioned` is non-empty — a Bash command of the session names one of the uncommitted files
  (a heredoc, `sed -i`, a script that writes it), and the session ended after that file's last
  commit. Weaker than `touched`: a `cat` of the file counts too, so read the dump before
  trusting it; or
- `afterLastCommit` is true — its last message is after `--since`.

Output, sessions sorted by `start`:

| Field | Meaning |
| --- | --- |
| `since`, `cwd`, `uncommittedFiles` | what the digest judged against |
| `currentSession`, `currentSessionInDigest` | `--self`: this conversation's id (null when unset) and whether it is among the kept sessions |
| `sessions[].sessionId`, `path`, `start`, `end`, `date`, `branch`, `title` | identity; `--dump` takes the id; the id is also the archive file id the weekly pass uploads under |
| `sessions[].current` | true for this conversation: never dumped, its recap is in context; its id goes last in the trailers |
| `sessions[].subagentFiles` | how many `<id>/subagents/*.jsonl` were folded into `editedFiles`, `touched`, `mentioned` and `commits` |
| `sessions[].firstHumanMessage` | the first human turn (≤ 2 000 characters), shown when planning the commits |
| `sessions[].editedFiles`, `touched` | every file the session edited; the uncommitted ones among them, edited after the file's last commit |
| `sessions[].touchedBeforeCommit` | uncommitted files the session edited before their last commit (probably already in) |
| `sessions[].mentioned` | uncommitted files a Bash command names after their last commit, not already in the two above |
| `sessions[].afterLastCommit` | true when the session ran on after the last commit |
| `fileLastCommit` | each uncommitted file's last commit date, null for a file never committed |
| `sessions[].commits` | in-session `git commit` calls with `sha`, `subject`, `ok`, `suspect` |
| `sessions[].humanTurns`, `toolUses` | size hints |
| `unmatchedFiles` | uncommitted files no session touched or mentioned: by hand, or in another tool |
| `skipped`, `skippedCounts` | `before-last-commit` and `other-cwd` are only counted; `no-messages` / `parse-error` are listed |

Which sessions count: never dump the one marked `current: true`, this conversation (when
`currentSession` is null, it is the one whose `firstHumanMessage` is this conversation's first
message, and say so); drop any other session with empty `touched` and `mentioned` and no
successful commit after the last commit (a question answered, a look around, an attempt
reverted before now). Such a session gets no dump and no trailer; a session is allowed to stay
linked to no commit.

## Dump

```
python3 .claude/skills/taddy-commit/scripts/work-sessions.py --cwd "$PWD" --dump <session id>
```

```
session <id> | <date> | branch <branch> | <title> | <n> turns
[H 09:14] <human turn, up to --max-chars>
[A 09:15] <assistant text, up to --max-chars> …(+N chars)
[tools 09:16] Bash×3 Edit×2
[… skipped N turns …]
```

It skips thinking, tool inputs, tool results, attachments and injected lines. The last
`--keep-tail` (5) assistant messages get three times the cap so the closing recap survives;
beyond `--max-turns` (80) it keeps the first third and the last two thirds. Summarise each
session right after its dump (≤ 200 words: first human message, what was tried, what happened,
what was decided, files touched), then move on; do not keep dumps around.

## Grouping work into commits

Several sessions per commit is the normal case for iterative work. In order of precedence:

1. What the user asked for ("one commit", "split the parser from the styling").
2. One unit is one change a reviewer could review or revert on its own, judged by what the
   work is (`references/splitting.md`): a session, this conversation included, that did two
   things is two units, and a subject that would need "and" means two.
3. Sessions sharing a `touched` (or `mentioned`) file are usually one unit, unless their
   recaps show two changes that happen to touch the same file: then split the file by hunk.
4. Sessions on the same topic (titles, first human messages, same branch, back to back) are
   one unit even with disjoint files.
5. Anything else is its own unit. A session whose files fall in two units gives each file, or
   each hunk, to the unit its work belongs to.
6. This conversation is a session like the others when it did work: its files join the unit
   they belong to and its id goes last in that unit's trailers. Its files never count as
   `unmatchedFiles`, even when the digest lists them there (an edit made through a worktree
   or a Bash script).

`unmatchedFiles` are never guessed: ask which commit they join, or what they are. Show the
table commit → files → sessions and confirm it when there is more than one commit, more than one
session behind a commit, or any unmatched file.

## The body and trailers for a commit with several sessions

- The body = one recap merged from the sessions' closing recaps and your summaries, in `start`
  order: what was done, what was found, what was decided and why, what is next, within the
  8-line, 72-column limit: with several sessions behind one commit, one or two plain
  sentences per session, the numbers kept. Nothing the dumps do not state. Files with no session get a sentence that says only what changed.
- The trailers = `SRED-Project: <id>` from the Project step, then one
  `Work-Session: <sessionId>` per session, in `start` order, this conversation last when it
  did any of the work. That is how the weekly pass joins the commit to these sessions, and
  each id is the file id its archived transcript gets.

## Example 1: one session, one commit

`git status` lists `src/artwork.ts`. The digest keeps session `bbbbbbbb-…` with
`touched: ["src/artwork.ts"]` and `firstHumanMessage` "Why does the episode page artwork fail to
load after the image migration?". Its dump ends "Done: the suffix is appended again in
artwork.ts. Left uncommitted." One commit, body "The CDN URL lost its size suffix after the
image migration. The suffix is appended again in artwork.ts.", `SRED-Project: 5` +
`Work-Session: bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb`, shown for approval.

## Example 2: two sessions, one commit

`git status` lists `src/styles/player.css`, `src/styles/nav.css` and `src/styles/tokens.css`.
Sessions `ffffffff-…` (player bar: 6px track, 44px hit area; touched `player.css`) and
`99999999-…` (align nav and player greys on `--surface-2`; touched `nav.css`, `player.css`;
mentioned `tokens.css`, written by a Bash heredoc) share `player.css` and restyle the same bar,
so they are one unit. Subject "Restyle the player bar to match the nav". Body: "Widened the player's progress track from 2px to 6px and gave the play
button a 44px hit area for mobile. Replaced the two hard-coded greys in nav.css and player.css
with var(--surface-2), defined once in the new tokens.css, so the nav and the player bar
match." Trailers `SRED-Project: 5` +
`Work-Session: ffffffff-6666-4666-8666-ffffffffffff` +
`Work-Session: 99999999-7777-4777-8777-999999999999`. With `src/artwork.ts` also uncommitted,
the plan is two commits: this one and Example 1's, each shown and approved one at a time.

## Example 3: an earlier session plus this conversation

`git status` lists `src/styles/player.css`, `src/styles/nav.css` and `src/styles/tokens.css`.
The digest keeps `ffffffff-…` (player bar; touched `player.css`) and this conversation,
marked `current: true` (`currentSession` = `$CLAUDE_CODE_SESSION_ID`), which aligned the greys
here: `nav.css` under its `touched`, `tokens.css` under `unmatchedFiles` because a Bash script
wrote it. Only `ffffffff-…` is dumped. One unit (same topic, back to back), subject "Restyle the player
bar to match the nav": body merged from
ffffffff's recap then this conversation's, trailers `SRED-Project: 5` +
`Work-Session: ffffffff-6666-4666-8666-ffffffffffff` + `Work-Session: <this conversation's id>`,
shown for approval.

## Why the trailers matter

Without the `Work-Session` lines the weekly report can only join a commit to the conversation
that ran `git commit`, so a commit-only conversation would be listed as the work and the real
sessions shown with no commit.
