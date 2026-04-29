import React, { useState } from 'react';
import { useMasterSlideStore } from '@/stores/masterSlideStore';
import { v4 as uuidv4 } from 'uuid';
import type { MasterPlaceholder, PlaceholderType } from '@/types/presentation';
import {
  X, Plus, Type, Image, Hash, AlignLeft, Trash2,
  Download, Upload, Edit3, LayoutGrid,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type PlaceholderAlign = 'left' | 'center' | 'right';

const PLACEHOLDER_TYPES: { type: PlaceholderType; label: string; icon: React.ReactNode }[] = [
  { type: 'title', label: 'Title', icon: <Type className="w-3.5 h-3.5" /> },
  { type: 'subtitle', label: 'Subtitle', icon: <Type className="w-3 h-3" /> },
  { type: 'content', label: 'Content', icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { type: 'footer', label: 'Footer', icon: <Type className="w-3 h-3" /> },
  { type: 'number', label: 'Slide #', icon: <Hash className="w-3.5 h-3.5" /> },
  { type: 'image', label: 'Image', icon: <Image className="w-3.5 h-3.5" /> },
  { type: 'caption', label: 'Caption', icon: <Type className="w-3 h-3" /> },
];

const PLACEHOLDER_COLORS: Record<PlaceholderType, string> = {
  title: '#3b82f6',
  subtitle: '#8b5cf6',
  content: '#22c55e',
  footer: '#f59e0b',
  number: '#ef4444',
  image: '#06b6d4',
  caption: '#ec4899',
};

interface MasterSlideEditorProps {
  onClose: () => void;
}

export const MasterSlideEditor: React.FC<MasterSlideEditorProps> = ({ onClose }) => {
  const store = useMasterSlideStore();
  const master = store.getActiveMaster();
  const layout = master.layouts[store.editingLayoutIndex];
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState(master.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addPlaceholder = (type: PlaceholderType) => {
    const ph: MasterPlaceholder = {
      id: uuidv4(),
      type,
      x: 100,
      y: 100,
      width: type === 'number' ? 60 : type === 'footer' ? 300 : 400,
      height: type === 'number' ? 25 : type === 'footer' ? 25 : type === 'title' ? 60 : 200,
      defaultText: type === 'number' ? '#' : `Click to add ${type}`,
      fontSize: type === 'title' ? 36 : type === 'subtitle' ? 22 : type === 'footer' || type === 'number' ? 11 : 18,
      fontFamily: master.fontFamily,
      color: type === 'footer' || type === 'number' ? '#9ca3af' : '#1f2937',
      align: type === 'title' || type === 'subtitle' || type === 'number' ? 'center' : 'left',
      fontWeight: type === 'title' ? 700 : 400,
    };
    store.addPlaceholder(master.id, layout.id, ph);
    setSelectedPlaceholder(ph.id);
  };

  const handleExport = () => {
    const json = store.exportMaster(master.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${master.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      store.importMaster(json);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selPh = layout?.placeholders.find(p => p.id === selectedPlaceholder);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[hsl(var(--ppt-ribbon-bg))]">
      {/* Header bar */}
      <div className="h-8 bg-[hsl(var(--ppt-brand))] flex items-center px-3 gap-2">
        <LayoutGrid className="w-3.5 h-3.5 text-white" />
        <span className="text-xs text-white font-medium">Master Slide Editor</span>
        {isRenaming ? (
          <div className="flex items-center gap-1 ml-2">
            <input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { store.renameMaster(master.id, renameInput); setIsRenaming(false); } }}
              onBlur={() => { store.renameMaster(master.id, renameInput); setIsRenaming(false); }}
              className="bg-white/20 rounded px-2 py-0.5 text-[11px] text-white outline-none border border-white/40 w-36"
              autoFocus
            />
          </div>
        ) : (
          <button onClick={() => { setRenameInput(master.name); setIsRenaming(true); }}
            className="text-[11px] text-white/80 hover:text-white ml-2 flex items-center gap-1">
            {master.name} <Edit3 className="w-2.5 h-2.5" />
          </button>
        )}
        <div className="flex-1" />
        <button onClick={handleExport} className="p-1 rounded hover:bg-white/20" title="Export Master">
          <Download className="w-3 h-3 text-white" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded hover:bg-white/20" title="Import Master">
          <Upload className="w-3 h-3 text-white" />
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20" title="Close Master Editor">
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - layouts list */}
        <div className="w-48 border-r border-[hsl(var(--border))] bg-[hsl(var(--ppt-slide-panel-bg))] flex flex-col">
          <div className="px-2 py-1.5 border-b border-[hsl(var(--border))]">
            <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Layouts</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {master.layouts.map((l, idx) => (
                <button
                  key={l.id}
                  onClick={() => { store.setEditingLayoutIndex(idx); setSelectedPlaceholder(null); }}
                  className={`w-full text-left rounded p-1.5 transition-colors ${
                    idx === store.editingLayoutIndex
                      ? 'bg-[hsl(var(--ppt-active))] border border-[hsl(var(--ppt-selection))]'
                      : 'hover:bg-[hsl(var(--ppt-hover))] border border-transparent'
                  }`}
                >
                  {/* Mini preview */}
                  <div className="w-full aspect-[16/9] bg-white border border-[hsl(var(--border))] rounded-sm mb-1 relative overflow-hidden">
                    {l.placeholders.map(p => (
                      <div
                        key={p.id}
                        className="absolute border border-dashed opacity-50"
                        style={{
                          left: `${(p.x / 960) * 100}%`,
                          top: `${(p.y / 540) * 100}%`,
                          width: `${(p.width / 960) * 100}%`,
                          height: `${(p.height / 540) * 100}%`,
                          borderColor: PLACEHOLDER_COLORS[p.type],
                          backgroundColor: `${PLACEHOLDER_COLORS[p.type]}15`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[hsl(var(--foreground))]">{l.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Master selector */}
          <div className="border-t border-[hsl(var(--border))] p-2 space-y-1">
            <select
              className="ppt-select w-full text-[10px]"
              value={master.id}
              onChange={(e) => store.setActiveMaster(e.target.value)}
            >
              {store.masters.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => store.createMasterSlide()}
                className="flex-1 text-[10px] px-2 py-1 rounded bg-[hsl(var(--ppt-hover))] hover:bg-[hsl(var(--ppt-active))] text-[hsl(var(--foreground))] transition-colors"
              >
                <Plus className="w-3 h-3 inline mr-0.5" /> New
              </button>
              {store.masters.length > 1 && (
                <button
                  onClick={() => store.deleteMaster(master.id)}
                  className="text-[10px] px-2 py-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center - Canvas preview */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[hsl(var(--ppt-canvas-bg))]">
          {layout && (
            <div
              className="relative bg-white shadow-lg"
              style={{ width: 960 * 0.7, height: 540 * 0.7, transform: 'scale(1)', transformOrigin: 'center' }}
            >
              {/* Background */}
              <div className="absolute inset-0" style={{ backgroundColor: layout.background.value || '#ffffff' }} />

              {/* Placeholders */}
              {layout.placeholders.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlaceholder(p.id)}
                  className={`absolute cursor-pointer border-2 border-dashed transition-colors flex items-start justify-start p-1 ${
                    selectedPlaceholder === p.id ? 'border-[hsl(var(--ppt-selection))]' : ''
                  }`}
                  style={{
                    left: p.x * 0.7,
                    top: p.y * 0.7,
                    width: p.width * 0.7,
                    height: p.height * 0.7,
                    borderColor: selectedPlaceholder === p.id ? undefined : PLACEHOLDER_COLORS[p.type],
                    backgroundColor: `${PLACEHOLDER_COLORS[p.type]}10`,
                  }}
                >
                  <span
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: Math.max(8, p.fontSize * 0.7),
                      fontFamily: p.fontFamily,
                      fontWeight: p.fontWeight,
                      color: p.color,
                      textAlign: p.align,
                      width: '100%',
                      opacity: 0.6,
                    }}
                  >
                    {p.defaultText}
                  </span>
                  <div
                    className="absolute top-0 left-0 px-1 text-white text-[8px] font-medium"
                    style={{ backgroundColor: PLACEHOLDER_COLORS[p.type] }}
                  >
                    {p.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar - tools */}
        <div className="w-52 border-l border-[hsl(var(--border))] bg-white flex flex-col">
          <div className="px-2 py-1.5 border-b border-[hsl(var(--border))]">
            <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Add Placeholder
            </span>
          </div>
          <div className="p-2 space-y-1 border-b border-[hsl(var(--border))]">
            {PLACEHOLDER_TYPES.map(pt => (
              <button
                key={pt.type}
                onClick={() => addPlaceholder(pt.type)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--ppt-hover))] transition-colors"
              >
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${PLACEHOLDER_COLORS[pt.type]}20`, color: PLACEHOLDER_COLORS[pt.type] }}>
                  {pt.icon}
                </div>
                {pt.label}
              </button>
            ))}
          </div>

          {/* Selected placeholder properties */}
          {selPh && (
            <div className="p-2 space-y-2 flex-1 overflow-y-auto scrollbar-thin">
              <div className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Properties: {selPh.type}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Default Text</label>
                <input
                  className="ppt-input w-full text-[10px]"
                  style={{ width: '100%', height: 24 }}
                  value={selPh.defaultText}
                  onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { defaultText: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[10px] text-[hsl(var(--muted-foreground))]">X</label>
                  <input className="ppt-input w-full" type="number" value={selPh.x}
                    onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { x: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Y</label>
                  <input className="ppt-input w-full" type="number" value={selPh.y}
                    onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { y: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--muted-foreground))]">W</label>
                  <input className="ppt-input w-full" type="number" value={selPh.width}
                    onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { width: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--muted-foreground))]">H</label>
                  <input className="ppt-input w-full" type="number" value={selPh.height}
                    onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { height: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Font Size</label>
                <input className="ppt-input w-full" type="number" value={selPh.fontSize}
                  onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { fontSize: Number(e.target.value) })} />
              </div>

              <div>
                <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Font Weight</label>
                <select className="ppt-select w-full" value={selPh.fontWeight}
                  onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { fontWeight: Number(e.target.value) })}>
                  <option value={300}>Light</option>
                  <option value={400}>Regular</option>
                  <option value={600}>Semi Bold</option>
                  <option value={700}>Bold</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Color</label>
                <input type="color" className="w-full h-6 rounded cursor-pointer" value={selPh.color}
                  onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { color: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Align</label>
                <select className="ppt-select w-full" value={selPh.align}
                  onChange={(e) => store.updatePlaceholder(master.id, layout.id, selPh.id, { align: e.target.value as PlaceholderAlign })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <button
                onClick={() => { store.removePlaceholder(master.id, layout.id, selPh.id); setSelectedPlaceholder(null); }}
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Remove Placeholder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
