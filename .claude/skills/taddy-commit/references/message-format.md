# Commit message format

Read this before writing the message. The subject says what changed; the body is the recap of
the work; the trailers say whether it was SR&ED work. Nothing in the body may come from anywhere
but the conversation(s) behind the commit: this one, or the work sessions `work-sessions.py`
found in a commit-only conversation. The whole message is shown and approved before `git commit`
runs.

## Subject

One line, imperative ("Try", "Fix", "Add"), what changed, at most 500 characters, no trailing period.

## Body

The recap of the work being committed: the same recap you close a turn with, written for the
person reading `git log` later. It covers the conversation's work since its last commit (the
whole conversation on the first commit), whatever the trailer says. In a commit-only
conversation it is seeded by the work sessions' closing recaps (the last assistant messages in
each dump) and your summaries, merged into one recap in start order when several sessions make
up the commit.

Say, in this order, whatever applies:
- what was done or built;
- what was found: results, numbers, and every attempt that did not work;
- what was decided, and why;
- what is next, if anything was left open.

Rules:
- Plain paragraphs or a short `-` list, roughly eight lines at most. No headings, no markdown
  emphasis, no links unless the user gave them.
- Keep the user's numbers and names exactly; do not round or rename.
- Never invent a result or an attempt. A failed attempt is still recorded: what was tried and
  that it did not work.
- A small `SRED: no` change (a bug fix, a config bump) gets one or two sentences: what changed
  and why.
- A file no session and no in-context work stands behind gets a sentence that says only what
  changed; nothing about why unless the user said it.

## Trailers

After a blank line, as the final paragraph, in this order, before any attribution trailers the
harness adds:

```
SRED: yes
```

or

```
SRED: no
SRED-Exclusion: routine
```

`SRED-Exclusion` takes exactly `routine` or `production` and appears only on `SRED: no`.

## Example 1 — SR&ED work

```
Try pyannote 3.1 for diarization on overlapping speech

Ran the 3.1 pipeline on the 40-clip overlap set in place of 2.1. DER went from 21% to 17%,
but two-speaker crosstalk is still mostly merged into one segment. Adding a 0.3 s minimum
segment length on top left DER unchanged and only removed the short correct segments.

Keeping 3.1 and dropping the minimum-length filter: the gain is in the model, not in
post-processing. Crosstalk is the open problem.

SRED: yes
```

## Example 2 — not SR&ED

```
Fix podcast artwork not loading on the episode page

The CDN URL lost its size suffix after the image migration.

SRED: no
SRED-Exclusion: production
```

## How the weekly pass reads it

`taddy-weekly-tasks` runs
`git log --format='%H%x1f%s%x1f%b%x1f%(trailers:key=SRED,valueonly)%x1f%(trailers:key=SRED-Exclusion,valueonly)%x1e'`
and uses the trailers for routine versus SR&ED work and the body (the recap) to seed each task's
body and to judge its kind (`experiment` when something was run or tried, `decision` when the
work was only a choice). A commit with no `SRED` trailer is classified again from its session's
first human message. After a commit-only conversation, the weekly pass sees that conversation
as the commit's session and the earlier work sessions as uncommitted candidates; merge them in
the draft.
