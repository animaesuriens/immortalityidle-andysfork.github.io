# Claude Code Instructions

## Git Commands

This repository often has many uncommitted changes. To prevent commands from hanging:

- **Always** use `git --no-pager` for any git command that produces output (diff, log, status, show, etc.)
- Use `--stat` instead of full diffs when possible to reduce output size
- For large diffs, use `git --no-pager diff --stat` first to assess the scope

Examples:
```bash
git --no-pager diff --stat
git --no-pager log --oneline -10
git --no-pager status
```

## Hooks

If a pre-commit hook or other hook runs and provides instructions, follow those instructions carefully.
