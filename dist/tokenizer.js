var TokenType;
(function (TokenType) {
    TokenType["Number"] = "number";
    TokenType["Identifier"] = "identifier";
    TokenType["Comma"] = "comma";
    TokenType["Unknown"] = "unknown";
})(TokenType || (TokenType = {}));
class Tokenizer {
    constructor(input) {
        this.input = input;
        this.position = 0;
    }
    static printTokens(tokens) {
        tokens.forEach(token => {
            console.log(`Type: ${token.type}, Value: '${token.value}', Position: ${token.position}`);
        });
    }
    tokenize() {
        const tokens = [];
        while (this.position < this.input.length) {
            const char = this.input[this.position];
            if (this.isWhitespace(char)) {
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
        if (char === ',') {
            return { type: TokenType.Comma, value: ',', position: this.position++ };
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
