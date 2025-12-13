enum TokenType {
    Number = 'number',
    Identifier = 'identifier',
    Comma = 'comma',
    Equals = 'equals',
    Newline = 'newline',
    Oparen = 'open_paren',
    Cparen = 'close_paren',
    Dot = 'dot',
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

class ExpectedTokens{
    tokens: Token[];
    constructor(tokens: Token[]){
        this.tokens = tokens;
    }
    toBe(expectedTypes: TokenType[]): void {
        if (this.tokens.length !== expectedTypes.length) {
            throw new Error(`Expected ${expectedTypes.length} tokens but got ${this.tokens.length}`);
        }
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].type !== expectedTypes[i]) {
                throw new Error(`Expected token type ${expectedTypes[i]} but got ${this.tokens[i].type} at position ${this.tokens[i].position}`);
            }
        }
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

        if (char === ',') {
            return { type: TokenType.Comma, value: ',', position: this.position++ };
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
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }

    private isIdentifierChar(char: string): boolean {
        return this.isIdentifierStart(char) || this.isDigit(char);
    }
}

export { Tokenizer, Token, TokenType };