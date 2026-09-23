# The scan: secrets and .gitignore lines

Read this at Workflow Step 1 and again when a finding is open. Every commit's staged change is
scanned before its message is written, and the same scan runs in front of `git commit`. A
finding is answered by the user, by number, before anything else happens. The committing
conversation's transcript is archived by the weekly pass, so nothing raw ever goes into it:
the script masks every value and the skill never pastes a flagged line.

## What the scan reads

`python3 .claude/skills/taddy-commit/scripts/secret-scan.py [--repo DIR] [--message-file PATH]
[--approved ID] [--max-history 5]` reads the index (`git diff --cached`), which is exactly what
the commit will hold, hunks included. With `--message-file` it also reads the draft message.
Exit 0 is clean (or approved, below), exit 1 lists findings, exit 2 is an error (not a git repo,
nothing staged, git failed): say why and stop; never commit unscanned. Standard library only;
it never writes and never uploads.

## Finding kinds

| Kind | Trigger | `recommend` |
| --- | --- | --- |
| `gitignore-removed` | a non-blank, non-comment line removed from any `.gitignore` (a changed pattern counts) | `git restore --staged -- <path>`, then put the line back |
| `gitignore-negated` | an added `!pattern` line | restore the file, drop the `!` line |
| `gitignore-deleted` | a `.gitignore` deleted or renamed | restore and keep the file |
| `secret-file` | a staged path named like a secrets file: `.env`, `.env.*` (not `.example`, `.sample`, `.template`, `.dist`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `*.ppk`, `id_rsa*`, `id_ed25519*`, `id_ecdsa*`, `*.tfvars`, `credentials.json`, `*-credentials.json`, `service-account*.json`, `.netrc`, `.pypirc`, `.htpasswd`, `secrets.{json,yml,yaml}`; `status` A, M or D and `ignored` say how it got there | A: `git rm --cached -- <path>`; M: `git restore --staged`; D: keep, rotate every value the file held |
| `ignored-file-staged` | a new path a `.gitignore` rule matches (a `git add -f`); `rule` names the rule | `git rm --cached -- <path>` |
| `secret-added` | an added line matching a rule: private key header, AWS `AKIA`/`ASIA` id, GitHub `ghp_`/`github_pat_`, Slack `xox…`, Stripe `sk_live_`/`rk_live_`, Google `AIza…`, Anthropic `sk-ant-`, OpenAI `sk-`, a JWT, `Bearer <16+ chars>`, `scheme://user:pass@`, or a `key = value` whose key says api_key, secret, token, password, private_key, client_secret, access_key or credential and whose value looks like a credential | `git restore --staged -- <file>`, then read the value from the environment |
| `secret-removed` | a removed line matching a rule; `inHistory` lists the commits the value is already in | keep the removal and rotate the credential |
| `message-secret` | a line of the draft message matching a rule (`file` is `<message>`) | edit the line out; never keepable |

Placeholders are not findings: `changeme`, `example`, `your_…`, `xxx`, `<token>`, `${VAR}`,
`$VAR`, `***`, `XXX_SECRET_XXX`, `process.env.X`, `os.environ[…]`, another variable's name,
a short or letters-only value. Lockfiles, minified files, source maps, SVGs and binaries are not
line-scanned (`scanned.skipped`). A token in a format the script does not know is not caught:
an unfamiliar long string in a config is still worth a question to the user.

## The reply grammar

Show the findings before any message, as a numbered table: n, kind, file:line, the masked
`excerpt`, `recommend`. Then stop. The reply must name every number with one of two verbs:

- `keep n`: commit it as it is.
- `unstage n`: run that finding's `recommend` command and nothing else. Never a working-tree
  edit, never `git add -f`, never a quiet edit of `.gitignore`.
- `keep all`, `unstage all`, `keep 1 and 3, unstage 2` are all fine.

"yes", "approved", "ok", "lgtm" or "commit" while a finding is open settles nothing: ask
again, naming the open numbers. A number the reply leaves out is asked about. A `keep` on a
`secret-removed` finding is still answered with the rotation note: the value sits in every
commit `inHistory` lists and must be rotated, the removal does not undo that. A
`message-secret` finding cannot be kept: the line is edited out of the message.

After any `unstage`, re-run the scan. Go on only when it exits 0, or when every finding it still
lists was kept (same kind, file, line and rule). Note that run's `approvalId`.

## `approvalId` and the commit command

`approvalId` is a short hash of the findings the user answered (not reversible, never a value).
The commit runs behind the scan:

```
M=$(mktemp); cat > "$M" <<'EOF'
<subject>

<body>

SRED-Project: 5
Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
Co-Authored-By: ...
EOF
python3 .claude/skills/taddy-commit/scripts/secret-scan.py --message-file "$M" \
  --approved "<approvalId>" && git commit -F "$M"
```

Omit `--approved` when the reviewed scan was clean. Exit 1 here means the index changed since
the user answered (a file staged after the review, a hunk re-applied) or the message itself
holds a value: back to Step 1, never `git commit` on its own, never `-a`, `-m` or `--no-verify`.

## Example 1: a `.env` staged and its ignore line dropped

`git status` lists `.gitignore`, `.env` and `src/config.ts`; the scan exits 1:

| # | Kind | Where | Excerpt | Recommend |
| --- | --- | --- | --- | --- |
| 1 | gitignore-removed | .gitignore:1 | `.env` | `git restore --staged -- .gitignore`, then put the line back |
| 2 | secret-file | .env (A, ignored) | | `git rm --cached -- .env` |

The user replies `approved`. That answers nothing: "Findings 1 and 2 are open: keep or unstage
each?" The user replies `unstage 1, unstage 2`. Run `git restore --staged -- .gitignore`, put the
`.env` line back in the working tree, run `git rm --cached -- .env`, re-run the scan: exit 0.
Only `src/config.ts` is staged. Write the message; the approval block shows the staged file
and `Scan: clean`; commit without `--approved`.

## Example 2: a fixture key kept

`tests/fixtures/stripe.json` adds a realistic-looking test key the scan reads as `stripe-live`.
The user replies `keep all`. Re-running is not needed (nothing changed); note `approvalId`
`68cd0ab41a9f`. The approval block ends with `Scan: kept: #1 secret-added
tests/fixtures/stripe.json:4 "key": "sk_l…(32 chars)"`, and the commit command passes
`--approved 68cd0ab41a9f`.

## Fields

| Field | Meaning |
| --- | --- |
| `ok` | true when there is no finding |
| `scanned` | `files` line-scanned, `skipped` paths, `added` and `removed` line counts |
| `findings[].n` | the number the user answers |
| `findings[].kind`, `file`, `line`, `side` | what and where; `side` is `new` for an added line, `old` for a removed one, `line` counts on that side |
| `findings[].rule` | the content rule, or the ignore rule for `ignored-file-staged` |
| `findings[].excerpt` | the line with the value masked to its first four characters and length; the pattern for a `.gitignore` finding; null for a file finding |
| `findings[].status`, `ignored` | file findings: the index status and whether a `.gitignore` rule matches the path |
| `findings[].inHistory` | `secret-removed` and a deleted `secret-file`: the commits (`%h`) that already hold it |
| `findings[].recommend` | the `unstage` command, or the rotation note |
| `approvalId` | hash of the findings shown, null when clean; `approvedId` echoes `--approved`; `approved` says whether it still holds |
