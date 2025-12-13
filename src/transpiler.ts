import { RootNode ,EquationNode, ParagraphNode,} from './parser.js';

export class Transpiler {
    private root: RootNode;
    public constructor(root: RootNode) {
        this.root = root;
        console.log((root.children[0] as ParagraphNode).content)
    }

    public transpile(): string {
        let latex = "";
        for(const child of this.root.children){
            switch(child.type){
                case 'equation':
                    latex += this.transpileEquation(child as EquationNode);
                    break;
                case 'paragraph':
                    latex += this.transpileParagraph(child as ParagraphNode);
                    break;
                default:
                    throw new Error(`Unknown node type: ${child.type}`);
            }
        }
        return latex;
    }

    private transpileEquation(node: EquationNode): string {
        const lhs = this.transpileExpression(node.lhs);
        const rhs = this.transpileExpression(node.rhs);
        return `\\[${lhs} = ${rhs}\\]`;
    }

    private transpileExpression(node: any): string {
        switch(node.type){
            case 'equation':
                return `${this.transpileExpression(node.lhs)} = ${this.transpileExpression(node.rhs)}`;
            case 'sum':
                return `\\sum_{${this.transpileExpression(node.start)}}^{${this.transpileExpression(node.end)}} ${this.transpileExpression(node.body)}`;
            case 'plus':
                return `${this.transpileExpression(node.left)} + ${this.transpileExpression(node.right)}`;
            case 'fraction':
                return `\\frac{${this.transpileExpression(node.numerator)}}{${this.transpileExpression(node.denominator)}}`;
            case 'identifier':
                return node.name;
            default:
                throw new Error(`Unknown expression node type: ${node.type}`);
        }
    }

    private transpileParagraph(node: ParagraphNode): string {
        return `\\paragraph{${node.content.replace(/\r/g, '')}}\n\n`;
    }
}