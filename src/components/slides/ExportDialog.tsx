import React, { useState } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileText, FileType, Image as ImageIcon, Code, CheckCircle2, AlertCircle } from 'lucide-react';

type ExportTab = 'pdf' | 'pptx' | 'png' | 'html';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: ExportTab;
}

// PDF Options
type PDFQuality = 'low' | 'medium' | 'high';
type PageSize = 'slides' | 'a4' | 'letter';

// PNG Options
type PNGScale = 1 | 2 | 4;
type PNGExportScope = 'all' | 'current';

interface ExportState {
  exporting: boolean;
  progress: number;
  progressLabel: string;
  done: boolean;
  error: string | null;
}

const initialExportState: ExportState = { exporting: false, progress: 0, progressLabel: '', done: false, error: null };

interface TableCellData {
  formula?: string;
  computedValue?: string;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  fontWeight?: number;
  fontStyle?: string;
  textAlign?: string;
  verticalAlign?: string;
  backgroundColor?: string;
  borderTop?: { width?: number; color?: string };
  borderRight?: { width?: number; color?: string };
  borderBottom?: { width?: number; color?: string };
  borderLeft?: { width?: number; color?: string };
  rowSpan?: number;
  colSpan?: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange, defaultTab = 'pdf' }) => {
  const store = usePresentationStore();
  const { presentation } = store;

  // PDF options
  const [pdfQuality, setPdfQuality] = useState<PDFQuality>('medium');
  const [pdfIncludeNotes, setPdfIncludeNotes] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<PageSize>('slides');
  const [pdfLandscape, setPdfLandscape] = useState(true);

  // PPTX options
  const [pptxEmbedFonts, setPptxEmbedFonts] = useState(false);

  // PNG options
  const [pngScale, setPngScale] = useState<PNGScale>(2);
  const [pngScope, setPngScope] = useState<PNGExportScope>('all');

  // HTML options
  const [htmlNav, setHtmlNav] = useState(true);
  const [htmlFullscreen, setHtmlFullscreen] = useState(true);
  const [htmlAutoAdvance, setHtmlAutoAdvance] = useState(false);
  const [htmlAutoTiming, setHtmlAutoTiming] = useState(5);

  const [exportState, setExportState] = useState<ExportState>(initialExportState);

  const resetState = () => setExportState(initialExportState);

  const setProgress = (progress: number, progressLabel: string) =>
    setExportState(s => ({ ...s, progress, progressLabel }));

  // ─── PDF Export ───
  const handleExportPDF = async () => {
    setExportState({ exporting: true, progress: 0, progressLabel: 'Initializing...', done: false, error: null });
    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');

      const dpiMap: Record<PDFQuality, number> = { low: 1, medium: 2, high: 3 };
      const pixelRatio = dpiMap[pdfQuality];

      const pageFormats: Record<PageSize, [number, number]> = {
        slides: [960, 540],
        a4: pdfLandscape ? [841.89, 595.28] : [595.28, 841.89],
        letter: pdfLandscape ? [792, 612] : [612, 792],
      };
      const [pw, ph] = pageFormats[pdfPageSize];
      const orientation = pdfLandscape ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [pw, ph] });

      const st = usePresentationStore.getState();
      const origIdx = st.currentSlideIndex;
      const total = presentation.slides.length;

      for (let i = 0; i < total; i++) {
        setProgress(Math.round(((i) / total) * 90), `Rendering slide ${i + 1} of ${total}...`);
        st.setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 300));
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio });
        if (i > 0) pdf.addPage([pw, ph], orientation);

        // Fit slide image into page
        const slideRatio = 960 / 540;
        const pageRatio = pw / ph;
        let iw: number, ih: number, ix: number, iy: number;
        if (slideRatio > pageRatio) {
          iw = pw; ih = pw / slideRatio; ix = 0; iy = (ph - ih) / 2;
        } else {
          ih = ph; iw = ph * slideRatio; iy = 0; ix = (pw - iw) / 2;
        }
        pdf.addImage(dataUrl, 'PNG', ix, iy, iw, ih);

        // Notes
        if (pdfIncludeNotes && presentation.slides[i].notes) {
          pdf.setFontSize(9);
          pdf.setTextColor(100);
          const noteY = iy + ih + 10;
          if (noteY < ph - 20) {
            pdf.text(presentation.slides[i].notes, ix + 10, noteY, { maxWidth: iw - 20 });
          }
        }
      }
      st.setCurrentSlide(origIdx);
      setProgress(95, 'Saving file...');
      pdf.save(`${presentation.name}.pdf`);
      setExportState(s => ({ ...s, exporting: false, done: true, progress: 100, progressLabel: 'Done!' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF export failed';
      setExportState(s => ({ ...s, exporting: false, error: message }));
    }
  };

  // ─── PPTX Export ───
  const handleExportPPTX = async () => {
    setExportState({ exporting: true, progress: 0, progressLabel: 'Initializing...', done: false, error: null });
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.title = presentation.name;
      pptx.layout = 'LAYOUT_16x9';

      const total = presentation.slides.length;
      for (let i = 0; i < total; i++) {
        setProgress(Math.round(((i) / total) * 80), `Processing slide ${i + 1} of ${total}...`);
        const slide = presentation.slides[i];
        const pSlide = pptx.addSlide();

        // Background
        if (slide.background.type === 'color') {
          pSlide.background = { color: slide.background.value.replace('#', '') };
        } else if (slide.background.type === 'gradient' && slide.background.gradient) {
          // pptxgenjs doesn't support gradient backgrounds natively well, use first stop color
          const firstColor = slide.background.gradient.stops[0]?.color || '#ffffff';
          pSlide.background = { color: firstColor.replace('#', '') };
        }

        // Notes
        if (slide.notes) {
          pSlide.addNotes(slide.notes);
        }

        for (const obj of slide.objects) {
          const xInch = obj.position.x / 960 * 10;
          const yInch = obj.position.y / 540 * 7.5;
          const wInch = obj.size.width / 960 * 10;
          const hInch = obj.size.height / 540 * 7.5;

          if (obj.type === 'text' && obj.textProps) {
            pSlide.addText(obj.textProps.content, {
              x: xInch, y: yInch, w: wInch, h: hInch,
              fontSize: Math.round(obj.textProps.fontSize * 0.75),
              fontFace: obj.textProps.fontFamily,
              color: obj.textProps.color.replace('#', ''),
              bold: obj.textProps.fontWeight >= 600,
              italic: obj.textProps.fontStyle === 'italic',
              underline: { style: obj.textProps.textDecoration === 'underline' ? 'sng' : 'none' } as any,
              align: obj.textProps.textAlign === 'justify' ? 'left' : obj.textProps.textAlign as any,
              valign: 'middle',
              rotate: obj.rotation || 0,
            });
          }

          if (obj.type === 'shape' && obj.shapeProps) {
            const shapeMap: Record<string, string> = {
              rectangle: 'rect', 'rounded-rectangle': 'roundRect', circle: 'ellipse',
              triangle: 'triangle', diamond: 'diamond', star: 'star5',
              pentagon: 'pentagon', hexagon: 'hexagon', octagon: 'octagon',
              arrow: 'rightArrow', 'arrow-left': 'leftArrow', 'arrow-up': 'upArrow', 'arrow-down': 'downArrow',
              heart: 'heart', cloud: 'cloud',
            };
            pSlide.addShape(shapeMap[obj.shapeProps.shapeType] as any || 'rect', {
              x: xInch, y: yInch, w: wInch, h: hInch,
              fill: { color: obj.shapeProps.fill.replace('#', '') },
              line: obj.shapeProps.strokeWidth > 0 ? {
                color: obj.shapeProps.stroke.replace('#', ''),
                width: obj.shapeProps.strokeWidth,
                dashType: obj.shapeProps.strokeStyle === 'dashed' ? 'dash' : obj.shapeProps.strokeStyle === 'dotted' ? 'sysDot' : 'solid',
              } : undefined,
              rotate: obj.rotation || 0,
            });
          }

          if (obj.type === 'image' && obj.imageProps) {
            try {
              pSlide.addImage({
                data: obj.imageProps.src,
                x: xInch, y: yInch, w: wInch, h: hInch,
                rotate: obj.rotation || 0,
              });
            } catch {
              // Skip images that can't be embedded
            }
          }

          if (obj.type === 'table' && obj.tableProps) {
            const tp = obj.tableProps;
            const tableRows: any[][] = tp.cells.map((row: any[]) =>
              row.map((cell: any) => ({
                text: cell.formula ? (cell.computedValue || cell.content) : cell.content,
                options: {
                  fontSize: Math.round(cell.fontSize * 0.75),
                  fontFace: cell.fontFamily,
                  color: cell.textColor.replace('#', ''),
                  bold: cell.fontWeight >= 600,
                  italic: cell.fontStyle === 'italic',
                  align: cell.textAlign as any,
                  valign: cell.verticalAlign as any,
                  fill: { color: cell.backgroundColor.replace('#', '') },
                  border: [
                    { type: 'solid' as any, pt: cell.borderTop?.width || 1, color: (cell.borderTop?.color || '#d1d5db').replace('#', '') },
                    { type: 'solid' as any, pt: cell.borderRight?.width || 1, color: (cell.borderRight?.color || '#d1d5db').replace('#', '') },
                    { type: 'solid' as any, pt: cell.borderBottom?.width || 1, color: (cell.borderBottom?.color || '#d1d5db').replace('#', '') },
                    { type: 'solid' as any, pt: cell.borderLeft?.width || 1, color: (cell.borderLeft?.color || '#d1d5db').replace('#', '') },
                  ],
                  rowspan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
                  colspan: cell.colSpan > 1 ? cell.colSpan : undefined,
                },
              }))
            );
            try {
              const colW = tp.columnWidths.map((w: number) => w / 960 * 10);
              pSlide.addTable(tableRows, {
                x: xInch, y: yInch, w: wInch,
                colW,
                rowH: tp.rowHeights.map((h: number) => h / 540 * 7.5),
                autoPage: false,
              });
            } catch {
              // Skip tables that fail to render
            }
          }
        }
      }

      setProgress(90, 'Generating PPTX file...');
      await pptx.writeFile({ fileName: `${presentation.name}.pptx` });
      setExportState(s => ({ ...s, exporting: false, done: true, progress: 100, progressLabel: 'Done!' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PPTX export failed';
      setExportState(s => ({ ...s, exporting: false, error: message }));
    }
  };

  // ─── PNG Export ───
  const handleExportPNG = async () => {
    setExportState({ exporting: true, progress: 0, progressLabel: 'Initializing...', done: false, error: null });
    try {
      const { toPng } = await import('html-to-image');
      const st = usePresentationStore.getState();
      const origIdx = st.currentSlideIndex;

      if (pngScope === 'current') {
        setProgress(30, 'Rendering current slide...');
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) throw new Error('Slide element not found');
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: pngScale });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${presentation.name}-slide-${st.currentSlideIndex + 1}.png`;
        a.click();
      } else {
        // Multiple slides → ZIP
        const JSZip = (await import('jszip')).default;
        const { saveAs } = await import('file-saver');
        const zip = new JSZip();
        const total = presentation.slides.length;

        for (let i = 0; i < total; i++) {
          setProgress(Math.round(((i) / total) * 85), `Rendering slide ${i + 1} of ${total}...`);
          st.setCurrentSlide(i);
          await new Promise(r => setTimeout(r, 300));
          const el = document.querySelector('[data-slide-export]') as HTMLElement;
          if (!el) continue;
          const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: pngScale });
          const resp = await fetch(dataUrl);
          const blob = await resp.blob();
          zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob);
        }

        st.setCurrentSlide(origIdx);
        setProgress(90, 'Creating ZIP archive...');
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${presentation.name}-slides.zip`);
      }

      setExportState(s => ({ ...s, exporting: false, done: true, progress: 100, progressLabel: 'Done!' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PNG export failed';
      setExportState(s => ({ ...s, exporting: false, error: message }));
    }
  };

  // ─── HTML Export ───
  const handleExportHTML = async () => {
    setExportState({ exporting: true, progress: 0, progressLabel: 'Generating HTML...', done: false, error: null });
    try {
      const { toPng } = await import('html-to-image');
      const st = usePresentationStore.getState();
      const origIdx = st.currentSlideIndex;
      const total = presentation.slides.length;
      const slideImages: string[] = [];

      for (let i = 0; i < total; i++) {
        setProgress(Math.round(((i) / total) * 80), `Rendering slide ${i + 1} of ${total}...`);
        st.setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 300));
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: 2 });
        slideImages.push(dataUrl);
      }
      st.setCurrentSlide(origIdx);

      setProgress(85, 'Building HTML file...');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${presentation.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:system-ui,sans-serif;user-select:none}
#container{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;position:relative}
.slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.5s ease;pointer-events:none}
.slide.active{opacity:1;pointer-events:auto}
.slide img{max-width:100%;max-height:100%;object-fit:contain}
${htmlNav ? `
#nav{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;background:rgba(0,0,0,0.6);padding:8px 16px;border-radius:99px;opacity:0;transition:opacity 0.3s}
#container:hover #nav{opacity:1}
#nav button{background:rgba(255,255,255,0.2);border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px}
#nav button:hover{background:rgba(255,255,255,0.3)}
#nav .counter{color:rgba(255,255,255,0.7);font-size:13px;display:flex;align-items:center;padding:0 8px}
` : ''}
${htmlFullscreen ? `
#fs-btn{position:fixed;top:16px;right:16px;background:rgba(0,0,0,0.5);border:none;color:#fff;padding:8px 12px;border-radius:6px;cursor:pointer;z-index:10;font-size:13px;opacity:0;transition:opacity 0.3s}
#container:hover #fs-btn{opacity:1}
` : ''}
</style>
</head>
<body>
<div id="container">
${slideImages.map((img, i) => `<div class="slide${i === 0 ? ' active' : ''}" data-idx="${i}"><img src="${img}" alt="Slide ${i + 1}"></div>`).join('\n')}
${htmlNav ? `<div id="nav"><button onclick="prev()">◀ Prev</button><span class="counter"><span id="c">1</span> / ${total}</span><button onclick="next()">Next ▶</button></div>` : ''}
${htmlFullscreen ? `<button id="fs-btn" onclick="toggleFS()">⛶ Fullscreen</button>` : ''}
</div>
<script>
let idx=0;const slides=document.querySelectorAll('.slide'),total=${total};
function show(n){idx=Math.max(0,Math.min(total-1,n));slides.forEach((s,i)=>{s.classList.toggle('active',i===idx)});const c=document.getElementById('c');if(c)c.textContent=idx+1}
function next(){show(idx+1)}function prev(){show(idx-1)}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')next();if(e.key==='ArrowLeft')prev();if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen()});
document.addEventListener('click',e=>{if(!e.target.closest('#nav')&&!e.target.closest('#fs-btn'))next()});
${htmlFullscreen ? `function toggleFS(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}` : ''}
${htmlAutoAdvance ? `setInterval(next,${htmlAutoTiming * 1000})` : ''}
</script>
</body>
</html>`;

      setProgress(95, 'Downloading...');
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.name}.html`;
      a.click();
      URL.revokeObjectURL(url);

      setExportState(s => ({ ...s, exporting: false, done: true, progress: 100, progressLabel: 'Done!' }));
    } catch (err: any) {
      setExportState(s => ({ ...s, exporting: false, error: err?.message || 'HTML export failed' }));
    }
  };

  const selectClass = "w-full h-8 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-xs px-2";
  const labelClass = "text-xs font-medium text-[hsl(var(--foreground))]";
  const checkClass = "w-4 h-4 accent-[hsl(var(--primary))]";
  const btnPrimary = "w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!exportState.exporting) { onOpenChange(v); resetState(); } }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Export Presentation</DialogTitle>
        </DialogHeader>

        {/* Progress overlay */}
        {(exportState.exporting || exportState.done || exportState.error) && (
          <div className="px-5 pb-5">
            <div className="rounded-lg border border-[hsl(var(--border))] p-5 space-y-3">
              {exportState.exporting && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[hsl(var(--foreground))]">{exportState.progressLabel}</span>
                  </div>
                  <Progress value={exportState.progress} className="h-2" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{exportState.progress}% complete</p>
                </>
              )}
              {exportState.done && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Export complete!</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Your file has been downloaded.</p>
                  </div>
                </div>
              )}
              {exportState.error && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-500">Export failed</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{exportState.error}</p>
                  </div>
                </div>
              )}
              {(exportState.done || exportState.error) && (
                <button onClick={resetState} className="text-xs text-[hsl(var(--primary))] hover:underline">
                  ← Back to options
                </button>
              )}
            </div>
          </div>
        )}

        {/* Export tabs */}
        {!exportState.exporting && !exportState.done && !exportState.error && (
          <Tabs defaultValue={defaultTab} className="px-5 pb-5">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="pdf" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />PDF</TabsTrigger>
              <TabsTrigger value="pptx" className="text-xs gap-1"><FileType className="w-3.5 h-3.5" />PPTX</TabsTrigger>
              <TabsTrigger value="png" className="text-xs gap-1"><ImageIcon className="w-3.5 h-3.5" />PNG</TabsTrigger>
              <TabsTrigger value="html" className="text-xs gap-1"><Code className="w-3.5 h-3.5" />HTML</TabsTrigger>
            </TabsList>

            {/* ── PDF ── */}
            <TabsContent value="pdf" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Quality</label>
                  <select className={selectClass} value={pdfQuality} onChange={e => setPdfQuality(e.target.value as PDFQuality)}>
                    <option value="low">Low (72 DPI)</option>
                    <option value="medium">Medium (150 DPI)</option>
                    <option value="high">High (300 DPI)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Page Size</label>
                  <select className={selectClass} value={pdfPageSize} onChange={e => setPdfPageSize(e.target.value as PageSize)}>
                    <option value="slides">Same as Slides</option>
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Orientation</label>
                  <select className={selectClass} value={pdfLandscape ? 'landscape' : 'portrait'} onChange={e => setPdfLandscape(e.target.value === 'landscape')}>
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="pdf-notes" className={checkClass} checked={pdfIncludeNotes} onChange={e => setPdfIncludeNotes(e.target.checked)} />
                  <label htmlFor="pdf-notes" className="text-xs text-[hsl(var(--foreground))]">Include notes</label>
                </div>
              </div>
              <div className="pt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {presentation.slides.length} slide{presentation.slides.length > 1 ? 's' : ''} will be exported
              </div>
              <button className={btnPrimary} onClick={handleExportPDF}>Export as PDF</button>
            </TabsContent>

            {/* ── PPTX ── */}
            <TabsContent value="pptx" className="space-y-4 mt-4">
              <div className="space-y-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Export as PowerPoint format. Text, shapes, and images will be converted to native PPTX objects.
                </p>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pptx-fonts" className={checkClass} checked={pptxEmbedFonts} onChange={e => setPptxEmbedFonts(e.target.checked)} />
                  <label htmlFor="pptx-fonts" className="text-xs text-[hsl(var(--foreground))]">Include speaker notes</label>
                </div>
              </div>
              <div className="pt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {presentation.slides.length} slide{presentation.slides.length > 1 ? 's' : ''} • Backgrounds, text, shapes, and images will be exported
              </div>
              <button className={btnPrimary} onClick={handleExportPPTX}>Export as PPTX</button>
            </TabsContent>

            {/* ── PNG ── */}
            <TabsContent value="png" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Quality</label>
                  <select className={selectClass} value={pngScale} onChange={e => setPngScale(Number(e.target.value) as PNGScale)}>
                    <option value={1}>Standard (1x)</option>
                    <option value={2}>High (2x)</option>
                    <option value={4}>Ultra (4x)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Export</label>
                  <select className={selectClass} value={pngScope} onChange={e => setPngScope(e.target.value as PNGExportScope)}>
                    <option value="current">Current Slide</option>
                    <option value="all">All Slides (ZIP)</option>
                  </select>
                </div>
              </div>
              <div className="pt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {pngScope === 'current' ? '1 image will be downloaded' : `${presentation.slides.length} images will be archived as ZIP`}
                {' • '}Resolution: {960 * pngScale} × {540 * pngScale}px
              </div>
              <button className={btnPrimary} onClick={handleExportPNG}>Export as PNG</button>
            </TabsContent>

            {/* ── HTML ── */}
            <TabsContent value="html" className="space-y-4 mt-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Export as a standalone HTML file that can be opened in any browser. Slides are rendered as images with keyboard and click navigation.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="html-nav" className={checkClass} checked={htmlNav} onChange={e => setHtmlNav(e.target.checked)} />
                  <label htmlFor="html-nav" className="text-xs text-[hsl(var(--foreground))]">Include navigation controls</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="html-fs" className={checkClass} checked={htmlFullscreen} onChange={e => setHtmlFullscreen(e.target.checked)} />
                  <label htmlFor="html-fs" className="text-xs text-[hsl(var(--foreground))]">Fullscreen button</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="html-auto" className={checkClass} checked={htmlAutoAdvance} onChange={e => setHtmlAutoAdvance(e.target.checked)} />
                  <label htmlFor="html-auto" className="text-xs text-[hsl(var(--foreground))]">Auto-advance slides</label>
                </div>
                {htmlAutoAdvance && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Every</span>
                    <input
                      type="number" min={1} max={60} value={htmlAutoTiming}
                      onChange={e => setHtmlAutoTiming(Number(e.target.value))}
                      className="w-14 h-7 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs text-center text-[hsl(var(--foreground))]"
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">seconds</span>
                  </div>
                )}
              </div>
              <button className={btnPrimary} onClick={handleExportHTML}>Export as HTML</button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
