import React from 'react';
import { Radio, X, Play, RotateCcw, Sparkles } from 'lucide-react';

interface ChannelHeaderBannerProps {
  channelHandle: string;
  videoCount: number;
  currentIndex: number;
  isAutoplayContinuous: boolean;
  onToggleContinuousAutoplay: () => void;
  onExitChannelStream: () => void;
}

export function ChannelHeaderBanner({
  channelHandle,
  videoCount,
  currentIndex,
  isAutoplayContinuous,
  onToggleContinuousAutoplay,
  onExitChannelStream
}: ChannelHeaderBannerProps) {
  return (
    <div className="fixed top-14 inset-x-0 z-35 flex justify-center pointer-events-none px-3">
      <div className="w-full max-w-[480px] pointer-events-auto">
        <div className="p-2 sm:px-3 bg-neutral-900/85 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl flex items-center justify-between gap-2 text-white">
          
          {/* Channel Info & Live Beacon */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  Channel Stream
                </span>
                <span className="text-[10px] text-neutral-400">
                  ({currentIndex + 1}/{videoCount})
                </span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                @{channelHandle}
              </div>
            </div>
          </div>

          {/* Autoplay & Exit Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleContinuousAutoplay}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                isAutoplayContinuous
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
              title="Continuous autoplay next video"
            >
              <RotateCcw className={`w-3 h-3 ${isAutoplayContinuous ? 'animate-spin-slow' : ''}`} />
              <span>Autoplay {isAutoplayContinuous ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onExitChannelStream}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title="Exit Channel Stream"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
