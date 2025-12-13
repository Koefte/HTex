import { Token , Tokenizer , TokenType} from './tokenizer.js';

class ExpectedNodes {
    private nodes: Node[];
    constructor(nodes: Node[]) {
        this.nodes = nodes;
    }
    toBe(expectedTypes: NodeType[]): GettableNodes {
        if (this.nodes.length !== expectedTypes.length) {
            throw new Error(`Expected ${expectedTypes.length} nodes but got ${this.nodes.length}`);
        }
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].type !== expectedTypes[i]) {
                throw new Error(`Expected node type ${expectedTypes[i]} but got ${this.nodes[i].type}`);
            }
        }
        return new GettableNodes(this.nodes);
    }
}

class GettableNodes {
    private nodes: Node[];
    constructor(nodes: Node[]) {
        this.nodes = nodes;
    }
    get(): Node[] {
        return this.nodes;
    }
}

export class Parser {
    private tokens: Token[]
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    public static expect(tokens: Token[]): ExpectedNodes{
        return new ExpectedNodes(new Parser(tokens).parse());
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
                Tokenizer.expect(this.tokens[position + 1]).toBe(TokenType.Oparen)
                let sumNodes: Node[] = Parser.expect(this.tokens.slice(position + 1,Tokenizer.find(this.tokens,'close_paren',position))).toBe([NodeType.Equation,NodeType.Expression,NodeType.Expression]).get()
                let sumNode = {
                    type: 'sum',
                    start: sumNodes[0] as EquationNode,
                    end: sumNodes[1] as ExpressionNode,
                    body: sumNodes[2] as ExpressionNode
                }
                
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

interface ExpressionNode extends Node {
    type: 'plus' | 'fraction' | 'identifier';
    value: string;
}

interface IdentiferNode extends ExpressionNode {
    type: 'identifier';
    name: string;
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
    start: EquationNode;
    end:ExpressionNode;
    body: ExpressionNode;
}

interface PlusNode extends ExpressionNode {
    type: 'plus';
    left: Node;
    right: Node;
}

interface FractionNode extends ExpressionNode {
    type: 'fraction';
    numerator: Node;
    denominator: Node;
}




