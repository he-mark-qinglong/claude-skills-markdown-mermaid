---
name: mermaid-validator
description: Validates Mermaid diagram syntax in markdown files. Use when user asks to check, validate, fix, or debug Mermaid diagrams in any markdown file, or when reading markdown files in docs/, prompts/, or .claude/rules/ directories.
---

# Mermaid Validator

A **self-contained** [Claude Code](https://claude.ai/code) skill for validating Mermaid diagram syntax within markdown files. Zero external dependencies - just copy the folder and run.

## Auto-Trigger Conditions

**This skill runs automatically when:**
- Any markdown (`.md`) file is created, edited, or updated
- User asks to "check", "validate", "fix", or "debug" Mermaid diagrams
- User mentions Mermaid rendering issues in GitHub, Obsidian, Notion, etc.
- Pre-commit or pre-push hooks for markdown files

## Installation for Claude Code

1. Copy the entire `mermaid-validator/` folder to your Claude Code skills directory:
   ```
   ~/.claude/skills/mermaid-validator/
   ├── SKILL.md
   └── scripts/
       └── mermaid-check.ts
   ```

2. That's it! Claude Code will automatically discover and use this skill.

## Quick Start (Manual Run)

```bash
npx tsx ~/.claude/skills/mermaid-validator/scripts/mermaid-check.ts --file <path-to-markdown>
```

## CLI Usage

```bash
# Validate a file
npx tsx ~/.claude/skills/mermaid-validator/scripts/mermaid-check.ts --file README.md

# JSON output (best for programmatic use)
npx tsx ~/.claude/skills/mermaid-validator/scripts/mermaid-check.ts --file README.md --format json

# Text output (human-readable)
npx tsx ~/.claude/skills/mermaid-validator/scripts/mermaid-check.ts --file README.md --format text

# Quiet mode (exit code only)
npx tsx ~/.claude/skills/mermaid-validator/scripts/mermaid-check.ts --file README.md --quiet
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
      "id": "mermaid-block-0",
      "diagramType": "flowchart",
      "code": "graph TD\nA[Start] --> B{Decision}",
      "startLine": 5,
      "endLine": 8,
      "isValid": false,
      "errors": [
        {
          "line": 1,
          "message": "Unmatched brackets: 2 opening, 1 closing",
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

- **Unmatched `{}` braces** - e.g., missing closing `}` in class definitions
- **Unmatched `[]` brackets** - e.g., missing closing `]` in node definitions
- **Unmatched `()` parentheses** - e.g., missing closing `)` in method calls
- **Empty mermaid blocks**

## Supported Diagram Types

| Type | Keywords |
|------|----------|
| Flowchart | `graph`, `flowchart`, `flow` |
| Sequence Diagram | `sequence`, `sequencediagram` |
| Class Diagram | `class`, `classdiagram` |
| State Diagram | `state`, `statediagram` |
| Entity Relationship | `er`, `entityrelationship` |
| Pie Chart | `pie` |
| Gantt Chart | `gantt` |
| Mind Map | `mindmap` |
| Quadrant Chart | `quadrant`, `quadrantchart` |
| Requirement | `requirement`, `req` |
| Git Graph | `git`, `gitgraph` |
| User Journey | `journey`, `userjourney` |
| Timeline | `timeline` |
| Sankey | `sankey` |
| Block Diagram | `block`, `blockdiagram` |
| XY Chart | `xychart`, `xy` |

## Tips for Writing Mermaid Diagrams

1. **Always use closing brackets**: `]` for square nodes, `}` for diamond decisions
2. **Quote text with spaces**: `["My Text"]`
3. **Use semicolons** to separate statements on one line
4. **Check flowchart direction**: `graph TD` (top-down) vs `graph LR` (left-right)
5. **Validate often**: Test before committing to git

## For Full Validation

This skill uses regex-based validation. For full Mermaid parser validation (catches semantic errors like negative pie chart values):

```bash
git clone https://github.com/YOUR_USERNAME/mermaid-checker
cd mermaid-checker
npm install
npm run validate:full -- --file <path>
```

## License

MIT
