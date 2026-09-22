#!/usr/bin/env python3
# Mask secrets in a copy of a Claude Code transcript before upload.sh sends it to the SR&ED
# archive. Python 3.9+, standard library only. Two rules: every value found in the product repo's
# .env files (at least --min-length characters) and every `Bearer <token>` become XXX_SECRET_XXX.
# The output keeps the input's lines byte for byte apart from those replacements. The summary
# names the env keys it used and the ones it skipped as too short; it never prints a value.
#
# Usage: redact.py --repo <product repo> --in <session.jsonl> --out <redacted.jsonl> [--min-length 8]

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


def main():
    ap = argparse.ArgumentParser(description="Mask .env values and Bearer tokens in a transcript copy.")
    ap.add_argument("--repo", required=True, help="the product repo whose .env files hold the secrets")
    ap.add_argument("--in", dest="src", required=True, help="the transcript to read")
    ap.add_argument("--out", dest="dst", required=True, help="where to write the redacted copy")
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

    counts = {"env": 0, "bearer": 0}
    lines_in = lines_out = 0
    with open(args.src, encoding="utf-8", errors="surrogateescape") as src, open(args.dst, "w", encoding="utf-8", errors="surrogateescape") as dst:
        for line in src:
            lines_in += 1
            line, n = BEARER_RE.subn(lambda m: m.group(1) + MASK, line)
            counts["bearer"] += n
            for form in ordered:
                if form in line:
                    counts["env"] += line.count(form)
                    line = line.replace(form, MASK)
            dst.write(line)
            lines_out += 1

    summary = {
        "envFiles": files,
        "envKeys": sorted(set(keys)),
        "skippedShort": sorted(set(skipped_short)),
        "replacements": counts,
        "lines": lines_in,
        "out": os.path.abspath(args.dst),
    }
    json.dump(summary, sys.stdout)
    print()
    if lines_in != lines_out:
        sys.exit("error: line count changed during redaction")


if __name__ == "__main__":
    main()
