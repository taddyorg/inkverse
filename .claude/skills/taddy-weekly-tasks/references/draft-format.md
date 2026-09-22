# The SRED-DRAFT file

Step 6 of the pass writes one markdown file at the product repo's root,
`SRED-DRAFT-<from>-<to>.md`, for the person to edit and confirm. `scripts/draft.py check <file>`
validates it and emits the `put_journal` / `create_tasks` payloads. The file is scratch: it is
deleted after Step 7 and never committed.

## Grammar

```
# SR&ED draft <from> → <to>
<!-- one comment with editing instructions -->

## <free heading> <!-- project:<id> week:<YYYY-MM-DD> -->

### Journal

<!-- existing journal, kept from an earlier pass or the dashboard; edit but do not drop -->   (only when one exists)
<the journal body, plain text, any number of paragraphs>

### Task <n>
- kind: experiment | decision | routine
- date: YYYY-MM-DD
- sources: file <session id>; commit <repo>@<sha> — <subject>; url <https://…>

<the task body, plain text>
```

- One `##` section per project and week. The heading text is free; the HTML comment carries the
  machine ids: `project:` the project id, `week:` its Monday. Keep the comment.
- `### Journal` once per section, then the body until the next `###`.
- One `### Task …` block per task. The three field lines come first, then a blank line, then the
  body until the next `###` or `##`. `sources` is optional; `kind` and `date` are required.
- `sources` are `;`-separated. Each is `<type> <ref>`, optionally followed by ` — <label>` (an em
  dash, or ` -- `). Types: `file` (an archived session id), `commit` (`<repo>@<7–40 hex>`), `url`
  (`http(s)://…`). At most 20.
- Deleting a task block drops that task. Deleting a section drops that project-week. Task numbers
  need not be contiguous. HTML comments anywhere are stripped from bodies.

## What `draft.py check` enforces

- every `##` section carries its `project:` / `week:` comment; `week` is a Monday;
- each task `date` falls in its section's week and is not in the future;
- `kind` is `experiment`, `decision` or `routine`; bodies and journals are non-empty and at most
  20 000 characters; at most 20 tasks per section (the `create_tasks` limit);
- source syntax as above; a session id cited under two projects is a warning (it is uploaded
  under the first).

On success it prints:

```json
{ "sections": [ { "projectId": 3, "weekStart": "2026-09-14", "heading": "…",
                  "journal": { "body": "…" },
                  "tasks": [ { "kind": "experiment", "date": "2026-09-15", "body": "…",
                               "sources": [ { "type": "file", "ref": "<session id>" },
                                            { "type": "commit", "ref": "taddy@<sha>", "label": "<subject>" } ] } ],
                  "fileSources": [ "<session id>", … ] } ],
  "warnings": [] }
```

`journal` is the `put_journal` body for `{ projectId, weekStart }`; `tasks` is the `create_tasks`
list for that section's journal id; `fileSources` are the sessions to upload first.

## Writing the draft

- **Journal**: plain language, first person, the author's voice. What was tried, what happened,
  what was decided, in the order it happened. No SR&ED vocabulary, no categories. End with
  `Not SR&ED this week:` and one line per routine slice with its category in parentheses
  (`routine` or `production`) — no hours; the admin rules on hours in the dashboard.
- **An existing journal** (Step 1's `list_my_journals` had a body for the section's project
  and week — another repo's pass, a re-run, or the dashboard): the section starts with the
  marker comment shown in the grammar, then that body verbatim, a blank line, then the new
  paragraphs. The comment is stripped by `draft.py`, so it never reaches the app. Keep a single
  `Not SR&ED this week:` block: move the existing one to the end and add the new lines under it.
  `put_journal` replaces the whole body, so dropping the existing text deletes it.
- **Task body**: what the work was about, what was tried, what happened, what was decided. The
  commit's recap (its body) seeds it; the session summary fills it in. Keep the numbers exactly.
  A failed attempt is still an experiment.
- **Task kind**: `routine` when the commit says `SRED: no` (or `classify_work` said so);
  otherwise `experiment` when the commit's recap or the sessions show anything run, built or
  tried, `decision` only when they show a choice with nothing run.
- **Task date**: the commit's day; the last session's day for uncommitted work.
- **Task sources**: `file <session id>` for every session behind it, `commit <repo>@<sha> — <subject>`
  for the commit, `url` for links the work produced or cited.

## Full example

```markdown
# SR&ED draft 2026-09-14 → 2026-09-20
<!-- Edit freely. Keep the "##" section lines with their comments, the "### Journal" and "### Task" headings and the field lines under each task. Delete a task block to drop it. Save, then tell Claude "confirmed" (or "cancel"). -->

## TP-03 Diarization — week of 2026-09-14 <!-- project:3 week:2026-09-14 -->

### Journal

This week I tried pyannote 3.1 on the overlap set. DER went from 21% to 17%, but crosstalk is
still merged. A minimum segment length did nothing, so I dropped it.

Not SR&ED this week: episode artwork CDN fix (production).

### Task 1
- kind: experiment
- date: 2026-09-15
- sources: file 4c3af633-9c1e-4b1a-9d1e-2f1a3b4c5d6e; commit taddy@c0d693f8 — Try pyannote 3.1 for diarization on overlapping speech

Tried the 3.1 pipeline on the 40-clip overlap set in place of 2.1. DER 21% → 17%; two-speaker
crosstalk still merged. Tried a 0.3 s minimum segment length: DER unchanged. Decided to keep 3.1
and drop the filter because the gain is in the model.

### Task 2
- kind: routine
- date: 2026-09-16
- sources: file 1a2b0e63-7d2f-4e5a-8b9c-0d1e2f3a4b5c; commit taddy@e55aa4d1 — Fix podcast artwork not loading on the episode page

The CDN URL lost its size suffix after the image migration. Added the suffix back in artwork.ts.
```
