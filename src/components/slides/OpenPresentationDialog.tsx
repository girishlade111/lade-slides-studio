import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trash2, FolderOpen } from 'lucide-react';

interface SavedPresentation {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  slideCount: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentations: SavedPresentation[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OpenPresentationDialog: React.FC<Props> = ({
  open, onOpenChange, presentations, onOpen, onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    presentations.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [presentations, search]
  );

  const fmt = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Presentation</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search presentations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">
              No saved presentations found.
            </p>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))/0.05] transition-colors"
            >
              {/* Thumbnail placeholder */}
              <div className="w-16 h-10 rounded bg-[hsl(var(--muted))] flex-shrink-0 flex items-center justify-center text-[10px] text-[hsl(var(--muted-foreground))]">
                {p.slideCount} slides
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Created {fmt(p.createdAt)} · Modified {fmt(p.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => { onOpen(p.id); onOpenChange(false); }}
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> Open
                </Button>

                {confirmDeleteId === p.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => { onDelete(p.id); setConfirmDeleteId(null); }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-[hsl(var(--destructive))]"
                    onClick={() => setConfirmDeleteId(p.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
