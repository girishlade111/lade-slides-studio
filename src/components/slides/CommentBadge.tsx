import React from 'react';
import { MessageSquare } from 'lucide-react';

interface CommentBadgeProps {
  count: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export const CommentBadge: React.FC<CommentBadgeProps> = ({ count, size = 'sm', onClick }) => {
  if (count <= 0) return null;

  const sizeClasses = size === 'sm'
    ? 'w-4 h-4 text-[8px]'
    : 'w-5 h-5 text-[10px]';

  return (
    <button
      onClick={onClick}
      className={`absolute -top-1.5 -right-1.5 ${sizeClasses} rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold shadow-sm z-50 hover:scale-110 transition-transform`}
      title={`${count} comment${count !== 1 ? 's' : ''}`}
    >
      {count}
    </button>
  );
};

export const SlideCommentIndicator: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full px-1 py-0.5 z-10">
      <MessageSquare className="w-2.5 h-2.5" />
      <span className="text-[8px] font-bold">{count}</span>
    </div>
  );
};
