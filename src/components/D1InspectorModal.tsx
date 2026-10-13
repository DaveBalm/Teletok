import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, Table, HardDrive, Heart, MessageSquare, Play } from 'lucide-react';

interface D1InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
}

export function D1InspectorModal({
  isOpen,
  onClose,
  onSelectVideo
}: D1InspectorModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<'videos' | 'reactions' | 'schema'>('videos');

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/d1-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch D1 stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-[#13141f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Cloudflare D1 Database Inspector</h2>
              <p className="text-[11px] text-neutral-400">SQLite Engine · Indexing · Live State</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Refresh D1 Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-neutral-800 bg-neutral-950/40 text-xs">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">TABLE: videos</span>
            <span className="font-bold text-base text-white">{stats?.totalVideos || 0}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Indexed items</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">TABLE: reactions</span>
            <span className="font-bold text-base text-rose-400">{stats?.totalReactions || 0}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">User interactions</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">TABLE: comments</span>
            <span className="font-bold text-base text-cyan-400">{stats?.totalComments || 0}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Community posts</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTable('videos')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTable === 'videos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            videos Table ({stats?.videos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTable('schema')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTable === 'schema' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            D1 SQLite Schema
          </button>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTable === 'videos' ? (
            <div className="space-y-3">
              {stats?.videos?.map((vid: any) => (
                <div 
                  key={vid.id}
                  className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl hover:border-neutral-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-sky-400 font-medium">{vid.id}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400 font-semibold">@{vid.source_channel}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-[10px] text-neutral-400">
                        {(vid.file_size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>

                    <p className="text-neutral-200 text-xs mt-1 truncate">{vid.caption}</p>

                    <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500 font-mono">
                      <span>TG_FILE_ID: {vid.telegram_file_id?.slice(0, 24)}...</span>
                      <span>LIKES: {vid.likes_count}</span>
                      <span>VIEWS: {vid.views_count}</span>
                    </div>
                  </div>

                  {onSelectVideo && (
                    <button
                      onClick={() => {
                        onSelectVideo(vid.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[11px] flex items-center gap-1.5 self-start sm:self-center shrink-0"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      Play in Feed
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 font-mono text-[11px] text-neutral-300">
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl overflow-x-auto text-emerald-300">
                <pre>{`-- Videos catalog (with Hashtag Discovery & Channel Streams)
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,               -- UUID
    telegram_file_id TEXT NOT NULL,    -- Telegram File ID
    caption TEXT,
    source_channel TEXT,
    file_size INTEGER,                 -- Bytes
    duration INTEGER,                  -- Seconds
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    tags TEXT,                         -- JSON array of parsed hashtags (e.g. ["surf","pipeline"])
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Reactions & Interactions
CREATE TABLE IF NOT EXISTS video_reactions (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    user_id TEXT NOT NULL,             -- Telegram User ID
    reaction_type TEXT NOT NULL,       -- 'like', 'fire', 'heart', 'laugh'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id),
    UNIQUE(video_id, user_id, reaction_type)
);

-- Indexes for rapid random discovery, channel streaming & hashtag searching
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(source_channel);
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos(tags);`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
