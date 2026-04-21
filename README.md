# Claude Code Skills - Markdown Validation

A collection of Claude Code skills for validating content within markdown files.

## Available Skills

### [mermaid-validator](./claude/skills/markdown/mermaid-validator/)

Validates Mermaid diagram syntax in markdown files. Auto-triggers when markdown files with Mermaid diagrams are edited.

**Features:**
- Zero external dependencies
- Auto-discovers ` ```mermaid ` blocks in markdown
- Catches unmatched `{}`, `[]`, `()` brackets
- Works with all Mermaid diagram types

### [json-validator](./claude/skills/markdown/json-validator/)

Validates JSON syntax in markdown files. Auto-triggers when markdown files with JSON code blocks are edited.

**Features:**
- Zero external dependencies
- Auto-discovers ` ```json ` blocks in markdown
- Precise line and column error locations
- Full JSON.parse() validation

## Quick Install (All Skills)

```bash
git clone https://github.com/he-mark-qinglong/claude-skills-markdown-mermaid.git /tmp/claude-skills
cp -r /tmp/claude-skills/claude/skills/* ~/.claude/skills/
```

## Directory Structure

```
claude/skills/markdown/
├── mermaid-validator/
│   ├── SKILL.md
│   └── scripts/
│       └── mermaid-check.ts
└── json-validator/
    ├── SKILL.md
    └── scripts/
        └── json-check.ts
```

## Usage

Once installed, Claude Code will automatically use these skills when:
- You ask to "check", "validate", or "fix" Mermaid/JSON in markdown
- You edit any markdown file containing code blocks
- You mention rendering issues

## License

MIT
