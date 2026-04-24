import React, { useState, useEffect, useRef, useMemo, KeyboardEvent, useCallback } from 'react';
import { SlideObject, TableCell, TableProperties, CellBorder } from '@/types/presentation';
import { usePresentationStore } from '@/stores/presentationStore';
import { evaluateFormula, shiftFormula } from '@/lib/formulaEngine';
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
  const setActiveTableCell = usePresentationStore((state) => state.setActiveTableCell);
  const activeTableId = usePresentationStore((state) => state.activeTableId);
  const addTableRow = usePresentationStore((state) => state.addTableRow);
  const deleteTableRow = usePresentationStore((state) => state.deleteTableRow);
  const addTableColumn = usePresentationStore((state) => state.addTableColumn);
  const deleteTableColumn = usePresentationStore((state) => state.deleteTableColumn);
  const sortTableColumn = usePresentationStore((state) => state.sortTableColumn);

  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const [dragFillTarget, setDragFillTarget] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const copyCells = usePresentationStore((state) => state.copyCells);
  const pasteCells = usePresentationStore((state) => state.pasteCells);
  const addChart = usePresentationStore((state) => state.addChart);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
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

  useEffect(() => {
    if (!isEditing) {
      commitEdit();
      setSelectedCell(null);
      if (activeTableId === obj.id) {
        setActiveTableCell(null, null, null);
      }
    }
  }, [isEditing, commitEdit, activeTableId, obj.id, setActiveTableCell]);

  // Global mouse up for drag-fill
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragFillTarget, selectedCell]);

  const cells = tableProps?.cells || [];

  const getCellValue = useCallback((r: number, c: number) => {
    if (!cells[r] || !cells[r][c]) return undefined;
    const content = cells[r][c].content;
    const num = Number(content);
    return isNaN(num) ? content : num;
  }, [cells]);

  const computedCells = useMemo(() => {
    return cells.map((row, ri) =>
      row.map((cell, ci) => {
        let computedValue = cell.content;
        if (cell.formula || (cell.content && cell.content.startsWith('='))) {
          const formula = cell.formula || cell.content;
          computedValue = String(evaluateFormula(formula, getCellValue));
        }

        // Apply Data Formatting
        if (cell.dataFormat && computedValue && !isNaN(Number(computedValue))) {
          const num = Number(computedValue);
          if (cell.dataFormat === 'currency') {
            computedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
          } else if (cell.dataFormat === 'percentage') {
            computedValue = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(num / 100);
          }
        } else if (cell.dataFormat === 'date' && computedValue) {
          const d = new Date(computedValue);
          if (!isNaN(d.getTime())) {
            computedValue = d.toLocaleDateString();
          }
        }

        return {
          ...cell,
          computedValue
        };
      })
    );
  }, [cells, getCellValue]);

  if (!tableProps) return null;

  const { columnWidths, rowHeights, headerRow, bandedRows, bandedRowColor } = tableProps;

  const handleCellClick = (r: number, c: number) => {
    if (!isEditing) return;
    if (editingCell && (editingCell.r !== r || editingCell.c !== c)) {
      commitEdit();
    }
    setSelectedCell({ r, c });
    setActiveTableCell(obj.id, r, c);
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    if (!isEditing) return;
    const cell = cells[r][c];
    if (cell.validationType === 'checkbox' || cell.validationType === 'dropdown') return;
    setEditingCell({ r, c });
    setEditValue(cell.formula || cell.content);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isEditing) return;
    
    if (editingCell) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
        if (editingCell.r + 1 < cells.length) {
          setSelectedCell({ r: editingCell.r + 1, c: editingCell.c });
          setActiveTableCell(obj.id, editingCell.r + 1, editingCell.c);
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        if (editingCell.c + 1 < cells[0].length) {
          setSelectedCell({ r: editingCell.r, c: editingCell.c + 1 });
          setActiveTableCell(obj.id, editingCell.r, editingCell.c + 1);
        }
      }
      return;
    }

    if (selectedCell) {
      const { r, c } = selectedCell;
      let newR = r;
      let newC = c;
      if (e.key === 'ArrowUp' && r > 0) newR = r - 1;
      else if (e.key === 'ArrowDown' && r < cells.length - 1) newR = r + 1;
      else if (e.key === 'ArrowLeft' && c > 0) newC = c - 1;
      else if (e.key === 'ArrowRight' && c < cells[0].length - 1) newC = c + 1;
      
      if (newR !== r || newC !== c) {
        setSelectedCell({ r: newR, c: newC });
        setActiveTableCell(obj.id, newR, newC);
      } else if (e.key === 'Enter') {
        handleCellDoubleClick(r, c);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const cell = cells[r][c];
        if (cell.validationType !== 'checkbox' && cell.validationType !== 'dropdown') {
          setEditingCell({ r, c });
          setEditValue(e.key);
        }
      }
    }
  };

  const handleDragStart = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragFillTarget({ r, c });
  };

  const handleDragMove = (e: React.MouseEvent, r: number, c: number) => {
    if (isDragging) {
      setDragFillTarget({ r, c });
    }
  };

  const handleDragEnd = () => {
    if (isDragging && selectedCell && dragFillTarget) {
      setIsDragging(false);
      const sr = selectedCell.r;
      const sc = selectedCell.c;
      const er = dragFillTarget.r;
      const ec = dragFillTarget.c;

      if (sr !== er || sc !== ec) {
        const sourceCell = cells[sr][sc];
        const minR = Math.min(sr, er);
        const maxR = Math.max(sr, er);
        const minC = Math.min(sc, ec);
        const maxC = Math.max(sc, ec);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            if (r === sr && c === sc) continue;
            
            const rOff = r - sr;
            const cOff = c - sc;
            
            const updates: Partial<TableCell> = {
              fontFamily: sourceCell.fontFamily,
              fontSize: sourceCell.fontSize,
              fontWeight: sourceCell.fontWeight,
              fontStyle: sourceCell.fontStyle,
              textDecoration: sourceCell.textDecoration,
              textColor: sourceCell.textColor,
              backgroundColor: sourceCell.backgroundColor,
              textAlign: sourceCell.textAlign,
              verticalAlign: sourceCell.verticalAlign,
              dataFormat: sourceCell.dataFormat,
              validationType: sourceCell.validationType,
              validationOptions: sourceCell.validationOptions,
            };

            if (sourceCell.formula) {
              updates.formula = shiftFormula(sourceCell.formula, rOff, cOff);
              updates.content = updates.formula;
            } else {
              updates.content = sourceCell.content;
            }
            
            updateTableCell(slideIndex, obj.id, r, c, updates);
          }
        }
      }
      setDragFillTarget(null);
    }
  };

  const renderCellBorder = (border: CellBorder) => {
    if (!border || border.style === 'none' || border.width === 0) return 'none';
    return `${border.width}px ${border.style} ${border.color}`;
  };

  const isCellInDragRange = (r: number, c: number) => {
    if (!isDragging || !selectedCell || !dragFillTarget) return false;
    const minR = Math.min(selectedCell.r, dragFillTarget.r);
    const maxR = Math.max(selectedCell.r, dragFillTarget.r);
    const minC = Math.min(selectedCell.c, dragFillTarget.c);
    const maxC = Math.max(selectedCell.c, dragFillTarget.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
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
                  if (cell.merged && cell.colSpan === 1 && cell.rowSpan === 1) return null;

                  const isSelected = selectedCell?.r === ri && selectedCell?.c === ci;
                  const isEditingThisCell = editingCell?.r === ri && editingCell?.c === ci;
                  const inDragRange = isCellInDragRange(ri, ci);

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
                          onMouseEnter={(e) => handleDragMove(e, ri, ci)}
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
                            outline: isSelected ? '2px solid #3b82f6' : (inDragRange ? '1px dashed #3b82f6' : 'none'),
                            outlineOffset: '-2px',
                            zIndex: isSelected ? 10 : (inDragRange ? 5 : 1),
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
                            <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', width: '100%', height: '100%' }}>
                              {cell.validationType === 'checkbox' ? (
                                <input 
                                  type="checkbox" 
                                  checked={cell.content === 'TRUE'}
                                  onChange={(e) => {
                                    updateTableCell(slideIndex, obj.id, ri, ci, { content: e.target.checked ? 'TRUE' : 'FALSE' });
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                              ) : cell.validationType === 'dropdown' ? (
                                <select
                                  value={cell.content}
                                  onChange={(e) => {
                                    updateTableCell(slideIndex, obj.id, ri, ci, { content: e.target.value });
                                  }}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-inherit font-inherit"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Select...</option>
                                  {(cell.validationOptions || []).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                cell.computedValue || cell.content
                              )}
                            </div>
                          )}

                          {isSelected && isEditing && (
                            <div 
                              className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 border border-white cursor-crosshair"
                              style={{ transform: 'translate(50%, 50%)', zIndex: 20 }}
                              onMouseDown={(e) => handleDragStart(e, ri, ci)}
                            />
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
