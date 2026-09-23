#!/usr/bin/env python3
# Render the weekly SR&ED report (TADDY-SRED-REPORT-<from>-<to>.md) from the digest, the commits,
# the recaps and the journal — for the taddy-weekly-tasks skill. Python 3.9+, standard library
# only. Reads its inputs, prints markdown on stdout, never touches git, the transcripts or the
# app. The format is in ../references/report-format.md.
#
# Usage:
#   report.py --sessions sessions.json --commits commits.json --recaps recaps.json --journal journal.md
#             [--projects projects.json] [--author "Name"] [--archived id,id] [--already id,id]
#             [--failed "<id>=<reason>"]... [--generated YYYY-MM-DD]
#
# sessions.json / commits.json are sessions.py's and commits.py --join's output; recaps.json is
# { "<session id>": "<recap>" } with one entry per session in sessions.json; journal.md is the
# range's journal, plain text; projects.json is [{ "id", "code", "name" }] from list_projects.
# --archived: sessions uploaded in this run; --already: sessions list_files already had;
# --failed: an upload that did not return 201, with its reason. Exit 1 (errors on stderr) when a
# session has no recap or the journal is empty; warnings go to stderr and never fail the run.

import argparse
import datetime as dt
import json
import sys

RECAP_SOFT_MAX = 1500  # characters, about 200 words


def load_json(path, what):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"error: cannot read {what} {path}: {e}")


def ids_arg(raw):
    return [s.strip() for s in (raw or "").split(",") if s.strip()]


def first_words(text, limit=60):
    text = " ".join((text or "").split())
    if len(text) <= limit:
        return text
    cut = text.rfind(" ", 0, limit + 1)
    return text[: cut if cut >= limit // 2 else limit].rstrip() + "…"


def project_label(pid, projects, warnings, seen):
    if pid is None:
        return "Unknown"
    p = projects.get(pid)
    if p is None:
        if pid not in seen:
            warnings.append(f"project {pid} is not in projects.json (archived, or not assigned to you)")
            seen.add(pid)
        return f"{pid} (not visible to you)"
    code = (p.get("code") or "").strip()
    name = (p.get("name") or "").strip()
    inner = " ".join(x for x in (code, name) if x)
    return f"{pid} ({inner})" if inner else str(pid)


def match_method(commit, sid):
    return "trailer" if sid in (commit.get("trailers") or {}).get("Work-Session", []) else "in-session"


def main():
    ap = argparse.ArgumentParser(description="Render the weekly SR&ED report as markdown.")
    ap.add_argument("--sessions", required=True, help="sessions.py output")
    ap.add_argument("--commits", required=True, help="commits.py --join output")
    ap.add_argument("--recaps", required=True, help='{ "<session id>": "<recap>" }')
    ap.add_argument("--journal", required=True, help="the range's journal, plain text")
    ap.add_argument("--projects", help='[{ "id", "code", "name" }] from list_projects')
    ap.add_argument("--author", default="", help="the author's name (whoami)")
    ap.add_argument("--archived", help="comma-separated session ids uploaded in this run")
    ap.add_argument("--already", help="comma-separated session ids already in the archive")
    ap.add_argument("--failed", action="append", default=[], metavar="ID=REASON", help="a session whose upload failed, with the reason")
    ap.add_argument("--generated", help="the report's date (default: today)")
    args = ap.parse_args()

    sessions_doc = load_json(args.sessions, "sessions")
    commits_doc = load_json(args.commits, "commits")
    recaps = load_json(args.recaps, "recaps")
    projects_list = load_json(args.projects, "projects") if args.projects else []
    if isinstance(projects_list, dict):
        projects_list = projects_list.get("projects", [])
    projects = {p["id"]: p for p in projects_list if isinstance(p, dict) and "id" in p}
    try:
        with open(args.journal, encoding="utf-8") as f:
            journal = f.read().strip()
    except OSError as e:
        sys.exit(f"error: cannot read journal {args.journal}: {e}")

    sessions = sorted(sessions_doc.get("sessions", []), key=lambda s: s.get("start") or "")
    commits = sorted(commits_doc.get("commits", []), key=lambda c: (c.get("date") or "", c.get("authoredAt") or ""))
    known = {s["sessionId"] for s in sessions}
    repo = commits_doc.get("repo") or sessions_doc.get("cwd", "").rstrip("/").split("/")[-1] or "?"
    rng = sessions_doc.get("range") or commits_doc.get("range") or {}
    archived = set(ids_arg(args.archived))
    already = set(ids_arg(args.already))
    failed = {}
    for item in args.failed:
        sid, _, reason = item.partition("=")
        failed[sid.strip()] = reason.strip() or "upload failed"

    errors, warnings = [], []
    if not journal:
        errors.append(f"the journal {args.journal} is empty")
    if not isinstance(recaps, dict):
        errors.append("recaps.json must be an object { \"<session id>\": \"<recap>\" }")
        recaps = {}
    for s in sessions:
        recap = (recaps.get(s["sessionId"]) or "").strip()
        if not recap:
            errors.append(f"session {s['sessionId']} has no recap in {args.recaps}")
        elif len(recap) > RECAP_SOFT_MAX:
            warnings.append(f"session {s['sessionId']}: recap is {len(recap)} characters, over the {RECAP_SOFT_MAX} soft limit")
    for sid in recaps:
        if sid not in known:
            warnings.append(f"recaps.json names {sid}, which is not in sessions.json (ignored)")
    for w in commits_doc.get("warnings", []):
        warnings.append(f"commits.py: {w}")
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        sys.exit(1)

    by_session = {}
    for c in commits:
        for sid in c.get("sessionIds", []):
            by_session.setdefault(sid, []).append(c)

    out = []
    generated = args.generated or dt.date.today().isoformat()
    out.append(f"# Taddy SR&ED report {rng.get('from', '?')} → {rng.get('to', '?')}")
    out.append(f"- Author: {args.author or '(unknown)'}")
    out.append(f"- Repo: {repo}")
    out.append(f"- Generated: {generated}")
    out.append("")
    out.append("## Journal")
    out.append("")
    out.append(journal)
    out.append("")
    out.append("## Conversations")
    out.append("")
    seen_missing = set()
    if not sessions:
        out.append("No Claude Code conversations in this range.")
        out.append("")
    for s in sessions:
        sid = s["sessionId"]
        title = (s.get("title") or "").strip() or first_words(s.get("firstHumanMessage")) or "(untitled)"
        out.append(f"### {s.get('date')} · {title} · `{sid}`")
        out.append(f"- Date: {s.get('date')} (week of {s.get('weekStart')})")
        out.append(f"- Branch: {s.get('branch') or '(none)'}")
        cs = by_session.get(sid, [])
        if cs:
            out.append("- Commits: " + "; ".join(f"{c['source']['ref'].split('@')[0]}@{c['short']} {c['subject']} ({match_method(c, sid)})" for c in cs))
        else:
            out.append("- Commits: none")
        pids = []
        for c in cs:
            if c.get("projectId") not in pids:
                pids.append(c.get("projectId"))
        labels = [project_label(p, projects, warnings, seen_missing) for p in pids if p is not None]
        if None in pids:
            labels.append("Unknown")
        if labels and any(p is not None for p in pids):
            out.append("- Project: " + ", ".join(labels) + " — from the SRED-Project trailer")
        else:
            out.append("- Project: Unknown")
        if sid in archived:
            out.append(f"- Archived: yes ({s.get('archiveName')})")
        elif sid in already:
            out.append("- Archived: already (archived earlier)")
        elif sid in failed:
            out.append(f"- Archived: no — {failed[sid]}")
        else:
            out.append("- Archived: no — not uploaded")
        out.append("")
        out.append(recaps[sid].strip())
        out.append("")
    out.append("## Commits")
    out.append("")
    if not commits:
        out.append("No commits in this range.")
        out.append("")
    for c in commits:
        ref = f"{c['source']['ref'].split('@')[0]}@{c['short']}"
        out.append(f"### {c.get('date')} · {ref} · {c.get('subject')}")
        if c.get("projectId") is not None:
            out.append(f"- Project: {project_label(c['projectId'], projects, warnings, seen_missing)} — SRED-Project trailer")
        else:
            out.append("- Project: Unknown (no SRED-Project trailer)")
        sids = c.get("sessionIds", [])
        if sids:
            parts = []
            for sid in sids:
                note = match_method(c, sid) + ("" if sid in known else ", not in range")
                parts.append(f"`{sid}` ({note})")
            out.append("- Sessions: " + "; ".join(parts))
        else:
            out.append("- Sessions: none")
        out.append("")
        out.append((c.get("body") or "").strip() or "(no body)")
        out.append("")
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    sys.stdout.write("\n".join(out).rstrip("\n") + "\n")


if __name__ == "__main__":
    main()
