import React, { useMemo } from 'react';
import type { TableProperties } from '@/types/presentation';
import { getCellDisplayValue } from '@/lib/formulaEngine';

interface PresentationTableRendererProps {
  tableProps: TableProperties;
  scale?: number;
}

export const PresentationTableRenderer: React.FC<PresentationTableRendererProps> = ({ tableProps: tp, scale = 1 }) => {
  const displayValues = useMemo(() => {
    return tp.cells.map((row) =>
      row.map((cell) => getCellDisplayValue(cell, tp.cells))
    );
  }, [tp.cells]);

  return (
    <table className="border-collapse w-full h-full" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        {tp.columnWidths.map((w, i) => (
          <col key={i} style={{ width: w * scale }} />
        ))}
      </colgroup>
      <tbody>
        {tp.cells.map((row, rowIdx) => (
          <tr key={rowIdx} style={{ height: tp.rowHeights[rowIdx] * scale }}>
            {row.map((cell, colIdx) => {
              if (cell.merged) return null;
              const isBanded = tp.bandedRows && (
                tp.headerRow ? (rowIdx > 0 && (rowIdx - 1) % 2 === 1) : rowIdx % 2 === 1
              );
              const bgColor = (tp.headerRow && rowIdx === 0)
                ? tp.headerBackgroundColor
                : isBanded ? tp.bandedRowColor : cell.backgroundColor;
              const textColor = (tp.headerRow && rowIdx === 0)
                ? tp.headerTextColor : cell.textColor;

              return (
                <td
                  key={`${rowIdx}-${colIdx}`}
                  rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                  colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    borderColor: cell.borderTop.color,
                    borderStyle: cell.borderTop.style,
                    borderWidth: `${cell.borderTop.width}px ${cell.borderRight.width}px ${cell.borderBottom.width}px ${cell.borderLeft.width}px`,
                    padding: `${2 * scale}px ${6 * scale}px`,
                    fontFamily: cell.fontFamily,
                    fontSize: `${cell.fontSize * scale}px`,
                    fontWeight: cell.fontWeight,
                    fontStyle: cell.fontStyle,
                    textDecoration: cell.textDecoration !== 'none' ? cell.textDecoration : undefined,
                    textAlign: cell.textAlign,
                    verticalAlign: cell.verticalAlign,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayValues[rowIdx]?.[colIdx] ?? cell.content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
