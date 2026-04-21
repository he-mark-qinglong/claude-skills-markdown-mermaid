---
name: json-validator
description: Validates JSON syntax in markdown files. Self-contained Claude Code skill with zero external dependencies. Auto-triggers when markdown files with JSON code blocks are edited.
---

# JSON Validator

A **self-contained** [Claude Code](https://claude.ai/code) skill for validating JSON syntax within markdown files. Zero external dependencies - just copy the folder and run.

## Auto-Trigger Conditions

**This skill runs automatically when:**
- Any markdown (`.md`) file is created, edited, or updated
- User asks to "check", "validate", "fix", or "debug" JSON in markdown
- User pastes markdown containing JSON code blocks
- Pre-commit or pre-push hooks for markdown files

## Installation for Claude Code

1. Copy the entire `json-validator/` folder to your Claude Code skills directory:
   ```
   ~/.claude/skills/json-validator/
   ├── SKILL.md
   └── scripts/
       └── json-check.ts
   ```

2. That's it! Claude Code will automatically discover and use this skill.

## Quick Start (Manual Run)

```bash
npx tsx ~/.claude/skills/json-validator/scripts/json-check.ts --file <path-to-markdown>
```

## CLI Usage

```bash
# Validate a file
npx tsx ~/.claude/skills/json-validator/scripts/json-check.ts --file README.md

# JSON output (best for programmatic use)
npx tsx ~/.claude/skills/json-validator/scripts/json-check.ts --file README.md --format json

# Text output (human-readable)
npx tsx ~/.claude/skills/json-validator/scripts/json-check.ts --file README.md --format text

# Quiet mode (exit code only)
npx tsx ~/.claude/skills/json-validator/scripts/json-check.ts --file README.md --quiet
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Validation successful (no errors found) |
| 1 | Validation failed (syntax errors found) |
| 2 | File not found |
| 3 | Invalid arguments |

## JSON Output Format

```json
{
  "isValid": false,
  "blocks": [
    {
      "id": "json-block-0",
      "code": "{\n  \"name\": \"test\",\n  \"invalid",
      "startLine": 5,
      "endLine": 8,
      "isValid": false,
      "errors": [
        {
          "line": 2,
          "column": 10,
          "message": "Unexpected end of JSON input",
          "severity": "error"
        }
      ]
    }
  ],
  "totalErrors": 1,
  "totalWarnings": 0,
  "summary": {
    "totalBlocks": 1,
    "validBlocks": 0,
    "invalidBlocks": 1
  }
}
```

## What This Skill Catches

- **Invalid JSON syntax** - missing quotes, trailing commas, etc.
- **Unterminated strings**
- **Unexpected tokens**
- **Empty JSON blocks**
- Provides precise line and column for errors

## License

MIT
