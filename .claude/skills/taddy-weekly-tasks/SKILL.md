---
name: taddy-weekly-tasks
description: The SR&ED evidence pass for a Taddy product repo over a range of days. Use this skill whenever the user runs /taddy-weekly-tasks, asks for the weekly SR&ED pass, wants last week's or this week's work filed as tasks, wants their journal drafted from their Claude Code sessions and commits, or wants their Claude Code transcripts archived to the SR&ED app. It digests the local transcripts, reads the range's commits and their SRED trailers, picks the project for each unit of work with pick_project, writes one editable draft file, and after confirmation writes the journal, uploads redacted transcripts and creates the tasks. Not for committing (that is taddy-commit), logging or checking hours, the hours split, drafting T661 narratives, or listing tasks.
metadata:
  version: "0.1.0"
  updated: "2026-09-21"
  source: "https://github.com/taddyorg/taddy-internal-skills"
---

# Taddy weekly tasks skill

CONFIDENCE_THRESHOLD = 0.6
PROJECT_CONFIDENCE_THRESHOLD = 0.6

Runs in the product repo. Its goal is the journal and the tasks, and which conversation belongs
to which task. It never reads, writes or estimates hours: the hours split and the review are done
in the dashboard. Helper scripts live in the `scripts/` folder beside this file
(`.claude/skills/taddy-weekly-tasks/scripts/`); run them with `python3` / `bash` from the repo
root and read their JSON. Never open a `.jsonl` transcript directly: the digest and the dump are
the only views of a session this skill uses.

## Range

`/taddy-weekly-tasks [start] [end]`, two `YYYY-MM-DD` days. Defaults: start = the latest Monday
(today if today is a Monday), end = today. Every script takes `--from` / `--to` with the same
defaults and prints `range.from` / `range.to`; use those for every `from` / `to` below. Journals
are keyed by week, so when the range crosses a Monday, group the work by the Monday of its date
(`weekStart` in the script output): one journal per project per week, each task under the journal
of its own week.

## Step 1: context

1. `whoami` — the author's name and `isAdmin` (informational).
2. `list_projects` — the active projects the author can see. Show `code`, `name` and
   `description`: they are what `pick_project` judges on.
3. `list_sources({ from, to })` — what is already filed. Collect the `file` refs (session ids)
   and the shas from the `commit` refs (`<repo>@<sha>`); Steps 2 and 3 exclude them, so a re-run
   handles only new work. If anything came back, this range was filed before: see Gotchas.
4. `list_my_journals({ from, to })` — the journals you already have for the range's weeks. Keep
   a map `(projectId, weekStart) → body`; Step 6 puts each existing body at the top of its
   section so `put_journal` never replaces it. A journal can exist with nothing in
   `list_sources`: another product repo's pass on the same project, or the dashboard.

Nothing else. Archived transcripts for the range are what this skill creates.

## Step 2: sessions

```
python3 scripts/sessions.py --cwd "$PWD" --from <from> --to <to> --exclude <filed session ids, comma-separated>
```

For each session in `sessions` (excluded ones sit in `skipped` as `already-filed`), run
`python3 scripts/sessions.py --cwd "$PWD" --dump <sessionId>` and write, before dumping the
next, a summary of at most 200 words: what it was about, what was tried, what happened, what was
decided, plus the in-session commits from `commits`. Keep the author's numbers and names. The
dump keeps the last assistant messages in full, where the session's closing recap lives; lean on
it. These summaries seed the journal and the task bodies. Line shapes and what the digest derives:
`references/transcript-format.md`.

## Step 3: commits and units of work

```
python3 scripts/commits.py --from <from> --to <to> --exclude <filed shas, comma-separated> --join sessions.json
```

(save the Step 2 output as `sessions.json` first.) Each commit in `commits` is one candidate,
with its sessions in `sessionIds`: first the commit's `Work-Session` trailers (`matchedBy:
trailer` — a commit-only conversation committed for them; the conversation that ran `git commit`
follows them and is not the work), then the session whose in-session `git commit` produced it
(sha, else subject). A trailer id `warnings` reports as not in `sessions.json` is outside the
range, already filed or from another machine: cite it without re-uploading when it is under
`skipped` as `already-filed`, otherwise leave it out of `sources` and say so. Every session in
`uncommittedSessions` is a candidate too: one per session, or one per run of sessions on the
same work (same branch, same topic — your call, say so). `repo` is the short name for `commit`
sources, taken from the git remote.

## Step 4: project per candidate

For each candidate call `pick_project({ text })`, `text` = the first human message of the first
session in `sessionIds` (never a commit-only conversation's own request), a blank line, then
the commit subject when there is one (a commit with no
session: subject + body). Cache by session: a session's commits share one answer.

- `confidence` ≥ `PROJECT_CONFIDENCE_THRESHOLD` → its `projectId`.
- Below → show the top candidates with their probabilities and ask which one.

Show the whole candidate → project table and ask the user to confirm it; they may override any
pick. Never guess under the threshold.

## Step 5: kind per candidate

- `SRED: yes` trailer → SR&ED work.
- `SRED: no` → routine work; its `SRED-Exclusion` (`routine` / `production`) is the category.
- No trailer (a commit made without `taddy-commit`, or uncommitted work) → `classify_work` on
  the same first human message; `confidence` ≥ `CONFIDENCE_THRESHOLD` follows the answer, below
  it ask exactly *Is this SR&ED viable?* for that candidate.

Show the candidate → kind table and ask the user to confirm it; they may override any kind.

## Step 6: draft, then the user edits and confirms

Write one file, `SRED-DRAFT-<from>-<to>.md`, at the repo root, in the format of
`references/draft-format.md`: per project and week, the journal and one task block per candidate.

- **Journal**: plain language, first person, the author's voice — what was tried, what
  happened, what was decided. End with *Not SR&ED this week:* and one line per routine slice
  with its category in parentheses. No hours, no SR&ED categories beyond that.
  When Step 1's map has a body for the section's project and week, the section starts with
  `<!-- existing journal, kept from an earlier pass or the dashboard; edit but do not drop -->`,
  then that body verbatim, a blank line, then the new paragraphs. Keep one *Not SR&ED this
  week:* block: move the existing one to the end and add the new lines under it. Name the
  sections that carry an existing journal in the file's top comment.
- **Tasks**: `kind` = `routine` for routine work; else `experiment` when the commit's recap or
  the session summaries show anything run, built or tried, `decision` only when they show a
  choice with nothing run. `date` = the commit's day, or the last session's day for uncommitted
  work. `sources` = `file <session id>` per session behind it and `commit <repo>@<sha> — <subject>`.
  The body: what the work was about, what was tried, what happened, what was decided — the
  commit's recap (its body) seeds it, the session summaries fill it in.

Tell the user where the file is and to edit it freely, then say "confirmed" or "cancel". Stop
here: nothing is uploaded or written yet. On "cancel", delete the file and stop.

On "confirmed", run `python3 scripts/draft.py check SRED-DRAFT-<from>-<to>.md`. It prints the
payloads on success; on errors it lists them one per line — fix the file (or ask, when the fix
is a judgment call), then check again.

## Step 7: write

In this order, because a task may only cite a file that is already archived
(`create_tasks` rejects unknown file ids and fails the whole batch):

1. **Journals.** For each section: `put_journal({ projectId, weekStart, body })` with the
   section's whole journal (existing text first, when there was one); keep `journal.id`.
2. **Uploads.** One line first: transcripts can carry secrets echoed by tools; a redacted copy
   is uploaded (every `.env` value and every `Bearer` token become `XXX_SECRET_XXX`) and the
   bucket is private to the uploader and admins. Then, for every id in every section's
   `fileSources` (a session cited under two sections goes under the first):

   ```
   bash scripts/upload.sh --session <id> --file <path from sessions.json> --date <date> --name <archiveName> --project <projectId> --repo "$PWD"
   ```

   Show each upload's redaction counts. A `201` per session is required; on any failure stop
   and report rather than filing a task without its source.
3. **Tasks.** For each section: `create_tasks({ journalId, tasks })` with the checked payload
   (≤ 20 per section).

**Verify:** every `put_journal` returned a `journal`, every upload printed `"ok": true`, every
`create_tasks` returned as many tasks as sent.

## Done

Delete `SRED-DRAFT-<from>-<to>.md`. Print what was written: journals with ids, tasks with ids,
archived session ids. Point at the dashboard for the hours split and the review.

## Rules

- Non-SR&ED work is a routine task, never an experiment. A failed attempt is still an experiment.
- Never read, write or estimate hours; never call `set_time_entry`, `set_hours_split` or
  `get_evidence_week`.
- Don't invent results a transcript doesn't show. Keep the author's voice and numbers.
- Never guess a project or a kind under the threshold; ask.
- Write nothing to the app before the user has confirmed the draft.

## Gotchas

- `create_tasks` fails the whole batch on one bad date or unknown file id; `draft.py check` and
  the upload-before-tasks order exist for that.
- A task dated outside its journal's week is rejected, hence the grouping by `weekStart`.
- `put_journal` replaces the week's body, which is why the draft always carries the existing
  journal first. Never send a section's journal without the existing text unless the user
  removed it on purpose. It also rejects future weeks and time-off rows.
- A resumed session keeps its id: re-uploading overwrites the bytes; `projectId` is fixed at the
  first upload.
- A session belongs to the range by the day of its first message. Running mid-week is normal.
- Sessions in a subdirectory of the repo are included; a sibling repo is not (`other-cwd`).
- Redaction only knows the repo's `.env` values (8+ characters) and `Bearer` tokens; anything
  else a tool echoed goes up as-is.
- A commit flagged `suspect` (its command also ran `git init` or `cd` outside the repo) may
  belong to another repo — check before filing it.
- Upload only sessions listed in `sessions.json`'s `sessions`; a `Work-Session` id outside the
  range has no digest and no summary, even when `sessions.py --dump` can still show it.
- `pick_project` with a single visible project answers without Jev, confidence 1.
- The draft file is scratch: delete it, never commit it.

## Reference routing

| Need | File |
| --- | --- |
| Every tool call and the REST upload: exact input and output fields, limits, errors | `references/api-shapes.md` |
| Where transcripts live, line shapes, what the digest and dump contain | `references/transcript-format.md` |
| The SRED-DRAFT grammar, what `draft.py check` enforces, writing guidance, a full example | `references/draft-format.md` |
| Digest and dump | `scripts/sessions.py` |
| Commits with trailers, joined to sessions | `scripts/commits.py` |
| Validate the edited draft, emit payloads | `scripts/draft.py` |
| Mask secrets in a transcript copy | `scripts/redact.py` |
| Token resolution, redaction, the PUT | `scripts/upload.sh` |
