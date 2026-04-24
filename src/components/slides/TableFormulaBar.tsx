import React, { useState, useEffect } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Input } from '@/components/ui/input';
import { FunctionSquare } from 'lucide-react';

export const TableFormulaBar: React.FC = () => {
  const { activeTableId, activeTableCell, presentation, currentSlideIndex, updateTableCell } = usePresentationStore();
  const [localValue, setLocalValue] = useState('');

  const currentSlide = presentation.slides[currentSlideIndex];
  const activeTable = activeTableId 
    ? currentSlide.objects.find(o => o.id === activeTableId && o.type === 'table') 
    : null;

  const activeCell = activeTable && activeTableCell && activeTable.tableProps
    ? activeTable.tableProps.cells[activeTableCell.r][activeTableCell.c]
    : null;

  useEffect(() => {
    if (activeCell) {
      setLocalValue(activeCell.formula || activeCell.content || '');
    } else {
      setLocalValue('');
    }
  }, [activeCell]);

  if (!activeTable || !activeTableCell || !activeCell) {
    return null;
  }

  const getCellReference = (r: number, c: number) => {
    let colStr = '';
    let tempCol = c + 1;
    while (tempCol > 0) {
      const remainder = (tempCol - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      tempCol = Math.floor((tempCol - 1) / 26);
    }
    return `${colStr}${r + 1}`;
  };

  const handleBlur = () => {
    if (activeTableId && activeTableCell) {
      const isFormula = localValue.startsWith('=');
      updateTableCell(currentSlideIndex, activeTableId, activeTableCell.r, activeTableCell.c, {
        formula: isFormula ? localValue : undefined,
        content: isFormula ? '' : localValue,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center bg-white border-b border-gray-200 px-4 py-2 space-x-2">
      <div className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-2 py-1 min-w-[50px] text-sm font-medium text-gray-600">
        {getCellReference(activeTableCell.r, activeTableCell.c)}
      </div>
      <div className="text-gray-400">
        <FunctionSquare size={18} />
      </div>
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 h-8 rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 border-gray-300 shadow-none font-mono text-sm"
        placeholder="Enter value or formula (e.g. =SUM(A1:B2))"
      />
    </div>
  );
};
