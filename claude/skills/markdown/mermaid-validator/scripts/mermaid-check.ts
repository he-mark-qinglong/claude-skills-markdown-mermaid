#!/usr/bin/env npx tsx
/**
 * Mermaid Checker - Self-contained Validation Script
 * Validates Mermaid diagram syntax in markdown files using regex-based checking.
 *
 * Usage:
 *   npx tsx scripts/mermaid-check.ts --file README.md
 *   npx tsx scripts/mermaid-check.ts --file README.md --format json
 *   echo "```mermaid\ngraph TD\nA-->B\n```" | npx tsx scripts/mermaid-check.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Types
// ============================================================================

interface ValidationError {
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

interface MermaidBlock {
  id: string;
  diagramType: string;
  code: string;
  startLine: number;
  endLine: number;
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationResult {
  isValid: boolean;
  blocks: MermaidBlock[];
  totalErrors: number;
  totalWarnings: number;
}

// ============================================================================
// Supported Diagram Types
// ============================================================================

const MERMAID_DIAGRAM_TYPES = [
  'mermaid', 'flowchart', 'flow', 'graph', 'sequence', 'sequencediagram',
  'class', 'classdiagram', 'state', 'statediagram', 'er', 'entityrelationship',
  'pie', 'gantt', 'mindmap', 'quadrant', 'quadrantchart',
  'requirement', 'req', 'git', 'gitgraph', 'journey', 'userjourney',
  'zenuml', 'c4c', 'timeline', 'sankey', 'block', 'blockdiagram',
  'xychart', 'xy', 'packet', 'topology', 'architecture', 'git-graph',
  'stateDiagram', 'stateDiagram-v2', 'graphTD', 'graph LR', 'graph RL', 'graph BT'
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Extract all mermaid blocks from markdown content
 */
function extractMermaidBlocks(markdown: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  const lines = markdown.split('\n');
  let blockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const currentLine = i + 1;

    const blockStartMatch = line.match(/^```(\w+)?\s*$/);
    if (blockStartMatch) {
      const lang = blockStartMatch[1]?.toLowerCase() || '';
      const isMermaid = MERMAID_DIAGRAM_TYPES.includes(lang) || lang === 'mermaid';

      if (isMermaid) {
        const startLine = currentLine;
        const codeLines: string[] = [];
        let endLine = startLine;

        for (let j = i + 1; j < lines.length; j++) {
          endLine = j + 1;
          if (lines[j].trim() === '```') {
            break;
          }
          codeLines.push(lines[j]);
        }

        blocks.push({
          id: `mermaid-block-${blockIndex++}`,
          diagramType: lang === 'mermaid' ? 'mermaid' : lang,
          code: codeLines.join('\n'),
          startLine,
          endLine,
          isValid: true,
          errors: []
        });

        i = endLine;
      }
    }
  }

  return blocks;
}

/**
 * Validate a single mermaid block using regex-based bracket matching
 */
function validateMermaidBasic(block: MermaidBlock): MermaidBlock {
  if (!block.code.trim()) {
    block.isValid = false;
    block.errors.push({
      line: 1,
      message: 'Empty mermaid block',
      severity: 'error'
    });
    return block;
  }

  const code = block.code;

  // Check for unmatched braces {}
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    block.isValid = false;
    block.errors.push({
      line: findLineWithMismatch(code, '{', '}'),
      message: `Unmatched braces: ${openBraces} opening, ${closeBraces} closing`,
      severity: 'error'
    });
  }

  // Check for unmatched parentheses ()
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    block.isValid = false;
    block.errors.push({
      line: findLineWithMismatch(code, '(', ')'),
      message: `Unmatched parentheses: ${openParens} opening, ${closeParens} closing`,
      severity: 'error'
    });
  }

  // Check for unmatched brackets []
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    block.isValid = false;
    block.errors.push({
      line: findLineWithMismatch(code, '[', ']'),
      message: `Unmatched brackets: ${openBrackets} opening, ${closeBrackets} closing`,
      severity: 'error'
    });
  }

  return block;
}

/**
 * Find approximate line number where bracket mismatch occurs
 */
function findLineWithMismatch(code: string, open: string, close: string): number {
  const lines = code.split('\n');
  let lineNum = 1;

  for (const line of lines) {
    const opens = (line.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const closes = (line.match(new RegExp(`\\${close}`, 'g')) || []).length;
    if (opens !== closes) {
      return lineNum;
    }
    lineNum++;
  }

  return 1;
}

/**
 * Validate all mermaid blocks in markdown
 */
function validateMarkdown(markdown: string): ValidationResult {
  const blocks = extractMermaidBlocks(markdown);

  for (const block of blocks) {
    validateMermaidBasic(block);
  }

  const totalErrors = blocks.reduce(
    (sum, b) => sum + b.errors.filter(e => e.severity === 'error').length, 0
  );
  const totalWarnings = blocks.reduce(
    (sum, b) => sum + b.errors.filter(e => e.severity === 'warning').length, 0
  );

  return {
    isValid: totalErrors === 0,
    blocks,
    totalErrors,
    totalWarnings
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

interface CliArgs {
  file?: string;
  input?: string;
  format: 'json' | 'text';
  quiet: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { format: 'json', quiet: false, help: false };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--file' || arg === '-f') {
      args.file = argv[++i];
    } else if (arg === '--input' || arg === '-i') {
      args.input = argv[++i];
    } else if (arg === '--format' || arg === '-o') {
      const format = argv[++i]?.toLowerCase();
      if (format === 'json' || format === 'text') {
        args.format = format;
      }
    } else if (arg === '--quiet' || arg === '-q') {
      args.quiet = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
Mermaid Checker CLI

Usage:
  npx tsx ~/.claude/skills/mermaid-checker/scripts/mermaid-check.ts --file <path>
  echo "markdown" | npx tsx ~/.claude/skills/mermaid-checker/scripts/mermaid-check.ts

Options:
  --file, -f <path>     Path to markdown file
  --input, -i <text>    Markdown content directly
  --format, -o <type>   Output format: json (default) or text
  --quiet, -q           Suppress logs, only output exit code
  --help, -h            Show this help message

Exit Codes:
  0  Validation successful
  1  Validation failed (syntax errors found)
  2  File not found
  3  Invalid arguments
`);
}

function formatText(result: ValidationResult, filePath?: string): string {
  const lines: string[] = [];

  if (filePath) {
    lines.push(`File: ${filePath}`);
    lines.push('');
  }

  const errorCount = result.blocks.reduce((sum, b) => sum + b.errors.length, 0);
  lines.push(`Summary: ${errorCount} error(s), ${result.totalWarnings} warning(s)`);
  lines.push(`Blocks: ${result.blocks.length} total, ${result.blocks.filter((b) => b.isValid).length} valid`);
  lines.push('');

  for (let i = 0; i < result.blocks.length; i++) {
    const block = result.blocks[i];
    const status = block.isValid ? '✓' : '✗';
    const type = block.diagramType;
    const range = `L${block.startLine}-L${block.endLine}`;

    lines.push(`${status} Block #${i + 1} (${type} ${range}) - ${block.isValid ? 'Valid' : 'Invalid'}`);

    if (block.errors.length > 0) {
      for (const error of block.errors) {
        lines.push(`  L${error.line}: ${error.message}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.file && !args.input && process.stdin.isTTY) {
    if (!args.quiet) {
      console.error('Error: Must provide --file or --input, or pipe content via stdin');
      console.error('Use --help for usage information');
    }
    process.exit(3);
  }

  let markdown: string;

  try {
    if (args.file) {
      const filePath = resolve(args.file);
      markdown = readFileSync(filePath, 'utf-8');
    } else if (args.input) {
      markdown = args.input;
    } else {
      markdown = await new Promise<string>((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => data += chunk);
        process.stdin.on('end', () => resolve(data));
      });
    }
  } catch {
    if (!args.quiet) {
      console.error(`Error: File not found - ${args.file}`);
    }
    process.exit(2);
  }

  try {
    const result = validateMarkdown(markdown);

    // Add summary
    const summary = {
      totalBlocks: result.blocks.length,
      validBlocks: result.blocks.filter((b) => b.isValid).length,
      invalidBlocks: result.blocks.filter((b) => !b.isValid).length,
      file: args.file
    };

    const output = {
      ...result,
      summary
    };

    if (args.format === 'json') {
      if (!args.quiet) {
        console.log(JSON.stringify(output, null, 2));
      }
    } else {
      if (!args.quiet) {
        console.log(formatText(result, args.file));
      }
    }

    process.exit(result.totalErrors > 0 ? 1 : 0);
  } catch (err) {
    if (!args.quiet) {
      console.error('Error: Validation failed');
      console.error(err instanceof Error ? err.message : String(err));
    }
    process.exit(1);
  }
}

main();
