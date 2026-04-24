 Add Enterprise-Grade Spreadsheet/Table Feature to Lade Slides Studio                                                                                        

 Context

 The user wants to embed spreadsheet/table objects inside presentation slides — similar to how PowerPoint lets you insert Excel tables. The existing app     
 supports text, shape, and image objects. We'll add a 4th object type: table, with enterprise-grade features including formula support, cell formatting,     
 sorting, merging, and proper export.

 Files to Modify

 1. src/types/presentation.ts — Add table types

 - Add 'table' to ObjectType union (line 1)
 - Add TableCell, TableColumn, TableProperties interfaces
 - Add tableProps?: TableProperties to SlideObject (line 117)

 TableCell structure:
 { id, content, formula?, computedValue?, rowSpan, colSpan, fontFamily, fontSize, fontWeight, fontStyle, textColor, backgroundColor, textAlign,
 verticalAlign, borderTop/Right/Bottom/Left: {color, width, style} }

 TableColumn structure:
 { id, width (px) }

 TableProperties structure:
 { rows, columns, cells (2D array of TableCell), columnWidths (TableColumn[]), rowHeights (number[]), headerRow, bandedRows, bandedRowColor, borderStyle,    
 defaultFontFamily, defaultFontSize }

 2. src/stores/presentationStore.ts — Add table store actions

 - Add 'table' to tool union type (line 28)
 - Add addTable: (x, y, rows, cols) => void interface + implementation
 - Add updateTableCell: (slideIndex, objectId, row, col, updates) => void
 - Add addTableRow, deleteTableRow, addTableColumn, deleteTableColumn
 - Add mergeCells, unmergeCells
 - Add sortTableColumn

 3. src/components/slides/TableRenderer.tsx — NEW: Core table renderer

 - Renders HTML table from tableProps
 - Handles cell selection state (local React state, not in global store)
 - Inline cell editing via contentEditable on double-click
 - Column resize handles (drag to resize)
 - Row resize handles
 - Tab/Enter/arrow key navigation between cells
 - Right-click context menu (add/delete row/col, merge, sort)
 - Formula display/evaluation
 - Cell range selection (shift+click, drag)
 - Copy/paste cells internally

 4. src/lib/formulaEngine.ts — NEW: Formula evaluator

 - Parse formulas starting with =
 - Cell references: A1, B2, etc. (column letter + row number)
 - Functions: SUM(), AVERAGE(), COUNT(), MIN(), MAX(), IF()
 - Range references: A1:B3
 - Basic arithmetic: +, -, *, /
 - Circular reference detection
 - Error handling: #REF!, #VALUE!, #DIV/0!, #NAME?

 5. src/components/slides/TableDimensionPicker.tsx — NEW: Grid picker UI

 - Visual grid (max 10x10) where user hovers to select dimensions
 - Shows "3 x 4 Table" label as user hovers
 - Click inserts table with selected dimensions
 - Quick preset sizes: 3x3, 4x4, 5x3

 6. src/components/slides/SlideObjectComponent.tsx — Add table rendering

 - Import TableRenderer
 - Add if (obj.type === 'table' && obj.tableProps) branch in renderContent() (after line 201)
 - Pass isEditing state and slide context to TableRenderer
 - Double-click enters table edit mode (like text editing)

 7. src/components/slides/PropertiesPanel.tsx — Add table properties editor

 - Add TablePropsEditor component after existing editors
 - Controls: header row toggle, banded rows toggle, border style selector, default font/size, colors
 - Add/remove rows/columns buttons
 - Table style presets (like PowerPoint's built-in table styles)

 8. src/components/slides/PPTRibbon.tsx — Add table button to Insert tab

 - Add "Table" ribbon group after Shapes group (after line 582)
 - Uses Grid3x3 icon from lucide-react
 - Dropdown shows TableDimensionPicker
 - Also: when a table is selected, show a contextual "Table Design" section in the ribbon

 9. src/components/slides/PPTCanvas.tsx — Handle table tool

 - Add 'table' case in handleCanvasClick (after line 35)
 - When tool is 'table', insert default 3x3 table at click position

 10. src/components/slides/ExportDialog.tsx — PPTX table export

 - Add table handling in the PPTX export loop (after line 211)
 - Use pptxgenjs's native pSlide.addTable() API
 - Convert tableProps.cells 2D array to pptxgenjs format
 - Map cell formatting (colors, fonts, borders, merge spans)

 11. src/hooks/useKeyboardShortcuts.ts — Optional table shortcuts

 - No changes needed — table keyboard handling is internal to TableRenderer

 Implementation Order

 1. Types (presentation.ts) — foundation for everything
 2. Formula engine (formulaEngine.ts) — standalone, no deps
 3. Store actions (presentationStore.ts) — CRUD operations
 4. Table renderer (TableRenderer.tsx) — core visual component
 5. Dimension picker (TableDimensionPicker.tsx) — small UI widget
 6. Integrate into SlideObjectComponent.tsx — wire up rendering
 7. Integrate into PPTCanvas.tsx — wire up insertion
 8. Integrate into PPTRibbon.tsx — wire up UI button
 9. Properties panel (PropertiesPanel.tsx) — editing controls
 10. Export support (ExportDialog.tsx) — PPTX export

 Key Design Decisions

 - Cell state is local to TableRenderer — selection, editing cursor, resize drag state are React local state, not Zustand. Only the cell data (content,      
 formatting) goes into the store.
 - Formulas compute on render — no separate computation step. computedValue is derived from formula + other cells at render time. Memoized with useMemo.     
 - Column/row resizing updates tableProps — pushHistory before resize, then update widths/heights in store.
 - Cell merging uses rowSpan/colSpan — merged cells have span > 1, spanned-over cells are marked as merged: true and skipped in rendering.

 Verification

 1. npm run build — no TypeScript errors
 2. npm run dev — start dev server on port 8080
 3. Test: Insert tab → Table → pick 4x3 → table appears on slide
 4. Test: Double-click cell → edit content → blur saves
 5. Test: Type =SUM(A1:A3) in cell → computed value shows
 6. Test: Right-click → add row/column, delete row/column
 7. Test: Select table → Properties panel shows table controls
 8. Test: Drag column border to resize
 9. Test: Export to PPTX → table renders in PowerPoint
 10. Test: Undo/redo works for all table operations
 11. Test: Copy/paste slide with table preserves data
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌