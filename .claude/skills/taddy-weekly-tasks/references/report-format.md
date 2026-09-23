# The weekly report

Step 6 of the pass renders one markdown file at the product repo's root,
`TADDY-SRED-REPORT-<from>-<to>.md`, with `scripts/report.py`. It is the deliverable for the
SR&ED admin, who reads it, decides what is SR&ED and creates the tasks in the app. It is never
uploaded by the skill, never hand-edited (change the inputs and re-render) and never committed.

## Format

```markdown
# Taddy SR&ED report <from> → <to>
- Author: <whoami.name>
- Repo: <repo short name, from commits.json>
- Generated: <YYYY-MM-DD>

## Journal

<the journal, verbatim from journal.md>

## Conversations

### <date> · <title, else the first words of the first human message> · `<session id>`
- Date: <date> (week of <weekStart>)
- Branch: <branch>
- Commits: <repo>@<short> <subject> (trailer | in-session); … | none
- Project: <id> (<code> <name>)[, …][, Unknown] — from the SRED-Project trailer | Unknown
- Archived: yes (<archiveName>) | already (archived earlier) | no — <reason>

<the session's recap, verbatim from recaps.json>

## Commits

### <date> · <repo>@<short> · <subject>
- Project: <id> (<code> <name>) — SRED-Project trailer | Unknown (no SRED-Project trailer)
- Sessions: `<session id>` (trailer | in-session[, not in range]); … | none

<the commit body, verbatim, or "(no body)">
```

- Conversations are in `start` order, one `###` per session in `sessions.json`, uploaded or not.
- A conversation's `Commits` are the commits whose `sessionIds` hold it. Each is suffixed with
  how the join was made: `trailer` when the session is one of the commit's `Work-Session`
  trailers, `in-session` when the digest saw the session run that `git commit`.
- A conversation's `Project` lists the distinct `projectId`s of those commits, in order, then
  `Unknown` when one of them has no trailer; a conversation with no commit is `Unknown`. A
  project id that is not in `projects.json` renders as `<id> (not visible to you)`.
- `Archived` comes from the flags: `--archived` (uploaded in this run, with the archive name),
  `--already` (returned by `list_files`), `--failed "<id>=<reason>"` (an upload that failed), else
  `no — not uploaded`.
- Commits are in date order, one `###` per commit in `commits.json`; a session id under a commit
  that is not in `sessions.json` is marked `not in range`.
- Nothing in the file is classified as SR&ED or routine, and nothing carries hours.

## What `report.py` enforces

Exit 1, one `error:` per line on stderr, nothing on stdout:

- a session in `sessions.json` with no recap (or an empty one) in `recaps.json`;
- an empty `journal.md`;
- an input that is missing or is not JSON.

Warnings, one `warning:` per line on stderr, with the report still rendered:

- a recap over 1 500 characters (about 200 words);
- a `projectId` that is not in `projects.json`;
- a recap keyed by a session id that is not in `sessions.json` (ignored);
- every `warnings` line from `commits.json` (a bad `SRED-Project` value, a `Work-Session` id
  not in the digest).

## Writing the journal

One journal for the whole range, in `journal.md`, for someone who was not there.

- It is about the work, not the person. The subject of a sentence is the thing worked on: "The
  overlap set was re-run on pyannote 3.1; DER fell from 21% to 17%, and two-speaker crosstalk
  still merged." Not "I tried pyannote 3.1" and not "we".
- Plain language, in the order it happened: what was built or changed, what was tried, what
  happened (with the numbers exactly as the sessions state them), what was decided and why,
  what was left open.
- Every conversation and commit in the range is covered, the small ones in a clause. No split
  by project, no SR&ED vocabulary (no "uncertainty", "experiment", "routine"), no hours, no
  list of files or commands.
- Nothing that the recaps and commit bodies do not show. A failed attempt is stated as tried
  and not working.

## Writing a recap

One per session, at most 200 words, in `recaps.json`, from the dump alone: what the
conversation was about (the first human message), what was tried, what happened, what was
decided, and which commits it made (`commits` in the digest). Same voice as the journal: the
work is the subject, the numbers are the author's. A session that only asked a question or
only ran a commit gets two or three sentences that say so.

## Full example

Inputs: the fixture digest (sessions `aaaaaaaa-…` on 2026-09-15, `bbbbbbbb-…` on 2026-09-16,
`eeeeeeee-…` on 2026-09-17), the fixture repo's four commits, `projects.json` with
`TP-03 Diarization` (3) and `Web app` (5), sessions a and b uploaded, e already archived.

```markdown
# Taddy SR&ED report 2026-09-14 → 2026-09-20
- Author: Dev
- Repo: fixture
- Generated: 2026-09-21

## Journal

The diarization pipeline moved from pyannote 2.1 to 3.1 on the 40-clip overlap set: DER fell
from 21% to 17%, but two-speaker crosstalk is still merged into one segment. A 0.3 s minimum
segment length on top of 3.1 left DER unchanged and only cut short correct segments, so it was
dropped; 3.1 stays because the gain is in the model, not the post-processing. Crosstalk is
still open.

The episode page had stopped showing podcast artwork: the CDN URL had lost its size suffix in
the image migration. The suffix is appended again in artwork.ts.

A loading skeleton for the podcast page was started on feat/skeleton and left uncommitted.

## Conversations

### 2026-09-15 · Pyannote 3.1 diarization overlap experiment · `aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa`
- Date: 2026-09-15 (week of 2026-09-14)
- Branch: develop
- Commits: fixture@1a2b3c4 Try pyannote 3.1 for diarization on overlapping speech (trailer)
- Project: 3 (TP-03 Diarization) — from the SRED-Project trailer
- Archived: yes (2026-09-15-pyannote-3-1-diarization-overlap.jsonl)

The 3.1 pipeline replaced 2.1 on the 40-clip overlap set. DER went from 21% to 17%; crosstalk
between two speakers was still merged. A 0.3 s minimum segment length was tried and changed
nothing, so it was dropped. Committed as "Try pyannote 3.1 for diarization on overlapping
speech" with 3.1 kept and no filter.

### 2026-09-16 · Fix episode artwork CDN suffix · `bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb`
- Date: 2026-09-16 (week of 2026-09-14)
- Branch: develop
- Commits: fixture@e55aa4d Fix podcast artwork not loading on the episode page (trailer)
- Project: 5 (Web app) — from the SRED-Project trailer
- Archived: yes (2026-09-16-fix-episode-artwork-cdn-suffix.jsonl)

The episode page artwork was not loading. The CDN URL had lost its size suffix after the image
migration; artwork.ts now appends it again. Left uncommitted; committed later from another
conversation.

### 2026-09-17 · Add a loading skeleton to the podcast page · `eeeeeeee-5555-4555-8555-eeeeeeeeeeee`
- Date: 2026-09-17 (week of 2026-09-14)
- Branch: feat/skeleton
- Commits: none
- Project: Unknown
- Archived: already (archived earlier)

A loading skeleton for the podcast page: placeholder blocks for the artwork, title and
episode list while the feed loads, no behaviour yet. Nothing was committed.

## Commits

### 2026-09-15 · fixture@1a2b3c4 · Try pyannote 3.1 for diarization on overlapping speech
- Project: 3 (TP-03 Diarization) — SRED-Project trailer
- Sessions: `aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa` (trailer)

Ran the 3.1 pipeline on the overlap set. DER 21% -> 17%, crosstalk still merged.

Keeping 3.1: the gain is in the model.

### 2026-09-16 · fixture@e55aa4d · Fix podcast artwork not loading on the episode page
- Project: 5 (Web app) — SRED-Project trailer
- Sessions: `bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb` (trailer); `cccccccc-3333-4333-8333-cccccccccccc` (trailer, not in range)

The CDN URL lost its size suffix.

### 2026-09-17 · fixture@9f8e7d6 · Commit made by hand with no trailer
- Project: Unknown (no SRED-Project trailer)
- Sessions: none

(no body)
```
