import React from 'react';
import { 
  Bot, 
  Database, 
  Volume2, 
  VolumeX, 
  User, 
  Radio,
  Activity,
  Sparkles
} from 'lucide-react';
import type { TelegramUser } from '../types.js';

interface TopNavProps {
  feedType: 'foryou' | 'following';
  onFeedTypeChange: (type: 'foryou' | 'following') => void;
  activeChannel: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  viewerCount: number;
  activeJobsCount: number;
  currentUser: TelegramUser | null;
  onOpenChannels: () => void;
  onOpenDiagnostics: () => void;
  onOpenCurator: () => void;
  onOpenD1Inspector: () => void;
  onOpenAuth: () => void;
}

export function TopNav({
  feedType,
  onFeedTypeChange,
  activeChannel,
  isMuted,
  onToggleMute,
  viewerCount,
  activeJobsCount,
  currentUser,
  onOpenChannels,
  onOpenDiagnostics,
  onOpenCurator,
  onOpenD1Inspector,
  onOpenAuth
}: TopNavProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 pointer-events-none flex justify-center">
      <div className="w-full max-w-[500px] px-3.5 py-3 flex items-center justify-between text-white pointer-events-auto">
        
        {/* Left Side: Channels Directory & Diagnostics */}
        <div className="flex items-center gap-1.5">
          {/* Channels Live Streams Directory */}
          <button
            onClick={onOpenChannels}
            className={`p-2 rounded-full backdrop-blur-md transition flex items-center gap-1.5 ${
              activeChannel 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-black/40 hover:bg-black/65 text-sky-400 hover:text-sky-300'
            }`}
            title="Channel Live Streams Directory"
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* Real-World Diagnostics Test Suite */}
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md text-amber-400 hover:text-amber-300 transition"
            title="Real-World Test Readiness Suite"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Curator Bot Hub */}
          <button
            onClick={onOpenCurator}
            className="relative p-2 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md text-sky-400 hover:text-sky-300 transition"
            title="Open Telegram Curator Bot Hub & Simulator"
          >
            <Bot className="w-4 h-4" />
            {activeJobsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center animate-pulse">
                {activeJobsCount}
              </span>
            )}
          </button>

          {/* D1 Database Inspector */}
          <button
            onClick={onOpenD1Inspector}
            className="p-2 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md text-emerald-400 hover:text-emerald-300 transition"
            title="Inspect Cloudflare D1 Database"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>

        {/* Center: "Following" | "For You" Feed Tabs */}
        <div className="flex items-center gap-4 text-sm font-semibold tracking-wide drop-shadow-md">
          <button
            onClick={() => onFeedTypeChange('following')}
            className={`transition relative ${
              feedType === 'following' && !activeChannel
                ? 'text-white' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Following
            {feedType === 'following' && !activeChannel && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
            )}
          </button>

          <span className="text-neutral-600 text-xs">|</span>

          <button
            onClick={() => onFeedTypeChange('foryou')}
            className={`transition relative ${
              feedType === 'foryou' && !activeChannel
                ? 'text-white' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            For You
            {feedType === 'foryou' && !activeChannel && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Right Side: Viewers, Audio Mute & Telegram Profile */}
        <div className="flex items-center gap-1.5">
          {/* Live Viewers Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">{viewerCount}</span>
          </div>

          {/* Sound Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md text-white transition"
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Telegram Profile Avatar / Login */}
          <button
            onClick={onOpenAuth}
            className="p-0.5 rounded-full border border-sky-400/60 bg-black/40 hover:scale-105 transition"
            title="Telegram Authentication"
          >
            {currentUser?.photo_url ? (
              <img 
                src={currentUser.photo_url} 
                alt="user" 
                className="w-7 h-7 rounded-full object-cover" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
