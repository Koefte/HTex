import { Token , Tokenizer , TokenType} from './tokenizer.js';

export class Parser {
    private tokens: Token[]
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    parse(begin = 0 , end = this.tokens.length): Node[] {
        const nodes: Node[] = [];
        let position = begin;
        while (position < this.tokens.length) {
            const token = this.tokens[position];
            if(token.type == 'equals'){
                let eqnode: EquationNode = {
                    type: 'equation',
                    lhs: nodes.pop()!,
                    rhs: this.parse(position + 1, Tokenizer.find(this.tokens,'newline',position))[0]
                }
                nodes.push(eqnode);
                position = Tokenizer.find(this.tokens,'newline',position); 
            }
            else if(token.type == 'identifier' && token.value == 'sum'){
                let sumNode: SumNode = {
                    type: 'sum',
                    start: 0,
                    end: 0,
                    variable: "",
                    body: {type: 'paragraph'}
                }
                Tokenizer.expect(this.tokens[position + 1]).toBe(TokenType.Oparen)
                Parser.expect(this.tokens.slice(position + 1,Tokenizer.find(this.tokens,'close_paren',position))).toBe([NodeType.Equation,NodeType.Expression,NodeType.Expression])
                nodes.push(sumNode);
            }
            else if(token.type == 'identifier'){
                let pnode: ParagraphNode = {
                    type: 'paragraph',
                    content: ""
                }
                let newlineCount = 0;
                while(position < end && (this.tokens[position].type == 'identifier' || this.tokens[position].type == 'dot') && ){
                    if(this.tokens[position].type == 'newline'){
                        newlineCount++;
                        if(newlineCount >= 2){
                            break;
                        } else {
                            pnode.content += "\n";
                        }
                    }
                    else{
                        pnode.content += this.tokens[position].value;
                        newlineCount = 0;
                    }
                    position++;
                }
                nodes.push(pnode);
            }
            else{
                position++;
            }
        }
        return nodes;
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

interface Node {
    type: string;
}

interface ParagraphNode extends Node {
    type: 'paragraph';
    content: string;
}

interface EquationNode extends Node {
    type: 'equation';
    lhs: Node,
    rhs: Node,
}


interface SumNode extends Node {
    type: 'sum';
    start: number;
    end:number;
    variable: string;
    body: Node;
}

interface PlusNode extends Node {
    type: 'plus';
    left: Node;
    right: Node;
}

interface FractionNode extends Node {
    type: 'fraction';
    numerator: Node;
    denominator: Node;
}




