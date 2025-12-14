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

    // Apply \italic\ and *emphasis* markers outside math mode
    private applyInlineItalics(text: string): string {
        let result = '';
        let buffer = '';
        let inMath = false;

        const flushBuffer = () => {
            if (buffer.length === 0) return;
            // Apply \text\ -> \textit{text}
            let replaced = buffer.replace(/\\([^\\\n]+)\\/g, '\\textit{$1}');
            // Apply *text* -> \emph{text}
            replaced = replaced.replace(/\*([^*\n]+)\*/g, '\\emph{$1}');
            result += replaced;
            buffer = '';
        };

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '$') {
                flushBuffer();
                result += ch;
                inMath = !inMath;
            } else {
                buffer += ch;
            }
        }
        flushBuffer();
        return result;
    }

    // Escape braces that are literal text, but leave math and LaTeX command arguments intact
    private escapeBracesOutsideMath(text: string): string {
        let inMath = false;
        let escaped = '';
        let braceDepth = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '$') {
                inMath = !inMath;
                escaped += char;
            } else if (char === '\\' && !inMath && i + 1 < text.length) {
                // Found backslash - check if it's a LaTeX command
                let j = i + 1;
                while (j < text.length && /[a-zA-Z]/.test(text[j])) {
                    j++;
                }
                if (j > i + 1) {
                    // It's a command like \textit or \emph
                    escaped += text.substring(i, j);
                    i = j - 1;
                } else {
                    escaped += char;
                }
            } else if (char === '{' && !inMath) {
                // Check if previous non-whitespace is a command
                let k = i - 1;
                while (k >= 0 && text[k] === ' ') k--;
                if (k >= 0 && /[a-zA-Z]/.test(text[k])) {
                    // Likely a command argument brace
                    escaped += char;
                    braceDepth++;
                } else {
                    escaped += '\\' + char;
                }
            } else if (char === '}' && !inMath) {
                if (braceDepth > 0) {
                    // Closing a command argument
                    escaped += char;
                    braceDepth--;
                } else {
                    escaped += '\\' + char;
                }
            } else {
                escaped += char;
            }
        }
        return escaped;
    }

    private transpileParagraph(node: ParagraphNode): string {
        let text = node.content;
        
        // Replace inline math markers
        text = text.replace(/\$\$MATHSTART\$\$/g, '$');
        text = text.replace(/\$\$MATHEND\$\$/g, '$');
        // Apply /.../ italics outside math
        text = this.applyInlineItalics(text);
        // Replace inline italic markers
        text = text.replace(/\$\$ITALICSTART\$\$(.*?)\$\$ITALICEND\$\$/gs, (_m, inner) => `\\textit{${inner}}`);
        
        // Check if this is a list (contains lines starting with -)
        const lines = text.split('\n');
        const hasListItems = lines.some(line => line.trim().startsWith('-'));
        
        if (hasListItems) {
            // Process as list
            let result = '';
            let inItemize = false;
            let textLines: string[] = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                    // Flush accumulated text lines before starting list
                    if (textLines.length > 0) {
                        for (let i = 0; i < textLines.length; i++) {
                            const lineBreak = i < textLines.length - 1 ? '\\newline' : '';
                            result += `${textLines[i]}${lineBreak}\n`;
                        }
                        textLines = [];
                    }
                    
                    if (!inItemize) {
                        result += '\\begin{itemize}\n';
                        inItemize = true;
                    }
                    const itemText = this.applyInlineItalics(trimmed.substring(1).trim());
                    let processedItem = this.replaceGreekLettersInText(itemText);
                    // Replace special symbols with math mode
                    processedItem = processedItem.replace(/->/g, '$\\to$');
                    processedItem = processedItem.replace(/\bx\b/g, '$\\times$');
                    processedItem = this.escapeBracesOutsideMath(processedItem);
                    result += `  \\item ${processedItem}\n`;
                } else if (trimmed.length > 0) {
                    if (inItemize) {
                        result += '\\end{itemize}\n';
                        inItemize = false;
                    }
                    let body = this.replaceGreekLettersInText(trimmed);
                    body = this.escapeBracesOutsideMath(body);
                    textLines.push(body);
                }
            }
            
            // Flush any remaining text lines
            if (textLines.length > 0) {
                for (let i = 0; i < textLines.length; i++) {
                    const lineBreak = i < textLines.length - 1 ? '\\newline' : '';
                    result += `${textLines[i]}${lineBreak}\n`;
                }
            }
            
            if (inItemize) {
                result += '\\end{itemize}\n';
            }
            
            return result + '\n';
        } else {
            // Process as regular paragraph - add explicit line breaks
            const lines = text.split('\n');
            let result = '';
            const nonEmptyLines = lines.filter(line => line.trim().length > 0);
            for (let i = 0; i < nonEmptyLines.length; i++) {
                const trimmed = nonEmptyLines[i].trim();
                let processed = this.replaceGreekLettersInText(trimmed);
                processed = this.escapeBracesOutsideMath(processed);
                const lineBreak = i < nonEmptyLines.length - 1 ? '\\newline' : '';
                result += `${processed}${lineBreak}\n`;
            }
            return result + '\n';
        }
    }

    private transpileHeading(node: HeadingNode): string {
        return `\\section{${node.content}}\n\n`;
    }
}