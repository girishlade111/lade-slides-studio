import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SlideComment, CommentReply, ActivityEntry, ActivityType, VersionSnapshot, Presentation } from '@/types/presentation';

const AUTHOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
];

function getAuthorColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) hash = author.charCodeAt(i) + ((hash << 5) - hash);
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}

interface CollaborationStore {
  comments: SlideComment[];
  activities: ActivityEntry[];
  versions: VersionSnapshot[];
  authorName: string;
  activePanel: 'none' | 'comments' | 'versions' | 'activity';
  commentFilter: 'all' | 'unresolved' | 'resolved';

  setAuthorName: (name: string) => void;
  setActivePanel: (panel: CollaborationStore['activePanel']) => void;
  setCommentFilter: (filter: CollaborationStore['commentFilter']) => void;

  // Comments
  addComment: (slideId: string, objectId: string | null, text: string) => void;
  replyToComment: (commentId: string, text: string) => void;
  resolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  getCommentsForSlide: (slideId: string) => SlideComment[];
  getCommentCountForSlide: (slideId: string) => number;
  getCommentCountForObject: (objectId: string) => number;
  getTotalUnresolved: () => number;

  // Versions
  saveVersion: (type: 'auto' | 'manual', presentation: Presentation, prevPresentation?: Presentation) => void;
  restoreVersion: (versionId: string) => Presentation | null;
  loadVersions: (presentationId: string) => void;

  // Activity
  logActivity: (presentationId: string, type: ActivityType, description: string) => void;
  clearActivities: () => void;
}

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  comments: [],
  activities: [],
  versions: [],
  authorName: 'User',
  activePanel: 'none',
  commentFilter: 'all',

  setAuthorName: (name) => set({ authorName: name }),
  setActivePanel: (panel) => set({ activePanel: panel === get().activePanel ? 'none' : panel }),
  setCommentFilter: (filter) => set({ commentFilter: filter }),

  addComment: (slideId, objectId, text) => {
    const { authorName, comments } = get();
    const comment: SlideComment = {
      id: uuidv4(),
      slideId,
      objectId,
      author: authorName,
      authorColor: getAuthorColor(authorName),
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    set({ comments: [...comments, comment] });
    get().logActivity(slideId, 'comment_added', `Comment added by ${authorName}`);
  },

  replyToComment: (commentId, text) => {
    const { authorName, comments } = get();
    const reply: CommentReply = {
      id: uuidv4(),
      author: authorName,
      text,
      createdAt: new Date().toISOString(),
    };
    set({
      comments: comments.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ),
    });
  },

  resolveComment: (commentId) => {
    const { comments, authorName } = get();
    set({
      comments: comments.map(c =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      ),
    });
    get().logActivity('', 'comment_resolved', `Comment resolved by ${authorName}`);
  },

  deleteComment: (commentId) => {
    set({ comments: get().comments.filter(c => c.id !== commentId) });
  },

  getCommentsForSlide: (slideId) => {
    const { comments, commentFilter } = get();
    const slideComments = comments.filter(c => c.slideId === slideId);
    if (commentFilter === 'unresolved') return slideComments.filter(c => !c.resolved);
    if (commentFilter === 'resolved') return slideComments.filter(c => c.resolved);
    return slideComments;
  },

  getCommentCountForSlide: (slideId) => get().comments.filter(c => c.slideId === slideId && !c.resolved).length,
  getCommentCountForObject: (objectId) => get().comments.filter(c => c.objectId === objectId && !c.resolved).length,
  getTotalUnresolved: () => get().comments.filter(c => !c.resolved).length,

  saveVersion: (type, presentation, prevPresentation) => {
    const { versions } = get();
    let summary = { slidesAdded: 0, slidesDeleted: 0, objectsModified: 0 };
    if (prevPresentation) {
      summary.slidesAdded = Math.max(0, presentation.slides.length - prevPresentation.slides.length);
      summary.slidesDeleted = Math.max(0, prevPresentation.slides.length - presentation.slides.length);
      const prevObjects = prevPresentation.slides.reduce((n, s) => n + s.objects.length, 0);
      const curObjects = presentation.slides.reduce((n, s) => n + s.objects.length, 0);
      summary.objectsModified = Math.abs(curObjects - prevObjects);
    }
    const version: VersionSnapshot = {
      id: uuidv4(),
      presentationId: presentation.id,
      createdAt: new Date().toISOString(),
      type,
      snapshot: JSON.parse(JSON.stringify(presentation)),
      changesSummary: summary,
    };
    const newVersions = [...versions, version].slice(-20);
    set({ versions: newVersions });
    try {
      localStorage.setItem(`presentation-${presentation.id}-versions`, JSON.stringify(newVersions));
    } catch { /* ignore */ }
  },

  restoreVersion: (versionId) => {
    const version = get().versions.find(v => v.id === versionId);
    if (!version) return null;
    get().logActivity(version.presentationId, 'version_restored', `Restored to version from ${new Date(version.createdAt).toLocaleString()}`);
    return JSON.parse(JSON.stringify(version.snapshot));
  },

  loadVersions: (presentationId) => {
    try {
      const data = localStorage.getItem(`presentation-${presentationId}-versions`);
      if (data) set({ versions: JSON.parse(data) });
      else set({ versions: [] });
    } catch { set({ versions: [] }); }
  },

  logActivity: (presentationId, type, description) => {
    const { activities, authorName } = get();
    const entry: ActivityEntry = {
      id: uuidv4(),
      presentationId,
      type,
      description,
      author: authorName,
      timestamp: new Date().toISOString(),
      undoable: false,
    };
    set({ activities: [entry, ...activities].slice(0, 100) });
  },

  clearActivities: () => set({ activities: [] }),
}));
