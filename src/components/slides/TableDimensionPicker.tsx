import React, { useState } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Button } from '@/components/ui/button';

interface TableDimensionPickerProps {
  onSelect: (rows: number, columns: number) => void;
}

export const TableDimensionPicker: React.FC<TableDimensionPickerProps> = ({ onSelect }) => {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);

  const MAX_ROWS = 10;
  const MAX_COLS = 10;

  const handleMouseMove = (r: number, c: number) => {
    setHoveredRow(r);
    setHoveredCol(c);
  };

  const handleClick = () => {
    if (hoveredRow > 0 && hoveredCol > 0) {
      onSelect(hoveredRow, hoveredCol);
    }
  };

  return (
    <div className="p-4 bg-white border rounded shadow-lg flex flex-col items-center">
      <div className="mb-2 text-sm font-semibold text-gray-700">
        {hoveredRow > 0 && hoveredCol > 0 ? `${hoveredRow} x ${hoveredCol} Table` : 'Insert Table'}
      </div>
      
      <div 
        className="grid gap-1 mb-4" 
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, minmax(0, 1fr))` }}
        onMouseLeave={() => { setHoveredRow(0); setHoveredCol(0); }}
      >
        {Array.from({ length: MAX_ROWS }).map((_, r) => (
          Array.from({ length: MAX_COLS }).map((_, c) => {
            const isHovered = r < hoveredRow && c < hoveredCol;
            return (
              <div
                key={`${r}-${c}`}
                className={`w-5 h-5 border cursor-pointer transition-colors ${isHovered ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-300'}`}
                onMouseMove={() => handleMouseMove(r + 1, c + 1)}
                onClick={handleClick}
              />
            );
          })
        ))}
      </div>

      <div className="flex gap-2 w-full justify-between">
        <Button variant="outline" size="sm" onClick={() => onSelect(3, 3)}>3x3</Button>
        <Button variant="outline" size="sm" onClick={() => onSelect(4, 4)}>4x4</Button>
        <Button variant="outline" size="sm" onClick={() => onSelect(5, 3)}>5x3</Button>
      </div>
    </div>
  );
};
