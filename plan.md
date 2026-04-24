    1 # Advanced Spreadsheet Features
    2
    3 ## Objective
    4 Add "Enterprise-Grade Spreadsheet" features requested by the user, mimicking Google Slides and Microsoft Sheets functionality:
    5 1. Advanced Cell Formatting
    6 2. Formula Bar & Advanced Functions
    7 3. Data Validation & Formatting
    8 4. Drag-to-Fill (Fill Handle)
    9
   10 ## Key Files & Context
   11
   12 ### 1. `src/types/presentation.ts`
   13 - Add `dataFormat?: 'general' | 'currency' | 'percentage' | 'date';` to `TableCell`.
   14 - Add `validationType?: 'none' | 'dropdown' | 'checkbox';` to `TableCell`.
   15 - Add `validationOptions?: string[];` to `TableCell`.
   16
   17 ### 2. `src/stores/presentationStore.ts`
   18 - Add state for the active table cell to allow external components (like the Formula Bar and Toolbar) to interact with it:
   19   - `activeTableId: string | null`
   20   - `activeTableCell: { r: number, c: number } | null`
   21 - Add an action: `setActiveTableCell: (objectId: string | null, row: number | null, col: number | null) => void`.
   22 - Update `addTable` default properties to initialize new fields as needed.
   23
   24 ### 3. `src/lib/formulaEngine.ts`
   25 - Add functions: `VLOOKUP`, `CONCATENATE`, `DATE`.
   26 - Add a helper `shiftFormula(formula, rowOffset, colOffset)` to support the Drag-to-Fill feature when dragging formulas.
   27
   28 ### 4. `src/components/slides/TableFormulaBar.tsx` (NEW)
   29 - A new component that sits above the canvas.
   30 - Reads `activeTableId` and `activeTableCell` from the store.
   31 - Displays the cell reference (e.g., "A1") and an input field for the formula/content.
   32 - Two-way binding with the active cell's content/formula using `updateTableCell`.
   33
   34 ### 5. `src/components/slides/SlideToolbar.tsx` (or `PPTRibbon.tsx`)
   35 - Incorporate the new `TableFormulaBar`.
   36 - Add a "Cell Formatting" section that appears when a table cell is active:
   37   - Bold, Italic, Underline, Text Color, Background Color, Horizontal/Vertical Alignment.
   38   - Data Validation / Format dropdown (Currency, Percentage, Checkbox, Dropdown).
   39
   40 ### 6. `src/components/slides/TableRenderer.tsx`
   41 - **Cell Formatting & Data Validation:**
   42   - Render specific UI if `validationType === 'checkbox'` (clickable checkbox).
   43   - Render a `select` dropdown if `validationType === 'dropdown'`.
   44   - Format the computed value if `dataFormat` is set (e.g., using `Intl.NumberFormat`).
   45   - Apply `fontWeight`, `fontStyle`, `textDecoration`, etc., inline styles based on the `TableCell` properties.
   46 - **Drag-to-Fill:**
   47   - Add a small square (fill handle) to the bottom-right corner of the selected cell's border.
   48   - Handle mouse events (`onMouseDown`, `onMouseMove`, `onMouseUp`) on this handle to create a "fill selection" range.
   49   - On mouse up, apply the source cell's content/formatting to the filled range. If it's a formula, use `shiftFormula` to adjust references.
   50 - **Store Sync:**
   51   - When `handleCellClick` happens, call the store's `setActiveTableCell` so external components know what is selected.
   52
   53 ### 7. `src/components/slides/PropertiesPanel.tsx`
   54 - Add controls to configure `validationOptions` for a dropdown if a cell is selected and `validationType` is set to `dropdown`.
   55
   56 ## Implementation Steps
   57 1. **Types and Store:** Update `presentation.ts` and `presentationStore.ts` with the new properties and active cell state.
   58 2. **Formula Engine:** Enhance `formulaEngine.ts` with new functions and `shiftFormula`.
   59 3. **Formula Bar:** Create `TableFormulaBar.tsx` and integrate it into the layout.
   60 4. **Table Renderer Core:** Update `TableRenderer.tsx` to handle syncing active state to the store, and rendering cell formatting, number formatting,  
      checkboxes, and dropdowns.
   61 5. **Drag-to-Fill:** Add the fill handle, drag state (local to `TableRenderer`), and logic to copy/shift values.
   62 6. **Formatting Toolbar/Properties:** Add the UI controls to apply cell-specific formatting and data validation settings.
   63
   64 ## Verification & Testing
   65 - **Formula Bar:** Select a cell -> Reference and formula show up in the Formula Bar. Edit from Formula Bar updates the cell.
   66 - **Cell Formatting:** Select cell -> Apply Bold/Italic/Alignment -> Cell updates visually.
   67 - **Data Validation:** Set cell to Currency -> Type `100` -> Shows `$100.00`.
   68 - **Drag-to-Fill:** Drag the fill handle down 3 rows -> Copies the value/formula correctly.
   69 - **New Functions:** Test `VLOOKUP` and `CONCATENATE`.

   70 - **Store Sync:** Select a cell -> `activeTableCell` in the store updates.