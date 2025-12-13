import { RootNode ,EquationNode, ParagraphNode, HeadingNode} from './parser.js';

export class Transpiler {
    private root: RootNode;
    public constructor(root: RootNode) {
        this.root = root;
        console.log((root.children[0] as ParagraphNode).content)
    }

    public transpile(): string {
        let content = "";
        for(const child of this.root.children){
            switch(child.type){
                case 'equation':
                    content += this.transpileEquation(child as EquationNode);
                    break;
                case 'paragraph':
                    content += this.transpileParagraph(child as ParagraphNode);
                    break;
                case 'heading':
                    content += this.transpileHeading(child as HeadingNode);
                    break;
                default:
                    throw new Error(`Unknown node type: ${child.type}`);
            }
        }
        
        // Wrap with document class and begin/end document
        const latex = `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n\\usepackage{amssymb}\n\n\\begin{document}\n\n${content}\\end{document}\n`;
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
                return this.replaceGreekLetters(node.name);
            default:
                throw new Error(`Unknown expression node type: ${node.type}`);
        }
    }

    private replaceGreekLetters(text: string): string {
        const greekLetters: { [key: string]: string } = {
            // Lowercase Greek letters
            'alpha': '\\alpha',
            'beta': '\\beta',
            'gamma': '\\gamma',
            'delta': '\\delta',
            'epsilon': '\\epsilon',
            'zeta': '\\zeta',
            'eta': '\\eta',
            'theta': '\\theta',
            'iota': '\\iota',
            'kappa': '\\kappa',
            'lambda': '\\lambda',
            'mu': '\\mu',
            'nu': '\\nu',
            'xi': '\\xi',
            'pi': '\\pi',
            'rho': '\\rho',
            'sigma': '\\sigma',
            'tau': '\\tau',
            'upsilon': '\\upsilon',
            'phi': '\\varphi',
            'chi': '\\chi',
            'psi': '\\psi',
            'omega': '\\omega',
            // Uppercase Greek letters
            'Gamma': '\\Gamma',
            'Delta': '\\Delta',
            'Theta': '\\Theta',
            'Lambda': '\\Lambda',
            'Xi': '\\Xi',
            'Pi': '\\Pi',
            'Sigma': '\\Sigma',
            'Upsilon': '\\Upsilon',
            'Phi': '\\Phi',
            'Psi': '\\Psi',
            'Omega': '\\Omega'
        };
        
        // Replace each Greek letter name with its LaTeX command
        let result = text;
        for (const [greekName, latexCommand] of Object.entries(greekLetters)) {
            // Use word boundaries to match whole words only
            const regex = new RegExp(`\\b${greekName}\\b`, 'g');
            result = result.replace(regex, latexCommand);
        }
        return result;
    }

    private replaceGreekLettersInText(text: string): string {
        const greekLetters: { [key: string]: string } = {
            // Lowercase Greek letters
            'alpha': '$\\alpha$',
            'beta': '$\\beta$',
            'gamma': '$\\gamma$',
            'delta': '$\\delta$',
            'epsilon': '$\\epsilon$',
            'zeta': '$\\zeta$',
            'eta': '$\\eta$',
            'theta': '$\\theta$',
            'iota': '$\\iota$',
            'kappa': '$\\kappa$',
            'lambda': '$\\lambda$',
            'mu': '$\\mu$',
            'nu': '$\\nu$',
            'xi': '$\\xi$',
            'pi': '$\\pi$',
            'rho': '$\\rho$',
            'sigma': '$\\sigma$',
            'tau': '$\\tau$',
            'upsilon': '$\\upsilon$',
            'phi': '$\\varphi$',
            'chi': '$\\chi$',
            'psi': '$\\psi$',
            'omega': '$\\omega$',
            // Uppercase Greek letters
            'Gamma': '$\\Gamma$',
            'Delta': '$\\Delta$',
            'Theta': '$\\Theta$',
            'Lambda': '$\\Lambda$',
            'Xi': '$\\Xi$',
            'Pi': '$\\Pi$',
            'Sigma': '$\\Sigma$',
            'Upsilon': '$\\Upsilon$',
            'Phi': '$\\Phi$',
            'Psi': '$\\Psi$',
            'Omega': '$\\Omega$'
        };
        
        let result = text;
        for (const [greekName, latexCommand] of Object.entries(greekLetters)) {
            const regex = new RegExp(`\\b${greekName}\\b`, 'g');
            result = result.replace(regex, latexCommand);
        }
        
        // Replace special symbols with math mode
        result = result.replace(/\bTeilmenge\b/g, '$\\subseteq$');
        result = result.replace(/\belement\b/g, '$\\in$');
        
        return result;
    }

    private transpileParagraph(node: ParagraphNode): string {
        let text = node.content;
        
        // Replace inline math markers
        text = text.replace(/\$\$MATHSTART\$\$/g, '$');
        text = text.replace(/\$\$MATHEND\$\$/g, '$');
        
        // Check if this is a list (contains lines starting with -)
        const lines = text.split('\n');
        const hasListItems = lines.some(line => line.trim().startsWith('-'));
        
        if (hasListItems) {
            // Process as list
            let result = '';
            let inItemize = false;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                    if (!inItemize) {
                        result += '\\begin{itemize}\n';
                        inItemize = true;
                    }
                    const itemText = trimmed.substring(1).trim();
                    let processedItem = this.replaceGreekLettersInText(itemText);
                    // Replace special symbols with math mode
                    processedItem = processedItem.replace(/->/g, '$\\to$');
                    processedItem = processedItem.replace(/\bx\b/g, '$\\times$');
                    // Escape braces that aren't part of math mode
                    let inMath = false;
                    let escaped = '';
                    for (let i = 0; i < processedItem.length; i++) {
                        const char = processedItem[i];
                        if (char === '$') {
                            inMath = !inMath;
                            escaped += char;
                        } else if ((char === '{' || char === '}') && !inMath) {
                            escaped += '\\' + char;
                        } else {
                            escaped += char;
                        }
                    }
                    result += `  \\item ${escaped}\n`;
                } else if (trimmed.length > 0) {
                    if (inItemize) {
                        result += '\\end{itemize}\n';
                        inItemize = false;
                    }
                    result += `\\text{${this.replaceGreekLettersInText(trimmed)}}\n`;
                }
            }
            
            if (inItemize) {
                result += '\\end{itemize}\n';
            }
            
            return result + '\n';
        } else {
            // Process as regular paragraph - wrap Greek letters and symbols in math mode
            let processed = this.replaceGreekLettersInText(text);
            return `\\text{${processed}}\n\n`;
        }
    }

    private transpileHeading(node: HeadingNode): string {
        return `\\section{${node.content}}\n\n`;
    }
}