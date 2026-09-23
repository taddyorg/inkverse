# Commit message format

Read this before writing the message. The subject says what changed; the body is the recap of
the work; the trailers say which project it belongs to and which sessions did the work.
Nothing in the body may come from anywhere but the conversation(s) behind the commit: this
one, and the earlier work sessions `work-sessions.py` found. The whole message is shown and approved before `git commit` runs.

## Subject

One line, imperative ("Try", "Fix", "Add"), what changed, at most 72 characters, no trailing
period. No file list and no trailing detail: if it does not fit, cut words, not the verb.

The subject names one change. Write it first: if it needs "and" (or a comma list) to join two
changes, the work is two commits, so go back to the plan (`references/splitting.md`). An
"and" inside one change is fine ("Align the nav and player greys"), and a subject that names
the change beats one that lists its parts.

## Body

The recap of the work being committed: the same recap you close a turn with, written for the
person reading `git log` later. It covers the conversation's work since its last commit (the
whole conversation on the first commit). In a commit-only conversation it is seeded by the
work sessions' closing recaps (the last assistant messages in each dump) and your summaries,
merged into one recap in start order when several sessions make up the commit.

Say, in this order, whatever applies, in one or two sentences each:
- what was done or built;
- what was found: the result, its numbers, and an attempt that did not work;
- what was decided, and why;
- what is next, only if something was left open and there is room.

Rules:
- One paragraph, at most 8 lines, no line wider than 72 characters (about 100 words). Git
  does not wrap, so wrap by hand at 72. No list, no headings, no markdown emphasis, no links
  unless the user gave them.
- Plain sentences: one idea per sentence, about 20 words, each with a verb. No semicolons, no
  "a / b" slashes, no parenthetical asides, no arrows. Say what a thing is instead of naming
  it; name a file, flag or tool only when the reader has to go there, at most one per
  sentence. Never compress two sentences into one to fit.
- Over 8 lines: drop the least important sentence whole (usually "what is next"), never a
  number, a failed attempt or a decision. The detail stays in the transcript, which the weekly
  report recaps too. Two changes that will not fit in 8 lines are a sign the commit should be
  two (`references/splitting.md`).
- Keep the user's numbers and names exactly; do not round or rename.
- Never invent a result or an attempt. A failed attempt is still recorded: what was tried and
  that it did not work.
- A small change (a bug fix, a config bump) gets one or two sentences: what changed and why.
- A file no session and no in-context work stands behind gets a sentence that says only what
  changed; nothing about why unless the user said it.
- Whether the work is SR&ED is not stated as a trailer. If the user wants it noted, it goes in
  the body in their words; the admin decides from the weekly report.

## Readable, not dense

The body is read by the SR&ED admin, off the report, without the conversation. A body cut to
size by packing clauses is worse than a longer one. Two changes squeezed into one commit
(the subject needed "and") came out like this:

```
Tag commits with a project and turn the weekly pass into a report

taddy-commit takes the project from the request, matched by one
list_projects call and stamped as SRED-Project; it no longer classifies
or writes SRED / SRED-Exclusion. Every commit lists its sessions as
Work-Session lines, subagent edits included, and bodies are capped at 5
lines of 72. The weekly pass now only writes TADDY-SRED-REPORT-*.md.
```

The same facts are two commits, each in plain sentences:

```
Stamp the project and every work session on each commit

The commit request now names the SR&ED project. The skill matches it
against one list_projects call and writes the id as SRED-Project. It
no longer classifies the work, so the SRED and SRED-Exclusion trailers
are gone and the admin decides from the weekly report. Every commit
also lists each session that did the work as a Work-Session line,
including edits a session made through a subagent.
```

```
Turn the weekly pass into a report for the admin

The weekly pass now writes one report file for the range and nothing
else. It no longer picks projects, classifies work, writes journals or
creates tasks. The admin does that in the app from the report, which
lists every conversation with its recap and every commit with its
project.
```

## Trailers

After a blank line, as the final paragraph, before any attribution trailers the harness adds.
First, on every commit, the project the Project step resolved from the user's words with
`list_projects` (`references/project.md`), the numeric id only:

```
SRED-Project: 3
```

Then one `Work-Session` line per session behind the commit, in the sessions' `start` order:
the `sessionId` from the `work-sessions.py` digest for each earlier session and, last, this
conversation's own id (`$CLAUDE_CODE_SESSION_ID`, the digest's `currentSession`) whenever it
did any of the work. Never the `session_…` id of the `Claude-Session:` URL the harness adds:
that is a different id. The value is the transcript's uuid, which is also the id the weekly
pass archives the transcript under, so the commit names the transcripts behind it.

```
SRED-Project: 5
Work-Session: ffffffff-6666-4666-8666-ffffffffffff
Work-Session: 99999999-7777-4777-8777-999999999999
```

A commit-only conversation (no edit made here) lists the sessions that did the work and not
itself. A commit of work done only in this conversation has one line, its own id.

No `SRED:` or `SRED-Exclusion:` line is ever written by this skill.

## Example 1 — experimental work

Committed at the end of the conversation that did it, whose id is `aaaaaaaa-…`.

```
Try pyannote 3.1 for diarization on overlapping speech

Ran pyannote 3.1 instead of 2.1 on the 40-clip overlap set: DER fell
from 21% to 17%, but two-speaker crosstalk still merges into one
segment. A 0.3 s minimum segment length on top left DER unchanged and
only cut short correct segments. Keeping 3.1 without the filter: the
gain is in the model, not post-processing. Crosstalk stays open.

SRED-Project: 3
Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
```

## Example 2 — a bug fix

Same conversation shape: the fix was made here, so the only session is this one.

```
Fix podcast artwork not loading on the episode page

The CDN URL lost its size suffix after the image migration.

SRED-Project: 5
Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
```

## Example 3 — the same fix, committed in a commit-only conversation

Session `bbbbbbbb-…` did the work and left it uncommitted; a fresh conversation commits it
with "commit the artwork fix to Web app". The committing conversation did no work, so its own
id is not listed.

```
Fix podcast artwork not loading on the episode page

The CDN URL lost its size suffix after the image migration. The suffix
is appended again in artwork.ts.

SRED-Project: 5
Work-Session: bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb
```

## Example 4 — earlier session plus this conversation

Session `ffffffff-…` restyled the player bar (6px track, 44px hit area) and left
`player.css` uncommitted; this conversation (`aaaaaaaa-…`) then aligned the nav and player
greys on `--surface-2` in `nav.css` and a new `tokens.css`, and the user says "commit the
styling to Web app". The digest keeps `ffffffff-…` (touched `player.css`) and marks this
conversation `current`; one unit, one commit, the body merged from ffffffff's recap (dumped)
and this conversation's recap, in that order. Two sessions on one change are one unit; two
changes in one session are two commits (`references/splitting.md`).

```
Restyle the player bar to match the nav

Widened the player's progress track from 2px to 6px and gave the play
button a 44px hit area for mobile. Replaced the two hard-coded greys in
nav.css and player.css with var(--surface-2), defined once in the new
tokens.css, so the nav and the player bar match.

SRED-Project: 5
Work-Session: ffffffff-6666-4666-8666-ffffffffffff
Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
```

## How the weekly pass reads it

`taddy-weekly-tasks` runs `git log` with
`--format='%H%x1f%h%x1f%aI%x1f%ae%x1f%s%x1f%B%x1f%(trailers:key=SRED,valueonly)%x1f%(trailers:key=SRED-Exclusion,valueonly)%x1f%(trailers:key=Work-Session,valueonly)%x1f%(trailers:key=SRED-Project,valueonly)%x1e'`
and writes each commit into the weekly report for the SR&ED admin: the body verbatim under the
commit, the `SRED-Project` id as the commit's project (`Unknown` when the trailer is missing or
not a number; the pass never picks one), and the `Work-Session` ids as the conversations behind
it, marked `trailer`. The body is short by design: the report carries a recap of each session
too, so an 8-line recap that keeps the number, the failed attempt and the decision is enough.
Nothing is classified in the pass; the admin decides SR&ED versus routine from the report and
creates the tasks in the app. Without `Work-Session` lines the pass falls back to the session
whose in-session `git commit` produced the commit (matched by sha, else subject), marked
`in-session`.
