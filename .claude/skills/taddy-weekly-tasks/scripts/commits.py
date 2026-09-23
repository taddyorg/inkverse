#!/usr/bin/env python3
# The product repo's commits over a range of days, with their SRED, SRED-Project and Work-Session
# trailers, as JSON — for the taddy-weekly-tasks skill. Python 3.9+, standard library only;
# shells out to git. Reads only.
#
# Usage:
#   commits.py [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--exclude sha,sha] [--repo .] [--repo-name taddy]
#              [--author me@example.com | --all-authors] [--branches HEAD|all] [--join sessions.json]
#
# Defaults: --from = the latest Monday, --to = today (local); --author = `git config user.email`;
# --repo-name = the origin remote's basename (without .git), else the directory name.
# --exclude lists shas to leave out (reported under `skipped`); the report pass does not use it.
# --join takes sessions.py's output and fills each commit's `sessionIds`: first the commit's
# `Work-Session` trailers (stamped by taddy-commit on every commit: the sessions that did the
# work, the committing conversation included when it did any of it), then the sessions whose
# in-session `git commit` produced it (matched by sha, else by subject; a session already listed
# from the trailer is not repeated); sessions matched to no commit are listed under
# `uncommittedSessions`.
# `projectId` is the commit's SRED-Project trailer (the project id taddy-commit stamped), else null.

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys

RS, FS = "\x1e", "\x1f"
TRAILER_LINE_RE = re.compile(r"^[A-Za-z0-9-]+: ")
SESSION_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,200}$")  # the shape upload.sh accepts as a session id
REPO_NAME_RE = re.compile(r"^[^@\s]+$")
CODE_EXCLUSIONS = ("routine", "production")


def parse_date(s):
    try:
        return dt.date.fromisoformat(s)
    except ValueError:
        sys.exit(f"error: {s!r} is not a date formatted YYYY-MM-DD")


def range_bounds(args):
    today = dt.date.today()
    start = parse_date(args.frm) if args.frm else today - dt.timedelta(days=today.weekday())
    end = parse_date(args.to) if args.to else today
    if start > end:
        sys.exit(f"error: --from {start} is after --to {end}")
    return start, end


def monday_of(d):
    return d - dt.timedelta(days=d.weekday())


def git(repo, *args, check=True):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit(f"error: git {' '.join(args[:2])} failed: {r.stderr.strip()}")
    return r.stdout


def repo_name(repo, override):
    if override:
        name = override
    else:
        url = git(repo, "remote", "get-url", "origin", check=False).strip()
        name = re.sub(r"\.git$", "", url.rstrip("/").split("/")[-1].split(":")[-1]) if url else ""
        name = name or os.path.basename(os.path.abspath(repo))
    if not REPO_NAME_RE.match(name):
        sys.exit(f"error: repo name {name!r} may not contain '@' or whitespace (use --repo-name)")
    return name


def split_body(full):
    """%B minus the subject line and minus the trailer block (the final paragraph of `Key: value` lines)."""
    lines = full.rstrip("\n").split("\n")
    rest = lines[1:]
    paragraphs, cur = [], []
    for line in rest:
        if line.strip():
            cur.append(line)
        elif cur:
            paragraphs.append(cur)
            cur = []
    if cur:
        paragraphs.append(cur)
    if paragraphs and all(TRAILER_LINE_RE.match(l) for l in paragraphs[-1]):
        paragraphs = paragraphs[:-1]
    return "\n\n".join("\n".join(p) for p in paragraphs).strip()


def parse_log(raw, name, warnings):
    commits = []
    for rec in raw.split(RS):
        rec = rec.strip("\n")
        if not rec.strip():
            continue
        parts = rec.split(FS)
        if len(parts) < 10:
            warnings.append(f"unparseable git log record: {rec[:80]!r}")
            continue
        sha, short, authored, email, subject, full, sred_raw, excl_raw, ws_raw, proj_raw = parts[:10]
        sred_val = sred_raw.strip().splitlines()[0].strip().lower() if sred_raw.strip() else ""
        excl_val = excl_raw.strip().splitlines()[0].strip().lower() if excl_raw.strip() else ""
        sred = True if sred_val == "yes" else False if sred_val == "no" else None
        if sred_val and sred is None:
            warnings.append(f"commit {short} has SRED '{sred_val}' (not yes|no)")
        excl = excl_val or None
        if excl and excl not in CODE_EXCLUSIONS:
            warnings.append(f"commit {short} has SRED-Exclusion '{excl}' (not routine|production)")
        work_sessions = []
        for v in (l.strip() for l in ws_raw.splitlines()):
            if not v or v in work_sessions:
                continue
            if not SESSION_ID_RE.match(v):
                warnings.append(f"commit {short} has Work-Session {v!r} (not a session id)")
                continue
            work_sessions.append(v)
        proj_val = proj_raw.strip().splitlines()[0].strip() if proj_raw.strip() else ""
        project_id = int(proj_val) if re.fullmatch(r"[1-9]\d*", proj_val) else None
        if proj_val and project_id is None:
            warnings.append(f"commit {short} has SRED-Project {proj_val!r} (not a project id)")
        body = split_body(full)
        date = dt.datetime.fromisoformat(authored).astimezone().date()
        commits.append({
            "sha": sha,
            "short": short,
            "date": date.isoformat(),
            "weekStart": monday_of(date).isoformat(),
            "authoredAt": authored,
            "authorEmail": email,
            "subject": subject.strip(),
            "body": body,
            "trailers": {"SRED": sred_val or None, "SRED-Exclusion": excl, "SRED-Project": project_id, "Work-Session": work_sessions},
            "sred": sred,
            "sredExclusion": excl,
            "projectId": project_id,
            "source": {"type": "commit", "ref": f"{name}@{sha}", "label": subject.strip()[:200]},
            "sessionIds": [],
            "matchedBy": None,
        })
    return commits


def sha_match(a, b):
    a, b = a.lower(), b.lower()
    return len(a) >= 7 and len(b) >= 7 and (a.startswith(b) or b.startswith(a))


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def join_sessions(commits, sessions_json, warnings):
    with open(sessions_json, encoding="utf-8") as f:
        sessions = json.load(f).get("sessions", [])
    known = {s["sessionId"] for s in sessions}
    matched = set()
    for c in commits:
        # The Work-Session trailers first: the sessions a commit-only conversation committed for.
        for sid in c["trailers"]["Work-Session"]:
            if sid not in c["sessionIds"]:
                c["sessionIds"].append(sid)
                c["matchedBy"] = c["matchedBy"] or "trailer"
                matched.add(sid)
            if sid not in known:
                warnings.append(f"commit {c['short']} cites Work-Session {sid} not in sessions.json (outside the range, already filed, or another machine)")
        for s in sessions:
            for sc in s.get("commits", []):
                if sc.get("ok") is False:
                    continue
                how = None
                if sc.get("sha") and sha_match(sc["sha"], c["sha"]):
                    how = "sha"
                elif sc.get("subject") and norm(sc["subject"]) == norm(c["subject"]):
                    how = "subject"
                elif sc.get("subject") and len(norm(sc["subject"])) >= 40 and (
                    norm(c["subject"]).startswith(norm(sc["subject"])[:40]) or norm(sc["subject"]).startswith(norm(c["subject"])[:40])
                ):
                    how = "subject-prefix"
                if how and s["sessionId"] not in c["sessionIds"]:
                    c["sessionIds"].append(s["sessionId"])
                    c["matchedBy"] = c["matchedBy"] or how
                    matched.add(s["sessionId"])
    return [s["sessionId"] for s in sessions if s["sessionId"] not in matched]


def main():
    ap = argparse.ArgumentParser(description="The repo's commits in a range of days, with SRED trailers, as JSON.")
    ap.add_argument("--from", dest="frm", help="first day, YYYY-MM-DD (default: the latest Monday)")
    ap.add_argument("--to", help="last day, YYYY-MM-DD (default: today)")
    ap.add_argument("--exclude", help="comma-separated shas (full or abbreviated) already filed; reported under skipped")
    ap.add_argument("--repo", default=".", help="the product repo (default: current directory)")
    ap.add_argument("--repo-name", help="short name for commit sources, <name>@<sha> (default: from the origin remote)")
    ap.add_argument("--author", help="only this author's commits (default: git config user.email)")
    ap.add_argument("--all-authors", action="store_true", help="every author's commits")
    ap.add_argument("--branches", choices=["HEAD", "all"], default="HEAD", help="HEAD's history or every branch")
    ap.add_argument("--join", metavar="SESSIONS_JSON", help="sessions.py output to join on")
    args = ap.parse_args()

    repo = os.path.abspath(args.repo)
    start, end = range_bounds(args)
    name = repo_name(repo, args.repo_name)
    author = None if args.all_authors else (args.author or git(repo, "config", "user.email", check=False).strip() or None)
    fmt = "%H" + FS + "%h" + FS + "%aI" + FS + "%ae" + FS + "%s" + FS + "%B" + FS + "%(trailers:key=SRED,valueonly)" + FS + "%(trailers:key=SRED-Exclusion,valueonly)" + FS + "%(trailers:key=Work-Session,valueonly)" + FS + "%(trailers:key=SRED-Project,valueonly)" + RS
    # --since alone (committer date; git stops walking at the first older commit). The range itself
    # is applied below on the author date, so a commit rebased after the range still counts once.
    cmd = ["log", f"--since={start} 00:00:00", "--no-merges", f"--format={fmt}"]
    if author:
        cmd.append(f"--author={author}")
    if args.branches == "all":
        cmd.append("--all")
    warnings = []
    commits = [c for c in parse_log(git(repo, *cmd), name, warnings) if start.isoformat() <= c["date"] <= end.isoformat()]
    if args.branches == "all":
        seen, unique = set(), []
        for c in commits:
            if c["sha"] not in seen:
                seen.add(c["sha"])
                unique.append(c)
        commits = unique

    exclude = [s.strip() for s in (args.exclude or "").split(",") if s.strip()]
    skipped = []
    kept = []
    for c in commits:
        if any(sha_match(c["sha"], x) for x in exclude):
            skipped.append({"sha": c["sha"], "subject": c["subject"], "reason": "already-filed"})
        else:
            kept.append(c)
    commits = kept

    uncommitted = join_sessions(commits, args.join, warnings) if args.join else []
    out = {
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "repo": name,
        "author": author or "*",
        "commits": commits,
        "skipped": skipped,
        "uncommittedSessions": uncommitted,
        "warnings": warnings,
    }
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
