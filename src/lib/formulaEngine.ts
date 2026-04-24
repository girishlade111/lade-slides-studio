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
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { col: columnToIndex(match[1]), row: parseInt(match[2], 10) - 1 };
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

function getCellValue(cells: TableCell[][], row: number, col: number, visiting: Set<string>): number {
  if (row < 0 || row >= cells.length || col < 0 || col >= (cells[0]?.length ?? 0)) return 0;
  const cell = cells[row][col];
  if (cell.formula) {
    const key = `${row},${col}`;
    if (visiting.has(key)) return NaN; // circular
    visiting.add(key);
    const result = evaluateFormula(cell.formula, cells, visiting);
    visiting.delete(key);
    return typeof result === 'number' ? result : parseFloat(result) || 0;
  }
  const num = parseFloat(cell.content);
  return isNaN(num) ? 0 : num;
}

function resolveValues(arg: string, cells: TableCell[][], visiting: Set<string>): number[] {
  arg = arg.trim();
  if (arg.includes(':')) {
    const range = parseRange(arg);
    if (!range) return [];
    return range.map(({ row, col }) => getCellValue(cells, row, col, visiting));
  }
  const ref = cellRefToIndex(arg);
  if (ref) return [getCellValue(cells, ref.row, ref.col, visiting)];
  const num = parseFloat(arg);
  return isNaN(num) ? [] : [num];
}

function evaluateFunction(name: string, args: string[], cells: TableCell[][], visiting: Set<string>): number | string {
  const values: number[] = [];
  for (const arg of args) {
    values.push(...resolveValues(arg, cells, visiting));
  }

  switch (name) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    case 'AVERAGE':
      return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
    case 'COUNT':
      return values.length;
    case 'MIN':
      return values.length === 0 ? 0 : Math.min(...values);
    case 'MAX':
      return values.length === 0 ? 0 : Math.max(...values);
    case 'ABS':
      return values.length > 0 ? Math.abs(values[0]) : 0;
    case 'ROUND':
      if (values.length >= 2) return parseFloat(values[0].toFixed(values[1]));
      return values.length > 0 ? Math.round(values[0]) : 0;
    case 'IF': {
      const condition = values[0];
      const trueVal = args.length > 1 ? resolveValues(args[1], cells, visiting)[0] ?? 0 : 1;
      const falseVal = args.length > 2 ? resolveValues(args[2], cells, visiting)[0] ?? 0 : 0;
      return condition ? trueVal : falseVal;
    }
    default:
      return '#NAME?';
  }
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let current = '';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if ('+-*/(),%'.includes(ch)) {
      if (current.trim()) tokens.push(current.trim());
      tokens.push(ch);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

function evaluateExpression(expr: string, cells: TableCell[][], visiting: Set<string>): number | string {
  expr = expr.trim();

  const funcMatch = expr.match(/^([A-Z]+)\((.+)\)$/);
  if (funcMatch) {
    const fname = funcMatch[1];
    const argsStr = funcMatch[2];
    const args: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of argsStr) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        args.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current) args.push(current);
    return evaluateFunction(fname, args, cells, visiting);
  }

  const tokens = tokenize(expr);
  if (tokens.length === 1) {
    const ref = cellRefToIndex(tokens[0]);
    if (ref) return getCellValue(cells, ref.row, ref.col, visiting);
    const num = parseFloat(tokens[0]);
    if (!isNaN(num)) return num;
    return '#VALUE!';
  }

  const values: number[] = [];
  const ops: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if ('+-*/%'.includes(t)) {
      ops.push(t);
    } else {
      const ref = cellRefToIndex(t);
      if (ref) {
        values.push(getCellValue(cells, ref.row, ref.col, visiting));
      } else {
        const innerFunc = t.match(/^([A-Z]+)\(/);
        if (innerFunc) {
          const result = evaluateExpression(t, cells, visiting);
          values.push(typeof result === 'number' ? result : 0);
        } else {
          const num = parseFloat(t);
          values.push(isNaN(num) ? 0 : num);
        }
      }
    }
  }

  // * / % first
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '*' || ops[i] === '/' || ops[i] === '%') {
      const a = values[i];
      const b = values[i + 1];
      let result: number;
      if (ops[i] === '*') result = a * b;
      else if (ops[i] === '/') result = b === 0 ? NaN : a / b;
      else result = b === 0 ? NaN : a % b;
      values.splice(i, 2, result);
      ops.splice(i, 1);
      i--;
    }
  }

  let result = values[0] ?? 0;
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '+') result += values[i + 1];
    else if (ops[i] === '-') result -= values[i + 1];
  }

  return result;
}

export function evaluateFormula(formula: string, cells: TableCell[][], visiting = new Set<string>()): string {
  if (!formula || !formula.startsWith('=')) return formula;

  try {
    const expr = formula.substring(1).trim().toUpperCase();
    const result = evaluateExpression(expr, cells, visiting);
    if (typeof result === 'string') return result;
    if (isNaN(result)) return '#DIV/0!';
    if (!isFinite(result)) return '#DIV/0!';
    return Number.isInteger(result) ? result.toString() : result.toFixed(2);
  } catch {
    return '#ERROR!';
  }
}

export function getCellDisplayValue(cell: TableCell, cells: TableCell[][]): string {
  if (cell.formula) {
    return evaluateFormula(cell.formula, cells);
  }
  return cell.content;
}
