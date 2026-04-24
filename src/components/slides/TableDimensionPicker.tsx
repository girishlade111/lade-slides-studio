import React, { useState } from 'react';

interface TableDimensionPickerProps {
  onSelect: (rows: number, columns: number) => void;
}

const MAX_ROWS = 10;
const MAX_COLS = 10;

export const TableDimensionPicker: React.FC<TableDimensionPickerProps> = ({ onSelect }) => {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  return (
    <div className="p-2">
      <div className="text-xs font-medium text-center mb-2 text-[hsl(var(--foreground))]">
        {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} x ${hoverCol} Table` : 'Insert Table'}
      </div>
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
        onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
      >
        {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, i) => {
          const r = Math.floor(i / MAX_COLS) + 1;
          const c = (i % MAX_COLS) + 1;
          const isActive = r <= hoverRow && c <= hoverCol;
          return (
            <div
              key={i}
              className={`w-4 h-4 border rounded-[2px] cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-500 border-blue-600'
                  : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
              onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
              onClick={() => onSelect(r, c)}
            />
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]">
        <div className="flex gap-1">
          {[
            { label: '3x3', rows: 3, cols: 3 },
            { label: '4x4', rows: 4, cols: 4 },
            { label: '5x3', rows: 5, cols: 3 },
            { label: '3x5', rows: 3, cols: 5 },
          ].map((preset) => (
            <button
              key={preset.label}
              className="flex-1 text-[10px] px-1.5 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:text-white transition-colors"
              onClick={() => onSelect(preset.rows, preset.cols)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
