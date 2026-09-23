---
name: taddy-weekly-tasks
description: The weekly SR&ED report for a Taddy product repo over a range of days. Use this skill whenever the user runs /taddy-weekly-tasks, asks for the weekly SR&ED pass or report, wants last week's or this week's work written up for the SR&ED admin, wants a journal drafted from their Claude Code sessions and commits, or wants their Claude Code transcripts archived to the SR&ED app. It digests the local transcripts, reads the range's commits and their SRED-Project and Work-Session trailers, archives every session's redacted transcript, and writes one Markdown report (journal, every conversation with its recap, every commit with its project id or Unknown) for the admin, who classifies the work and creates the tasks in the app. Not for committing (that is taddy-commit), logging or checking hours, the hours split, drafting T661 narratives, classifying work, or creating or listing tasks.
metadata:
  version: "0.1.0"
  updated: "2026-09-23"
  source: "https://github.com/taddyorg/taddy-internal-skills"
---

# Taddy weekly tasks skill

Runs in the product repo. Its output is one file, `TADDY-SRED-REPORT-<from>-<to>.md` at the
repo root, for the SR&ED admin: the range's journal, every Claude Code conversation with a
recap, and every commit with the project its `SRED-Project` trailer names, else `Unknown`. The
admin decides what is SR&ED and creates the tasks in the app; this skill never classifies work,
never picks a project, never writes a journal or a task to the app, and never reads, writes or
estimates hours. Its only writes to the app are the redacted transcripts it archives. Helper
scripts live in `scripts/` beside this file; run them with `python3` / `bash` from the repo root
and read their JSON. Never open a `.jsonl` directly: the digest and the dump are the only views
of a session this skill uses.

## Range

`/taddy-weekly-tasks [start] [end]`, two `YYYY-MM-DD` days. Defaults: start = the latest Monday
(today if today is a Monday), end = today. Every script takes `--from` / `--to` with the same
defaults and prints `range.from` / `range.to`; use those everywhere below. Scratch files go in
`WORK=${TMPDIR:-/tmp}/sred-report-<from>-<to>` (`mkdir -p`); only the report lands in the repo.

## Step 1: context

1. `whoami` — the author's `name`, for the report header.
2. `list_projects` — the active projects the author can see. Save `[{ id, code, name }]` as
   `$WORK/projects.json`: the report labels project ids with them and flags an id it cannot see.
3. `list_files({ from, to, type: "transcript" })` — the sessions already archived for the range
   (`files[].id` is the session id). They are still in the report; they are not re-uploaded.

Nothing else. No `list_sources`, `list_my_journals`, `pick_project`, `classify_work`.

## Step 2: sessions and recaps

```
python3 scripts/sessions.py --cwd "$PWD" --from <from> --to <to> > $WORK/sessions.json
```

Every session in `sessions` goes in the report. For each one run
`python3 scripts/sessions.py --cwd "$PWD" --dump <sessionId>` and write, before dumping the
next, a recap of at most 200 words: what it was about, what was tried, what happened, what was
decided, plus the in-session commits from `commits`. Keep the author's numbers and names; do not
invent a result the dump does not show. The dump keeps the last assistant messages in full,
where the closing recap lives; lean on it. Collect the recaps as `$WORK/recaps.json`,
`{ "<session id>": "<recap>" }`, one entry per session. Line shapes and what the digest derives:
`references/transcript-format.md`.

## Step 3: commits

```
python3 scripts/commits.py --from <from> --to <to> --join $WORK/sessions.json > $WORK/commits.json
```

Each commit carries `projectId` (its `SRED-Project` trailer, null when absent or not a number)
and `sessionIds`, the conversations behind it: first its `Work-Session` trailers (`matchedBy:
trailer`; `taddy-commit` stamps one per session that did the work), then, for a commit without
them, the session whose in-session `git commit` produced it (sha, else subject). `warnings`
names a trailer id not in `sessions.json` (outside the range, another machine): it stays listed
under the commit, marked not in range, and is not uploaded. `uncommittedSessions` are
conversations with no commit; they stay in the report with `Commits: none`. Read `projectId`,
`sessionIds` and `warnings`; ignore the legacy `sred` / `sredExclusion` fields.

## Step 4: archive the transcripts

No confirmation step: say in one line that a redacted copy of each session is being uploaded
(every `.env` value and every `Bearer` token become `XXX_SECRET_XXX`; the bucket is private to
the uploader and admins). Then, for every session in `sessions.json` whose id Step 3 did not
return from `list_files`:

```
bash scripts/upload.sh --session <sessionId> --file <path> --date <date> --name <archiveName> [--project <id>] --repo "$PWD"
```

`--project` is the `projectId` of the first commit in `commits.json` whose `sessionIds` holds
the session; leave it out when there is none (the file is archived with no project). Keep three
lists for Step 6: `archived` (printed `"ok": true`), `already` (from `list_files`), and
`failed` with the error line for any other exit. Report each upload's redaction counts. A
failure does not stop the run: the report says which sessions were not archived.

## Step 5: the journal

Write `$WORK/journal.md`: one plain-language journal for the whole range, from the recaps and
the commit bodies, for someone who was not there. It is about the work, not the person: what
was built, tried, observed and decided, in the order it happened, with the exact numbers and
names from the sessions ("The overlap set was re-run on pyannote 3.1; DER fell from 21% to
17%", never "I tried pyannote"). No hours, no SR&ED vocabulary, no split by project, no list of
files. A few paragraphs is normal; a one-commit week is one paragraph.

## Step 6: render

```
python3 scripts/report.py --sessions $WORK/sessions.json --commits $WORK/commits.json \
  --recaps $WORK/recaps.json --journal $WORK/journal.md --projects $WORK/projects.json \
  --author "<name>" --archived <ids,comma-separated> --already <ids> [--failed "<id>=<reason>"]... \
  > TADDY-SRED-REPORT-<from>-<to>.md
```

It exits 1 (errors on stderr) when a session has no recap or the journal is empty: fix the
input and run it again. Warnings (a recap over about 200 words, a project id you cannot see,
`commits.py` warnings) go to stderr; pass them on to the user. Format and a full example:
`references/report-format.md`. Do not hand-edit the report; change the inputs and re-render.

## Done

Print the report's path, the archived session ids, the sessions that were not archived and
why, and the commits whose project is `Unknown` (the author can amend the trailer or tell the
admin). Say the file is for the admin, is not uploaded by this skill, and should not be
committed. Delete `$WORK`.

## Rules

- Never classify work as SR&ED or routine, never pick or guess a project: the trailer or
  `Unknown`, nothing else. Never call `pick_project`, `classify_work`, `put_journal`,
  `create_task(s)`, `list_tasks`, `list_sources`, `list_my_journals`, `set_time_entry`,
  `set_hours_split`, `get_evidence_week` or `get_hours_summary`.
- Don't invent results a transcript doesn't show. Keep the author's numbers and names.
- The journal and the recaps describe the work, not the person: no first person.
- Every session in the range is in the report, uploaded or not, committed or not.
- Upload only sessions listed in `sessions.json`'s `sessions`; a `Work-Session` id outside the
  range has no digest and is only named under its commit.

## Gotchas

- A session belongs to the range by the day of its first message. Running mid-week is normal.
- Sessions in a subdirectory of the repo are included; a sibling repo is not (`other-cwd`).
- A resumed session keeps its id: re-uploading overwrites the bytes; `projectId` is fixed at the
  first upload, so a session already archived keeps whatever project it had.
- Redaction only knows the repo's `.env` values (8+ characters) and `Bearer` tokens; anything
  else a tool echoed goes up as-is.
- A commit flagged `suspect` in the digest (its command also ran `git init` or `cd` outside the
  repo) may belong to another repo; say so in its recap.
- The `Work-Session` uuid is the transcript's file name and the archive file id; the
  `session_…` id in a `Claude-Session:` URL is a different id and never joined.
- An `SRED-Project` id not in `list_projects` (archived, someone else's) renders as
  `<id> (not visible to you)` with a warning; leave it, the admin can see it.
- `upload.sh` exit 2 is a missing token (`SRED_TOKEN` or the `sred` MCP header); tell the user
  how to get the 180-day exchange token from the Settings page and list those sessions as not
  archived rather than retrying blindly.
- A session over 25 MB (exit 3) cannot be archived; it stays in the report as not archived.
- The report is the deliverable, not scratch: leave it at the repo root, never `git add` it.

## Reference routing

| Need | File |
| --- | --- |
| The tool calls and the REST upload: exact input and output fields, limits, errors | `references/api-shapes.md` |
| Where transcripts live, line shapes, what the digest and dump contain | `references/transcript-format.md` |
| The report format, what `report.py` enforces, journal and recap guidance, a full example | `references/report-format.md` |
| Digest and dump | `scripts/sessions.py` |
| Commits with trailers, joined to sessions | `scripts/commits.py` |
| Render the report from the digest, commits, recaps and journal | `scripts/report.py` |
| Mask secrets in a transcript copy | `scripts/redact.py` |
| Token resolution, redaction, the PUT | `scripts/upload.sh` |
