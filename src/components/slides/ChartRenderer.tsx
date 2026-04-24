import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { usePresentationStore } from '@/stores/presentationStore';
import type { SlideObject } from '@/types/presentation';

interface ChartRendererProps {
  object: SlideObject;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ object }) => {
  const { chartProps } = object;
  const { presentation, currentSlideIndex } = usePresentationStore();

  const chartData = useMemo(() => {
    if (!chartProps || !chartProps.sourceTableId || !chartProps.dataRange) return [];
    
    // Find the source table
    const currentSlide = presentation.slides[currentSlideIndex];
    let sourceTable = currentSlide.objects.find(o => o.id === chartProps.sourceTableId);
    
    // If not in current slide, search all slides
    if (!sourceTable) {
      for (const slide of presentation.slides) {
        sourceTable = slide.objects.find(o => o.id === chartProps.sourceTableId);
        if (sourceTable) break;
      }
    }
    
    if (!sourceTable || !sourceTable.tableProps) return [];
    
    const { cells } = sourceTable.tableProps;
    
    // Parse range, e.g. A1:B5
    const match = chartProps.dataRange.toUpperCase().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!match) return [];
    
    const getColIndex = (colStr: string) => {
      let col = 0;
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
      }
      return col - 1;
    };
    
    const startCol = getColIndex(match[1]);
    const startRow = parseInt(match[2], 10) - 1;
    const endCol = getColIndex(match[3]);
    const endRow = parseInt(match[4], 10) - 1;
    
    // Assume first column in range is the label/name, subsequent columns are data series
    // If startRow == endRow or startCol == endCol, handle 1D data
    const data: any[] = [];
    
    // Check if first row is headers
    const headers: string[] = [];
    for (let c = startCol + 1; c <= endCol; c++) {
      const cell = cells[startRow]?.[c];
      headers.push(cell ? (cell.computedValue || cell.content || `Series ${c - startCol}`) : `Series ${c - startCol}`);
    }

    for (let r = startRow + 1; r <= endRow; r++) {
      const rowData: any = {};
      const labelCell = cells[r]?.[startCol];
      rowData.name = labelCell ? (labelCell.computedValue || labelCell.content || `Row ${r + 1}`) : `Row ${r + 1}`;
      
      for (let c = startCol + 1; c <= endCol; c++) {
        const valCell = cells[r]?.[c];
        const val = parseFloat(valCell?.computedValue || valCell?.content || '0');
        rowData[headers[c - startCol - 1]] = isNaN(val) ? 0 : val;
      }
      data.push(rowData);
    }
    
    return { data, headers };
  }, [presentation, currentSlideIndex, chartProps]);

  if (!chartProps) return <div className="p-4 border border-dashed border-gray-300 text-gray-500">Invalid Chart Properties</div>;

  const { type, title, showLegend, colors } = chartProps;
  const defaultColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const activeColors = colors || defaultColors;

  const renderChart = () => {
    if (!chartData || !('data' in chartData) || chartData.data.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-400">No Data</div>;
    }

    const { data, headers } = chartData as { data: any[], headers: string[] };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              {headers.map((h, i) => (
                <Bar key={h} dataKey={h} fill={activeColors[i % activeColors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              {headers.map((h, i) => (
                <Line key={h} type="monotone" dataKey={h} stroke={activeColors[i % activeColors.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        // Pie usually uses 1 data series. We'll use the first header.
        const dataKey = headers[0];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey || "value"}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      }
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col pointer-events-none p-2 shadow-sm rounded-md border border-gray-100">
      {title && <h3 className="text-center text-lg font-semibold mb-2">{title}</h3>}
      <div className="flex-1 min-h-0">
        {renderChart()}
      </div>
    </div>
  );
};
