# Claude Code Skills - Mermaid Validator

A collection of Claude Code skills for markdown and Mermaid diagram validation.

## Available Skills

### [mermaid-validator](./claude/skills/markdown/mermaid-validator/)

Validates Mermaid diagram syntax in markdown files. Auto-triggers when markdown files with Mermaid diagrams are edited.

**Features:**
- Zero external dependencies
- Auto-discovers and validates ` ```mermaid ` blocks in markdown
- Catches unmatched `{}`, `[]`, `()` brackets
- Works with all Mermaid diagram types
- JSON output for programmatic use

**Quick Install:**
```bash
cp -r claude/skills/mermaid-validator ~/.claude/skills/
```

## Directory Structure

```
claude/
└── skills/
    └── markdown/
        └── mermaid-validator/
            ├── SKILL.md           # Claude Code skill definition
            └── scripts/
                └── mermaid-check.ts  # The validator script
```

## Usage

Once installed, Claude Code will automatically use this skill when:
- You ask to "check", "validate", or "fix" Mermaid diagrams
- You edit any markdown file containing Mermaid code blocks
- You mention Mermaid rendering issues

## License

MIT
