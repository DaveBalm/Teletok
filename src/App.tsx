/**
 * TeleTok - Telegram TikTok-Style Mini App & Curator Agent System
 * Full-stack vertical video platform powered by Cloudflare Workers, D1 & Telegram
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown, X, Hash } from 'lucide-react';
import { VideoCard } from './components/VideoCard.js';
import { TopNav } from './components/TopNav.js';
import { ChannelHeaderBanner } from './components/ChannelHeaderBanner.js';
import { ChannelsDrawer } from './components/ChannelsDrawer.js';
import { DiagnosticsModal } from './components/DiagnosticsModal.js';
import { CommentsDrawer } from './components/CommentsDrawer.js';
import { CuratorBotModal } from './components/CuratorBotModal.js';
import { D1InspectorModal } from './components/D1InspectorModal.js';
import { AuthModal } from './components/AuthModal.js';
import { RealtimeToast, ToastItem } from './components/RealtimeToast.js';
import type { VideoRecord, TelegramUser, CompressionJob } from './types.js';

export default function App() {
  const [feed, setFeed] = useState<VideoRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedType, setFeedType] = useState<'foryou' | 'following'>('foryou');
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [isAutoplayContinuous, setIsAutoplayContinuous] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
  
  // Modals and drawers state
  const [isChannelsDrawerOpen, setIsChannelsDrawerOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isCuratorOpen, setIsCuratorOpen] = useState(false);
  const [isD1InspectorOpen, setIsD1InspectorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeCommentsVideoId, setActiveCommentsVideoId] = useState<string | null>(null);
  
  // Real-time compression jobs and notifications
  const [activeJobs, setActiveJobs] = useState<CompressionJob[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);
  const hasTriggeredThresholdHapticRef = useRef(false);
  const PULL_THRESHOLD = 64;

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Initialize Telegram WebApp environment & User Session
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        // Set Telegram header and background colors
        if (tg.setHeaderColor) tg.setHeaderColor('#000000');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
        
        // Extract native Telegram user if running inside Telegram
        if (tg.initDataUnsafe?.user) {
          const u = tg.initDataUnsafe.user;
          const tgUser: TelegramUser = {
            id: `tg_${u.id}`,
            first_name: u.first_name,
            last_name: u.last_name,
            username: u.username || `user_${u.id}`,
            photo_url: u.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            is_verified: !!u.is_premium
          };
          handleAutoLogin(tgUser, tg.initData);
        }
      } catch (e) {
        console.warn('Telegram WebApp init warning:', e);
      }
    }

    // Check existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          // Default initial Telegram demo user
          setCurrentUser({
            id: "tg_durov_01",
            first_name: "Pavel",
            last_name: "Durov",
            username: "durov",
            photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            is_verified: true
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const handleAutoLogin = async (user: TelegramUser, initData?: string) => {
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, initData })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      setCurrentUser(user);
    }
  };

  // 2. Fetch Feed from D1 (either randomized discovery, channel stream, or hashtag filter)
  const fetchFeed = useCallback(async (replace = false, channelOverride?: string | null, hashtagOverride?: string | null) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const channelToQuery = channelOverride !== undefined ? channelOverride : activeChannel;
    const tagToQuery = hashtagOverride !== undefined ? hashtagOverride : activeHashtag;

    try {
      let url = '/api/feed';
      if (tagToQuery) {
        url = `/api/feed?tag=${encodeURIComponent(tagToQuery)}`;
      } else if (channelToQuery) {
        url = `/api/feed?channel=${encodeURIComponent(channelToQuery)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data: VideoRecord[] = await res.json();
        setFeed(prev => {
          if (replace) return data;
          // De-duplicate by id
          const existingIds = new Set(prev.map(v => v.id));
          const newItems = data.filter(item => !existingIds.has(item.id));
          return [...prev, ...(newItems.length > 0 ? newItems : data)];
        });
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [activeChannel, activeHashtag]);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Channel Stream Selector
  const handleSelectChannel = (channel: string | null) => {
    setActiveChannel(channel);
    setActiveHashtag(null);
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    fetchFeed(true, channel, null);
    if (channel) {
      addToast({
        type: 'general',
        title: 'Channel Stream Connected',
        message: `Now streaming continuous feed from @${channel}`
      });
    } else {
      addToast({
        type: 'general',
        title: 'Discover Feed Restored',
        message: 'Switched back to global algorithm feed.'
      });
    }
  };

  // Hashtag Stream Selector
  const handleSelectHashtag = (tag: string | null) => {
    setActiveHashtag(tag);
    setActiveChannel(null);
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    fetchFeed(true, null, tag);
    if (tag) {
      addToast({
        type: 'general',
        title: `Hashtag #${tag}`,
        message: `Filtering clips tagged with #${tag}`
      });
    } else {
      addToast({
        type: 'general',
        title: 'Hashtag Filter Cleared',
        message: 'Returned to For You feed.'
      });
    }
  };

  // 3. Connect to WebSocket for Real-Time Events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send initial ping
        ws?.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'viewer:count' && msg.data?.count) {
            setViewerCount(msg.data.count);
          }

          if (msg.type === 'video:new' && msg.data) {
            const newVideo: VideoRecord & { isChannelPost?: boolean } = msg.data;
            setFeed(prev => {
              // Add to top if not already present
              if (prev.some(v => v.id === newVideo.id)) return prev;
              // If we are in a channel stream, only prepend if video is for this channel
              if (activeChannel && newVideo.source_channel.toLowerCase().replace('@', '') !== activeChannel.toLowerCase().replace('@', '')) {
                return prev;
              }
              return [newVideo, ...prev];
            });

            addToast({
              type: 'video:new',
              title: newVideo.isChannelPost ? `Live Channel Post!` : `New Video Curated!`,
              message: `@${newVideo.source_channel}: ${newVideo.caption}`
            });
          }

          if (msg.type === 'reaction:update' && msg.data) {
            const { videoId, likesCount, reactionType } = msg.data;
            setFeed(prev => prev.map(v => {
              if (v.id === videoId) {
                return { ...v, likes_count: likesCount };
              }
              return v;
            }));

            // Only notify if someone else reacted
            if (msg.data.userId !== currentUser?.id) {
              addToast({
                type: 'reaction',
                title: 'New Reaction',
                message: `Someone reacted with ${reactionType === 'like' ? '❤️' : reactionType === 'fire' ? '🔥' : '😂'}!`
              });
            }
          }

          if (msg.type === 'comment:new' && msg.data) {
            const { videoId, userName, text } = msg.data;
            setFeed(prev => prev.map(v => {
              if (v.id === videoId) {
                return { ...v, comments_count: (v.comments_count || 0) + 1 };
              }
              return v;
            }));

            if (msg.data.userId !== currentUser?.id) {
              addToast({
                type: 'comment',
                title: `${userName} commented`,
                message: text
              });
            }
          }

          if (msg.type === 'compression:update' && msg.data) {
            const job: CompressionJob = msg.data;
            setActiveJobs(prev => {
              const idx = prev.findIndex(j => j.id === job.id);
              if (idx === -1) {
                return [job, ...prev];
              }
              const copy = [...prev];
              copy[idx] = job;
              return copy;
            });

            if (job.status === 'completed') {
              addToast({
                type: 'compression',
                title: 'Compression Finished! ⚡',
                message: `Transcoded to 720p H.264 (${((job.compressed_size_bytes || 0) / (1024 * 1024)).toFixed(1)}MB)`
              });
            }
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addToast, currentUser, activeChannel]);

  // 4. Snap Scroll Navigation
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const height = target.clientHeight || window.innerHeight;
    const index = Math.round(target.scrollTop / height);

    if (index !== activeIndex && index >= 0 && index < feed.length) {
      setActiveIndex(index);
      
      // Haptic on scroll transition in Telegram
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
      }

      // Prefetch more when getting near the end (only in global discover mode)
      if (!activeChannel && index >= feed.length - 2) {
        fetchFeed(false);
      }
    }
  };

  // Pull-to-refresh Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 5) {
      touchStartYRef.current = e.touches[0].clientY;
      hasTriggeredThresholdHapticRef.current = false;
      setIsPulling(true);
    } else {
      touchStartYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 5) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;

    if (diff > 0) {
      const damped = Math.min(88, Math.pow(diff, 0.84) * 1.5);
      setPullDistance(damped);

      if (damped >= PULL_THRESHOLD && !hasTriggeredThresholdHapticRef.current) {
        hasTriggeredThresholdHapticRef.current = true;
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
      } else if (damped < PULL_THRESHOLD) {
        hasTriggeredThresholdHapticRef.current = false;
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (touchStartYRef.current === null || isRefreshing) return;
    touchStartYRef.current = null;
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.85);

      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
      }

      try {
        await fetchFeed(true);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        setActiveIndex(0);

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        addToast({
          type: 'general',
          title: 'Feed Refreshed ⚡',
          message: 'Loaded latest content from Cloudflare D1'
        });
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        hasTriggeredThresholdHapticRef.current = false;
      }
    } else {
      setPullDistance(0);
      hasTriggeredThresholdHapticRef.current = false;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isRefreshing || e.button !== 0) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 5) {
      touchStartYRef.current = e.clientY;
      isMouseDownRef.current = true;
      hasTriggeredThresholdHapticRef.current = false;
      setIsPulling(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || touchStartYRef.current === null || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 5) {
      setPullDistance(0);
      return;
    }

    const diff = e.clientY - touchStartYRef.current;
    if (diff > 0) {
      const damped = Math.min(88, Math.pow(diff, 0.84) * 1.5);
      setPullDistance(damped);
      if (damped >= PULL_THRESHOLD && !hasTriggeredThresholdHapticRef.current) {
        hasTriggeredThresholdHapticRef.current = true;
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    handleTouchEnd();
  };

  // Continuous Autoplay when current video finishes
  const handleVideoEnded = () => {
    if (!isAutoplayContinuous || feed.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const height = container.clientHeight || window.innerHeight;
    const nextIndex = (activeIndex + 1) % feed.length;
    setActiveIndex(nextIndex);
    container.scrollTo({ top: nextIndex * height, behavior: 'smooth' });
  };

  // Keyboard navigation for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const height = container.clientHeight || window.innerHeight;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(feed.length - 1, activeIndex + 1);
        container.scrollTo({ top: next * height, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        container.scrollTo({ top: prev * height, behavior: 'smooth' });
      } else if (e.key === 'm') {
        setIsMuted(m => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, feed.length]);

  // Handle Reactions (Optimistic Update)
  const handleReaction = async (videoId: string, reactionType: 'like' | 'fire' | 'heart' | 'laugh') => {
    const userId = currentUser?.id || 'tg_guest_' + Date.now();

    // Optimistically update local video
    setFeed(prev => prev.map(v => {
      if (v.id === videoId) {
        const alreadyHas = v.user_reactions?.includes(reactionType);
        if (alreadyHas) return v;
        const currentReactions = v.user_reactions || [];
        return {
          ...v,
          likes_count: v.likes_count + 1,
          user_has_liked: reactionType === 'like' ? true : v.user_has_liked,
          user_reactions: [...currentReactions, reactionType]
        };
      }
      return v;
    }));

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, userId, reactionType })
      });
      const data = await res.json();
      if (!data.success && data.alreadyReacted) {
        // Rollback or keep as-is
      }
    } catch (err) {
      console.error('Reaction request failed:', err);
    }
  };

  const activeCommentsVideo = feed.find(v => v.id === activeCommentsVideoId);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-black text-white overflow-hidden select-none flex justify-center">
      
      {/* Top Floating Navigation */}
      <TopNav
        feedType={feedType}
        onFeedTypeChange={(type) => {
          setFeedType(type);
          setActiveChannel(null);
          setActiveHashtag(null);
          fetchFeed(true, null, null);
        }}
        activeChannel={activeChannel}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        viewerCount={viewerCount}
        activeJobsCount={activeJobs.filter(j => j.status !== 'completed').length}
        currentUser={currentUser}
        onOpenChannels={() => setIsChannelsDrawerOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenCurator={() => setIsCuratorOpen(true)}
        onOpenD1Inspector={() => setIsD1InspectorOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Active Channel Stream Header Banner */}
      {activeChannel && (
        <ChannelHeaderBanner
          channelHandle={activeChannel}
          videoCount={feed.length}
          currentIndex={activeIndex}
          isAutoplayContinuous={isAutoplayContinuous}
          onToggleContinuousAutoplay={() => setIsAutoplayContinuous(!isAutoplayContinuous)}
          onExitChannelStream={() => handleSelectChannel(null)}
        />
      )}

      {/* Active Hashtag Stream / Filter Banner */}
      {activeHashtag && (
        <div className="fixed top-14 inset-x-0 z-35 flex justify-center pointer-events-none px-3">
          <div className="w-full max-w-[480px] pointer-events-auto">
            <div className="p-2 sm:px-3 bg-neutral-900/90 backdrop-blur-md border border-sky-500/60 rounded-2xl shadow-2xl flex items-center justify-between gap-2 text-white animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-extrabold text-sm shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-sky-400">
                      Hashtag Search
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      ({feed.length} {feed.length === 1 ? 'clip' : 'clips'})
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    #{activeHashtag}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectHashtag(null)}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
                title="Clear Hashtag Search"
              >
                <span>Clear</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Toast Notifications */}
      <RealtimeToast toasts={toasts} onDismiss={dismissToast} />

      {/* Pull-To-Refresh Indicator Badge */}
      <div 
        className="absolute top-14 left-1/2 -translate-x-1/2 z-35 pointer-events-none transition-all duration-200"
        style={{
          transform: `translate(-50%, ${pullDistance > 0 || isRefreshing ? Math.min(pullDistance * 0.9, 65) : -45}px)`,
          opacity: pullDistance > 12 || isRefreshing ? 1 : 0
        }}
      >
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md border text-xs font-semibold ${
          pullDistance >= PULL_THRESHOLD || isRefreshing
            ? 'bg-neutral-900/95 border-sky-500/70 text-sky-400'
            : 'bg-neutral-900/85 border-neutral-700/80 text-neutral-300'
        }`}>
          {isRefreshing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Updating Feed...</span>
            </>
          ) : (
            <>
              <ArrowDown 
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  pullDistance >= PULL_THRESHOLD ? 'rotate-180 text-sky-400' : 'text-neutral-400'
                }`} 
              />
              <span>{pullDistance >= PULL_THRESHOLD ? 'Release to Refresh' : 'Pull to Refresh'}</span>
            </>
          )}
        </div>
      </div>

      {/* Vertical Snap-Scrolling Video Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
        className="w-full h-full max-w-[500px] overflow-y-scroll snap-y snap-mandatory no-scrollbar relative bg-black shadow-2xl"
      >
        {feed.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-10 h-10 border-2 border-neutral-700 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-neutral-300">
              {activeChannel ? `Loading stream for @${activeChannel}...` : 'Fetching Discover Feed from Cloudflare D1...'}
            </p>
            <p className="text-xs text-neutral-500">Connecting to Stream Proxy & Telegram Curator Bot</p>
          </div>
        ) : (
          feed.map((vid, idx) => (
            <VideoCard
              key={`${vid.id}-${idx}`}
              video={vid}
              isActive={idx === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              currentUser={currentUser}
              onOpenComments={(id) => setActiveCommentsVideoId(id)}
              onReaction={handleReaction}
              onSelectChannel={handleSelectChannel}
              onSelectHashtag={handleSelectHashtag}
              onVideoEnded={handleVideoEnded}
              isAutoplayContinuous={isAutoplayContinuous}
            />
          ))
        )}
      </div>

      {/* Channels Live Streams Directory Drawer */}
      <ChannelsDrawer
        isOpen={isChannelsDrawerOpen}
        onClose={() => setIsChannelsDrawerOpen(false)}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
      />

      {/* Real-World Test Readiness & Production Diagnostic Suite Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Comments Drawer */}
      <CommentsDrawer
        isOpen={!!activeCommentsVideoId}
        onClose={() => setActiveCommentsVideoId(null)}
        videoId={activeCommentsVideoId || ''}
        currentUser={currentUser}
        commentsCount={activeCommentsVideo?.comments_count || 0}
        onCommentAdded={() => {
          if (activeCommentsVideoId) {
            setFeed(prev => prev.map(v => 
              v.id === activeCommentsVideoId ? { ...v, comments_count: (v.comments_count || 0) + 1 } : v
            ));
          }
        }}
      />

      {/* Curator Bot & Channel Admin Post Simulator Modal */}
      <CuratorBotModal
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        activeJobs={activeJobs}
        onVideoCreated={() => {
          fetchFeed(true);
        }}
      />

      {/* Cloudflare D1 Inspector Modal */}
      <D1InspectorModal
        isOpen={isD1InspectorOpen}
        onClose={() => setIsD1InspectorOpen(false)}
        onSelectVideo={(videoId) => {
          const idx = feed.findIndex(v => v.id === videoId);
          if (idx !== -1 && containerRef.current) {
            const height = containerRef.current.clientHeight || window.innerHeight;
            containerRef.current.scrollTo({ top: idx * height, behavior: 'smooth' });
          }
        }}
      />

      {/* Telegram User Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
      />

    </div>
  );
}
