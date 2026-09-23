#!/usr/bin/env tsx
/**
 * Pull the team's Claude Code skills from taddyorg/taddy-internal-skills into
 * `.claude/skills/` — run it whenever a skill is updated upstream.
 *
 *   yarn sync-skills [--ref <branch|tag>]
 *
 * Shallow-clones the (private) repo with `gh` into a temp dir, then mirrors each
 * `skills/<name>/` into `.claude/skills/<name>/` — files removed upstream are
 * removed here too, like the upstream `scripts/install.sh` (rsync --delete).
 * Skills that exist only in this repo are left alone. `--ref` defaults to
 * `develop`. Review `git diff .claude/skills` and commit afterwards so everyone
 * runs the same version.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

const REPO_ROOT = path.join(__dirname, '..')
const SKILLS_REPO = 'taddyorg/taddy-internal-skills'
const DEST_DIR = path.join(REPO_ROOT, '.claude', 'skills')

const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: { ref: { type: 'string', default: 'develop' } },
})
const ref = flags.ref!

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'taddy-skills-'))
try {
  sync(tmp)
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

function sync(tmp: string): void {
  const checkout = path.join(tmp, 'repo')
  try {
    execFileSync('gh', ['repo', 'clone', SKILLS_REPO, checkout, '--', '--depth', '1', '--branch', ref], {
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  } catch {
    console.error(
      `\nCould not clone ${SKILLS_REPO}@${ref}. Check the ref exists, and that gh is installed and signed in (\`gh auth login\`) with access to the repo.`,
    )
    process.exitCode = 1
    return
  }
  const sha = execFileSync('git', ['-C', checkout, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()

  const srcDir = path.join(checkout, 'skills')
  const skills = fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  if (skills.length === 0) {
    console.error(`No skills found under skills/ in ${SKILLS_REPO}@${ref}.`)
    process.exitCode = 1
    return
  }

  fs.mkdirSync(DEST_DIR, { recursive: true })
  for (const skill of skills) {
    const dest = path.join(DEST_DIR, skill)
    fs.rmSync(dest, { recursive: true, force: true })
    fs.cpSync(path.join(srcDir, skill), dest, {
      recursive: true,
      filter: (src) => path.basename(src) !== '__pycache__',
    })
    console.log(`synced ${skill} ${skillVersion(dest)} -> ${path.relative(REPO_ROOT, dest)}`)
  }
  console.log(`\nFrom ${SKILLS_REPO}@${ref} (${sha}). Review \`git diff .claude/skills\` and commit.`)
}

/** The `version: "x.y.z"` line of SKILL.md's frontmatter metadata, or '' if absent. */
function skillVersion(skillDir: string): string {
  const skillMd = path.join(skillDir, 'SKILL.md')
  if (!fs.existsSync(skillMd)) return ''
  return fs.readFileSync(skillMd, 'utf8').match(/^\s+version:\s*"([^"]+)"/m)?.[1] ?? ''
}
