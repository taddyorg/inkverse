# The app's API, as the pass uses it

All calls are MCP tools on the Taddy SR&ED server (`sred`, or the claude.ai connector "Taddy
SR&ED") unless marked REST. Every tool returns its result both as JSON text and as
`structuredContent`; the shapes below are that object. Dates are `YYYY-MM-DD`; weeks start on
Monday.

## `whoami`

Input `{}`. Output `{ userId, name, avatarUrl, isAdmin, isMember }`. Informational: the pass
writes the same things whoever runs it.

## `list_projects`

Input `{ status?: "active" | "archived" | "all" (default active), mine?: boolean }`. Output
`{ projects: [{ id, code, sredNumber, name, description, claimable, status, sortOrder, assignees, … }] }`
— the projects the caller can see. `code` is `TP-NN` for claimable projects, null for routine
ones. Show `code`, `name` and `description`: they are what `pick_project` judges on.

## `list_sources`

Input `{ from, to, projectId?, userId? (admin only) }`, at most 731 days. Output
`{ sources: [{ type: "file" | "commit" | "url", ref, label?, taskId, projectId, userId, date, kind }] }`
— every source cited by the caller's tasks whose work date is in the range, oldest first, one row
per task and source. Split them: `file` refs are session ids already filed (pass them to
`sessions.py --exclude`); `commit` refs are `<repo>@<sha>` (pass the part after `@` to
`commits.py --exclude`).

## `list_my_journals`

Input `{ from, to }`, at most 62 days. Output
`{ journals: [{ id, projectId, userId, authorName, weekStart, body, createdAt, updatedAt }] }`
— the caller's own journals for every week overlapping the range, newest week first, every
project. Key them by `(projectId, weekStart)`; a pair not present has no journal yet. A body
found here goes verbatim at the top of that section's journal in the draft.

## `pick_project`

Input `{ text, projectIds? }`. `text` (≤ 8 000 chars) = the first human message of the first
session behind the unit of work, then a blank line, then the commit subject when there is one; a
commit with no session: subject + body. `projectIds` narrows the candidates (default: every active
project the caller is assigned to, minus time-off rows). Output:

```json
{ "projectId": 3,
  "project": { "id": 3, "code": "TP-03", "name": "Diarization", "claimable": true },
  "probabilities": { "3": 0.86, "5": 0.11, "7": 0.03 },
  "confidence": 0.86 }
```

With a single candidate it answers at once with `confidence: 1`. Errors: `No active projects to
pick from` (400) — the caller is assigned to none; `TYPESAFE_API_KEY is not set` / `TypeSafe
answered …` (500) — Jev unreachable, ask the person which project instead.

## `classify_work`

Input `{ text }` — the same first human message. Output
`{ workClass: "routine" | "production" | "other", sred, exclusion: "routine" | "production" | null, probabilities: { routine, production, other }, confidence }`.
`other` means SR&ED. Used only for commits with no `SRED` trailer and for uncommitted work.

## `put_journal`

Input `{ projectId, weekStart, body }`; `weekStart` must be a Monday and not a future week; the
project must be active, assigned to the caller and not a time-off row; `body` ≤ 20 000 chars
(empty removes the journal). Output `{ journal: { id, projectId, userId, weekStart, body, createdAt, updatedAt } }`.
An upsert: it replaces the week's body, so the body sent is the draft's whole journal for the
section, the existing text (from `list_my_journals`) first and the new paragraphs after it.
Keep `journal.id` for `create_tasks`.

## REST `PUT /sred/api/files/<session id>`

`scripts/upload.sh` sends it. Headers `Authorization: Bearer <token>`,
`Content-Type: application/x-ndjson`,
`X-File-Meta: {"type":"transcript","name":"<date>-<slug>.jsonl","date":"<date>","projectId":<id>}`;
body = the redacted copy, ≤ 25 MB, `Content-Length` set (curl does). Response
`201 { file: { id, userId, projectId, type, name, contentType, bytes, date, createdAt } }`. The same
id overwrites the bytes; `projectId` is fixed at first upload. A task may cite the id as a `file`
source only after this succeeded.

## `create_tasks`

Input `{ journalId, tasks: [{ kind, body, date?, sources? }] }`, 1–20 tasks. Every task is
attributed to the journal's author, linked to the journal and must be dated inside its week
(`date` defaults to the latest day of that week not after today — always pass it). Every `file`
source must already be archived, else the whole call fails with
`Unknown file id <id> — upload it first`. Output `{ tasks: [{ id, projectId, userId, kind, date, body, sources, journalId, createdAt, … }] }`.
`kind` ∈ `experiment` | `decision` | `routine`; `sources` ≤ 20 of
`{ type: "file" | "commit" | "url", ref, label? }` where a `commit` ref is `<repo>@<7–40 hex>`.

## Fix-ups

`create_task({ projectId, journalId?, kind, body, date, sources })` for one task, `update_task({ taskId, patch })`,
`delete_task({ taskId })`, `delete_file({ fileId })` (refused while a task cites it).

## Not called by this skill

`list_time_entries`, `set_time_entry`, `set_hours_split`, `get_evidence_week`,
`get_hours_summary`, `list_files`, `list_tasks`. Hours, the split and the review are the
dashboard's; the archived files for the range are what this skill creates.
