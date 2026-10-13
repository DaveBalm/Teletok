import React from 'react';
import { Sparkles, Heart, MessageCircle, Cpu, Bot, CheckCircle } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'video:new' | 'reaction' | 'comment' | 'compression' | 'general';
  title: string;
  message: string;
}

interface RealtimeToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function RealtimeToast({ toasts, onDismiss }: RealtimeToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-white animate-in slide-in-from-top-3 fade-in duration-200"
          onClick={() => onDismiss(toast.id)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-neutral-800 text-sky-400 shrink-0">
              {toast.type === 'video:new' && <Bot className="w-3.5 h-3.5 text-sky-400" />}
              {toast.type === 'reaction' && <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
              {toast.type === 'comment' && <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />}
              {toast.type === 'compression' && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
              {toast.type === 'general' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white truncate">{toast.title}</div>
              <div className="text-[10px] text-neutral-400 truncate">{toast.message}</div>
            </div>
          </div>
          <button 
            className="text-neutral-500 hover:text-white text-xs px-1"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
