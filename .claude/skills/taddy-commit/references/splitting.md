# Splitting work into commits

Read this when planning the commits (Step 0.3). A commit holds one unit of work, judged by
what the work is, not by which session did it. `work-sessions.py` says which sessions touched
which files; this page says how many commits that work is and how to stage each one.

## What a unit is

One change a reviewer could review, or revert, on its own. The test applies to the earlier
sessions the digest found and to this conversation's own work alike: a conversation that did
two things yields two commits, even when the request says "commit this". The user's own
direction overrides: "as one commit" keeps it together, "split the parser from the styling"
splits it that way.

Write each candidate subject first. If it needs "and" (or a comma list) to join two changes,
the work is two commits.

Signs of two units, any one of which is enough:
- the subject would need "and" to cover the work;
- the files fall into groups with nothing in common: two skills, two packages, a feature plus
  an unrelated fix;
- the recap has two "what was done" sentences on different topics;
- the conversation answered two different asks.

Signs of one unit:
- the second change exists only because of the first (a token file added for the alignment
  that needed it);
- a rename plus its call sites; tests, docs and changelog lines for the change;
- several attempts at one change, across sessions or within one.

Sessions and commits are many-to-many: a session's id goes on every commit that holds its
work, this conversation's own id included, so two commits from one conversation carry the
same `Work-Session` line.

## A file both units changed

A shared file does not glue two units together. Stage only the unit's hunks:

```
git diff -- <file> > "$SCRATCH/<unit>.patch"   # edit: keep the header and this unit's hunks
git apply --cached "$SCRATCH/<unit>.patch"
git diff --cached --stat                        # what the commit holds; show it in the table
```

Edit the patch by deleting whole hunks (from one `@@` line to the next); never edit inside a
hunk. A new, untracked file is whole by nature and needs no patch. After the first commit the
other hunks are still in the working tree, so the next commit stages the file whole with
`git add`. Before showing the message, `git diff --cached -- <file>` and check that only this
unit's lines are in. CHANGELOG and README lines go with the change they describe. When two
changes sit on the same lines and the hunks cannot be separated, say so and keep one commit
whose subject names the combined change.

The plan table stays `commit → files → sessions`, with `(hunks)` after a file staged by patch.
Confirm it whenever there is more than one commit.

## Example: one conversation, two units, one shared file

This conversation (`aaaaaaaa-…`) added a loading skeleton to the podcast page (a new
`src/components/Skeleton.tsx`, a block in `src/pages/podcast.tsx`) and, later in the same
conversation, fixed the artwork CDN suffix (`src/artwork.ts`, and one line in
`src/pages/podcast.tsx` that built the URL). The user says "commit this to Web app". A single
subject would read "Add a loading skeleton and fix the artwork URL": two changes, so two
commits, `podcast.tsx` split by hunk.

| Commit | Files | Sessions |
| --- | --- | --- |
| Add a loading skeleton to the podcast page | `src/components/Skeleton.tsx`, `src/pages/podcast.tsx` (hunks) | aaaaaaaa |
| Fix podcast artwork not loading on the episode page | `src/artwork.ts`, `src/pages/podcast.tsx` (hunks) | aaaaaaaa |

The first commit's message:

```
Add a loading skeleton to the podcast page

The podcast page showed a blank panel for up to two seconds while the
episode list loaded. It now renders a grey skeleton in the shape of the
list until the data arrives. The skeleton is its own component so the
episode page can reuse it next.

SRED-Project: 5
Work-Session: aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa
```

Then `git add -- src/artwork.ts src/pages/podcast.tsx` (the file is whole now, only the fix's
hunk is left) and the second message, Example 2 of `message-format.md`, with the same
`Work-Session` line.
