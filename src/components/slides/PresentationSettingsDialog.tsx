import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePresentationStore } from '@/stores/presentationStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESETS = [
  { label: '16:9 (960×540)', w: 960, h: 540 },
  { label: '4:3 (960×720)', w: 960, h: 720 },
  { label: 'Widescreen (1280×720)', w: 1280, h: 720 },
];

export const PresentationSettingsDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { presentation, setPresentation } = usePresentationStore();
  const [name, setName] = useState(presentation.name);
  const [width, setWidth] = useState(presentation.slideWidth);
  const [height, setHeight] = useState(presentation.slideHeight);
  const [author, setAuthor] = useState((presentation as any).author || '');

  useEffect(() => {
    if (open) {
      setName(presentation.name);
      setWidth(presentation.slideWidth);
      setHeight(presentation.slideHeight);
      setAuthor((presentation as any).author || '');
    }
  }, [open, presentation]);

  const fmt = (ts: number) => new Date(ts).toLocaleString();

  const handleSave = () => {
    setPresentation({
      ...presentation,
      name,
      slideWidth: width,
      slideHeight: height,
      updatedAt: Date.now(),
      ...(author ? { author } as any : {}),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Presentation Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Presentation Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Slide Size</Label>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant={width === p.w && height === p.h ? 'default' : 'outline'}
                  className="text-xs h-7"
                  onClick={() => { setWidth(p.w); setHeight(p.h); }}
                >
                  {p.label.split(' ')[0]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">×</span>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">px</span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
            <p>Created: {fmt(presentation.createdAt)}</p>
            <p>Last Modified: {fmt(presentation.updatedAt)}</p>
            <p>Slides: {presentation.slides.length}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
