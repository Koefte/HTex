enum TokenType {
    Number = 'number',
    Identifier = 'identifier',
    Comma = 'comma',
    Equals = 'equals',
    Newline = 'newline',
    Oparen = 'open_paren',
    Cparen = 'close_paren',
    Dot = 'dot',
    Plus = 'plus',
    Whitespace = 'whitespace',
    Colon = 'colon',
    Arrow = 'arrow',
    OpenBrace = 'open_brace',
    CloseBrace = 'close_brace',
    Multiply = 'multiply',
    Minus = 'minus',
    Slash = 'slash',
    Backslash = 'backslash',
    Exponent = 'exponent',
    Asterisk = 'asterisk',
    Unknown = 'unknown',
}

interface Token {
    type: TokenType;
    value: string;
    position: number;
}

class ExpectedToken{
    token: Token;
    constructor(token: Token){
        this.token = token;
    }
    toBe(expectedType: TokenType): void {
        if (this.token.type !== expectedType) {
            throw new Error(`Expected token type ${expectedType} but got ${this.token.type} at position ${this.token.position}`);
        }
    }
}

class GettableTokens{
    private tokens: Token[];
    constructor(tokens: Token[]){
        this.tokens = tokens;
    }
    get(): Token[] {
        return this.tokens;
    }   
}

class ExpectedTokens{
    tokens: Token[];
    constructor(tokens: Token[]){
        this.tokens = tokens;
    }
    toBe(expectedTypes: TokenType[]): this {
        if (this.tokens.length !== expectedTypes.length) {
            throw new Error(`Expected ${expectedTypes.length} tokens but got ${this.tokens.length}`);
        }
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].type !== expectedTypes[i]) {
                throw new Error(`Expected token type ${expectedTypes[i]} but got ${this.tokens[i].type} at position ${this.tokens[i].position}`);
            }
        }
        return this;
    }
    toNotHave(value: unknown): this {
        for (let i = 0; i < this.tokens.length; i++) {
            if ((this.tokens as unknown as any[])[i] === value) {
                throw new Error(`Unexpected value ${value} at index ${i}`);
            }
        }
        return this;
    }
    get(): Token[] {
        return this.tokens;
    }
}

class Tokenizer {
    private input: string;
    private position: number;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
    }

    public static expect(token: Token): ExpectedToken {
        return new ExpectedToken(token);
    }


    public static expectMany(tokens: Token[]): ExpectedTokens {
        return new ExpectedTokens(tokens);
    }

    // split list of arguments at top-level commas (ignores nested parentheses)

    public static findMatchingCParen(tokens: Token[], openPos: number): number {
        let depth = 1;
        for (let i = openPos; i < tokens.length; i++) {
            if (tokens[i].type === TokenType.Oparen) {
                depth++;
            } else if (tokens[i].type === TokenType.Cparen) {
                depth--;
            }
            if (depth === 0) {
                return i;
            }
        }
        return -1; // No matching closing parenthesis found
    }

    public static splitAtTopLevelCommas(tokens: Token[]): Token[][] {
        const parts: Token[][] = [];
        let start = 0;
        let depth = 0;
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.type === TokenType.Oparen) depth++;
            else if (t.type === TokenType.Cparen) depth--;
            else if (t.type === TokenType.Comma && depth === 0) {
                parts.push(tokens.slice(start, i));
                start = i + 1;
            }
        }
        parts.push(tokens.slice(start));
        return parts;
    }
    public static printTokens(tokens: Token[]): void {
        tokens.forEach(token => {
            console.log(`Type: ${token.type}, Value: '${token.value}', Position: ${token.position}`);
        });
    }

    public static find(tokens: Token[], type: string, startPos: number = 0): number {
        for (let i = startPos; i < tokens.length; i++) {
            if (tokens[i].type === type) {
                return i;
            }
        }
        return -1;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.position < this.input.length) {
            const char = this.input[this.position];

            if (this.isWhitespace(char)) {
                if(char === '\n') {
                    tokens.push({ type: TokenType.Newline, value: '\n', position: this.position });
                }
                else{
                    tokens.push({ type: TokenType.Whitespace, value: char, position: this.position });
                }
                this.position++;
                continue;
            }

            const token = this.matchToken();
            if (token) {
                tokens.push(token);
            } else {
                this.position++;
            }
        }

        return tokens;
    }

    private matchToken(): Token | null {
        const char = this.input[this.position];

        // Check for arrow ->
        if (char === '-' && this.position + 1 < this.input.length && this.input[this.position + 1] === '>') {
            const pos = this.position;
            this.position += 2;
            return { type: TokenType.Arrow, value: '->', position: pos };
        }

        if (char === '^') {
            return { type: TokenType.Exponent, value: '^', position: this.position++ };
        }
        if (char === '-') {
            return { type: TokenType.Minus, value: '-', position: this.position++ };
        }

        if (char === '{') {
            return { type: TokenType.OpenBrace, value: '{', position: this.position++ };
        }

        if (char === '}') {
            return { type: TokenType.CloseBrace, value: '}', position: this.position++ };
        }

        if (char === 'x' && this.position > 0 && this.position + 1 < this.input.length) {
            const before = this.input[this.position - 1];
            const after = this.input[this.position + 1];
            // Check if x is used as multiplication (surrounded by spaces or identifiers)
            if ((before === ' ' || this.isIdentifierChar(before)) && 
                (after === ' ' || this.isIdentifierStart(after))) {
                return { type: TokenType.Multiply, value: 'x', position: this.position++ };
            }
        }

        if (char == ',') {
            return { type: TokenType.Comma, value: ',', position: this.position++ };
        }

        if(char == ':') {
            return { type: TokenType.Colon, value: ':', position: this.position++ };
        }

        if(char == '+') {
            return { type: TokenType.Plus, value: '+', position: this.position++ };
        }

        if(char == '/') {
            return { type: TokenType.Slash, value: '/', position: this.position++ };
        }

        if(char == '\\') {
            return { type: TokenType.Backslash, value: '\\', position: this.position++ };
        }

        if(char == '*') {
            return { type: TokenType.Asterisk, value: '*', position: this.position++ };
        }

        if(char == '(') {
            return { type: TokenType.Oparen, value: '(', position: this.position++ };
        }
        if(char == ')') {
            return { type: TokenType.Cparen, value: ')', position: this.position++ };
        }

        if(char == '.') {
            return { type: TokenType.Dot, value: '.', position: this.position++ };
        }

        if (char === '=') {
            return { type: TokenType.Equals, value: '=', position: this.position++ };
        }

        if (this.isDigit(char)) {
            return this.matchNumber();
        }

        if (this.isIdentifierStart(char)) {
            return this.matchIdentifier();
        }

        return null;
    }

    private matchNumber(): Token {
        const start = this.position;
        while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
            this.position++;
        }
        if (this.input[this.position] === '.' && this.isDigit(this.input[this.position + 1])) {
            this.position++;
            while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
                this.position++;
            }
        }
        return { type: TokenType.Number, value: this.input.slice(start, this.position), position: start };
    }

    private matchIdentifier(): Token {
        const start = this.position;
        while (this.position < this.input.length && this.isIdentifierChar(this.input[this.position])) {
            this.position++;
        }
        return { type: TokenType.Identifier, value: this.input.slice(start, this.position), position: start };
    }

    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private isIdentifierStart(char: string): boolean {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || 
               char === 'ü' || char === 'Ü' || char === 'ä' || char === 'Ä' || char === 'ö' || char === 'Ö' || char === 'ß';
    }

    private isIdentifierChar(char: string): boolean {
        return this.isIdentifierStart(char) || this.isDigit(char);
    }
}

export { Tokenizer, Token, TokenType };