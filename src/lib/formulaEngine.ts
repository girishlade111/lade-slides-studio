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

export function shiftFormula(formula: string, rowOffset: number, colOffset: number): string {
  if (!formula.startsWith('=')) return formula;
  
  const cellRefRegex = /([\$]?)([A-Z]+)([\$]?)(\d+)/gi;
  
  return formula.replace(cellRefRegex, (match, colAbsolute, colStr, rowAbsolute, rowStr) => {
    let col = 0;
    const upperColStr = colStr.toUpperCase();
    for (let i = 0; i < upperColStr.length; i++) {
      col = col * 26 + (upperColStr.charCodeAt(i) - 64);
    }
    
    let newCol = col;
    if (!colAbsolute) {
      newCol += colOffset;
      if (newCol < 1) newCol = 1;
    }
    
    let newRow = parseInt(rowStr, 10);
    if (!rowAbsolute) {
      newRow += rowOffset;
      if (newRow < 1) newRow = 1;
    }
    
    let newColStr = '';
    let tempCol = newCol;
    while (tempCol > 0) {
      const remainder = (tempCol - 1) % 26;
      newColStr = String.fromCharCode(65 + remainder) + newColStr;
      tempCol = Math.floor((tempCol - 1) / 26);
    }
    
    return `${colAbsolute}${newColStr}${rowAbsolute}${newRow}`;
  });
}

export function evaluateFormula(formula: string, getCellValue: (row: number, col: number) => string | number | undefined): string | number {
  if (!formula.startsWith('=')) {
    return formula;
  }

  try {
    const expression = formula.substring(1);
    
    // Helper to parse cell reference (e.g., A1)
    const parseCellRef = (ref: string): { row: number, col: number } | null => {
      const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
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

    // VLOOKUP(search_key, range, index)
    const vlookupRegex = /VLOOKUP\(([^,]+),([^,]+),([^)]+)\)/gi;
    evalStr = evalStr.replace(vlookupRegex, (match, searchKey, rangeStr, indexStr) => {
      searchKey = searchKey.trim();
      // Remove quotes if present
      if (searchKey.startsWith('"') && searchKey.endsWith('"')) {
        searchKey = searchKey.substring(1, searchKey.length - 1);
      } else {
        const cell = parseCellRef(searchKey);
        if (cell) {
          const val = getCellValue(cell.row, cell.col);
          searchKey = val !== undefined ? String(val) : '';
        }
      }

      rangeStr = rangeStr.trim();
      const parts = rangeStr.split(':');
      if (parts.length !== 2) return '#N/A';
      const start = parseCellRef(parts[0]);
      const end = parseCellRef(parts[1]);
      if (!start || !end) return '#N/A';

      const index = parseInt(indexStr.trim(), 10);
      if (isNaN(index) || index < 1 || index > (end.col - start.col + 1)) return '#REF!';

      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);

      for (let r = minRow; r <= maxRow; r++) {
        const keyVal = getCellValue(r, minCol);
        if (String(keyVal) === searchKey) {
          const resultVal = getCellValue(r, minCol + index - 1);
          return typeof resultVal === 'string' ? `"${resultVal}"` : String(resultVal || '');
        }
      }
      return '#N/A';
    });

    // CONCATENATE
    const concatRegex = /CONCATENATE\(([^)]+)\)/gi;
    evalStr = evalStr.replace(concatRegex, (match, args) => {
      const parts = args.split(',').map((p: string) => p.trim());
      const res = parts.map((p: string) => {
        if (p.startsWith('"') && p.endsWith('"')) {
          return p.substring(1, p.length - 1);
        }
        const cell = parseCellRef(p);
        if (cell) {
          const val = getCellValue(cell.row, cell.col);
          return val !== undefined ? String(val) : '';
        }
        return p;
      }).join('');
      return `"${res}"`;
    });

    // DATE(year, month, day)
    const dateRegex = /DATE\(([^,]+),([^,]+),([^)]+)\)/gi;
    evalStr = evalStr.replace(dateRegex, (match, y, m, d) => {
      const year = parseInt(y.trim(), 10);
      const month = parseInt(m.trim(), 10) - 1; // JS months are 0-indexed
      const day = parseInt(d.trim(), 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return '#VALUE!';
      const date = new Date(year, month, day);
      return `"${date.toLocaleDateString()}"`;
    });

    const functionRegex = /(SUM|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)/gi;
    evalStr = evalStr.replace(functionRegex, (match, func, args) => {
      func = func.toUpperCase();
      let values: number[] = [];
      
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

    const ifRegex = /IF\(([^,]+),([^,]+),([^)]+)\)/gi;
    evalStr = evalStr.replace(ifRegex, (match, condition, trueVal, falseVal) => {
      try {
        const condResult = new Function(`return ${condition}`)();
        return condResult ? trueVal.trim() : falseVal.trim();
      } catch (e) {
        return '#ERROR!';
      }
    });

    const cellRefRegex = /[A-Z]+\d+/gi;
    evalStr = evalStr.replace(cellRefRegex, (match) => {
      // Do not replace inside strings
      const cell = parseCellRef(match);
      if (cell) {
        const val = getCellValue(cell.row, cell.col);
        return String(val === undefined ? 0 : typeof val === 'string' && isNaN(Number(val)) ? `"${val}"` : val);
      }
      return match;
    });

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