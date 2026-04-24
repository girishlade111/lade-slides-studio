import type { TableCell } from '@/types/presentation';

export function getCellDisplayValue(cell: TableCell, cells: TableCell[][]): string {
  if (cell.formula || (cell.content && cell.content.startsWith('='))) {
    const getCellValue = (r: number, c: number) => {
      if (!cells[r] || !cells[r][c]) return undefined;
      const content = cells[r][c].content;
      const num = Number(content);
      return isNaN(num) ? content : num;
    };
    return String(evaluateFormula(cell.formula || cell.content, getCellValue));
  }
  return cell.content;
}

export function evaluateFormula(formula: string, getCellValue: (row: number, col: number) => string | number | undefined): string | number {
  if (!formula.startsWith('=')) {
    return formula;
  }

  try {
    const expression = formula.substring(1).toUpperCase();
    
    // Helper to parse cell reference (e.g., A1)
    const parseCellRef = (ref: string): { row: number, col: number } | null => {
      const match = ref.match(/^([A-Z]+)(\d+)$/);
      if (!match) return null;
      
      const colStr = match[1];
      let col = 0;
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
      }
      col -= 1; // 0-indexed
      
      const row = parseInt(match[2], 10) - 1; // 0-indexed
      return { row, col };
    };

    // Helper to get range of cells (e.g., A1:B3)
    const getRangeValues = (rangeStr: string): number[] => {
      const parts = rangeStr.split(':');
      if (parts.length !== 2) return [];
      
      const start = parseCellRef(parts[0]);
      const end = parseCellRef(parts[1]);
      if (!start || !end) return [];
      
      const values: number[] = [];
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const val = getCellValue(r, c);
          const num = Number(val);
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      }
      return values;
    };

    // Replace function calls
    let evalStr = expression;
    const functionRegex = /(SUM|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)/g;
    evalStr = evalStr.replace(functionRegex, (match, func, args) => {
      let values: number[] = [];
      
      // Parse arguments
      const argParts = args.split(',');
      for (const part of argParts) {
        const trimmed = part.trim();
        if (trimmed.includes(':')) {
          values = values.concat(getRangeValues(trimmed));
        } else {
          const cell = parseCellRef(trimmed);
          if (cell) {
            const val = getCellValue(cell.row, cell.col);
            const num = Number(val);
            if (!isNaN(num)) values.push(num);
          } else if (!isNaN(Number(trimmed))) {
            values.push(Number(trimmed));
          }
        }
      }

      if (values.length === 0 && func !== 'COUNT') return '0';

      switch (func) {
        case 'SUM':
          return values.reduce((a, b) => a + b, 0).toString();
        case 'AVERAGE':
          return (values.reduce((a, b) => a + b, 0) / values.length).toString();
        case 'COUNT':
          return values.length.toString();
        case 'MIN':
          return Math.min(...values).toString();
        case 'MAX':
          return Math.max(...values).toString();
        default:
          return '0';
      }
    });

    // Handle simple IF (e.g. IF(A1>5, 10, 0))
    // We only support basic logic for now
    const ifRegex = /IF\(([^,]+),([^,]+),([^)]+)\)/g;
    evalStr = evalStr.replace(ifRegex, (match, condition, trueVal, falseVal) => {
      // Very naive evaluation of condition
      try {
        // eslint-disable-next-line no-new-func
        const condResult = new Function(`return ${condition}`)();
        return condResult ? trueVal.trim() : falseVal.trim();
      } catch (e) {
        return '#ERROR!';
      }
    });

    // Replace standalone cell references
    const cellRefRegex = /[A-Z]+\d+/g;
    evalStr = evalStr.replace(cellRefRegex, (match) => {
      const cell = parseCellRef(match);
      if (cell) {
        const val = getCellValue(cell.row, cell.col);
        return String(val === undefined ? 0 : val);
      }
      return match;
    });

    // Evaluate basic math
    try {
      const result = new Function(`return ${evalStr}`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return result;
      }
      if (typeof result === 'string') {
        return result;
      }
      return '#VALUE!';
    } catch (e) {
      return '#ERROR!';
    }
  } catch (e) {
    return '#ERROR!';
  }
}
