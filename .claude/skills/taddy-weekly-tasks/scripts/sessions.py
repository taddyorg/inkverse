#!/usr/bin/env python3
# Digest a repo's Claude Code transcripts over a range of days, for the taddy-weekly-tasks skill.
# Python 3.9+, standard library only. Reads ~/.claude/projects/<encoded cwd>*/<session id>.jsonl
# and prints JSON; never uploads or writes anything. Nothing about time is measured: timestamps
# only give each session its day and the order of turns.
#
# Usage:
#   sessions.py --cwd "$PWD" [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--exclude id,id]   # digest
#   sessions.py --cwd "$PWD" --dump <session id> [--max-chars 800] [--max-turns 80]    # one session's turns
#
# Defaults: --from = the latest Monday (today if today is a Monday), --to = today, both local time.
# --exclude lists session ids already filed (from list_sources' `file` refs); they land in `skipped`.

import argparse
import datetime as dt
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

DEFAULT_ROOT = Path.home() / ".claude" / "projects"
COMMIT_CMD_RE = re.compile(r"\bgit\s+(?:-C\s+\S+\s+)?commit\b")
COMMIT_OUT_RE = re.compile(r"^\[(?P<branch>[^\s\]]+)(?: \([^)]*\))? (?P<sha>[0-9a-f]{7,40})\] (?P<subject>.*)$", re.M)
MSG_FLAG_RE = re.compile(r"""-m\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')""")
HEREDOC_RE = re.compile(r"<<-?\s*'?\"?(\w+)'?\"?\s*\n(.*)", re.S)


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


def encode_cwd(cwd):
    return re.sub(r"[^A-Za-z0-9]", "-", cwd)


def candidate_dirs(root, cwd):
    enc = encode_cwd(cwd)
    if not root.is_dir():
        return []
    return sorted(d for d in root.iterdir() if d.is_dir() and (d.name == enc or d.name.startswith(enc + "-")))


def transcript_files(dirs):
    for d in dirs:
        yield from sorted(d.glob("*.jsonl"))  # top level only: <id>/subagents/*.jsonl are never read


def local(ts):
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone()


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


def slugify(text, limit=40):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    if len(s) > limit:
        cut = s.rfind("-", 0, limit + 1)
        s = s[: cut if cut >= limit // 2 else limit]
    return s.rstrip("-") or "session"


def digest_file(path, cwd, start, end, exclude, max_first):
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
    date = start_dt.date()
    if not (start <= date <= end):
        return None, {"sessionId": sid, "path": str(path), "reason": "outside-range"}
    if sid in exclude:
        return None, {"sessionId": sid, "path": str(path), "reason": "already-filed"}

    title = next((l.get("aiTitle") for l in lines if l.get("type") == "ai-title" and l.get("aiTitle")), None)
    branch = next((m.get("gitBranch") for m in messages if m.get("gitBranch")), None)
    version = next((m.get("version") for m in messages if m.get("version")), None)
    slug = next((m.get("slug") for m in messages if m.get("slug")), None)
    humans = [text_of((m.get("message") or {}).get("content")) for m in messages if is_human(m)]
    first_human = next((h for h in humans if h.strip()), "")
    tool_uses = Counter()
    assistant_turns = 0
    for m in messages:
        if m.get("type") == "assistant":
            assistant_turns += 1
            for b in (m.get("message") or {}).get("content") or []:
                if isinstance(b, dict) and b.get("type") == "tool_use":
                    tool_uses[b.get("name") or "?"] += 1
    slug_src = title or (re.sub(r"-[a-z]+-[a-z]+$", "", slug) if slug else None) or " ".join(first_human.split()[:5])
    return {
        "sessionId": sid,
        "path": str(path),
        "bytes": path.stat().st_size,
        "date": date.isoformat(),
        "weekStart": monday_of(date).isoformat(),
        "start": start_dt.isoformat(),
        "end": local(messages[-1]["timestamp"]).isoformat(),
        "branch": branch,
        "version": version,
        "title": title,
        "archiveName": f"{date.isoformat()}-{slugify(slug_src)}.jsonl",
        "humanTurns": len([h for h in humans]),
        "assistantTurns": assistant_turns,
        "toolUses": dict(tool_uses),
        "firstHumanMessage": first_human[:max_first],
        "commits": find_commits(messages, cwd),
        "hasSubagents": (path.parent / path.stem / "subagents").is_dir(),
        "unparsedLines": bad,
    }, None


def cmd_digest(args, cwd, root):
    start, end = range_bounds(args)
    exclude = {s.strip() for s in (args.exclude or "").split(",") if s.strip()}
    dirs = candidate_dirs(root, cwd)
    sessions, skipped = [], []
    for path in transcript_files(dirs):
        try:
            session, skip = digest_file(path, cwd, start, end, exclude, args.max_first)
        except Exception as e:  # one broken file must not sink the digest
            skip = {"sessionId": path.stem, "path": str(path), "reason": "parse-error", "detail": str(e)[:200]}
            session = None
        (sessions if session else skipped).append(session or skip)
    sessions.sort(key=lambda s: s["start"])
    # Sessions from other days or sibling repos are the bulk of a transcripts folder; only the
    # skips worth a look are listed, the rest is counted.
    counts = Counter(k["reason"] for k in skipped)
    listed = [k for k in skipped if k["reason"] not in ("outside-range", "other-cwd")]
    out = {
        "range": {"from": start.isoformat(), "to": end.isoformat(), "tz": dt.datetime.now().astimezone().tzname()},
        "cwd": cwd,
        "projectDirs": [str(d) for d in dirs],
        "sessions": sessions,
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
    ap = argparse.ArgumentParser(description="Digest Claude Code transcripts for the weekly SR&ED pass.")
    ap.add_argument("--cwd", required=True, help="the product repo's absolute path (the session's working directory)")
    ap.add_argument("--from", dest="frm", help="first day, YYYY-MM-DD (default: the latest Monday)")
    ap.add_argument("--to", help="last day, YYYY-MM-DD (default: today)")
    ap.add_argument("--exclude", help="comma-separated session ids already filed; reported under skipped")
    ap.add_argument("--projects-root", default=str(DEFAULT_ROOT), help="where Claude Code keeps transcripts")
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
