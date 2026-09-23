# The project: `list_projects` and the `SRED-Project` trailer

Read this before the Project step. The user names the project in the commit request; this skill
turns that name into the numeric project id the weekly report lists the commit under. One
`list_projects` call per request, no `pick_project`: the person committing knows the project,
so nothing is guessed.

## `list_projects`

Input `{ status?: "active" | "archived" | "all" (default active), mine?: boolean }`. Call it
with no arguments. Output:

```json
{ "projects": [
  { "id": 3, "code": "TP-03", "name": "Diarization", "description": "Speaker diarization accuracy on overlapping speech",
    "claimable": true, "status": "active", "sortOrder": 10, "assignees": [ { "userId": "u1", "name": "Dev" } ] },
  { "id": 5, "code": null, "name": "Web app", "description": "The podcast web app: pages, UI, feeds",
    "claimable": false, "status": "active", "sortOrder": 20, "assignees": [ … ] },
  { "id": 2, "code": null, "name": "Sick", "description": "Time Off", "claimable": false, "status": "active", "sortOrder": 901, "assignees": [ … ] }
] }
```

- `code` is `TP-NN` on claimable (SR&ED) projects and null on routine ones. Both kinds take
  commits: a routine project is where non-SR&ED work is filed.
- Rows with `sortOrder` ≥ 900 are time off (Sick, Vacation, statutory holidays). Drop them
  before matching; a commit never belongs to one.
- Members only see the projects they are assigned to; admins see every project.

## Where the name comes from

The words in the commit request that name a project: after "to", "under", "for" or "project",
or a bare `TP-NN` code. "commit this to Diarization", "commit under TP-03", "commit the artwork
fix, Web app project", "commit — TP-03". Words that direct the commit itself ("as two commits",
"and push", "mark it not SR&ED") are not the project.

## Matching

Compare case-insensitively, after trimming whitespace and surrounding punctuation from both
sides, in this order; the first rule that yields exactly one project wins:

1. The given text equals a `code` (`tp-03` = `TP-03`).
2. The given text equals a `name` (`web app` = `Web app`).
3. Every word of the given text appears in exactly one `name` (`diarization` → `Diarization`;
   `ai tools` → `AI Tools (MCP Server, Skills)`).

Then:

- **One hit** → its `id`. Tell the user: `TP-03 Diarization (id 3)`.
- **Several hits** (`transcripts` against `Better Transcripts` and `Auto-scaling episode
  transcripts`) → show those candidates with code, name and id and ask which one.
- **No hit** → show every project returned (code, name, id) and ask which one; say the name did
  not match, since it may be a project the user is not assigned to.
- **No name in the request** ("commit this") → show every project returned and ask which one.

Never pick under any doubt, and never call `pick_project` to decide: the trailer records
what the user said.

## Scope and overrides

The answer applies to every commit of the request, including each commit of a commit-only
conversation that yields several. At any approval step the user may name a different project or
code (or "put this one under Web app"); match it against the list already fetched, no second
`list_projects` call, and stamp that id on that commit only.

## The trailer

```
SRED-Project: 3
```

Numeric id only, one line, on every commit, the first trailer, before any `Work-Session`
line (see `references/message-format.md`). The weekly pass reads it with
`%(trailers:key=SRED-Project,valueonly)` and lists the commit under that project in the weekly
report; a commit without it shows as `Unknown` there, for the admin to place.

## Errors

- `401` / no MCP server: the app is not connected. Say so, ask the user for the numeric id
  (the app's Projects page shows it), remind them that the Settings page prints the
  `claude mcp add` command, and stamp the id they give. Never commit without the trailer.
- An empty `projects` list: the user is assigned to no project. Say so; an admin assigns them
  in the app. Do not commit until a project exists.
