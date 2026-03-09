import React, { useState } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { History, RotateCcw, X, Clock, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const VersionHistoryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { versions, restoreVersion, saveVersion } = useCollaborationStore();
  const { presentation, setPresentation } = usePresentationStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sortedVersions = [...versions].filter(v => v.presentationId === presentation.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRestore = (versionId: string) => {
    // Save current as backup first
    saveVersion('manual', presentation);
    const restored = restoreVersion(versionId);
    if (restored) {
      setPresentation(restored);
    }
    setConfirmId(null);
  };

  const handleManualSave = () => {
    saveVersion('manual', presentation);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="w-72 border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Version History</span>
        </div>
        <button onClick={onClose} className="p-0.5 hover:bg-[hsl(var(--muted))] rounded">
          <X className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Manual save */}
      <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
        <button onClick={handleManualSave} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-[11px] font-medium hover:opacity-90">
          <Save className="w-3.5 h-3.5" /> Save Current Version
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {sortedVersions.length === 0 && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center py-6">No versions saved yet</p>
          )}
          {sortedVersions.map(v => (
            <div key={v.id} className="border border-[hsl(var(--border))] rounded-lg p-2.5 bg-[hsl(var(--card))]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  {v.type === 'auto' ? (
                    <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                  ) : (
                    <Save className="w-3 h-3 text-[hsl(var(--primary))]" />
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${v.type === 'manual' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                    {v.type === 'manual' ? 'Manual' : 'Auto'}
                  </span>
                </div>
                <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{timeAgo(v.createdAt)}</span>
              </div>

              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1">{formatTime(v.createdAt)}</p>

              <div className="flex gap-2 text-[9px] text-[hsl(var(--muted-foreground))] mb-2">
                {v.changesSummary.slidesAdded > 0 && <span className="text-green-600">+{v.changesSummary.slidesAdded} slides</span>}
                {v.changesSummary.slidesDeleted > 0 && <span className="text-red-500">-{v.changesSummary.slidesDeleted} slides</span>}
                {v.changesSummary.objectsModified > 0 && <span className="text-amber-500">~{v.changesSummary.objectsModified} objects</span>}
                {v.changesSummary.slidesAdded === 0 && v.changesSummary.slidesDeleted === 0 && v.changesSummary.objectsModified === 0 && <span>No changes tracked</span>}
              </div>

              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">{v.snapshot.slides.length} slide{v.snapshot.slides.length !== 1 ? 's' : ''}</p>

              {confirmId === v.id ? (
                <div className="flex gap-1">
                  <button onClick={() => handleRestore(v.id)} className="flex-1 text-[10px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Confirm Restore</button>
                  <button onClick={() => setConfirmId(null)} className="text-[10px] px-2 py-1 border border-[hsl(var(--border))] rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(v.id)}
                  className="w-full flex items-center justify-center gap-1 text-[10px] px-2 py-1 border border-[hsl(var(--border))] rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
