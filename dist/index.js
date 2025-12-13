import fs from 'fs';
import path from 'path';
import { Tokenizer } from './tokenizer.js';
const filePath = path.join(process.cwd(), 'examples/gauss.htex');
const fileContent = fs.readFileSync(filePath, 'utf-8').toString();
const tokenizer = new Tokenizer(fileContent);
const tokens = tokenizer.tokenize();
Tokenizer.printTokens(tokens);
