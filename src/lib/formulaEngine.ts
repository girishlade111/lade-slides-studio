import type { TableCell } from '@/types/presentation';

const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function columnToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

export function indexToColumn(idx: number): string {
  let col = '';
  let n = idx + 1;
  while (n > 0) {
    n--;
    col = COL_LETTERS[n % 26] + col;
    n = Math.floor(n / 26);
  }
  return col;
}

export function cellRefToIndex(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return { col: columnToIndex(match[1].toUpperCase()), row: parseInt(match[2], 10) - 1 };
}

function parseRange(range: string): { row: number; col: number }[] | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;
  const start = cellRefToIndex(parts[0].trim());
  const end = cellRefToIndex(parts[1].trim());
  if (!start || !end) return null;
  const cells: { row: number; col: number }[] = [];
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

type TokenType = 'NUMBER' | 'STRING' | 'REF' | 'RANGE' | 'FUNC' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

class Lexer {
  private pos = 0;
  constructor(private input: string) {}

  private peek(): string {
    return this.pos < this.input.length ? this.input[this.pos] : '';
  }

  private advance(): string {
    return this.pos < this.input.length ? this.input[this.pos++] : '';
  }

  private isWhitespace(c: string) {
    return c === ' ' || c === '\t' || c === '\n' || c === '\r';
  }

  private isAlpha(c: string) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9';
  }

  next(): Token {
    while (this.isWhitespace(this.peek())) this.advance();
    
    if (this.pos >= this.input.length) return { type: 'EOF', value: '' };

    const c = this.peek();

    if (c === '"' || c === "'") {
      const quote = this.advance(); // skip quote
      let str = '';
      while (this.peek() !== quote && this.pos < this.input.length) {
        str += this.advance();
      }
      if (this.peek() === quote) this.advance();
      return { type: 'STRING', value: str };
    }

    if ("+-*/^%=<>&".includes(c)) {
      let op = this.advance();
      const nxt = this.peek();
      if ((op === '<' && (nxt === '=' || nxt === '>')) || (op === '>' && nxt === '=')) {
        op += this.advance();
      }
      return { type: 'OP', value: op };
    }

    if (c === '(') return { type: 'LPAREN', value: this.advance() };
    if (c === ')') return { type: 'RPAREN', value: this.advance() };
    if (c === ',') return { type: 'COMMA', value: this.advance() };

    if (this.isDigit(c) || c === '.') {
      let num = '';
      while (this.isDigit(this.peek()) || this.peek() === '.') {
        num += this.advance();
      }
      return { type: 'NUMBER', value: num };
    }

    if (this.isAlpha(c)) {
      let id = '';
      while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
        id += this.advance();
      }
      
      if (this.peek() === '(') {
        return { type: 'FUNC', value: id.toUpperCase() };
      }
      
      if (this.peek() === ':') {
        this.advance(); // skip :
        let id2 = '';
        while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
          id2 += this.advance();
        }
        return { type: 'RANGE', value: `${id}:${id2}`.toUpperCase() };
      }
      
      if (id.match(/^[A-Z]+\d+$/i)) {
        return { type: 'REF', value: id.toUpperCase() };
      }
      // If it's a known string like TRUE or FALSE
      if (id.toUpperCase() === 'TRUE' || id.toUpperCase() === 'FALSE') {
        return { type: 'STRING', value: id.toUpperCase() };
      }
      return { type: 'STRING', value: id };
    }

    // fallback
    return { type: 'STRING', value: this.advance() };
  }
}

class Parser {
  private current!: Token;
  constructor(private lexer: Lexer) {
    this.advance();
  }

  private advance() {
    this.current = this.lexer.next();
  }

  private eat(type: TokenType) {
    if (this.current.type === type) {
      this.advance();
    } else {
      throw new Error(`Expected ${type} but got ${this.current.type}`);
    }
  }

  parse(): any {
    if (this.current.type === 'EOF') return null;
    const res = this.parseExpression();
    if (this.current.type !== 'EOF') {
       throw new Error(`Unexpected token ${this.current.value}`);
    }
    return res;
  }

  private parseExpression(): any {
    return this.parseComparison();
  }

  private parseComparison(): any {
    let node = this.parseConcat();
    while (this.current.type === 'OP' && ["=", "<", ">", "<=", ">=", "<>"].includes(this.current.value)) {
      const op = this.current.value;
      this.advance();
      node = { type: 'BinaryOp', op, left: node, right: this.parseConcat() };
    }
    return node;
  }

  private parseConcat(): any {
    let node = this.parseAdditive();
    while (this.current.type === 'OP' && this.current.value === '&') {
      this.advance();
      node = { type: 'BinaryOp', op: '&', left: node, right: this.parseAdditive() };
    }
    return node;
  }

  private parseAdditive(): any {
    let node = this.parseMultiplicative();
    while (this.current.type === 'OP' && ['+', '-'].includes(this.current.value)) {
      const op = this.current.value;
      this.advance();
      node = { type: 'BinaryOp', op, left: node, right: this.parseMultiplicative() };
    }
    return node;
  }

  private parseMultiplicative(): any {
    let node = this.parsePower();
    while (this.current.type === 'OP' && ['*', '/', '%'].includes(this.current.value)) {
      const op = this.current.value;
      this.advance();
      node = { type: 'BinaryOp', op, left: node, right: this.parsePower() };
    }
    return node;
  }

  private parsePower(): any {
    let node = this.parseUnary();
    while (this.current.type === 'OP' && this.current.value === '^') {
      this.advance();
      node = { type: 'BinaryOp', op: '^', left: node, right: this.parseUnary() };
    }
    return node;
  }

  private parseUnary(): any {
    if (this.current.type === 'OP' && ['+', '-'].includes(this.current.value)) {
      const op = this.current.value;
      this.advance();
      return { type: 'UnaryOp', op, expr: this.parseUnary() };
    }
    return this.parseFactor();
  }

  private parseFactor(): any {
    const token = this.current;
    if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'Literal', value: parseFloat(token.value) };
    }
    if (token.type === 'STRING') {
      this.advance();
      return { type: 'Literal', value: token.value };
    }
    if (token.type === 'REF') {
      this.advance();
      return { type: 'Ref', value: token.value };
    }
    if (token.type === 'RANGE') {
      this.advance();
      return { type: 'Range', value: token.value };
    }
    if (token.type === 'FUNC') {
      const name = token.value;
      this.advance(); // consume FUNC
      this.eat('LPAREN');
      const args: any[] = [];
      if (this.current.type !== 'RPAREN') {
        args.push(this.parseExpression());
        while (this.current.type === 'COMMA') {
          this.advance();
          args.push(this.parseExpression());
        }
      }
      this.eat('RPAREN');
      return { type: 'Call', name, args };
    }
    if (token.type === 'LPAREN') {
      this.advance();
      const node = this.parseExpression();
      this.eat('RPAREN');
      return node;
    }
    
    // allow implicit string if unexpected token
    const val = token.value;
    this.advance();
    return { type: 'Literal', value: val };
  }
}

class Evaluator {
  constructor(private cells: TableCell[][], private visiting: Set<string>) {}

  private getCellValue(row: number, col: number): any {
    if (row < 0 || row >= this.cells.length || col < 0 || col >= (this.cells[0]?.length ?? 0)) return null;
    const cell = this.cells[row][col];
    if (cell.formula) {
      const key = `${row},${col}`;
      if (this.visiting.has(key)) throw new Error('#CIRCULAR!');
      this.visiting.add(key);
      const res = evaluateAST(parse(cell.formula.substring(1)), this.cells, this.visiting);
      this.visiting.delete(key);
      return res;
    }
    if (!isNaN(Number(cell.content)) && cell.content.trim() !== '') {
      return Number(cell.content);
    }
    if (cell.content.toLowerCase() === 'true') return true;
    if (cell.content.toLowerCase() === 'false') return false;
    return cell.content;
  }

  private resolveRange(rangeStr: string): any[] {
    const range = parseRange(rangeStr);
    if (!range) throw new Error('#REF!');
    return range.map(({ row, col }) => this.getCellValue(row, col));
  }

  evaluate(node: any): any {
    if (!node) return null;

    if (node.type === 'Literal') {
      if (node.value === 'TRUE') return true;
      if (node.value === 'FALSE') return false;
      return node.value;
    }
    
    if (node.type === 'Ref') {
      const ref = cellRefToIndex(node.value);
      if (!ref) throw new Error('#REF!');
      return this.getCellValue(ref.row, ref.col);
    }
    
    if (node.type === 'Range') {
      return this.resolveRange(node.value);
    }

    if (node.type === 'UnaryOp') {
      const val = this.evaluate(node.expr);
      if (node.op === '+') return Number(val);
      if (node.op === '-') return -Number(val);
    }

    if (node.type === 'BinaryOp') {
      const left = this.evaluate(node.left);
      // Short-circuit OR/AND if possible
      if (node.op === '&') return `${left ?? ''}${this.evaluate(node.right) ?? ''}`;
      
      const right = this.evaluate(node.right);
      
      switch (node.op) {
        case '+': return Number(left) + Number(right);
        case '-': return Number(left) - Number(right);
        case '*': return Number(left) * Number(right);
        case '/': 
          if (Number(right) === 0) throw new Error('#DIV/0!');
          return Number(left) / Number(right);
        case '^': return Math.pow(Number(left), Number(right));
        case '%': return Number(left) % Number(right);
        case '=': return left === right;
        case '<>': return left !== right;
        case '<': return Number(left) < Number(right);
        case '>': return Number(left) > Number(right);
        case '<=': return Number(left) <= Number(right);
        case '>=': return Number(left) >= Number(right);
      }
    }

    if (node.type === 'Call') {
      const args = node.args;
      const flatArgs = (): any[] => {
        const res: any[] = [];
        for (const arg of args) {
          const val = this.evaluate(arg);
          if (Array.isArray(val)) res.push(...val);
          else res.push(val);
        }
        return res;
      };

      const nums = () => flatArgs().map(a => Number(a)).filter(n => !isNaN(n));

      switch (node.name) {
        case 'SUM': return nums().reduce((a, b) => a + b, 0);
        case 'AVERAGE': {
          const n = nums();
          return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;
        }
        case 'COUNT': return nums().length;
        case 'MIN': {
          const n = nums();
          return n.length ? Math.min(...n) : 0;
        }
        case 'MAX': {
          const n = nums();
          return n.length ? Math.max(...n) : 0;
        }
        case 'IF': {
          const cond = this.evaluate(args[0]);
          if (cond) return args.length > 1 ? this.evaluate(args[1]) : true;
          return args.length > 2 ? this.evaluate(args[2]) : false;
        }
        case 'AND': return flatArgs().every(a => !!a);
        case 'OR': return flatArgs().some(a => !!a);
        case 'NOT': return !this.evaluate(args[0]);
        case 'CONCATENATE': return flatArgs().map(a => String(a ?? '')).join('');
        case 'ABS': return Math.abs(Number(this.evaluate(args[0])));
        case 'ROUND': {
           const val = Number(this.evaluate(args[0]));
           const precision = args.length > 1 ? Number(this.evaluate(args[1])) : 0;
           const factor = Math.pow(10, precision);
           return Math.round(val * factor) / factor;
        }
        case 'IFERROR': {
          try {
            return this.evaluate(args[0]);
          } catch {
            return args.length > 1 ? this.evaluate(args[1]) : '';
          }
        }
        default: throw new Error('#NAME?');
      }
    }
    
    return null;
  }
}

function parse(expr: string) {
  const lexer = new Lexer(expr);
  const parser = new Parser(lexer);
  return parser.parse();
}

function evaluateAST(ast: any, cells: TableCell[][], visiting: Set<string>): any {
  const evaluator = new Evaluator(cells, visiting);
  return evaluator.evaluate(ast);
}

export function evaluateFormula(formula: string, cells: TableCell[][], visiting = new Set<string>()): string {
  if (!formula || !formula.startsWith('=')) return formula;
  try {
    const expr = formula.substring(1).trim();
    if (!expr) return '';
    const ast = parse(expr);
    const result = evaluateAST(ast, cells, visiting);
    
    if (result === null || result === undefined) return '';
    if (typeof result === 'number') {
      if (isNaN(result)) return '#VALUE!';
      if (!isFinite(result)) return '#DIV/0!';
      // Avoid tiny floating point errors like 0.1+0.2
      return Number.isInteger(result) ? result.toString() : parseFloat(result.toPrecision(10)).toString();
    }
    if (typeof result === 'boolean') return result ? 'TRUE' : 'FALSE';
    return String(result);
  } catch (e: any) {
    if (e.message && e.message.startsWith('#')) return e.message;
    return '#ERROR!';
  }
}

export function getCellDisplayValue(cell: TableCell, cells: TableCell[][]): string {
  if (cell.formula) {
    return evaluateFormula(cell.formula, cells);
  }
  return cell.content;
}
