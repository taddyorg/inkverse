# `work-sessions.py`

The only view of a transcript this skill uses, for the commit-only conversation: a fresh
conversation whose first human message is the commit request and whose files were changed in
earlier sessions. The script is this skill's own copy of the transcript plumbing (the weekly
skill has its own); it reads `~/.claude/projects/<encoded cwd>*/<session id>.jsonl` and prints
JSON. It never uploads or writes anything. Never open a `.jsonl` yourself.

## Digest

```
python3 .claude/skills/taddy-commit/scripts/work-sessions.py --cwd "$PWD" [--since ISO] [--files a,b,c]
```

Defaults: `--since` = the last commit's committer date (`git log -1 --format=%cI`; the epoch
when the repo has no commit); `--files` = the paths `git status --porcelain` lists (renames:
the new path); `--repo` = `--cwd`, where git runs. Pass them only to test, or when the repo is
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
| `sessions[].sessionId`, `path`, `start`, `end`, `date`, `branch`, `title` | identity; `--dump` takes the id |
| `sessions[].firstHumanMessage` | the first human turn (≤ 2 000 characters): the `classify_work` text |
| `sessions[].editedFiles`, `touched` | every file the session edited; the uncommitted ones among them, edited after the file's last commit |
| `sessions[].touchedBeforeCommit` | uncommitted files the session edited before their last commit (probably already in) |
| `sessions[].mentioned` | uncommitted files a Bash command names after their last commit, not already in the two above |
| `sessions[].afterLastCommit` | true when the session ran on after the last commit |
| `fileLastCommit` | each uncommitted file's last commit date, null for a file never committed |
| `sessions[].commits` | in-session `git commit` calls with `sha`, `subject`, `ok`, `suspect` |
| `sessions[].humanTurns`, `toolUses` | size hints |
| `unmatchedFiles` | uncommitted files no session touched or mentioned: by hand, or in another tool |
| `skipped`, `skippedCounts` | `before-last-commit` and `other-cwd` are only counted; `no-messages` / `parse-error` are listed |

Two sessions to drop before dumping: the one whose `firstHumanMessage` is this conversation's
own request (the current transcript is on disk while the skill runs), and any with empty
`touched` and `mentioned` and no successful commit after the last commit (a question answered,
a look around).

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

## Grouping sessions into commits

Several sessions per commit is the normal case for iterative work. In order of precedence:

1. What the user asked for ("one commit", "split the parser from the styling").
2. Sessions sharing a `touched` (or `mentioned`) file are one unit.
3. Sessions on the same topic (titles, first human messages, same branch, back to back) are
   one unit even with disjoint files.
4. Anything else is its own unit. A session whose files fall in two units gives each file to
   the unit its work belongs to.

`unmatchedFiles` are never guessed: ask which commit they join, or what they are. Show the
table commit → files → sessions and confirm it when there is more than one commit, more than one
session behind a commit, or any unmatched file.

## The classify text and the body for a commit with several sessions

- `classify_work.text` = the sessions' `firstHumanMessage` values in `start` order, separated by
  a blank line, trimmed to 8 000 characters. Say which sessions were used.
- The body = one recap merged from the sessions' closing recaps and your summaries, in `start`
  order: what was done, what was found, what was decided and why, what is next. Nothing the
  dumps do not state. Files with no session get a sentence that says only what changed.
- The trailers = the SRED lines, then one `Work-Session: <sessionId>` per session, in `start`
  order. That is how the weekly pass joins the commit to these sessions.

## Example 1: one session, one commit

`git status` lists `src/artwork.ts`. The digest keeps session `bbbbbbbb-…` with
`touched: ["src/artwork.ts"]` and `firstHumanMessage` "Why does the episode page artwork fail to
load after the image migration?". Its dump ends "Done: the suffix is appended again in
artwork.ts. Left uncommitted." One commit, `classify_work` on that first message (production,
0.75), body "The CDN URL lost its size suffix after the image migration; the suffix is appended
again in artwork.ts.", `SRED: no` + `SRED-Exclusion: production` +
`Work-Session: bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb`, shown for approval.

## Example 2: two sessions, one commit

`git status` lists `src/styles/player.css`, `src/styles/nav.css` and `src/styles/tokens.css`.
Sessions `ffffffff-…` (player bar: 6px track, 44px hit area; touched `player.css`) and
`99999999-…` (align nav and player greys on `--surface-2`; touched `nav.css`, `player.css`;
mentioned `tokens.css`, written by a Bash heredoc) share `player.css`, so they are one unit. `classify_work` gets

```
Restyle the player bar: the progress track is 2px and hard to grab on mobile, make it 6px and give the play button a 44px hit area

The nav and the player bar use different greys now, align both on the --surface-2 token
```

(routine, 0.8). Body: "Widened the player's progress track from 2px to 6px and gave the play
button a 44px hit area for mobile. Replaced the two hard-coded greys in nav.css and player.css
with var(--surface-2), defined once in the new tokens.css, so the nav and the player bar
match." Trailers `SRED: no` + `SRED-Exclusion: routine` +
`Work-Session: ffffffff-6666-4666-8666-ffffffffffff` +
`Work-Session: 99999999-7777-4777-8777-999999999999`. With `src/artwork.ts` also uncommitted,
the plan is two commits: this one and Example 1's, each classified on its own, shown and
approved one at a time.
