#!/usr/bin/env python3
# Mask secrets in a copy of a Claude Code transcript before upload.sh sends it to the SR&ED
# archive. Python 3.9+, standard library only. Three rules: every value found in the product
# repo's .env files (at least --min-length characters), every `Bearer <token>`, and every value
# the commit scan's token rules match (RULES, the same list as taddy-commit/scripts/secret-scan.py:
# known token formats, key assignments, private keys, URLs with credentials) become
# XXX_SECRET_XXX. Only the matched span is replaced, so every line stays the JSON object it was;
# a private key is masked from its BEGIN header through its END marker. The output keeps the
# input's lines apart from those replacements, then each --append file's lines (a session's
# <id>/subagents/*.jsonl) after the parent's. The summary names the env keys it used, the ones it
# skipped as too short and the counts per rule; it never prints a value.
#
# Usage: redact.py --repo <product repo> --in <session.jsonl> --out <redacted.jsonl>
#                  [--append <subagent.jsonl>]... [--min-length 8]

import argparse
import json
import os
import re
import sys

MASK = "XXX_SECRET_XXX"
BEARER_RE = re.compile(r"(?i)(bearer\s+)(?!XXX_SECRET_XXX)[A-Za-z0-9._~+/=-]{8,}")
KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", "coverage"}
SKIP_SUFFIXES = (".example", ".sample", ".template")
PRIVATE_KEY_END_RE = re.compile(r"-----END [A-Z ]*PRIVATE KEY(?: BLOCK)?-----")
STRING_REST_RE = re.compile(r'(?:[^"\\]|\\.)*')  # the rest of a JSON string value, escapes kept whole
ESCAPED_BREAK_RE = re.compile(r"(\\[nrt])")  # a line break inside a JSON string: the rules see one line at a time

# Shared with taddy-commit/scripts/secret-scan.py; keep byte-identical (evals/run-scripts.sh checks).
PLACEHOLDER_WORDS = ("example", "changeme", "placeholder", "your_", "your-", "xxx", "redacted",
                     "dummy", "fake", "replace", "todo", "sample", "xxx_secret_xxx")
PLACEHOLDER_RE = re.compile(r"(?i)^(<.*>|\$\{.*\}|\$[A-Za-z_][A-Za-z0-9_]*|null|none|true|false|\*{3,}|(.)\2+)$")
CODE_LIKE = ("process.env", "os.environ", "getenv", "config.", "env.", "settings.", "this.", "self.")
KEY_SKIP_RE = re.compile(r"(?i)[_-]?(url|uri|path|file|dir|name|id|header|ttl|expir\w*|length|len|type|kind|count|prefix|regex|pattern)$")
VAR_NAME_RE = re.compile(r"^[A-Z_][A-Z0-9_]*$")
ASSIGN_RE = re.compile(
    r"(?i)\b([\w.-]*?(?:api[_-]?key|apikey|secret|token|passw(?:or)?d|private[_-]?key|"
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


def env_files(repo):
    for dirpath, dirnames, filenames in os.walk(repo):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if (name == ".env" or name.startswith(".env.")) and not name.endswith(SKIP_SUFFIXES):
                yield os.path.join(dirpath, name)


def unquote(value):
    v = value.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        inner = v[1:-1]
        if v[0] == '"':
            inner = inner.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
        return inner
    return v.split(" #", 1)[0].strip()


def parse_env(path):
    """(key, value) pairs of one .env file."""
    pairs = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            if line.startswith("export "):
                line = line[7:].lstrip()
            key, value = line.split("=", 1)
            key = key.strip()
            if KEY_RE.match(key):
                pairs.append((key, unquote(value)))
    return pairs


def keep_escape(text, start, end):
    """A span may not end on the backslash that escapes the next character."""
    n = 0
    while end - n > start and text[end - n - 1] == "\\":
        n += 1
    return end - 1 if n % 2 else end


def rule_span(rule, m, text):
    """(start, end) of what this match masks, or None when the value is a placeholder."""
    if rule == "private-key":
        end_m = PRIVATE_KEY_END_RE.search(text, m.end(1))
        return m.start(1), end_m.end() if end_m else STRING_REST_RE.match(text, m.end(1)).end()
    if rule == "assignment":
        return None if assignment_value(m) is None else (m.start(2), keep_escape(text, m.start(2), m.end(2)))
    return None if is_placeholder(m.group(1)) else (m.start(1), keep_escape(text, m.start(1), m.end(1)))


def mask_rule(rule, rx, text, counts):
    pos = 0
    while True:
        m = rx.search(text, pos)
        if not m:
            break
        span = rule_span(rule, m, text)
        if span is None:
            pos = m.end()
            continue
        start, end = span
        text = text[:start] + MASK + text[end:]
        counts[rule] += 1
        pos = start + len(MASK)
    return text


def mask_rules(line, counts):
    """The private-key rule reads the whole line (a key spans escaped line breaks); every other
    rule sees the text between escaped line breaks, as the commit scan sees a line of a diff."""
    line = mask_rule("private-key", RULES[0][1], line, counts)
    parts = ESCAPED_BREAK_RE.split(line)
    for i in range(0, len(parts), 2):
        for rule, rx in RULES[1:]:
            parts[i] = mask_rule(rule, rx, parts[i], counts)
    return "".join(parts)


def redact_lines(src_path, dst, forms, counts):
    n = 0
    with open(src_path, encoding="utf-8", errors="surrogateescape") as src:
        for line in src:
            n += 1
            line, k = BEARER_RE.subn(lambda m: m.group(1) + MASK, line)
            counts["bearer"] += k
            for form in forms:
                if form in line:
                    counts["env"] += line.count(form)
                    line = line.replace(form, MASK)
            line = mask_rules(line, counts["rules"])
            if "\n" in line[:-1]:
                sys.exit("error: a redaction would change the line count")
            dst.write(line)
    return n


def main():
    ap = argparse.ArgumentParser(description="Mask .env values, Bearer tokens and known token formats in a transcript copy.")
    ap.add_argument("--repo", required=True, help="the product repo whose .env files hold the secrets")
    ap.add_argument("--in", dest="src", required=True, help="the transcript to read")
    ap.add_argument("--out", dest="dst", required=True, help="where to write the redacted copy")
    ap.add_argument("--append", action="append", default=[], metavar="PATH", help="a subagent transcript whose lines follow the parent's, redacted the same way")
    ap.add_argument("--min-length", type=int, default=8, help="shorter .env values are left alone (default 8)")
    args = ap.parse_args()

    repo = os.path.abspath(args.repo)
    files, keys, skipped_short, forms = [], [], [], {}
    for path in sorted(env_files(repo)):
        files.append(os.path.relpath(path, repo))
        for key, value in parse_env(path):
            if len(value) < args.min_length:
                if value:
                    skipped_short.append(key)
                continue
            keys.append(key)
            for form in {value, json.dumps(value)[1:-1]}:
                forms[form] = key
    ordered = sorted(forms, key=len, reverse=True)

    counts = {"env": 0, "bearer": 0, "rules": {rule: 0 for rule, _ in RULES}}
    with open(args.dst, "w", encoding="utf-8", errors="surrogateescape") as dst:
        lines_in = redact_lines(args.src, dst, ordered, counts)
        appended_lines = 0
        for path in args.append:
            appended_lines += redact_lines(path, dst, ordered, counts)

    summary = {
        "envFiles": files,
        "envKeys": sorted(set(keys)),
        "skippedShort": sorted(set(skipped_short)),
        "replacements": counts,
        "lines": lines_in + appended_lines,
        "appended": [os.path.abspath(p) for p in args.append],
        "appendedLines": appended_lines,
        "out": os.path.abspath(args.dst),
    }
    json.dump(summary, sys.stdout)
    print()


if __name__ == "__main__":
    main()
