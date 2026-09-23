# The app's API, as the pass uses it

Three MCP tools on the Taddy SR&ED server (`sred`, or the claude.ai connector "Taddy SR&ED")
and one REST call. Every tool returns its result both as JSON text and as `structuredContent`;
the shapes below are that object. Dates are `YYYY-MM-DD`; weeks start on Monday.

## `whoami`

Input `{}`. Output `{ userId, name, avatarUrl, isAdmin, isMember }`. `name` is the report's
`Author` line; nothing else is used.

## `list_projects`

Input `{ status?: "active" | "archived" | "all" (default active), mine?: boolean }`; call it
with no arguments. Output
`{ projects: [{ id, code, sredNumber, name, description, claimable, status, sortOrder, assignees, … }] }`
— the projects the caller can see. `code` is `TP-NN` for claimable projects, null for routine
ones. Save `[{ id, code, name }]` as `projects.json`: `report.py` labels every `SRED-Project` id
with them (`3 (TP-03 Diarization)`) and marks an id that is not there `(not visible to you)`.
Members only see the projects they are assigned to, so that case is normal, not an error.

## `list_files`

Input `{ from, to, type?: "transcript" | "markdown" | "pdf" | "image", projectId?, userId? (admin only) }`,
at most 731 days. Output
`{ files: [{ id, userId, projectId, type, name, contentType, bytes, date, createdAt }] }` —
metadata only, the caller's own uploads, oldest first. Call it with `type: "transcript"`: each
`id` is a session id already archived for the range. Those sessions stay in the report and are
marked `already`; they are not uploaded again.

## REST `PUT /sred/api/files/<session id>`

`scripts/upload.sh` sends it. Headers `Authorization: Bearer <token>`,
`Content-Type: application/x-ndjson`,
`X-File-Meta: {"type":"transcript","name":"<date>-<slug>.jsonl","date":"<date>","projectId":<id>}`
— `projectId` is optional: the script writes it only when `--project` is given (the first
commit's `SRED-Project` behind the session) and leaves it out for a session with no commit or
no trailer. Body = the redacted copy, ≤ 25 MB, `Content-Length` set (curl does). Response
`201 { file: { id, userId, projectId, type, name, contentType, bytes, date, createdAt } }`. The same
id overwrites the bytes; `projectId` is fixed at first upload. Errors the script maps to exit
codes: 2 no token, 3 too large or empty, 4 token rejected (401), 5 refused (400/403/413/415), 6
other. The token is `$SRED_TOKEN`, else the `sred` MCP server's Authorization header.

## Not called by this skill

Everything else. In particular `pick_project` and `classify_work` (the admin decides the
project and the kind), `put_journal`, `list_my_journals`, `create_task`, `create_tasks`,
`update_task`, `delete_task`, `list_tasks`, `list_sources`, `get_evidence_week`,
`get_evidence_audit`, `list_time_entries`, `set_time_entry`, `set_hours_split`,
`get_hours_summary`, `delete_file`. The report is a local file; the archived transcripts are
the skill's only writes to the app.
