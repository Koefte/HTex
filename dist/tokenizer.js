var TokenType;
(function (TokenType) {
    TokenType["Number"] = "number";
    TokenType["Identifier"] = "identifier";
    TokenType["Comma"] = "comma";
    TokenType["Equals"] = "equals";
    TokenType["Newline"] = "newline";
    TokenType["Oparen"] = "open_paren";
    TokenType["Cparen"] = "close_paren";
    TokenType["Dot"] = "dot";
    TokenType["Plus"] = "plus";
    TokenType["Whitespace"] = "whitespace";
    TokenType["Colon"] = "colon";
    TokenType["Unknown"] = "unknown";
})(TokenType || (TokenType = {}));
class ExpectedToken {
    constructor(token) {
        this.token = token;
    }
    toBe(expectedType) {
        if (this.token.type !== expectedType) {
            throw new Error(`Expected token type ${expectedType} but got ${this.token.type} at position ${this.token.position}`);
        }
    }
}
class GettableTokens {
    constructor(tokens) {
        this.tokens = tokens;
    }
    get() {
        return this.tokens;
    }
}
class ExpectedTokens {
    constructor(tokens) {
        this.tokens = tokens;
    }
    toBe(expectedTypes) {
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
    toNotHave(value) {
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i] === value) {
                throw new Error(`Unexpected value ${value} at index ${i}`);
            }
        }
        return this;
    }
    get() {
        return this.tokens;
    }
}
class Tokenizer {
    constructor(input) {
        this.input = input;
        this.position = 0;
    }
    static expect(token) {
        return new ExpectedToken(token);
    }
    static expectMany(tokens) {
        return new ExpectedTokens(tokens);
    }
    // split list of arguments at top-level commas (ignores nested parentheses)
    static findMatchingCParen(tokens, openPos) {
        let depth = 1;
        for (let i = openPos; i < tokens.length; i++) {
            if (tokens[i].type === TokenType.Oparen) {
                depth++;
            }
            else if (tokens[i].type === TokenType.Cparen) {
                depth--;
            }
            if (depth === 0) {
                return i;
            }
        }
        return -1; // No matching closing parenthesis found
    }
    static splitAtTopLevelCommas(tokens) {
        const parts = [];
        let start = 0;
        let depth = 0;
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.type === TokenType.Oparen)
                depth++;
            else if (t.type === TokenType.Cparen)
                depth--;
            else if (t.type === TokenType.Comma && depth === 0) {
                parts.push(tokens.slice(start, i));
                start = i + 1;
            }
        }
        parts.push(tokens.slice(start));
        return parts;
    }
    static printTokens(tokens) {
        tokens.forEach(token => {
            console.log(`Type: ${token.type}, Value: '${token.value}', Position: ${token.position}`);
        });
    }
    static find(tokens, type, startPos = 0) {
        for (let i = startPos; i < tokens.length; i++) {
            if (tokens[i].type === type) {
                return i;
            }
        }
        return -1;
    }
    tokenize() {
        const tokens = [];
        while (this.position < this.input.length) {
            const char = this.input[this.position];
            if (this.isWhitespace(char)) {
                if (char === '\n') {
                    tokens.push({ type: TokenType.Newline, value: '\n', position: this.position });
                }
                else {
                    tokens.push({ type: TokenType.Whitespace, value: char, position: this.position });
                }
                this.position++;
                continue;
            }
            const token = this.matchToken();
            if (token) {
                tokens.push(token);
            }
            else {
                this.position++;
            }
        }
        return tokens;
    }
    matchToken() {
        const char = this.input[this.position];
        if (char == ',') {
            return { type: TokenType.Comma, value: ',', position: this.position++ };
        }
        if (char == ':') {
            return { type: TokenType.Colon, value: ':', position: this.position++ };
        }
        if (char == '+') {
            return { type: TokenType.Plus, value: '+', position: this.position++ };
        }
        if (char == '(') {
            return { type: TokenType.Oparen, value: '(', position: this.position++ };
        }
        if (char == ')') {
            return { type: TokenType.Cparen, value: ')', position: this.position++ };
        }
        if (char == '.') {
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
    matchNumber() {
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
    matchIdentifier() {
        const start = this.position;
        while (this.position < this.input.length && this.isIdentifierChar(this.input[this.position])) {
            this.position++;
        }
        return { type: TokenType.Identifier, value: this.input.slice(start, this.position), position: start };
    }
    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }
    isDigit(char) {
        return char >= '0' && char <= '9';
    }
    isIdentifierStart(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }
    isIdentifierChar(char) {
        return this.isIdentifierStart(char) || this.isDigit(char);
    }
}
export { Tokenizer, TokenType };
