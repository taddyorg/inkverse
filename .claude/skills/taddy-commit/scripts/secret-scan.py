#!/usr/bin/env python3
# The staged change checked for a dropped .gitignore line and for secrets, for the taddy-commit
# skill: run after staging and before the message is written, and again in front of
# `git commit`. Python 3.9+, standard library only; reads the index through git and prints
# JSON. It never prints a value: excerpts are masked (first four characters and the length),
# and the approval id is a hash. Self-contained on purpose: no code is shared with the weekly
# skill, though the .env and Bearer conventions match its redact.py.
#
# Usage:
#   secret-scan.py [--repo DIR] [--message-file PATH] [--approved ID] [--max-history 5]
#
# Findings (kind): gitignore-removed, gitignore-negated, gitignore-deleted, secret-file,
# ignored-file-staged, secret-added, secret-removed, message-secret. Each carries a number
# the user answers by name (keep / unstage), a masked excerpt and a recommended command.
# `approvalId` hashes the findings shown; `--approved <id>` exits 0 only when the index still
# yields the same findings and the message holds no value, so a changed index or a secret in
# the message stops the chained `git commit`. Exit 0 clean or approved, 1 findings, 2 error.

import argparse
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys

SECRET_FILE_NAMES = {
    ".env", ".netrc", "_netrc", ".pypirc", ".htpasswd", "credentials.json",
    "secrets.json", "secrets.yml", "secrets.yaml",
}
SECRET_FILE_GLOBS = (
    "*.pem", "*.key", "*.p12", "*.pfx", "*.jks", "*.keystore", "*.ppk", "id_rsa*",
    "id_ed25519*", "id_ecdsa*", "*.tfvars", "*-credentials.json", "service-account*.json",
)
ENV_SKIP_SUFFIXES = (".example", ".sample", ".template", ".dist")
SKIP_CONTENT_NAMES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}
SKIP_CONTENT_GLOBS = ("*.lock", "*.min.*", "*.map", "*.svg")

# A captured value that is one of these is a placeholder, not a secret.
PLACEHOLDER_WORDS = ("example", "changeme", "placeholder", "your_", "your-", "xxx", "redacted",
                     "dummy", "fake", "replace", "todo", "sample", "xxx_secret_xxx")
PLACEHOLDER_RE = re.compile(r"(?i)^(<.*>|\$\{.*\}|\$[A-Za-z_][A-Za-z0-9_]*|null|none|true|false|\*{3,}|(.)\2+)$")
CODE_LIKE = ("process.env", "os.environ", "getenv", "config.", "env.", "settings.", "this.", "self.")
KEY_SKIP_RE = re.compile(r"(?i)[_-]?(url|uri|path|file|dir|name|id|header|ttl|expir\w*|length|len|type|kind|count|prefix|regex|pattern)$")
VAR_NAME_RE = re.compile(r"^[A-Z_][A-Z0-9_]*$")

ASSIGN_RE = re.compile(
    r"(?i)\b([A-Za-z_][\w.-]*?(?:api[_-]?key|apikey|secret|token|passw(?:or)?d|private[_-]?key|"
    r"client[_-]?secret|access[_-]?key|credential)[\w-]*)\s*[:=]\s*[\"']?([^\s\"',;]{8,})"
)
RULES = [
    ("private-key", re.compile(r"(-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----)")),
    ("aws-key", re.compile(r"\b((?:AKIA|ASIA)[A-Z0-9]{16})\b")),
    ("github-token", re.compile(r"\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b")),
    ("slack-token", re.compile(r"\b(xox[baprs]-[A-Za-z0-9-]{10,})")),
    ("stripe-live", re.compile(r"\b([sr]k_live_[A-Za-z0-9]{16,})\b")),
    ("google-key", re.compile(r"\b(AIza[0-9A-Za-z_-]{35})")),
    ("anthropic-key", re.compile(r"\b(sk-ant-[A-Za-z0-9_-]{20,})")),
    ("openai-key", re.compile(r"\b(sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,})")),
    ("jwt", re.compile(r"\b(eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})")),
    ("bearer", re.compile(r"(?i)\bbearer\s+([A-Za-z0-9._~+/=-]{16,})")),
    ("url-credentials", re.compile(r"://[^\s/:@]+:([^\s/@]{4,})@")),
    ("assignment", ASSIGN_RE),
]

RECOMMEND = {
    "gitignore-removed": "git restore --staged -- {file}, then put the line back",
    "gitignore-negated": "git restore --staged -- {file}, then drop the ! line",
    "gitignore-deleted": "git restore --staged -- {file} and keep the file",
    "secret-file-A": "git rm --cached -- {file}",
    "secret-file-M": "git restore --staged -- {file}",
    "secret-file-D": "keep the removal and rotate every value the file held: it is in {history}",
    "ignored-file-staged": "git rm --cached -- {file}",
    "secret-added": "git restore --staged -- {file}, then read the value from the environment",
    "secret-removed": "keep the removal and rotate the credential: it is in {history}",
    "message-secret": "edit the line out of the message",
}


def fail(msg):
    print(f"error: {msg}", file=sys.stderr)
    json.dump({"ok": False, "error": msg}, sys.stdout)
    print()
    sys.exit(2)


def git(repo, *args, check=True, stdin=None):
    p = subprocess.run(["git", "-C", repo, "-c", "core.quotePath=false", *args],
                       capture_output=True, text=True, input=stdin)
    if check and p.returncode != 0:
        fail(f"git {args[0]} failed: {p.stderr.strip() or p.returncode}")
    return p


def is_placeholder(value):
    low = value.lower()
    return any(w in low for w in PLACEHOLDER_WORDS) or bool(PLACEHOLDER_RE.match(value))


def assignment_value(m):
    key, value = m.group(1), m.group(2)
    if KEY_SKIP_RE.search(key):
        return None
    if is_placeholder(value) or VAR_NAME_RE.match(value):
        return None
    if "(" in value or value.startswith(("http", "/", "./", "~", "{", "[")) or any(c in value for c in CODE_LIKE):
        return None
    has_digit = any(ch.isdigit() for ch in value)
    has_alpha = any(ch.isalpha() for ch in value)
    if not ((has_digit and has_alpha) or len(value) >= 24):
        return None
    return value


def match_line(text):
    """(rule, value) of the first rule the line matches, else None."""
    for rule, rx in RULES:
        m = rx.search(text)
        if not m:
            continue
        value = assignment_value(m) if rule == "assignment" else m.group(1)
        if value is None or (rule != "private-key" and is_placeholder(value)):
            continue
        return rule, value
    return None


def mask(value):
    return value[:4] + "…(" + str(len(value)) + " chars)"


def excerpt_of(text, value, rule):
    shown = text.strip()
    if rule != "private-key":
        shown = shown.replace(value, mask(value))
    return shown[:100]


def is_secret_file(path):
    base = os.path.basename(path)
    if base == ".env" or (base.startswith(".env.") and not base.endswith(ENV_SKIP_SUFFIXES)):
        return True
    return base in SECRET_FILE_NAMES or any(fnmatch.fnmatch(base, g) for g in SECRET_FILE_GLOBS)


def skip_content(path):
    base = os.path.basename(path)
    return base in SKIP_CONTENT_NAMES or any(fnmatch.fnmatch(base, g) for g in SKIP_CONTENT_GLOBS)


def name_status(repo):
    """[(status letter, path)] for the index; a rename or copy lists its new path."""
    out = git(repo, "diff", "--cached", "--name-status", "-z", "-M").stdout.split("\0")
    entries, i = [], 0
    while i < len(out) and out[i]:
        status = out[i][0]
        if status in "RC":
            entries.append((status, out[i + 2])); i += 3
        else:
            entries.append((status, out[i + 1])); i += 2
    return entries


def ignored(repo, paths):
    """{path: 'file:line:pattern'} for the paths a .gitignore rule matches."""
    if not paths:
        return {}
    p = git(repo, "check-ignore", "--no-index", "-v", "-z", "--stdin", check=False,
            stdin="".join(x + "\0" for x in paths))
    if p.returncode not in (0, 1):
        fail(f"git check-ignore failed: {p.stderr.strip()}")
    parts, hits = p.stdout.split("\0"), {}
    for i in range(0, len(parts) - 3, 4):
        source, line, pattern, path = parts[i:i + 4]
        if source:
            hits[path] = f"{source}:{line}:{pattern}"
    return hits


def parse_diff(repo):
    """{path: {'binary': bool, 'lines': [(side, number, text)]}} from the index diff, -U0."""
    out = git(repo, "diff", "--cached", "-U0", "--no-color", "--no-ext-diff", "--no-textconv", "-M",
              "--no-prefix").stdout
    files, cur, old, new = {}, None, 0, 0
    for raw in out.split("\n"):
        if raw.startswith("diff --git "):
            cur = None
        elif raw.startswith("--- ") and cur is None and not raw.startswith("--- /dev/null"):
            cur = files.setdefault(unquote(raw[4:]), {"binary": False, "lines": []})
        elif raw.startswith("+++ ") and not raw.startswith("+++ /dev/null"):
            cur = files.setdefault(unquote(raw[4:]), {"binary": False, "lines": []})
        elif raw.startswith("Binary files "):
            for path in re.findall(r"Binary files (.+?) and (.+?) differ", raw)[0]:
                if path != "/dev/null":
                    files.setdefault(path, {"binary": True, "lines": []})["binary"] = True
        elif raw.startswith("@@"):
            m = re.match(r"@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@", raw)
            old, new = int(m.group(1)), int(m.group(2))
        elif cur is not None and raw.startswith("+"):
            cur["lines"].append(("new", new, raw[1:])); new += 1
        elif cur is not None and raw.startswith("-"):
            cur["lines"].append(("old", old, raw[1:])); old += 1
    return files


def unquote(path):
    if len(path) >= 2 and path[0] == '"' and path[-1] == '"':
        return path[1:-1].encode("latin-1", "backslashreplace").decode("unicode_escape")
    return path


def history(repo, n, file, value=None):
    args = ["log", f"--format=%h", f"--max-count={n}"]
    if value is not None:
        args.append("-S" + value)
    p = git(repo, *args, "--", file, check=False)
    return p.stdout.split() if p.returncode == 0 else []


def scan_message(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            lines = f.read().split("\n")
    except OSError as e:
        fail(f"cannot read --message-file: {e}")
    found = []
    for i, text in enumerate(lines, 1):
        hit = match_line(text)
        if hit:
            rule, value = hit
            found.append({"kind": "message-secret", "file": "<message>", "line": i, "side": None,
                          "rule": rule, "excerpt": excerpt_of(text, value, rule),
                          "recommend": RECOMMEND["message-secret"], "_value": value})
    return found


def main():
    ap = argparse.ArgumentParser(description="Check the index for a dropped .gitignore line and for secrets.")
    ap.add_argument("--repo", default=os.getcwd(), help="the git repo (default: the working directory)")
    ap.add_argument("--message-file", help="also scan this draft commit message")
    ap.add_argument("--approved", help="the approvalId of the run the user answered; exit 0 when it still holds")
    ap.add_argument("--max-history", type=int, default=5, help="how many commits to name for a removed value")
    a = ap.parse_args()

    top = git(a.repo, "rev-parse", "--show-toplevel", check=False)
    if top.returncode != 0:
        fail(f"not a git repository: {a.repo}")
    repo = top.stdout.strip()
    if git(repo, "diff", "--cached", "--quiet", check=False).returncode == 0:
        fail("nothing staged")

    entries = name_status(repo)
    diff = parse_diff(repo)
    hits = ignored(repo, [p for s, p in entries if s in "ARC"])
    findings, scanned = [], {"files": 0, "skipped": [], "added": 0, "removed": 0}

    def add(kind, file, **fields):
        f = {"kind": kind, "file": file, "line": None, "side": None, "rule": None, "excerpt": None}
        f.update(fields)
        f.setdefault("recommend", RECOMMEND.get(kind, "").format(file=file, history=""))
        findings.append(f)

    # Path-level findings, in index order.
    for status, path in entries:
        base = os.path.basename(path)
        if base == ".gitignore":
            if status in "DR":
                add("gitignore-deleted", path)
            for side, num, text in diff.get(path, {}).get("lines", []):
                line = text.strip()
                if side == "old" and line and not line.startswith("#"):
                    add("gitignore-removed", path, line=num, side="old", excerpt=line[:100])
                elif side == "new" and line.startswith("!"):
                    add("gitignore-negated", path, line=num, side="new", excerpt=line[:100])
            continue
        if is_secret_file(path):
            key = "secret-file-" + (status if status in "AMD" else "A")
            hist = history(repo, a.max_history, path) if status == "D" else []
            add("secret-file", path, status=status, ignored=path in hits,
                recommend=RECOMMEND[key].format(file=path, history=", ".join(hist) or "no commit"),
                **({"inHistory": hist} if status == "D" else {}))
            continue
        if path in hits:
            add("ignored-file-staged", path, status=status, rule=hits[path])

    # Line-level findings.
    flagged_paths = {f["file"] for f in findings}
    for path, info in diff.items():
        if path in flagged_paths or os.path.basename(path) == ".gitignore":
            continue
        if info["binary"] or skip_content(path):
            scanned["skipped"].append(path)
            continue
        scanned["files"] += 1
        for side, num, text in info["lines"]:
            scanned["added" if side == "new" else "removed"] += 1
            hit = match_line(text)
            if not hit:
                continue
            rule, value = hit
            kind = "secret-added" if side == "new" else "secret-removed"
            extra = {}
            if kind == "secret-removed":
                extra["inHistory"] = history(repo, a.max_history, path, value)
                rec = RECOMMEND[kind].format(file=path, history=", ".join(extra["inHistory"]) or "no commit")
            else:
                rec = RECOMMEND[kind].format(file=path, history="")
            add(kind, path, line=num, side=side, rule=rule, excerpt=excerpt_of(text, value, rule),
                recommend=rec, _value=value, **extra)

    message_findings = scan_message(a.message_file) if a.message_file else []

    material = sorted(f"{f['kind']}|{f['file']}|{f['line']}|{f['rule']}|{f.get('_value', f['excerpt'])}" for f in findings)
    approval_id = hashlib.sha256("\n".join(material).encode()).hexdigest()[:12] if findings else None
    findings.extend(message_findings)
    for n, f in enumerate(findings, 1):
        f.pop("_value", None)
        f["n"] = n
    approved = bool(a.approved) and (approval_id is None or a.approved == approval_id) and not message_findings
    ok = not findings
    json.dump({"ok": ok, "repo": repo, "scanned": scanned, "findings": findings,
               "approvalId": approval_id, "approvedId": a.approved, "approved": approved}, sys.stdout, ensure_ascii=False)
    print()
    sys.exit(0 if ok or approved else 1)


if __name__ == "__main__":
    main()
