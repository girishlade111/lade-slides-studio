import React, { useState } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { Activity, X, Filter, Plus, Trash2, Palette, MessageSquare, Download, Save, RotateCcw, Edit, Copy, Image } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActivityType } from '@/types/presentation';

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  slide_added: <Plus className="w-3 h-3 text-green-500" />,
  slide_deleted: <Trash2 className="w-3 h-3 text-red-500" />,
  slide_duplicated: <Copy className="w-3 h-3 text-blue-500" />,
  object_added: <Plus className="w-3 h-3 text-green-500" />,
  object_modified: <Edit className="w-3 h-3 text-amber-500" />,
  object_deleted: <Trash2 className="w-3 h-3 text-red-500" />,
  background_changed: <Image className="w-3 h-3 text-purple-500" />,
  theme_applied: <Palette className="w-3 h-3 text-purple-500" />,
  comment_added: <MessageSquare className="w-3 h-3 text-blue-500" />,
  comment_resolved: <MessageSquare className="w-3 h-3 text-green-500" />,
  export_performed: <Download className="w-3 h-3 text-cyan-500" />,
  presentation_saved: <Save className="w-3 h-3 text-[hsl(var(--primary))]" />,
  version_restored: <RotateCcw className="w-3 h-3 text-amber-500" />,
};

const ACTIVITY_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Slides', value: 'slides' },
  { label: 'Objects', value: 'objects' },
  { label: 'Comments', value: 'comments' },
  { label: 'Other', value: 'other' },
] as const;

type FilterCategory = typeof ACTIVITY_CATEGORIES[number]['value'];

export const ActivityLogPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { activities } = useCollaborationStore();
  const { presentation } = usePresentationStore();
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filtered = activities.filter(a => {
    if (a.presentationId && a.presentationId !== presentation.id && a.presentationId !== '') return false;
    if (filter === 'all') return true;
    if (filter === 'slides') return a.type.startsWith('slide_');
    if (filter === 'objects') return a.type.startsWith('object_');
    if (filter === 'comments') return a.type.startsWith('comment_');
    return !a.type.startsWith('slide_') && !a.type.startsWith('object_') && !a.type.startsWith('comment_');
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Group by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach(a => {
    const day = new Date(a.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  });

  return (
    <div className="w-72 border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Activity Log</span>
          <span className="text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 rounded-full">{filtered.length}</span>
        </div>
        <button onClick={onClose} className="p-0.5 hover:bg-[hsl(var(--muted))] rounded">
          <X className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[hsl(var(--border))] flex-wrap">
        <Filter className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
        {ACTIVITY_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilter(c.value)}
            className={`text-[10px] px-2 py-0.5 rounded-full ${filter === c.value ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filtered.length === 0 && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center py-6">No activity yet</p>
          )}
          {Object.entries(grouped).map(([day, entries]) => (
            <div key={day} className="mb-3">
              <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1.5 px-1">{day}</p>
              <div className="space-y-0.5">
                {entries.map(a => (
                  <div key={a.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[hsl(var(--muted))]/50">
                    <div className="mt-0.5 flex-shrink-0">{ACTIVITY_ICONS[a.type] || <Activity className="w-3 h-3" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[hsl(var(--foreground))] leading-tight">{a.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{a.author}</span>
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))]">·</span>
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{formatTime(a.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
