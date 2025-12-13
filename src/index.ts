import fs from 'fs';
import path from 'path';
import { Tokenizer, Token } from './tokenizer.js';
import { Parser, RootNode } from './parser.js';
import { Transpiler } from './transpiler.js';

// Get file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: npm start <path-to-htex-file>');
    process.exit(1);
}

const inputFilePath = args[0];

// Check if file exists
if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: File not found: ${inputFilePath}`);
    process.exit(1);
}

// Read and process the file
const fileContent: string = fs.readFileSync(inputFilePath, 'utf-8').toString();
const tokenizer = new Tokenizer(fileContent);
const tokens: Token[] = tokenizer.tokenize();
const parser = new Parser(tokens);
const ast: RootNode = parser.parse();
Parser.printNode(ast); // For debugging
const transpiler = new Transpiler(ast);
const latex = transpiler.transpile();

// Create out directory if it doesn't exist
const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Get the base name and create output file path
const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
const outputFilePath = path.join(outDir, `${baseName}.tex`);

// Write the LaTeX output
fs.writeFileSync(outputFilePath, latex, 'utf-8');

console.log(`Successfully transpiled ${inputFilePath} to ${outputFilePath}`);
