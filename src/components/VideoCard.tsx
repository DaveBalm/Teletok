import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Flame, 
  Smile, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Music, 
  Info, 
  Check, 
  Copy,
  Plus,
  Send
} from 'lucide-react';
import type { VideoRecord, TelegramUser } from '../types.js';

interface VideoCardProps {
  video: VideoRecord;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  currentUser: TelegramUser | null;
  onOpenComments: (videoId: string) => void;
  onReaction: (videoId: string, reactionType: 'like' | 'fire' | 'heart' | 'laugh') => void;
  onSelectChannel?: (channel: string) => void;
  onSelectHashtag?: (hashtag: string) => void;
  onVideoEnded?: () => void;
  isAutoplayContinuous?: boolean;
}

/**
 * Parses caption text and renders inline hashtags as clickable buttons
 */
function renderCaptionWithHashtags(caption: string, onSelectHashtag?: (tag: string) => void) {
  if (!caption) return null;
  const parts = caption.split(/(#[\p{L}\p{N}_]+)/gu);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onSelectHashtag?.(tag);
          }}
          className="font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer inline-block mx-0.5 transition active:scale-95"
          title={`Filter feed by #${tag}`}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function VideoCard({
  video,
  isActive,
  isMuted,
  onToggleMute,
  currentUser,
  onOpenComments,
  onReaction,
  onSelectChannel,
  onSelectHashtag,
  onVideoEnded,
  isAutoplayContinuous = false
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(video.duration || 15);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const lastTapTimeRef = useRef<number>(0);

  // Auto-play / pause when active index changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy might require mute
            el.muted = true;
            el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Update progress bar
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (el && el.duration) {
      setProgress((el.currentTime / el.duration) * 100);
      setDuration(el.duration);
    }
  };

  // Video Tap Handler (Differentiates Single Tap from Double Tap)
  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (timeSinceLastTap < 300) {
      // DOUBLE TAP: Trigger floating heart & Like reaction!
      triggerDoubleTapHeart(x, y);
    } else {
      // SINGLE TAP: Toggle Play/Pause after short debounce
      setTimeout(() => {
        if (Date.now() - lastTapTimeRef.current >= 280) {
          togglePlayPause();
        }
      }, 290);
    }
  };

  const triggerDoubleTapHeart = (x: number, y: number) => {
    const heartId = Date.now() + Math.random();
    setHearts(prev => [...prev, { id: heartId, x, y }]);

    // Trigger haptic feedback if running in Telegram WebApp
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // Call like reaction
    onReaction(video.id, 'like');

    // Remove heart element after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== heartId));
    }, 850);
  };

  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().then(() => {
        setIsPlaying(true);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);
      });
    } else {
      el.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    el.currentTime = pct * el.duration;
    setProgress(pct * 100);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#${video.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2200);
    }
    // Also trigger Telegram WebApp share or native navigator.share if available
    if (navigator.share) {
      navigator.share({
        title: video.caption,
        text: `Watch on TeleTok: ${video.caption}`,
        url: shareUrl
      }).catch(() => {});
    }
  };

  const hasLiked = video.user_has_liked;
  const hasFired = video.user_reactions?.includes('fire');
  const hasLaughed = video.user_reactions?.includes('laugh');

  return (
    <div 
      className="relative w-full h-[100dvh] max-h-[100dvh] snap-start snap-always flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Tap detection layer */}
      <div 
        className="relative w-full h-full max-w-[500px] flex items-center justify-center overflow-hidden"
        onClick={handleTap}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={video.stream_url || `/api/stream/${video.id}`}
          poster={video.thumbnail_url}
          className="w-full h-full object-cover pointer-events-none"
          loop={!isAutoplayContinuous}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={isAutoplayContinuous ? onVideoEnded : undefined}
        />

        {/* Ambient Top Vignette for Contrast */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

        {/* Ambient Bottom Vignette for Captions */}
        <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

        {/* Center Play / Pause Indicator */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-18 h-18 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white scale-110 transition-transform">
              {isPlaying ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
            </div>
          </div>
        )}

        {/* Floating Hearts from Double Tap */}
        {hearts.map(h => (
          <div
            key={h.id}
            style={{ left: h.x, top: h.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-float-heart drop-shadow-lg"
          >
            <span className="text-5xl">💖</span>
          </div>
        ))}

        {/* =========================================================================
            RIGHT ACTION RAIL (TikTok standard buttons)
           ========================================================================= */}
        <div 
          className="absolute right-3 sm:right-4 bottom-14 z-20 flex flex-col items-center gap-4 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Channel Avatar with Follow Button */}
          <div className="relative mb-1 flex flex-col items-center">
            <div 
              onClick={() => onSelectChannel?.(video.source_channel)}
              className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-md cursor-pointer hover:scale-105 transition"
              title={`Stream channel @${video.source_channel}`}
            >
              <div className="w-full h-full rounded-full bg-neutral-900 overflow-hidden flex items-center justify-center font-bold text-xs">
                {video.source_channel.charAt(0).toUpperCase()}
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`absolute -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition shadow-sm ${
                isFollowing 
                  ? 'bg-neutral-800 text-neutral-400' 
                  : 'bg-rose-500 text-white hover:scale-110'
              }`}
            >
              {isFollowing ? <Check className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Heart / Like Button */}
          <button
            onClick={() => onReaction(video.id, 'like')}
            className="flex flex-col items-center group transition active:scale-90"
            title="Like clip"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              hasLiked 
                ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/40' 
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}>
              <Heart className={`w-6 h-6 ${hasLiked ? 'fill-white stroke-white' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
              {video.likes_count}
            </span>
          </button>

          {/* Flame / Fire Reaction */}
          <button
            onClick={() => onReaction(video.id, 'fire')}
            className="flex flex-col items-center group transition active:scale-90"
            title="Fire reaction"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              hasFired 
                ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/40' 
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}>
              <Flame className={`w-6 h-6 ${hasFired ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
              Lit
            </span>
          </button>

          {/* Laugh Reaction */}
          <button
            onClick={() => onReaction(video.id, 'laugh')}
            className="flex flex-col items-center group transition active:scale-90"
            title="Laugh reaction"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              hasLaughed 
                ? 'bg-yellow-500/90 text-black shadow-lg shadow-yellow-500/40' 
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}>
              <Smile className={`w-6 h-6 ${hasLaughed ? 'stroke-[2.5]' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
              Haha
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => onOpenComments(video.id)}
            className="flex flex-col items-center group transition active:scale-90"
            title="Comments"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
              {video.comments_count || 0}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center group transition active:scale-90"
            title="Share clip"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
              Share
            </span>
          </button>

          {/* Technical Specs / Telegram File ID Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              showInfo ? 'bg-sky-500 text-black' : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
            title="Technical specs & Telegram File ID"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Spinning Vinyl Record Sound Icon */}
          <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center p-1 mt-1 animate-spin-slow">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-950 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-neutral-300" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM OVERLAY (Caption, Channel Handle, Sound Title)
           ========================================================================= */}
        <div 
          className="absolute bottom-4 left-4 right-18 z-20 text-white pointer-events-none"
        >
          {/* Channel Name */}
          <div className="flex items-center gap-1.5 mb-1.5 pointer-events-auto">
            <span 
              onClick={() => onSelectChannel?.(video.source_channel)}
              className="font-bold text-sm tracking-wide drop-shadow-md hover:underline cursor-pointer flex items-center gap-1 hover:text-sky-300 transition"
              title={`Switch to @${video.source_channel} stream`}
            >
              @{video.source_channel}
            </span>
            <span className="inline-block w-3.5 h-3.5 bg-sky-500 rounded-full text-[9px] text-black font-extrabold text-center leading-3.5">
              ✓
            </span>
          </div>

          {/* Caption with Clickable Hashtags */}
          <p className="text-xs text-neutral-100 font-normal leading-relaxed drop-shadow-md line-clamp-3 pointer-events-auto max-w-[90%]">
            {renderCaptionWithHashtags(video.caption, onSelectHashtag)}
          </p>

          {/* Hashtag Quick Filter Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] font-medium text-sky-300 pointer-events-auto drop-shadow-md">
              {video.tags.map((tag, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHashtag?.(tag);
                  }}
                  className="px-2 py-0.5 rounded-md bg-black/40 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-neutral-800 hover:border-sky-500/40 backdrop-blur-xs transition cursor-pointer text-[10px]"
                  title={`Filter by #${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Sound bar */}
          <div className="flex items-center gap-2 mt-2.5 text-[11px] text-neutral-300 pointer-events-auto max-w-[80%] overflow-hidden">
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {video.sound_title || `Original Audio - @${video.source_channel}`}
            </span>
          </div>
        </div>

        {/* Technical Info Overlay Drawer */}
        {showInfo && (
          <div 
            className="absolute inset-x-3 bottom-16 z-30 p-4 bg-neutral-950/90 border border-neutral-800 rounded-2xl backdrop-blur-md text-xs text-neutral-300 shadow-2xl animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Cloudflare D1 & Telegram Metadata</span>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Video ID:</span>
                <span className="text-sky-400">{video.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Telegram File ID:</span>
                <span className="text-neutral-300 truncate max-w-[180px]">{video.telegram_file_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">File Size:</span>
                <span className="text-emerald-400">
                  {(video.file_size / (1024 * 1024)).toFixed(2)} MB {video.file_size <= 18874368 ? '(≤ 18MB Direct)' : '(Transcoded 720p)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Duration:</span>
                <span className="text-neutral-300">{video.duration}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Stream Protocol:</span>
                <span className="text-cyan-400">HTTP/2 Chunked Range Buffer</span>
              </div>
            </div>
          </div>
        )}

        {/* Share Toast */}
        {showShareToast && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-neutral-900/90 border border-neutral-700 text-white px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Clip link copied to clipboard!</span>
          </div>
        )}

        {/* Bottom Video Progress Scrubbing Bar */}
        <div 
          onClick={handleSeek}
          className="absolute bottom-0 inset-x-0 h-2 bg-neutral-900/60 cursor-pointer z-30 group"
        >
          <div 
            className="h-full bg-gradient-to-r from-sky-400 to-rose-500 group-hover:h-2.5 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
