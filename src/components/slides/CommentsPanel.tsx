import React, { useState } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { MessageSquare, Check, Trash2, Reply, Send, X, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const CommentsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { presentation, currentSlideIndex } = usePresentationStore();
  const slide = presentation.slides[currentSlideIndex];
  const {
    getCommentsForSlide, addComment, replyToComment, resolveComment, deleteComment,
    commentFilter, setCommentFilter, authorName, setAuthorName,
  } = useCollaborationStore();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showAuthorInput, setShowAuthorInput] = useState(false);
  const [authorInput, setAuthorInput] = useState(authorName);

  if (!slide) return null;
  const comments = getCommentsForSlide(slide.id);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(slide.id, null, newComment.trim());
    setNewComment('');
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return;
    replyToComment(commentId, replyText.trim());
    setReplyText('');
    setReplyingTo(null);
  };

  const handleAuthorSave = () => {
    if (authorInput.trim()) setAuthorName(authorInput.trim());
    setShowAuthorInput(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="w-72 border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Comments</span>
          <span className="text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 rounded-full">{comments.length}</span>
        </div>
        <button onClick={onClose} className="p-0.5 hover:bg-[hsl(var(--muted))] rounded">
          <X className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Author */}
      <div className="px-3 py-1.5 border-b border-[hsl(var(--border))] flex items-center gap-1.5">
        {showAuthorInput ? (
          <div className="flex items-center gap-1 flex-1">
            <input value={authorInput} onChange={e => setAuthorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthorSave()} className="flex-1 text-[11px] px-1.5 py-0.5 border rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none" autoFocus />
            <button onClick={handleAuthorSave} className="text-[10px] text-[hsl(var(--primary))]">Save</button>
          </div>
        ) : (
          <button onClick={() => { setAuthorInput(authorName); setShowAuthorInput(true); }} className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            Commenting as <span className="font-medium text-[hsl(var(--foreground))]">{authorName}</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[hsl(var(--border))]">
        <Filter className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
        {(['all', 'unresolved', 'resolved'] as const).map(f => (
          <button key={f} onClick={() => setCommentFilter(f)}
            className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${commentFilter === f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {comments.length === 0 && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center py-6">No comments yet</p>
          )}
          {comments.map(c => (
            <div key={c.id} className={`rounded-lg border p-2 ${c.resolved ? 'opacity-60 border-[hsl(var(--border))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: c.authorColor }}>
                  {getInitials(c.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[hsl(var(--foreground))]">{c.author}</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => resolveComment(c.id)} title={c.resolved ? 'Unresolve' : 'Resolve'}
                        className="p-0.5 hover:bg-[hsl(var(--muted))] rounded">
                        <Check className={`w-3 h-3 ${c.resolved ? 'text-green-500' : 'text-[hsl(var(--muted-foreground))]'}`} />
                      </button>
                      <button onClick={() => deleteComment(c.id)} className="p-0.5 hover:bg-[hsl(var(--muted))] rounded">
                        <Trash2 className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(c.createdAt)}</p>
                  <p className="text-[11px] text-[hsl(var(--foreground))] mt-1 whitespace-pre-wrap">{c.text}</p>
                  {c.objectId && (
                    <span className="inline-block text-[9px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-1 rounded mt-1">Object</span>
                  )}
                </div>
              </div>

              {/* Replies */}
              {c.replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-1.5 border-l-2 border-[hsl(var(--border))] pl-2">
                  {c.replies.map(r => (
                    <div key={r.id}>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{r.author}</span>
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{formatTime(r.createdAt)}</span>
                      </div>
                      <p className="text-[10px] text-[hsl(var(--foreground))]">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === c.id ? (
                <div className="ml-8 mt-1.5 flex gap-1">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply(c.id)}
                    placeholder="Reply..." className="flex-1 text-[10px] px-1.5 py-0.5 border rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none" autoFocus />
                  <button onClick={() => handleReply(c.id)} className="p-0.5 text-[hsl(var(--primary))]"><Send className="w-3 h-3" /></button>
                  <button onClick={() => setReplyingTo(null)} className="p-0.5"><X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" /></button>
                </div>
              ) : (
                <button onClick={() => setReplyingTo(c.id)} className="ml-8 mt-1 flex items-center gap-0.5 text-[10px] text-[hsl(var(--primary))] hover:underline">
                  <Reply className="w-3 h-3" /> Reply
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New Comment */}
      <div className="p-2 border-t border-[hsl(var(--border))]">
        <div className="flex gap-1">
          <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            placeholder="Add a comment..." className="flex-1 text-[11px] px-2 py-1.5 border rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none" />
          <button onClick={handleAddComment} disabled={!newComment.trim()}
            className="p-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded disabled:opacity-40">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
