#!/usr/bin/env npx tsx
/**
 * JSON Validator - Self-contained Validation Script
 * Validates JSON code blocks within markdown files.
 *
 * Usage:
 *   npx tsx scripts/json-check.ts --file README.md
 *   npx tsx scripts/json-check.ts --file README.md --format json
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

interface JsonBlock {
  id: string;
  code: string;
  startLine: number;
  endLine: number;
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationResult {
  isValid: boolean;
  blocks: JsonBlock[];
  totalErrors: number;
  totalWarnings: number;
}

// ============================================================================
// Core Functions
// ============================================================================

function extractJsonBlocks(markdown: string): JsonBlock[] {
  const blocks: JsonBlock[] = [];
  const lines = markdown.split('\n');
  let blockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const currentLine = i + 1;

    const blockStartMatch = line.match(/^```(?:json|JSON)\s*$/);
    if (blockStartMatch) {
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
        id: `json-block-${blockIndex++}`,
        code: codeLines.join('\n'),
        startLine,
        endLine,
        isValid: true,
        errors: []
      });

      i = endLine;
    }
  }

  return blocks;
}

function validateJsonBlock(block: JsonBlock): JsonBlock {
  if (!block.code.trim()) {
    block.isValid = false;
    block.errors.push({
      line: 1,
      message: 'Empty JSON block',
      severity: 'error'
    });
    return block;
  }

  try {
    JSON.parse(block.code);
  } catch (e) {
    block.isValid = false;
    const errorMsg = e instanceof Error ? e.message : String(e);
    const errorInfo = parseJsonError(errorMsg, block.code);
    block.errors.push(errorInfo);
  }

  return block;
}

function parseJsonError(errorMsg: string, code: string): ValidationError {
  const positionMatch = errorMsg.match(/at position (\d+)/);
  const lineMatch = errorMsg.match(/line (\d+)/i);
  const columnMatch = errorMsg.match(/column (\d+)/i);

  let line = 1;
  let column: number | undefined;

  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    const codeLines = code.split('\n');
    let charCount = 0;
    for (let i = 0; i < codeLines.length; i++) {
      if (charCount + codeLines[i].length >= position) {
        line = i + 1;
        column = position - charCount + 1;
        break;
      }
      charCount += codeLines[i].length + 1;
    }
  } else if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
    if (columnMatch) {
      column = parseInt(columnMatch[1], 10);
    }
  }

  return {
    line,
    column,
    message: errorMsg,
    severity: 'error'
  };
}

function validateMarkdown(markdown: string): ValidationResult {
  const blocks = extractJsonBlocks(markdown);

  for (const block of blocks) {
    validateJsonBlock(block);
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
  const helpText = [
    'JSON Validator CLI',
    '',
    'Usage:',
    '  npx tsx scripts/json-check.ts --file <path>',
    '',
    'Options:',
    '  --file, -f <path>     Path to markdown file',
    '  --input, -i <text>    Markdown content directly',
    '  --format, -o <type>   Output format: json (default) or text',
    '  --quiet, -q           Suppress logs, only output exit code',
    '  --help, -h            Show this help message',
    '',
    'Exit Codes:',
    '  0  Validation successful',
    '  1  Validation failed (syntax errors found)',
    '  2  File not found',
    '  3  Invalid arguments',
  ].join('\n');

  console.log('\n' + helpText + '\n');
}

function formatText(result: ValidationResult, filePath?: string): string {
  const lines: string[] = [];

  if (filePath) {
    lines.push('File: ' + filePath);
    lines.push('');
  }

  const errorCount = result.blocks.reduce((sum, b) => sum + b.errors.length, 0);
  lines.push('Summary: ' + errorCount + ' error(s), ' + result.totalWarnings + ' warning(s)');
  lines.push('Blocks: ' + result.blocks.length + ' total, ' + result.blocks.filter((b) => b.isValid).length + ' valid');
  lines.push('');

  for (let i = 0; i < result.blocks.length; i++) {
    const block = result.blocks[i];
    const status = block.isValid ? '✓' : '✗';
    const range = 'L' + block.startLine + '-L' + block.endLine;

    lines.push(status + ' Block #' + (i + 1) + ' (' + range + ') - ' + (block.isValid ? 'Valid' : 'Invalid'));

    if (block.errors.length > 0) {
      for (const error of block.errors) {
        const col = error.column ? ':' + error.column : '';
        lines.push('  L' + error.line + col + ': ' + error.message);
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
      console.error('Error: File not found - ' + args.file);
    }
    process.exit(2);
  }

  try {
    const result = validateMarkdown(markdown);

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
