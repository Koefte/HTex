import { Token , Tokenizer , TokenType} from './tokenizer.js';

class ExpectedNode{
    private node: Node;
    constructor(node: Node) {
        this.node = node;
    }
    toBe(expectedType : NodeType) : GettableNode {
        if(expectedType == NodeType.Expression){
            if(this.node.type != 'plus' && this.node.type != 'fraction' && this.node.type != 'identifier'){
                throw new Error(`Expected node type to be one of 'plus', 'fraction', 'identifier' but got ${this.node.type}`);
            }
        }
        else if(this.node.type != expectedType) throw new Error(`Expected node type ${expectedType} but got ${this.node.type}`);
        return new GettableNode(this.node);
    }
}

class GettableNode {
    private node: Node;
    constructor(node: Node) {
        this.node = node;
    }
    get(): Node {
        return this.node;
    }
}

export class Parser {
    private tokens: Token[]
    private position: number;
    constructor(tokens: Token[]) {
        this.tokens = Tokenizer.expectMany(tokens).toNotHave(undefined).get();
        this.position = 0;
    }
    public static expect(tokens: Token[],parseFn: (tokens:Token[]) => Node ): ExpectedNode{
        if(tokens.length == 0){
            throw new Error('Nothing to expect');
        }
        return new ExpectedNode(parseFn(tokens));
    }


    // Parse should return one Root Node that has Children

    public parse(): RootNode {
        let children: Node[] = [];
        let accumulatedTokens: Token[] = [];
        let balance = 0;
        while (this.position < this.tokens.length) {
            let token = this.tokens[this.position];
            if(token.type == 'close_paren'){
                balance--;
                if(balance < 0){
                    throw new Error(`Unmatched closing parenthesis at position ${token.position}`);
                }
            }
            else if(token.type == 'open_paren'){
                balance++;
            }
            else if(token.type == 'equals' && balance == 0){
                // Remove tokens from the current line that were accumulated
                let lineStartIdx = accumulatedTokens.length;
                for (let i = accumulatedTokens.length - 1; i >= 0; i--) {
                    if (accumulatedTokens[i].type === 'newline') {
                        lineStartIdx = i + 1;
                        break;
                    }
                }
                // Keep only tokens before the current line
                const paragraphTokens = accumulatedTokens.slice(0, lineStartIdx);
                
                // Flush any accumulated paragraph text before processing equation
                if(paragraphTokens.length > 0){
                    const paragraphContent = paragraphTokens.map(t => t.value).join('').trim();
                    if(paragraphContent.length > 0){
                        const paragraphNode: ParagraphNode = {
                            type: 'paragraph',
                            content: paragraphContent,
                        }
                        children.push(paragraphNode);
                    }
                }
                accumulatedTokens = [];
                
                let line = [];
                let j = this.position;
                while(j >=0 && this.tokens[j].type != 'newline'){
                    line.unshift(this.tokens[j]);
                    j--;
                }
                let k = this.position+1;
                while(k < this.tokens.length && this.tokens[k].type != 'newline'){
                    line.push(this.tokens[k]);
                    k++;
                }
                children.push(Parser.parseEquation(line));
                this.position = k;
            }
            else if(token.type == 'newline'){ 
                if(this.tokens[this.position + 1] && this.tokens[this.position + 1].type == 'newline'){
                    // Double newline indicates new paragraph
                    if(accumulatedTokens.length > 0){
                        const paragraphContent = accumulatedTokens.map(t => t.value).join('').trim();
                        const paragraphNode: ParagraphNode = {
                            type: 'paragraph',
                            content: paragraphContent,
                        }
                        children.push(paragraphNode);
                        accumulatedTokens = [];
                    }
                    // Skip the second newline to avoid empty paragraphs
                    this.position++;
                } else {
                    // Single newline - add it to paragraph tokens (will become a space)
                    accumulatedTokens.push(token);
                }
            }
            else {
                accumulatedTokens.push(token);
            }
            this.position++;
        }
        // Flush any trailing paragraph text
        if (accumulatedTokens.length > 0) {
            const paragraphContent = accumulatedTokens.map(t => t.value).join('').trim();
            if (paragraphContent.length > 0) {
                children.push({ type: 'paragraph', content: paragraphContent } as ParagraphNode);
            }
        }
        return {
            type: 'root',
            children: children
        };
    }

    public static printNodes(nodes:Node[]):string{
        let result = '';
        for(const node of nodes){
            result += node.type + ' ';
        }
        return result.trim();
    }

    public static printNode(node:Node, indent:string = ''):void {
        const next = indent + '  ';
        switch (node.type) {
            case 'root': {
                console.log(`${indent}root`);
                const children = (node as RootNode).children || [];
                for (const child of children) Parser.printNode(child, next);
                break;
            }
            case 'sum': {
                console.log(`${indent}sum`);
                const n = node as SumNode;
                console.log(`${next}start:`);
                Parser.printNode(n.start, next + '  ');
                console.log(`${next}end:`);
                Parser.printNode(n.end, next + '  ');
                console.log(`${next}body:`);
                Parser.printNode(n.body, next + '  ');
                break;
            }
            case 'fraction': {
                console.log(`${indent}fraction`);
                const n = node as FractionNode;
                console.log(`${next}numerator:`);
                Parser.printNode(n.numerator, next + '  ');
                console.log(`${next}denominator:`);
                Parser.printNode(n.denominator, next + '  ');
                break;
            }
            case 'equation': {
                console.log(`${indent}equation`);
                const n = node as EquationNode;
                console.log(`${next}lhs:`);
                Parser.printNode(n.lhs, next + '  ');
                console.log(`${next}rhs:`);
                Parser.printNode(n.rhs, next + '  ');
                break;
            }
            case 'plus': {
                console.log(`${indent}plus`);
                const n = node as PlusNode;
                console.log(`${next}left:`);
                Parser.printNode(n.left, next + '  ');
                console.log(`${next}right:`);
                Parser.printNode(n.right, next + '  ');
                break;
            }
            case 'identifier': {
                const n = node as IdentiferNode;
                console.log(`${indent}identifier(${n.name})`);
                break;
            }
            case 'paragraph': {
                const n = node as ParagraphNode;
                const content = (n.content || '').replace(/\r/g, '');
                const preview = content.length > 80 ? content.slice(0, 77) + '...' : content;
                console.log(`${indent}paragraph: "${preview}"`);
                break;
            }
            default: {
                console.log(`${indent}${node.type}`);
                if (node.children) {
                    for (const child of node.children) Parser.printNode(child, next);
                }
            }
        }
    }


    private static  parseEquation(tokens:Token[]): EquationNode {
        Tokenizer.printTokens(tokens);
        console.log('------------------------')
        let balance = 0;
        for(let pos = 0; pos < tokens.length; pos++){
            const token = tokens[pos];
            if(token.type == 'open_paren'){
                balance++;
            }
            else if(token.type == 'close_paren'){
                balance--;
            }
            if(token.type == 'equals' && balance == 0){
                let eqnode: EquationNode = {
                    type: 'equation',
                    lhs: Parser.parseExpression(tokens.slice(0,pos)),
                    rhs: Parser.parseExpression(tokens.slice(pos + 1))
                }
                
                return eqnode;
            }
        }
        throw new Error('Could not parse tokens into equation node');
    }
    private static parseExpression(tokens:Token[]): ExpressionNode {
        for(let pos = 0; pos < tokens.length; pos++){
            const token = tokens[pos];
            if(token.type == 'plus'){
                let left = Parser.parseExpression(tokens.slice(0, pos));
                let right = Parser.parseExpression(tokens.slice(pos + 1));
                let plusNode: PlusNode = {
                    type: 'plus',
                    left: left,
                    right: right,
                }
                return plusNode;
            }
            else if(token.type == 'equals'){
                    let left = Parser.parseExpression(tokens.slice(0, pos));
                    let right = Parser.parseExpression(tokens.slice(pos + 1));
                    let eqNode: EquationNode = {
                        type: 'equation',
                        lhs: left,
                        rhs: right,
                    }
                    return eqNode;
                }
            else if(token.type == 'identifier' && token.value == 'sum'){
                Tokenizer.expect(tokens[pos + 1]).toBe(TokenType.Oparen);
                let sumTokens = tokens.slice(pos + 2,Tokenizer.findMatchingCParen(tokens,pos+2))
                let [startTokens,endTokens,bodyTokens] = Tokenizer.splitAtTopLevelCommas(sumTokens);
                let startNode = Parser.parseExpression(startTokens);
                let endNode = Parser.parseExpression(endTokens);
                let bodyNode = Parser.parseExpression(bodyTokens);
                let sumNode: SumNode = {
                    type: 'sum',
                    start: startNode,
                    end: endNode,
                    body: bodyNode,
                }
                return sumNode;
            }
            else if(token.type == 'identifier' && token.value == 'frac'){
                Tokenizer.expect(tokens[pos + 1]).toBe(TokenType.Oparen);
                let fracTokens = tokens.slice(pos + 2,Tokenizer.findMatchingCParen(tokens,pos+2))
                let [numeratorTokens,denominatorTokens] = Tokenizer.splitAtTopLevelCommas(fracTokens);
                let numeratorNode = Parser.parseExpression(numeratorTokens);
                let denominatorNode = Parser.parseExpression(denominatorTokens);
                let fracNode: FractionNode = {
                    type: 'fraction',
                    numerator: numeratorNode,
                    denominator: denominatorNode,
                }
                return fracNode;
            }
        }
        return {
            type: 'identifier',
            name: tokens.map(t => t.value).join(''),

        } as IdentiferNode;
        
    }
        



}

enum NodeType {
    Paragraph = 'paragraph',
    Equation = 'equation',
    Sum = 'sum',
    Plus = 'plus',
    Fraction = 'fraction',
    Expression = 'expression',
}

export interface Node {
    type: string;
    children?: Node[];
}



export interface RootNode extends Node {
    type: 'root';
    children: Node[];
}

export interface ExpressionNode extends Node {
    type: 'plus' | 'fraction' | 'identifier' | 'sum' | 'equation';
}

export interface IdentiferNode extends ExpressionNode {
    type: 'identifier';
    name: string;
}

export interface ParagraphNode extends Node {
    type: 'paragraph';
    content: string;
}

export interface EquationNode extends ExpressionNode {
    type: 'equation';
    lhs: ExpressionNode,
    rhs: ExpressionNode,
}


export interface SumNode extends ExpressionNode {
    type: 'sum';
    start: ExpressionNode;
    end:ExpressionNode;
    body: ExpressionNode;
}

export interface PlusNode extends ExpressionNode {
    type: 'plus';
    left: ExpressionNode;
    right: ExpressionNode;
}

export interface FractionNode extends ExpressionNode {
    type: 'fraction';
    numerator: ExpressionNode;
    denominator: ExpressionNode;
}




