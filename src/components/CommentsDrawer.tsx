import React, { useState, useEffect } from 'react';
import { X, Send, Heart, MessageCircle } from 'lucide-react';
import type { VideoComment, TelegramUser } from '../types.js';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  currentUser: TelegramUser | null;
  commentsCount: number;
  onCommentAdded?: () => void;
}

export function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  currentUser,
  onCommentAdded
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        videoId,
        text: newComment.trim(),
        userId: currentUser?.id || 'tg_guest_' + Date.now().toString().slice(-4),
        userName: currentUser ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : 'Telegram User',
        userHandle: currentUser?.username ? `@${currentUser.username}` : '@telegram_guest'
      };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-md bg-[#161823] text-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col border-t border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-neutral-400" />
            <h3 className="font-semibold text-sm">
              {comments.length} Comments
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-2">
              <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
              <p className="text-xs">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
              <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Be the first to comment!</p>
              <p className="text-xs text-neutral-500 mt-0.5">Share your thoughts on this Telegram clip</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${comment.avatar_color || 'from-sky-500 to-blue-600'} flex items-center justify-center font-bold text-white shrink-0`}>
                  {comment.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">{comment.user_name}</span>
                    <span className="text-[10px] text-neutral-500">{comment.user_handle}</span>
                  </div>
                  <p className="text-neutral-100 mt-1 leading-relaxed text-[13px]">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-500">
                    <span>
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="hover:text-neutral-300">Reply</button>
                  </div>
                </div>
                <div className="flex flex-col items-center pt-1 text-neutral-500 hover:text-rose-500 cursor-pointer">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[10px] mt-0.5">{comment.likes || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800 bg-[#12131b] flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={currentUser ? `Add comment as @${currentUser.username || currentUser.first_name}...` : "Add a comment..."}
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3.5 py-2.5 rounded-full focus:outline-none focus:border-cyan-500 placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black flex items-center justify-center transition shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
