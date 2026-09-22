#!/usr/bin/env python3
# Validate the SRED-DRAFT markdown file the person edited (taddy-weekly-tasks, Step 6) and emit
# the exact put_journal / create_tasks payloads. Python 3.9+, standard library only. Reads only.
# The grammar is in ../references/draft-format.md.
#
# Usage: draft.py check SRED-DRAFT-<from>-<to>.md
# Exit 0 and JSON on stdout when the draft is valid; exit 1 and one error per line on stderr otherwise.

import datetime as dt
import json
import re
import sys

SECTION_RE = re.compile(r"^##\s+(?P<heading>.*?)\s*<!--\s*project:(?P<project>\d+)\s+week:(?P<week>\d{4}-\d{2}-\d{2})\s*-->\s*$")
BARE_SECTION_RE = re.compile(r"^##\s")
JOURNAL_RE = re.compile(r"^###\s+Journal\s*$", re.I)
TASK_RE = re.compile(r"^###\s+Task\b.*$", re.I)
FIELD_RE = re.compile(r"^-\s*(kind|date|sources)\s*:\s*(.*)$", re.I)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
COMMIT_REF_RE = re.compile(r"^[^@\s]+@[0-9a-f]{7,40}$", re.I)
FILE_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,200}$")
KINDS = ("experiment", "decision", "routine")
SOURCE_TYPES = ("file", "commit", "url")
MAX_TASKS = 20
BODY_MAX = 20_000


def monday_of(d):
    return d - dt.timedelta(days=d.weekday())


def clean(text):
    return COMMENT_RE.sub("", text).strip()


def parse_sources(raw, where, errors):
    sources = []
    for part in [p.strip() for p in raw.split(";") if p.strip()]:
        m = re.match(r"^(file|commit|url)\s+(\S+)(?:\s+(?:—|--)\s+(.*))?$", part, re.I)
        if not m:
            errors.append(f"{where}: cannot parse source {part!r} (expected 'file <id>', 'commit <repo>@<sha> — <label>' or 'url <https://…>')")
            continue
        typ, ref, label = m.group(1).lower(), m.group(2), (m.group(3) or "").strip()
        if typ == "commit" and not COMMIT_REF_RE.match(ref):
            errors.append(f"{where}: commit ref {ref!r} must look like <repo>@<7-40 hex sha>")
        if typ == "url" and not re.match(r"^https?://", ref):
            errors.append(f"{where}: url {ref!r} must start with http:// or https://")
        if typ == "file" and not FILE_ID_RE.match(ref):
            errors.append(f"{where}: file id {ref!r} may only contain letters, digits, '.', '_' and '-'")
        src = {"type": typ, "ref": ref}
        if label:
            src["label"] = label[:200]
        sources.append(src)
    if len(sources) > 20:
        errors.append(f"{where}: at most 20 sources")
    return sources


def parse(text):
    """Split the draft into sections → journal + task blocks. Returns (sections, errors, warnings)."""
    errors, warnings, sections = [], [], []
    lines = text.splitlines()
    if not lines or not lines[0].startswith("# "):
        warnings.append("no '# SR&ED draft <from> → <to>' title line")
    cur = None
    block = None  # ("journal", lines) or ("task", heading, lines)

    def close_block():
        nonlocal block
        if block is None:
            return
        if block[0] == "journal":
            cur["journal_raw"] = "\n".join(block[1])
        else:
            cur["task_blocks"].append((block[1], block[2]))
        block = None

    for i, line in enumerate(lines, 1):
        m = SECTION_RE.match(line)
        if m:
            close_block()
            cur = {"line": i, "heading": m.group("heading"), "projectId": int(m.group("project")), "weekStart": m.group("week"), "journal_raw": None, "task_blocks": []}
            sections.append(cur)
            continue
        if BARE_SECTION_RE.match(line):
            close_block()
            cur = None
            errors.append(f"line {i}: section heading is missing its '<!-- project:<id> week:<YYYY-MM-DD> -->' comment")
            continue
        if JOURNAL_RE.match(line):
            close_block()
            if cur is None:
                errors.append(f"line {i}: '### Journal' outside any section")
                continue
            block = ("journal", [])
            continue
        if TASK_RE.match(line):
            close_block()
            if cur is None:
                errors.append(f"line {i}: task block outside any section")
                continue
            block = ("task", f"line {i} ({line.strip()})", [])
            continue
        if block is not None:
            block[-1].append(line)
    close_block()
    return sections, errors, warnings


def check(text):
    sections, errors, warnings = parse(text)
    today = dt.date.today()
    out = []
    seen_files = {}
    if not sections:
        errors.append("no sections: expected '## <heading> <!-- project:<id> week:<YYYY-MM-DD> -->'")
    for sec in sections:
        where = f"section '{sec['heading']}' (line {sec['line']})"
        try:
            week = dt.date.fromisoformat(sec["weekStart"])
        except ValueError:
            errors.append(f"{where}: week {sec['weekStart']!r} is not a date")
            continue
        if monday_of(week) != week:
            errors.append(f"{where}: week {sec['weekStart']} is not a Monday")
        journal = clean(sec["journal_raw"] or "")
        if not journal:
            errors.append(f"{where}: the journal is empty (a section needs a '### Journal' with text)")
        if len(journal) > BODY_MAX:
            errors.append(f"{where}: the journal is longer than {BODY_MAX} characters")
        tasks = []
        file_ids = []
        for heading, blines in sec["task_blocks"]:
            fields, body_lines, in_fields = {}, [], True
            for l in blines:
                fm = FIELD_RE.match(l) if in_fields else None
                if fm:
                    fields[fm.group(1).lower()] = fm.group(2).strip()
                elif in_fields and not l.strip() and not body_lines:
                    continue
                else:
                    in_fields = False
                    body_lines.append(l)
            body = clean("\n".join(body_lines))
            kind = fields.get("kind", "").lower()
            if kind not in KINDS:
                errors.append(f"{heading}: kind {fields.get('kind')!r} must be one of {', '.join(KINDS)}")
            date_raw = fields.get("date", "")
            try:
                date = dt.date.fromisoformat(date_raw)
                if monday_of(date) != week:
                    errors.append(f"{heading}: date {date_raw} is outside the section's week starting {sec['weekStart']}")
                if date > today:
                    errors.append(f"{heading}: date {date_raw} is in the future")
            except ValueError:
                errors.append(f"{heading}: date {date_raw!r} must be YYYY-MM-DD")
            if not body:
                errors.append(f"{heading}: the body is empty")
            if len(body) > BODY_MAX:
                errors.append(f"{heading}: the body is longer than {BODY_MAX} characters")
            sources = parse_sources(fields.get("sources", ""), heading, errors)
            for s in sources:
                if s["type"] == "file":
                    file_ids.append(s["ref"])
                    prev = seen_files.setdefault(s["ref"], sec["projectId"])
                    if prev != sec["projectId"]:
                        warnings.append(f"{heading}: session {s['ref']} is also cited under project {prev}; it will be uploaded under project {prev}")
            task = {"kind": kind, "date": date_raw, "body": body}
            if sources:
                task["sources"] = sources
            tasks.append(task)
        if len(tasks) > MAX_TASKS:
            errors.append(f"{where}: {len(tasks)} tasks; create_tasks takes at most {MAX_TASKS} per section")
        out.append({
            "projectId": sec["projectId"],
            "weekStart": sec["weekStart"],
            "heading": sec["heading"],
            "journal": {"body": journal},
            "tasks": tasks,
            "fileSources": list(dict.fromkeys(file_ids)),
        })
    return {"sections": out, "warnings": warnings}, errors


def main():
    if len(sys.argv) != 3 or sys.argv[1] != "check":
        sys.exit("usage: draft.py check <SRED-DRAFT file>")
    try:
        with open(sys.argv[2], encoding="utf-8") as f:
            text = f.read()
    except OSError as e:
        sys.exit(f"error: {e}")
    result, errors = check(text)
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        sys.exit(1)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
