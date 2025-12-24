import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Tokenizer } from '../src/tokenizer.js';
import { Parser } from '../src/parser.js';
import { Transpiler } from '../src/transpiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function transpileFile(relative: string): string {
  const inputPath = path.resolve(projectRoot, relative);
  const content = fs.readFileSync(inputPath, 'utf-8');
  const tokenizer = new Tokenizer(content);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const transpiler = new Transpiler(ast);
  return transpiler.transpile();
}

function readExpected(name: string): string {
  const expectedPath = path.resolve(projectRoot, 'tests', 'fixtures', 'expected', name);
  return fs.readFileSync(expectedPath, 'utf-8');
}

const normalize = (text: string) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();

describe('HTex -> LaTeX transpilation', () => {
  it('transpiles unendlicheAutomaten example', () => {
    const output = normalize(transpileFile('examples/unendlicheAutomaten.htex'));
    const expected = normalize(readExpected('unendlicheAutomaten.tex'));
    expect(output).toBe(expected);
  });

  it('transpiles gauss example', () => {
    const output = normalize(transpileFile('examples/gauss.htex'));
    const expected = normalize(readExpected('gauss.tex'));
    expect(output).toBe(expected);
  });

  it('transpiles heading-test example', () => {
    const output = normalize(transpileFile('examples/heading-test.htex'));
    const expected = normalize(readExpected('heading-test.tex'));
    expect(output).toBe(expected);
  });
});
