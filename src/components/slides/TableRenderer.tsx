import React, { useState, useEffect, useRef, useMemo, KeyboardEvent, useCallback } from 'react';
import { SlideObject, TableCell, TableProperties, CellBorder } from '@/types/presentation';
import { usePresentationStore } from '@/stores/presentationStore';
import { evaluateFormula } from '@/lib/formulaEngine';
import { Settings, Plus, Trash, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';

interface TableRendererProps {
  obj: SlideObject;
  isEditing: boolean;
  slideIndex: number;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ obj, isEditing, slideIndex }) => {
  const { tableProps } = obj;
  const updateTableCell = usePresentationStore((state) => state.updateTableCell);
  const addTableRow = usePresentationStore((state) => state.addTableRow);
  const deleteTableRow = usePresentationStore((state) => state.deleteTableRow);
  const addTableColumn = usePresentationStore((state) => state.addTableColumn);
  const deleteTableColumn = usePresentationStore((state) => state.deleteTableColumn);
  const mergeCells = usePresentationStore((state) => state.mergeCells);
  const unmergeCells = usePresentationStore((state) => state.unmergeCells);
  const sortTableColumn = usePresentationStore((state) => state.sortTableColumn);
  const resizeObject = usePresentationStore((state) => state.resizeObject);

  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      // Move cursor to end
      const length = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(length, length);
    }
  }, [editingCell]);

  const commitEdit = useCallback(() => {
    if (editingCell) {
      const { r, c } = editingCell;
      const val = editValue;
      const updates: Partial<TableCell> = val.startsWith('=') 
        ? { content: val, formula: val }
        : { content: val, formula: undefined };
      
      updateTableCell(slideIndex, obj.id, r, c, updates);
      setEditingCell(null);
    }
  }, [editingCell, editValue, slideIndex, obj.id, updateTableCell]);

  // Cancel editing when object is no longer selected
  useEffect(() => {
    if (!isEditing) {
      commitEdit();
      setSelectedCell(null);
    }
  }, [isEditing, commitEdit]);

  const cells = tableProps?.cells || [];

  // Computed values
  const getCellValue = useCallback((r: number, c: number) => {
    if (!cells[r] || !cells[r][c]) return undefined;
    const content = cells[r][c].content;
    const num = Number(content);
    return isNaN(num) ? content : num;
  }, [cells]);

  const computedCells = useMemo(() => {
    return cells.map((row, ri) =>
      row.map((cell, ci) => {
        if (cell.formula || (cell.content && cell.content.startsWith('='))) {
          const formula = cell.formula || cell.content;
          return {
            ...cell,
            computedValue: String(evaluateFormula(formula, getCellValue))
          };
        }
        return cell;
      })
    );
  }, [cells, getCellValue]);

  if (!tableProps) return null;

  const { columnWidths, rowHeights, headerRow, bandedRows, bandedRowColor } = tableProps;

  const handleCellDoubleClick = (r: number, c: number) => {
    if (!isEditing) return;
    const cell = cells[r][c];
    setEditingCell({ r, c });
    setEditValue(cell.formula || cell.content);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!isEditing) return;
    if (editingCell && (editingCell.r !== r || editingCell.c !== c)) {
      commitEdit();
    }
    setSelectedCell({ r, c });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isEditing) return;
    
    if (editingCell) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
        if (editingCell.r + 1 < cells.length) {
          setSelectedCell({ r: editingCell.r + 1, c: editingCell.c });
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        if (editingCell.c + 1 < cells[0].length) {
          setSelectedCell({ r: editingCell.r, c: editingCell.c + 1 });
        }
      }
      return;
    }

    if (selectedCell) {
      const { r, c } = selectedCell;
      if (e.key === 'ArrowUp' && r > 0) setSelectedCell({ r: r - 1, c });
      else if (e.key === 'ArrowDown' && r < cells.length - 1) setSelectedCell({ r: r + 1, c });
      else if (e.key === 'ArrowLeft' && c > 0) setSelectedCell({ r, c: c - 1 });
      else if (e.key === 'ArrowRight' && c < cells[0].length - 1) setSelectedCell({ r, c: c + 1 });
      else if (e.key === 'Enter') handleCellDoubleClick(r, c);
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setEditingCell({ r, c });
        setEditValue(e.key);
      }
    }
  };

  const renderCellBorder = (border: CellBorder) => {
    if (!border || border.style === 'none' || border.width === 0) return 'none';
    return `${border.width}px ${border.style} ${border.color}`;
  };

  return (
    <div
      className="w-full h-full relative"
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? 0 : -1}
      style={{ outline: 'none' }}
    >
      <table 
        style={{ 
          width: '100%', 
          height: '100%', 
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          {columnWidths.map((w, i) => (
            <col key={i} style={{ width: `${w}px` }} />
          ))}
        </colgroup>
        <tbody>
          {computedCells.map((row, ri) => {
            const isHeader = headerRow && ri === 0;
            const isBanded = bandedRows && !isHeader && ri % 2 === 1;

            return (
              <tr key={ri} style={{ height: `${rowHeights[ri] || 36}px` }}>
                {row.map((cell, ci) => {
                  if (cell.merged && cell.colSpan === 1 && cell.rowSpan === 1) return null; // Skip merged cells that are covered

                  const isSelected = selectedCell?.r === ri && selectedCell?.c === ci;
                  const isEditingThisCell = editingCell?.r === ri && editingCell?.c === ci;

                  let bgColor = cell.backgroundColor;
                  if (isBanded && bgColor === '#ffffff') bgColor = bandedRowColor;

                  return (
                    <ContextMenu key={`${ri}-${ci}`}>
                      <ContextMenuTrigger asChild>
                        <td
                          rowSpan={cell.rowSpan}
                          colSpan={cell.colSpan}
                          onClick={() => handleCellClick(ri, ci)}
                          onDoubleClick={() => handleCellDoubleClick(ri, ci)}
                          style={{
                            backgroundColor: bgColor,
                            fontFamily: cell.fontFamily,
                            fontSize: `${cell.fontSize}px`,
                            fontWeight: cell.fontWeight,
                            fontStyle: cell.fontStyle,
                            textDecoration: cell.textDecoration,
                            color: cell.textColor,
                            textAlign: cell.textAlign,
                            verticalAlign: cell.verticalAlign,
                            borderTop: renderCellBorder(cell.borderTop),
                            borderRight: renderCellBorder(cell.borderRight),
                            borderBottom: renderCellBorder(cell.borderBottom),
                            borderLeft: renderCellBorder(cell.borderLeft),
                            padding: '4px 8px',
                            position: 'relative',
                            userSelect: 'none',
                            outline: isSelected ? '2px solid #3b82f6' : 'none',
                            outlineOffset: '-2px',
                            zIndex: isSelected ? 10 : 1,
                            overflow: 'hidden',
                          }}
                        >
                          {isEditingThisCell ? (
                            <textarea
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '1.5em',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                color: 'inherit',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                fontStyle: 'inherit',
                                textAlign: 'inherit',
                                margin: 0,
                                padding: 0,
                                overflow: 'hidden'
                              }}
                            />
                          ) : (
                            <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {cell.computedValue || cell.content}
                            </div>
                          )}
                        </td>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => addTableRow(obj.id, ri - 1)}>
                          <ArrowUp className="mr-2 h-4 w-4" /> Insert Row Above
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => addTableRow(obj.id, ri)}>
                          <ArrowDown className="mr-2 h-4 w-4" /> Insert Row Below
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => addTableColumn(obj.id, ci - 1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Insert Column Left
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => addTableColumn(obj.id, ci)}>
                          <ArrowRight className="mr-2 h-4 w-4" /> Insert Column Right
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => deleteTableRow(obj.id, ri)} disabled={cells.length <= 1}>
                          <Trash className="mr-2 h-4 w-4" /> Delete Row
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => deleteTableColumn(obj.id, ci)} disabled={cells[0].length <= 1}>
                          <Trash className="mr-2 h-4 w-4" /> Delete Column
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => sortTableColumn(obj.id, ci, true)}>
                          Sort Ascending
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => sortTableColumn(obj.id, ci, false)}>
                          Sort Descending
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
