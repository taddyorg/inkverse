#!/usr/bin/env python3
# The Claude Code sessions behind a repo's uncommitted work, for the taddy-commit skill: run
# before every commit, it lists the earlier sessions that edited the files about to be
# committed and marks the conversation that is running now. Python 3.9+, standard library
# only; reads ~/.claude/projects/<encoded cwd>*/<id>.jsonl (and <id>/subagents/*.jsonl for
# the files a session edited through a subagent) and prints JSON; never uploads or writes
# anything. A self-contained copy of the transcript plumbing in
# taddy-weekly-tasks/scripts/sessions.py — the two skills share no code on purpose.
#
# Usage:
#   work-sessions.py --cwd "$PWD" [--since ISO] [--files a,b,c] [--repo DIR] [--self ID]   # digest
#   work-sessions.py --cwd "$PWD" --dump <session id> [--max-chars 800] [--max-turns 80]
#
# --self is this conversation's session id (default: $CLAUDE_CODE_SESSION_ID, which Claude Code
# sets in Bash). The matching session is marked `current: true` and never dumped: its recap is
# already in context. `currentSession` at the top level repeats the id (null when unset) and
# `currentSessionInDigest` says whether it was found among the kept sessions.
#
# Defaults: --since = the last commit's committer date (`git log -1 --format=%cI`; the epoch when
# the repo has no commit); --files = the paths `git status --porcelain` lists (renames: the new
# path); --repo = --cwd (where git runs; the tests point it at a temporary repo). A session is
# kept when it edited one of those files after the file's last commit (`touched`), named one in
# a Bash command after the file's last commit (`mentioned`: heredocs, sed -i, scripts), or ran
# on after --since (`afterLastCommit`). An edit older than the file's last commit is listed under
# `touchedBeforeCommit` and does not count, and an older mention is dropped: both are most
# likely already in. Both --since
# and --files are overridable so the digest also runs with no git repo behind it.

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

DEFAULT_ROOT = Path.home() / ".claude" / "projects"
EDIT_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit")
COMMIT_CMD_RE = re.compile(r"\bgit\s+(?:-C\s+\S+\s+)?commit\b")
COMMIT_OUT_RE = re.compile(r"^\[(?P<branch>[^\s\]]+)(?: \([^)]*\))? (?P<sha>[0-9a-f]{7,40})\] (?P<subject>.*)$", re.M)
MSG_FLAG_RE = re.compile(r"""-m\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')""")
HEREDOC_RE = re.compile(r"<<-?\s*'?\"?(\w+)'?\"?\s*\n(.*)", re.S)
EPOCH = dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)


def encode_cwd(cwd):
    return re.sub(r"[^A-Za-z0-9]", "-", cwd)


def candidate_dirs(root, cwd):
    enc = encode_cwd(cwd)
    if not root.is_dir():
        return []
    return sorted(d for d in root.iterdir() if d.is_dir() and (d.name == enc or d.name.startswith(enc + "-")))


def transcript_files(dirs):
    for d in dirs:
        yield from sorted(d.glob("*.jsonl"))  # top level; <id>/subagents/*.jsonl are folded into <id> by digest_file


def subagent_messages(path):
    """The timestamped lines of <id>/subagents/*.jsonl: a subagent's edits and commands count as
    the parent session's, since the parent transcript only records that it delegated."""
    sub_dir = path.parent / path.stem / "subagents"
    if not sub_dir.is_dir():
        return [], 0
    messages, files = [], 0
    for f in sorted(sub_dir.glob("*.jsonl")):
        files += 1
        lines, _ = read_lines(f)
        messages.extend(l for l in lines if isinstance(l.get("timestamp"), str))
    return messages, files


def local(ts):
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone()


def parse_since(s):
    try:
        d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        sys.exit(f"error: --since {s!r} is not an ISO timestamp")
    return d if d.tzinfo else d.astimezone()


def git(cwd, *args):
    r = subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def default_since(cwd):
    out = git(cwd, "log", "-1", "--format=%cI")
    return parse_since(out.strip()) if out and out.strip() else EPOCH


def file_commit_dates(repo, files):
    """Each file's last commit date, or None when it was never committed (or there is no repo)."""
    dates = {}
    for f in files:
        out = git(repo, "log", "-1", "--format=%cI", "--", f)
        dates[f] = parse_since(out.strip()) if out and out.strip() else None
    return dates


def default_files(cwd):
    out = git(cwd, "status", "--porcelain", "--untracked-files=all")
    if out is None:
        return None
    files = []
    for line in out.splitlines():
        if len(line) < 4:
            continue
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        files.append(path.strip('"'))
    return files


def relative_to_cwd(path, cwd):
    """A tool's file_path relative to the repo, or None when it points outside it."""
    if not path:
        return None
    if os.path.isabs(path):
        norm = os.path.normpath(path)
        if norm == cwd:
            return None
        if norm.startswith(cwd + os.sep):
            return norm[len(cwd) + 1:]
        return None
    return os.path.normpath(path)


def read_lines(path):
    """Every parsed JSON line, plus a count of lines that were not JSON objects."""
    lines, bad = [], 0
    with open(path, encoding="utf-8", errors="replace") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                bad += 1
                continue
            if isinstance(obj, dict):
                lines.append(obj)
            else:
                bad += 1
    return lines, bad


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""


def is_human(msg):
    return msg.get("type") == "user" and not msg.get("isMeta") and (msg.get("origin") or {}).get("kind") == "human"


def result_text(msg):
    """The text of a tool_result user line, preferring toolUseResult.stdout for Bash."""
    tur = msg.get("toolUseResult")
    if isinstance(tur, dict) and isinstance(tur.get("stdout"), str) and tur["stdout"].strip():
        return tur["stdout"]
    for b in (msg.get("message") or {}).get("content") or []:
        if isinstance(b, dict) and b.get("type") == "tool_result":
            c = b.get("content")
            return c if isinstance(c, str) else text_of(c)
    return ""


def subject_from_command(cmd):
    m = MSG_FLAG_RE.search(cmd)
    if m:
        s = (m.group(1) or m.group(2) or "").replace('\\"', '"')
        return s.strip().splitlines()[0] if s.strip() else None
    m = HEREDOC_RE.search(cmd)
    if m:
        for line in m.group(2).splitlines():
            if line.strip() and line.strip() != m.group(1):
                return line.strip()
    return None


def is_suspect(cmd, cwd):
    if re.search(r"\bgit\s+init\b", cmd):
        return True
    for m in re.finditer(r"\bcd\s+(/\S+)", cmd):
        target = m.group(1).rstrip("/")
        if not (target == cwd or target.startswith(cwd + "/")):
            return True
    return False


def find_commits(messages, cwd):
    pending, commits = {}, []
    for msg in messages:
        if msg.get("type") == "assistant":
            for b in (msg.get("message") or {}).get("content") or []:
                if not (isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "Bash"):
                    continue
                cmd = (b.get("input") or {}).get("command") or ""
                if COMMIT_CMD_RE.search(cmd):
                    entry = {
                        "command": cmd[:300],
                        "sha": None,
                        "subject": subject_from_command(cmd),
                        "at": local(msg["timestamp"]).isoformat(),
                        "ok": None,
                        "suspect": is_suspect(cmd, cwd),
                    }
                    pending[b.get("id")] = entry
                    commits.append(entry)
        elif msg.get("type") == "user" and pending:
            for b in (msg.get("message") or {}).get("content") or []:
                if isinstance(b, dict) and b.get("type") == "tool_result" and b.get("tool_use_id") in pending:
                    entry = pending.pop(b["tool_use_id"])
                    out = result_text(msg)
                    m = COMMIT_OUT_RE.search(out)
                    if m:
                        entry["sha"], entry["subject"], entry["ok"] = m.group("sha"), m.group("subject"), True
                    elif re.search(r"^Exit code|nothing to commit|nothing added to commit", out, re.M):
                        entry["ok"] = False
                    else:
                        entry["ok"] = True if out.strip() else None
    return commits


def edited_files(messages, cwd):
    files = []
    for m in messages:
        if m.get("type") != "assistant":
            continue
        for b in (m.get("message") or {}).get("content") or []:
            if not (isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") in EDIT_TOOLS):
                continue
            inp = b.get("input") or {}
            rel = relative_to_cwd(inp.get("file_path") or inp.get("notebook_path"), cwd)
            if rel and rel not in files:
                files.append(rel)
    return files


def mentioned_files(messages, uncommitted):
    """Uncommitted files named in a Bash command: a heredoc, sed -i, a script that writes them."""
    found = []
    for m in messages:
        if m.get("type") != "assistant":
            continue
        for b in (m.get("message") or {}).get("content") or []:
            if not (isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "Bash"):
                continue
            cmd = (b.get("input") or {}).get("command") or ""
            for f in uncommitted:
                if f not in found and re.search(r"(?<![\w./-])" + re.escape(f) + r"(?![\w-])", cmd):
                    found.append(f)
    return [f for f in uncommitted if f in found]


def digest_file(path, cwd, since, uncommitted, dates, max_first):
    lines, bad = read_lines(path)
    messages = [l for l in lines if isinstance(l.get("timestamp"), str)]
    sid = next((l.get("sessionId") for l in lines if l.get("sessionId")), path.stem)
    if not messages:
        return None, {"sessionId": sid, "path": str(path), "reason": "parse-error" if bad and not lines else "no-messages"}
    first = messages[0]
    first_cwd = first.get("cwd") or ""
    if not (first_cwd == cwd or first_cwd.startswith(cwd + "/")):
        return None, {"sessionId": sid, "path": str(path), "reason": "other-cwd"}
    start_dt = local(first["timestamp"])
    end_dt = local(messages[-1]["timestamp"])
    subs, sub_files = subagent_messages(path)
    work = messages + subs  # what the session did, subagents included; turns and dates stay the parent's
    edited = edited_files(work, cwd)
    touched, stale = [], []
    for f in uncommitted:
        if f not in edited:
            continue
        committed = dates.get(f)
        (touched if committed is None or end_dt > committed else stale).append(f)
    mentioned = [f for f in mentioned_files(work, uncommitted)
                 if f not in touched and f not in stale and (dates.get(f) is None or end_dt > dates[f])]
    after = end_dt > since
    if not touched and not mentioned and not after:
        return None, {"sessionId": sid, "path": str(path), "reason": "before-last-commit"}

    title = next((l.get("aiTitle") for l in lines if l.get("type") == "ai-title" and l.get("aiTitle")), None)
    branch = next((m.get("gitBranch") for m in messages if m.get("gitBranch")), None)
    humans = [text_of((m.get("message") or {}).get("content")) for m in messages if is_human(m)]
    first_human = next((h for h in humans if h.strip()), "")
    tool_uses = Counter()
    for m in messages:
        if m.get("type") == "assistant":
            for b in (m.get("message") or {}).get("content") or []:
                if isinstance(b, dict) and b.get("type") == "tool_use":
                    tool_uses[b.get("name") or "?"] += 1
    return {
        "sessionId": sid,
        "path": str(path),
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat(),
        "date": start_dt.date().isoformat(),
        "branch": branch,
        "title": title,
        "firstHumanMessage": first_human[:max_first],
        "humanTurns": len(humans),
        "toolUses": dict(tool_uses),
        "editedFiles": edited,
        "touched": touched,
        "touchedBeforeCommit": stale,
        "mentioned": mentioned,
        "afterLastCommit": after,
        "commits": find_commits(work, cwd),
        "subagentFiles": sub_files,
        "unparsedLines": bad,
    }, None


def cmd_digest(args, cwd, root):
    repo = os.path.abspath(args.repo) if args.repo else cwd
    since = parse_since(args.since) if args.since else default_since(repo)
    if args.files is not None:
        uncommitted = [f.strip() for f in args.files.split(",") if f.strip()]
    else:
        uncommitted = default_files(repo)
        if uncommitted is None:
            sys.exit(f"error: {repo} is not a git repository; pass --files")
    dates = file_commit_dates(repo, uncommitted)
    dirs = candidate_dirs(root, cwd)
    sessions, skipped = [], []
    for path in transcript_files(dirs):
        try:
            session, skip = digest_file(path, cwd, since, uncommitted, dates, args.max_first)
        except Exception as e:  # one broken file must not sink the digest
            skip = {"sessionId": path.stem, "path": str(path), "reason": "parse-error", "detail": str(e)[:200]}
            session = None
        (sessions if session else skipped).append(session or skip)
    sessions.sort(key=lambda s: s["start"])
    me = (args.self_id or "").strip() or None
    for s in sessions:
        s["current"] = s["sessionId"] == me
    matched = {f for s in sessions for f in s["touched"] + s["mentioned"]}
    counts = Counter(k["reason"] for k in skipped)
    listed = [k for k in skipped if k["reason"] not in ("before-last-commit", "other-cwd")]
    out = {
        "since": since.isoformat(),
        "cwd": cwd,
        "projectDirs": [str(d) for d in dirs],
        "uncommittedFiles": uncommitted,
        "fileLastCommit": {f: (d.isoformat() if d else None) for f, d in dates.items()},
        "currentSession": me,
        "currentSessionInDigest": any(s["current"] for s in sessions),
        "sessions": sessions,
        "unmatchedFiles": [f for f in uncommitted if f not in matched],
        "skipped": listed,
        "skippedCounts": dict(counts),
    }
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    print()


def find_session(root, cwd, sid):
    for path in transcript_files(candidate_dirs(root, cwd)):
        if path.stem == sid:
            return path
    sys.exit(f"error: no transcript named {sid}.jsonl under {root} for {cwd}")


def truncate(text, cap):
    text = text.strip()
    if len(text) <= cap:
        return text
    return text[:cap].rstrip() + f" …(+{len(text) - cap} chars)"


def cmd_dump(args, cwd, root):
    if args.self_id and args.dump == args.self_id.strip():
        sys.exit(f"error: {args.dump} is this conversation (--self); its recap is already in context, do not dump it")
    path = find_session(root, cwd, args.dump)
    lines, _ = read_lines(path)
    messages = [l for l in lines if isinstance(l.get("timestamp"), str)]
    title = next((l.get("aiTitle") for l in lines if l.get("type") == "ai-title"), None)
    entries = []  # (kind, timestamp, text)
    for m in messages:
        if is_human(m):
            t = text_of((m.get("message") or {}).get("content"))
            if t.strip():
                entries.append(["H", m["timestamp"], t])
        elif m.get("type") == "assistant":
            blocks = (m.get("message") or {}).get("content") or []
            text = "\n".join(b.get("text", "") for b in blocks if isinstance(b, dict) and b.get("type") == "text").strip()
            tools = Counter(b.get("name") or "?" for b in blocks if isinstance(b, dict) and b.get("type") == "tool_use")
            if text:
                entries.append(["A", m["timestamp"], text])
            elif tools:
                entries.append(["T", m["timestamp"], " ".join(f"{k}×{v}" for k, v in tools.items())])
    if not messages:
        sys.exit(f"error: {path} holds no messages")
    first = messages[0]
    print(f"session {path.stem} | {local(first['timestamp']).date()} | branch {first.get('gitBranch')} | {title or '(no title)'} | {len(entries)} turns")
    if len(entries) > args.max_turns:
        head = args.max_turns // 3
        tail = args.max_turns - head
        skipped = len(entries) - head - tail
        entries = entries[:head] + [["S", None, f"[… skipped {skipped} turns …]"]] + entries[-tail:]
    assistant_idx = [i for i, e in enumerate(entries) if e[0] == "A"]
    tail_set = set(assistant_idx[-args.keep_tail:]) if args.keep_tail else set()
    for i, (kind, ts, text) in enumerate(entries):
        if kind == "S":
            print(text)
            continue
        stamp = local(ts).strftime("%H:%M")
        if kind == "T":
            print(f"[tools {stamp}] {text}")
            continue
        cap = args.max_chars * (3 if i in tail_set else 1)
        print(f"[{kind} {stamp}] {truncate(text, cap)}")


def main():
    ap = argparse.ArgumentParser(description="The Claude Code sessions behind a repo's uncommitted work.")
    ap.add_argument("--cwd", required=True, help="the product repo's absolute path (the session's working directory)")
    ap.add_argument("--since", help="ISO timestamp; sessions active after it are kept (default: the last commit's date)")
    ap.add_argument("--files", help="comma-separated repo-relative paths (default: git status --porcelain)")
    ap.add_argument("--repo", help="where git runs for the defaults and the per-file commit dates (default: --cwd)")
    ap.add_argument("--projects-root", default=str(DEFAULT_ROOT), help="where Claude Code keeps transcripts")
    ap.add_argument("--self", dest="self_id", default=os.environ.get("CLAUDE_CODE_SESSION_ID"),
                    help="this conversation's session id, marked current and never dumped (default: $CLAUDE_CODE_SESSION_ID)")
    ap.add_argument("--max-first", type=int, default=2000, help="characters kept of the first human message")
    ap.add_argument("--dump", metavar="SESSION_ID", help="print one session's human turns and assistant text instead")
    ap.add_argument("--max-chars", type=int, default=800, help="dump: characters kept per turn")
    ap.add_argument("--max-turns", type=int, default=80, help="dump: turns kept (first third, last two thirds)")
    ap.add_argument("--keep-tail", type=int, default=5, help="dump: last assistant messages allowed 3x the cap")
    args = ap.parse_args()
    cwd = os.path.abspath(args.cwd).rstrip("/")
    root = Path(args.projects_root).expanduser()
    if args.dump:
        cmd_dump(args, cwd, root)
    else:
        cmd_digest(args, cwd, root)


if __name__ == "__main__":
    main()
