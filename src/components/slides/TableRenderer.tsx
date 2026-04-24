import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { SlideObject, TableCell } from '@/types/presentation';
import { usePresentationStore } from '@/stores/presentationStore';
import { getCellDisplayValue, indexToColumn } from '@/lib/formulaEngine';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Plus, Trash2, ArrowUpAZ, ArrowDownAZ, Merge, Split,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';

interface TableRendererProps {
  obj: SlideObject;
  isEditing: boolean;
  slideIndex: number;
}

interface CellSelection {
  row: number;
  col: number;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ obj, isEditing, slideIndex }) => {
  const tp = obj.tableProps!;
  const {
    updateTableCell, addTableRow, deleteTableRow,
    addTableColumn, deleteTableColumn, mergeCells,
    unmergeCells, sortTableColumn, pushHistory,
    updateObject,
  } = usePresentationStore();

  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [editingCell, setEditingCell] = useState<CellSelection | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef({ pos: 0, size: 0 });

  const cells = tp.cells;

  const displayValues = useMemo(() => {
    return cells.map((row) =>
      row.map((cell) => getCellDisplayValue(cell, cells))
    );
  }, [cells]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const cell = cells[editingCell.row]?.[editingCell.col];
    if (!cell) return;
    const isFormula = editValue.startsWith('=');
    pushHistory();
    updateTableCell(slideIndex, obj.id, editingCell.row, editingCell.col, {
      content: isFormula ? '' : editValue,
      formula: isFormula ? editValue : undefined,
    });
    setEditingCell(null);
  }, [editingCell, editValue, slideIndex, obj.id, cells, updateTableCell, pushHistory]);

  const handleCellClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation();
    if (!isEditing) return;
    if (e.shiftKey && selectedCell) {
      setSelectionEnd({ row, col });
    } else {
      if (editingCell) commitEdit();
      setSelectedCell({ row, col });
      setSelectionEnd(null);
    }
  }, [isEditing, selectedCell, editingCell, commitEdit]);

  const handleCellDoubleClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation();
    if (!isEditing) return;
    const cell = cells[row]?.[col];
    if (!cell || cell.merged) return;
    setEditingCell({ row, col });
    setEditValue(cell.formula || cell.content);
    setTimeout(() => editRef.current?.focus(), 0);
  }, [isEditing, cells]);

  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    if (!isEditing || e.button !== 0) return;
    setIsSelecting(true);
    setSelectedCell({ row, col });
    setSelectionEnd(null);
  }, [isEditing]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting) return;
    setSelectionEnd({ row, col });
  }, [isSelecting]);

  useEffect(() => {
    if (!isSelecting) return;
    const handleUp = () => setIsSelecting(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [isSelecting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditing || !selectedCell) return;

    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        setSelectedCell({ row: Math.min(editingCell.row + 1, tp.rows - 1), col: editingCell.col });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        const nextCol = e.shiftKey
          ? Math.max(editingCell.col - 1, 0)
          : Math.min(editingCell.col + 1, tp.columns - 1);
        setSelectedCell({ row: editingCell.row, col: nextCol });
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      const cell = cells[selectedCell.row]?.[selectedCell.col];
      if (cell && !cell.merged) {
        setEditingCell(selectedCell);
        setEditValue(cell.formula || cell.content);
        setTimeout(() => editRef.current?.focus(), 0);
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const range = getSelectionRange();
      pushHistory();
      for (const { row, col } of range) {
        updateTableCell(slideIndex, obj.id, row, col, { content: '', formula: undefined });
      }
      return;
    }

    let nr = selectedCell.row;
    let nc = selectedCell.col;
    if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
    else if (e.key === 'ArrowDown') nr = Math.min(tp.rows - 1, nr + 1);
    else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
    else if (e.key === 'ArrowRight') nc = Math.min(tp.columns - 1, nc + 1);
    else if (e.key === 'Tab') {
      e.preventDefault();
      nc = e.shiftKey ? Math.max(0, nc - 1) : Math.min(tp.columns - 1, nc + 1);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const cell = cells[selectedCell.row]?.[selectedCell.col];
      if (cell && !cell.merged) {
        setEditingCell(selectedCell);
        setEditValue(e.key);
        setTimeout(() => editRef.current?.focus(), 0);
      }
      return;
    } else return;

    e.preventDefault();
    if (e.shiftKey) {
      setSelectionEnd({ row: nr, col: nc });
    } else {
      setSelectedCell({ row: nr, col: nc });
      setSelectionEnd(null);
    }
  }, [isEditing, selectedCell, editingCell, tp, cells, commitEdit, pushHistory, updateTableCell, slideIndex, obj.id]);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (!isEditing || editingCell) return;
    const range = getSelectionRange();
    if (range.length === 0) return;
    
    range.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    
    const minRow = range[0].row;
    const maxRow = range[range.length - 1].row;
    const minCol = Math.min(...range.map(c => c.col));
    const maxCol = Math.max(...range.map(c => c.col));
    
    const matrix: string[][] = Array.from({ length: maxRow - minRow + 1 }, () => 
      Array(maxCol - minCol + 1).fill('')
    );
    
    for (const { row, col } of range) {
      const cell = cells[row]?.[col];
      if (cell && !cell.merged) {
        matrix[row - minRow][col - minCol] = cell.formula || cell.content;
      }
    }
    
    const tsv = matrix.map(r => r.join('\t')).join('\n');
    e.clipboardData.setData('text/plain', tsv);
    e.preventDefault();
  }, [isEditing, editingCell, getSelectionRange, cells]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!isEditing || editingCell || !selectedCell) return;
    const tsv = e.clipboardData.getData('text/plain');
    if (!tsv) return;
    e.preventDefault();
    
    pushHistory();
    const rows = tsv.split(/\r?\n/);
    const startRow = selectedCell.row;
    const startCol = selectedCell.col;
    
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r].split('\t');
      for (let c = 0; c < cols.length; c++) {
        const targetRow = startRow + r;
        const targetCol = startCol + c;
        if (targetRow < tp.rows && targetCol < tp.columns) {
          const val = cols[c];
          const isFormula = val.startsWith('=');
          updateTableCell(slideIndex, obj.id, targetRow, targetCol, {
            content: isFormula ? '' : val,
            formula: isFormula ? val : undefined
          });
        }
      }
    }
  }, [isEditing, editingCell, selectedCell, pushHistory, tp, updateTableCell, slideIndex, obj.id]);

  const getSelectionRange = useCallback((): CellSelection[] => {
    if (!selectedCell) return [];
    if (!selectionEnd) return [selectedCell];
    const r1 = Math.min(selectedCell.row, selectionEnd.row);
    const r2 = Math.max(selectedCell.row, selectionEnd.row);
    const c1 = Math.min(selectedCell.col, selectionEnd.col);
    const c2 = Math.max(selectedCell.col, selectionEnd.col);
    const result: CellSelection[] = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        result.push({ row: r, col: c });
      }
    }
    return result;
  }, [selectedCell, selectionEnd]);

  const isCellInSelection = useCallback((row: number, col: number): boolean => {
    if (!selectedCell) return false;
    if (!selectionEnd) return selectedCell.row === row && selectedCell.col === col;
    const r1 = Math.min(selectedCell.row, selectionEnd.row);
    const r2 = Math.max(selectedCell.row, selectionEnd.row);
    const c1 = Math.min(selectedCell.col, selectionEnd.col);
    const c2 = Math.max(selectedCell.col, selectionEnd.col);
    return row >= r1 && row <= r2 && col >= c1 && col <= c2;
  }, [selectedCell, selectionEnd]);

  // Column resize
  const handleColResizeStart = useCallback((e: React.MouseEvent, colIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol(colIdx);
    resizeStartRef.current = { pos: e.clientX, size: tp.columnWidths[colIdx] };
  }, [tp.columnWidths]);

  const handleRowResizeStart = useCallback((e: React.MouseEvent, rowIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingRow(rowIdx);
    resizeStartRef.current = { pos: e.clientY, size: tp.rowHeights[rowIdx] };
  }, [tp.rowHeights]);

  useEffect(() => {
    if (resizingCol === null && resizingRow === null) return;
    const handleMove = (e: MouseEvent) => {
      if (resizingCol !== null) {
        const dx = e.clientX - resizeStartRef.current.pos;
        const newWidth = Math.max(30, resizeStartRef.current.size + dx);
        const widths = [...tp.columnWidths];
        const diff = newWidth - widths[resizingCol];
        widths[resizingCol] = newWidth;
        updateObject(slideIndex, obj.id, {
          tableProps: { ...tp, columnWidths: widths },
          size: { ...obj.size, width: obj.size.width + diff },
        });
      }
      if (resizingRow !== null) {
        const dy = e.clientY - resizeStartRef.current.pos;
        const newHeight = Math.max(20, resizeStartRef.current.size + dy);
        const heights = [...tp.rowHeights];
        const diff = newHeight - heights[resizingRow];
        heights[resizingRow] = newHeight;
        updateObject(slideIndex, obj.id, {
          tableProps: { ...tp, rowHeights: heights },
          size: { ...obj.size, height: obj.size.height + diff },
        });
      }
    };
    const handleUp = () => {
      setResizingCol(null);
      setResizingRow(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizingCol, resizingRow, tp, slideIndex, obj.id, obj.size, updateObject]);

  useEffect(() => {
    if (!isEditing) {
      if (editingCell) {
        commitEdit();
      }
      setSelectedCell(null);
      setEditingCell(null);
      setSelectionEnd(null);
    }
  }, [isEditing, editingCell, commitEdit]);

  const formatSelectedCells = useCallback((updates: Partial<TableCell>) => {
    const range = getSelectionRange();
    if (range.length === 0) return;
    pushHistory();
    for (const { row, col } of range) {
      updateTableCell(slideIndex, obj.id, row, col, updates);
    }
  }, [getSelectionRange, pushHistory, updateTableCell, slideIndex, obj.id]);

  const canMerge = useMemo(() => {
    const range = getSelectionRange();
    return range.length > 1;
  }, [getSelectionRange]);

  const canUnmerge = useMemo(() => {
    if (!selectedCell) return false;
    const cell = cells[selectedCell.row]?.[selectedCell.col];
    return cell ? (cell.rowSpan > 1 || cell.colSpan > 1) : false;
  }, [selectedCell, cells]);

  const renderCell = (cell: TableCell, rowIdx: number, colIdx: number) => {
    if (cell.merged) return null;
    const isSelected = isCellInSelection(rowIdx, colIdx);
    const isEditingThis = editingCell?.row === rowIdx && editingCell?.col === colIdx;
    const isBanded = tp.bandedRows && !tp.headerRow ? rowIdx % 2 === 1
      : tp.bandedRows && tp.headerRow ? (rowIdx - 1) % 2 === 1 && rowIdx > 0
      : false;

    const bgColor = (tp.headerRow && rowIdx === 0)
      ? tp.headerBackgroundColor
      : isBanded
        ? tp.bandedRowColor
        : cell.backgroundColor;

    const textColor = (tp.headerRow && rowIdx === 0)
      ? tp.headerTextColor
      : cell.textColor;

    return (
      <td
        key={`${rowIdx}-${colIdx}`}
        rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
        colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
        className={`relative border select-none ${isSelected && isEditing ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
        style={{
          width: tp.columnWidths[colIdx],
          height: tp.rowHeights[rowIdx],
          minWidth: 30,
          minHeight: 20,
          backgroundColor: bgColor,
          borderColor: cell.borderTop.color,
          borderStyle: cell.borderTop.style,
          borderWidth: `${cell.borderTop.width}px ${cell.borderRight.width}px ${cell.borderBottom.width}px ${cell.borderLeft.width}px`,
          padding: '2px 6px',
          fontFamily: cell.fontFamily,
          fontSize: `${cell.fontSize}px`,
          fontWeight: cell.fontWeight,
          fontStyle: cell.fontStyle,
          textDecoration: cell.textDecoration !== 'none' ? cell.textDecoration : undefined,
          color: textColor,
          textAlign: cell.textAlign,
          verticalAlign: cell.verticalAlign,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          cursor: isEditing ? 'cell' : 'default',
        }}
        onClick={(e) => handleCellClick(e, rowIdx, colIdx)}
        onDoubleClick={(e) => handleCellDoubleClick(e, rowIdx, colIdx)}
        onMouseDown={(e) => handleCellMouseDown(e, rowIdx, colIdx)}
        onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
      >
        {isEditingThis ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') setEditingCell(null);
              if (e.key === 'Tab') {
                e.preventDefault();
                commitEdit();
                const nextCol = e.shiftKey
                  ? Math.max(colIdx - 1, 0)
                  : Math.min(colIdx + 1, tp.columns - 1);
                setSelectedCell({ row: rowIdx, col: nextCol });
              }
            }}
            className="w-full h-full bg-white border-none outline-none text-inherit font-inherit"
            style={{ fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}
          />
        ) : (
          <span className="pointer-events-none">
            {displayValues[rowIdx]?.[colIdx] ?? cell.content}
          </span>
        )}
      </td>
    );
  };

  const contextMenuContent = (
    <ContextMenuContent className="w-56">
      <ContextMenuItem onClick={() => selectedCell && addTableRow(obj.id, selectedCell.row)}>
        <Plus className="w-4 h-4 mr-2" /> Insert Row Below
      </ContextMenuItem>
      <ContextMenuItem onClick={() => selectedCell && addTableRow(obj.id, selectedCell.row - 1)}>
        <Plus className="w-4 h-4 mr-2" /> Insert Row Above
      </ContextMenuItem>
      <ContextMenuItem onClick={() => selectedCell && addTableColumn(obj.id, selectedCell.col)}>
        <Plus className="w-4 h-4 mr-2" /> Insert Column Right
      </ContextMenuItem>
      <ContextMenuItem onClick={() => selectedCell && addTableColumn(obj.id, selectedCell.col - 1)}>
        <Plus className="w-4 h-4 mr-2" /> Insert Column Left
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => selectedCell && deleteTableRow(obj.id, selectedCell.row)}
        disabled={tp.rows <= 1}
        className="text-red-600"
      >
        <Trash2 className="w-4 h-4 mr-2" /> Delete Row
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => selectedCell && deleteTableColumn(obj.id, selectedCell.col)}
        disabled={tp.columns <= 1}
        className="text-red-600"
      >
        <Trash2 className="w-4 h-4 mr-2" /> Delete Column
      </ContextMenuItem>
      <ContextMenuSeparator />
      {canMerge && (
        <ContextMenuItem onClick={() => {
          if (!selectedCell || !selectionEnd) return;
          const r1 = Math.min(selectedCell.row, selectionEnd.row);
          const r2 = Math.max(selectedCell.row, selectionEnd.row);
          const c1 = Math.min(selectedCell.col, selectionEnd.col);
          const c2 = Math.max(selectedCell.col, selectionEnd.col);
          mergeCells(obj.id, r1, c1, r2, c2);
        }}>
          <Merge className="w-4 h-4 mr-2" /> Merge Cells
        </ContextMenuItem>
      )}
      {canUnmerge && (
        <ContextMenuItem onClick={() => selectedCell && unmergeCells(obj.id, selectedCell.row, selectedCell.col)}>
          <Split className="w-4 h-4 mr-2" /> Unmerge Cells
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ArrowUpAZ className="w-4 h-4 mr-2" /> Sort Column
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={() => selectedCell && sortTableColumn(obj.id, selectedCell.col, true)}>
            <ArrowUpAZ className="w-4 h-4 mr-2" /> Ascending (A-Z)
          </ContextMenuItem>
          <ContextMenuItem onClick={() => selectedCell && sortTableColumn(obj.id, selectedCell.col, false)}>
            <ArrowDownAZ className="w-4 h-4 mr-2" /> Descending (Z-A)
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Bold className="w-4 h-4 mr-2" /> Format
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={() => {
            const cell = selectedCell ? cells[selectedCell.row]?.[selectedCell.col] : null;
            formatSelectedCells({ fontWeight: cell?.fontWeight === 700 ? 400 : 700 });
          }}>
            <Bold className="w-4 h-4 mr-2" /> Toggle Bold
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            const cell = selectedCell ? cells[selectedCell.row]?.[selectedCell.col] : null;
            formatSelectedCells({ fontStyle: cell?.fontStyle === 'italic' ? 'normal' : 'italic' });
          }}>
            <Italic className="w-4 h-4 mr-2" /> Toggle Italic
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => formatSelectedCells({ textAlign: 'left' })}>
            <AlignLeft className="w-4 h-4 mr-2" /> Align Left
          </ContextMenuItem>
          <ContextMenuItem onClick={() => formatSelectedCells({ textAlign: 'center' })}>
            <AlignCenter className="w-4 h-4 mr-2" /> Align Center
          </ContextMenuItem>
          <ContextMenuItem onClick={() => formatSelectedCells({ textAlign: 'right' })}>
            <AlignRight className="w-4 h-4 mr-2" /> Align Right
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="w-full h-full overflow-hidden"
          onKeyDown={handleKeyDown}
          onCopy={handleCopy}
          onPaste={handlePaste}
          tabIndex={isEditing ? 0 : -1}
          style={{ outline: 'none' }}
        >
          <table
            className="border-collapse w-full h-full table-fixed"
            style={{ tableLayout: 'fixed' }}
          >
            <colgroup>
              {tp.columnWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <tbody>
              {cells.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ height: tp.rowHeights[rowIdx] }}>
                  {row.map((cell, colIdx) => renderCell(cell, rowIdx, colIdx))}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Resize handles */}
          {isEditing && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {/* Column resize handles */}
              {tp.columnWidths.reduce((acc: { left: number; handles: React.ReactNode[] }, w, i) => {
                const left = acc.left + w;
                acc.handles.push(
                  <div
                    key={`col-${i}`}
                    className="absolute top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 pointer-events-auto z-10"
                    style={{ left: left - 3 }}
                    onMouseDown={(e) => handleColResizeStart(e, i)}
                  />
                );
                return { left, handles: acc.handles };
              }, { left: 0, handles: [] }).handles}
              
              {/* Row resize handles */}
              {tp.rowHeights.reduce((acc: { top: number; handles: React.ReactNode[] }, h, i) => {
                const top = acc.top + h;
                acc.handles.push(
                  <div
                    key={`row-${i}`}
                    className="absolute left-0 w-full h-1.5 cursor-row-resize hover:bg-blue-400 pointer-events-auto z-10"
                    style={{ top: top - 3 }}
                    onMouseDown={(e) => handleRowResizeStart(e, i)}
                  />
                );
                return { top, handles: acc.handles };
              }, { top: 0, handles: [] }).handles}
            </div>
          )}
          {/* Column letters header (shown when editing) */}
          {isEditing && selectedCell && (
            <div
              className="absolute -top-4 left-0 flex text-[9px] text-gray-400 pointer-events-none"
              style={{ height: 14 }}
            >
              {tp.columnWidths.map((w, i) => (
                <div key={i} className="text-center" style={{ width: w }}>
                  {indexToColumn(i)}
                </div>
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      {isEditing && contextMenuContent}
    </ContextMenu>
  );
};
