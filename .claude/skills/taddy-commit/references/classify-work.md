# `classify_work`

The one MCP call this skill makes. It is served by the Taddy SR&ED app (server name `sred`, or the
claude.ai connector "Taddy SR&ED"); the TypeSafe key behind it never leaves the server.

## Input

```json
{ "text": "<the conversation's first human message, verbatim, at most 8000 characters>" }
```

`text` is what the user asked for. Not the diff, not a summary, not the commit subject.

- In the conversation that did the work: its first human message. On a resumed or compacted
  session, the earliest human message still in context, and tell the user that is what was used.
- In a commit-only conversation: the `firstHumanMessage` of every session behind the commit
  (from `work-sessions.py`), in start order, separated by a blank line, then trimmed to 8 000
  characters. Tell the user which sessions were used. One call per commit; two commits backed
  by the same sessions share one answer.
- No session and no in-context work behind the files: ask the user what the work was and pass
  their answer.

## Output

```json
{
  "workClass": "routine" | "production" | "other",
  "sred": true | false,
  "exclusion": "routine" | "production" | null,
  "probabilities": { "routine": 0.12, "production": 0.08, "other": 0.80 },
  "confidence": 0.80
}
```

- `other` means neither exclusion category fits: hands-on work on a technological uncertainty
  (designing and running an experiment, writing the code that is the experiment, analysing
  results, deciding what to try next). `sred` is true only for `other`.
- `routine` is feature work, UI, glue code and API surface built around the experimental
  component; `production` is deploys, devops, monitoring, on-call, bug fixes in shipped code,
  config within documented ranges. These are the two values `SRED-Exclusion` may take.
- `confidence` is 0–1 and is the only number the threshold rule looks at.

## The threshold rule

`CONFIDENCE_THRESHOLD` is declared at the top of `SKILL.md` (0.6).

1. Show the answer: the class, the three probabilities and the confidence.
2. `confidence` ≥ threshold → trailers follow `sred` and `exclusion`.
3. `confidence` < threshold → ask exactly one question, *Is this SR&ED viable?*
   - Yes → `SRED: yes`.
   - No → `SRED: no`, `SRED-Exclusion` = whichever of `routine` / `production` has the higher
     probability, shown so the user can change it.
4. The user may override either trailer at any point. An override does not trigger another call.

## Errors

- `500 TYPESAFE_API_KEY is not set` or `TypeSafe answered <status>`: the server cannot reach Jev.
  Say so, ask *Is this SR&ED viable?* and stamp the trailers from the answer.
- `401` / no MCP server: the app is not connected. Say so, ask the same question, and remind the
  user that the Settings page prints the `claude mcp add` command.
