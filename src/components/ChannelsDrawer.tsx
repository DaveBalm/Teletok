import React, { useState, useEffect } from 'react';
import { X, Radio, Play, Users, Heart, Film, Search, CheckCircle2 } from 'lucide-react';
import type { TelegramChannel } from '../types.js';

interface ChannelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: string | null;
  onSelectChannel: (channelHandle: string | null) => void;
}

export function ChannelsDrawer({
  isOpen,
  onClose,
  activeChannel,
  onSelectChannel
}: ChannelsDrawerProps) {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = channels.filter(c => 
    c.handle.toLowerCase().includes(search.toLowerCase()) || 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#161823] text-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col border-t border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Channel Live Streams</h3>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-semibold border border-sky-500/20">
              {channels.length} Channels
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels (e.g. cyber_vibes)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-full pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Global Discover Option */}
        <div className="px-4 py-2 border-b border-neutral-800/60 bg-neutral-900/20">
          <button
            onClick={() => {
              onSelectChannel(null);
              onClose();
            }}
            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
              activeChannel === null
                ? 'border-sky-500 bg-sky-500/10 text-white'
                : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs">
                🌐
              </div>
              <div>
                <div className="font-bold text-xs text-white">All Channels (Discover For You)</div>
                <div className="text-[10px] text-neutral-400">Randomized global discovery algorithm</div>
              </div>
            </div>
            {activeChannel === null && (
              <span className="text-[10px] font-semibold text-sky-400">Active</span>
            )}
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[250px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-2">
              <div className="w-6 h-6 border-2 border-neutral-600 border-t-sky-400 rounded-full animate-spin" />
              <p className="text-xs">Loading streaming channels...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              No matching channels found.
            </div>
          ) : (
            filtered.map((channel) => {
              const isSelected = activeChannel?.toLowerCase() === channel.handle.toLowerCase();
              return (
                <div
                  key={channel.handle}
                  onClick={() => {
                    onSelectChannel(channel.handle);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${channel.avatar_color} flex items-center justify-center font-bold text-sm shrink-0 shadow-md`}>
                      {channel.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{channel.title}</span>
                        {channel.is_verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-sky-400 font-medium">@{channel.handle}</div>
                      
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3 text-neutral-500" />
                          {channel.video_count} clips
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-400" />
                          {channel.total_likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-neutral-500" />
                          {channel.subscribers_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
                      isSelected
                        ? 'bg-sky-500 text-black'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isSelected ? 'Streaming' : 'Stream'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
