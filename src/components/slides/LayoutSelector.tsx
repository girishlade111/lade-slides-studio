import React, { useState } from 'react';
import { useMasterSlideStore } from '@/stores/masterSlideStore';
import { usePresentationStore } from '@/stores/presentationStore';
import type { MasterLayout, PlaceholderType } from '@/types/presentation';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PLACEHOLDER_COLORS: Record<PlaceholderType, string> = {
  title: '#3b82f6',
  subtitle: '#8b5cf6',
  content: '#22c55e',
  footer: '#f59e0b',
  number: '#ef4444',
  image: '#06b6d4',
  caption: '#ec4899',
};

export const LayoutSelector: React.FC = () => {
  const masterStore = useMasterSlideStore();
  const presStore = usePresentationStore();
  const master = masterStore.getActiveMaster();

  const applyLayout = (layout: MasterLayout) => {
    presStore.pushHistory();
    const objects = masterStore.applyLayoutToSlide(layout, master.fontFamily);
    const slides = [...presStore.presentation.slides];
    const slide = { ...slides[presStore.currentSlideIndex] };
    slide.objects = objects;
    slide.background = { ...layout.background };
    slides[presStore.currentSlideIndex] = slide;
    presStore.setPresentation({
      ...presStore.presentation,
      slides,
      updatedAt: Date.now(),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ppt-ribbon-btn ppt-ribbon-btn-large" title="Apply Layout">
          <LayoutGrid className="w-5 h-5 text-[hsl(var(--accent))]" />
          <span>Layout <ChevronDown className="w-3 h-3 inline" /></span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[360px] p-3">
        <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
          {master.name} — Layouts
        </p>
        <div className="grid grid-cols-3 gap-2">
          {master.layouts.map(layout => (
            <button
              key={layout.id}
              onClick={() => applyLayout(layout)}
              className="rounded border border-[hsl(var(--border))] hover:border-[hsl(var(--ppt-selection))] transition-all hover:shadow-sm p-1"
            >
              <div className="w-full aspect-[16/9] bg-white rounded-sm relative overflow-hidden mb-1">
                {layout.placeholders.map(p => (
                  <div
                    key={p.id}
                    className="absolute border border-dashed opacity-40"
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
              <span className="text-[9px] text-[hsl(var(--foreground))] leading-tight block text-center">
                {layout.name}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
