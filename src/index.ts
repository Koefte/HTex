import fs from 'fs';
import path from 'path';
import { Tokenizer, Token } from './tokenizer.js';
import { Parser } from './parser.js';

const filePath = path.join(process.cwd(), 'examples/gauss.htex');
const fileContent:string = fs.readFileSync(filePath, 'utf-8').toString();
const tokenizer = new Tokenizer(fileContent);
const tokens: Token[] = tokenizer.tokenize();
const parser = new Parser(tokens);
const nodes = parser.parse();