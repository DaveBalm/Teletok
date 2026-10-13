import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  FileVideo, 
  Cpu, 
  CheckCircle2, 
  Database, 
  AlertTriangle,
  ArrowRight,
  Code2,
  Copy,
  Check
} from 'lucide-react';
import type { CompressionJob } from '../types.js';

interface CuratorBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeJobs: CompressionJob[];
  onVideoCreated?: () => void;
}

export function CuratorBotModal({
  isOpen,
  onClose,
  activeJobs,
  onVideoCreated
}: CuratorBotModalProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  const [ingestionMode, setIngestionMode] = useState<'channel_post' | 'forward'>('channel_post');
  const [caption, setCaption] = useState('Cyberpunk Tokyo rain scene 🌧️');
  const [sourceChannel, setSourceChannel] = useState('tech_highlights');
  const [fileSizePreset, setFileSizePreset] = useState<'small' | 'large'>('small'); // small = 12.5MB, large = 26.4MB
  const [videoUrl, setVideoUrl] = useState('https://assets.mixkit.co/videos/preview/mixkit-vertical-video-of-a-futuristic-city-at-night-42861-large.mp4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentBytes = fileSizePreset === 'small' 
    ? 13107200  // 12.5 MB (<= 18MB direct save)
    : 27682406; // 26.4 MB (> 18MB triggers compression)

  const handleSimulateWebhook = async () => {
    setIsSubmitting(true);
    setLastResponse(null);

    const payload = ingestionMode === 'channel_post' ? {
      update_id: Math.floor(Math.random() * 1000000),
      channel_post: {
        message_id: Math.floor(Math.random() * 10000),
        chat: {
          id: -10019283748,
          title: sourceChannel.replace('@', ''),
          username: sourceChannel.replace('@', ''),
          type: "channel"
        },
        date: Math.floor(Date.now() / 1000),
        video: {
          file_id: `BAACAgIAAxk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
          file_size: currentBytes,
          file_name: `${sourceChannel}_channel_clip.mp4`,
          duration: 15,
          media_url: videoUrl
        },
        caption: caption
      }
    } : {
      update_id: Math.floor(Math.random() * 1000000),
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: {
          id: 541098231,
          is_bot: false,
          first_name: "Curator",
          username: "teletok_curator"
        },
        chat: {
          id: 541098231,
          type: "private"
        },
        forward_from_chat: {
          id: -10019283748,
          title: sourceChannel.replace('@', ''),
          username: sourceChannel.replace('@', ''),
          type: "channel"
        },
        video: {
          file_id: `BAACAgIAAxk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
          file_size: currentBytes,
          file_name: `${sourceChannel}_clip.mp4`,
          duration: 15,
          media_url: videoUrl
        },
        caption: caption
      }
    };

    try {
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLastResponse(data);
      onVideoCreated?.();
    } catch (err: any) {
      setLastResponse({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyWranglerSnippet = () => {
    const text = `name = "teletok-mini-app"
main = "worker.js"
compatibility_date = "2024-04-01"

[[d1_databases]]
binding = "DB"
database_name = "teletok-production-db"
database_id = "your-d1-uuid-here"

[vars]
TELEGRAM_BOT_TOKEN = "your-telegram-bot-token"
TRANSCODE_API_URL = "https://transcode-engine.internal/api/compress"`;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-[#13141f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Telegram Curator Bot & Worker Agent</h2>
              <p className="text-[11px] text-neutral-400">Webhook Processor · 18MB Threshold Gate · Cloudflare D1</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 text-xs font-medium px-4">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'simulator' 
                ? 'border-sky-500 text-sky-400' 
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Bot Webhook Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'code' 
                ? 'border-sky-500 text-sky-400' 
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Cloudflare Architecture
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-neutral-300">
          {activeTab === 'simulator' ? (
            <>
              {/* Architecture rule indicator */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-neutral-200">18MB Ingestion Rule: </span>
                  Workers cannot run native FFmpeg inside V8 Isolates. Videos <span className="text-emerald-400 font-semibold">≤ 18MB</span> save directly to D1. Videos <span className="text-amber-400 font-semibold">&gt; 18MB</span> trigger the offload cloud transcoding engine to convert to 720p H.264 under 15MB.
                </div>
              </div>

              {/* Simulation Controls Form */}
              <div className="space-y-3.5 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                {/* Ingestion Mode Toggle */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1.5">Webhook Payload Ingestion Type:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIngestionMode('channel_post')}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                        ingestionMode === 'channel_post'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span className="font-semibold text-xs text-white">Channel Admin Stream</span>
                      <span className="text-[10px] mt-0.5 text-sky-400">update.channel_post (Auto-Stream)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIngestionMode('forward')}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                        ingestionMode === 'forward'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span className="font-semibold text-xs text-white">Direct / Forward Share</span>
                      <span className="text-[10px] mt-0.5 text-indigo-400">update.message (Direct User)</span>
                    </button>
                  </div>
                </div>

                {/* Size Mode Selection */}
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1.5">File Size & Pipeline Path:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFileSizePreset('small')}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                        fileSizePreset === 'small'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span className="font-semibold text-xs text-white">12.5 MB (≤ 18MB)</span>
                      <span className="text-[10px] mt-0.5 text-emerald-400">Direct Save to Cloudflare D1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFileSizePreset('large')}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                        fileSizePreset === 'large'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span className="font-semibold text-xs text-white">26.4 MB (&gt; 18MB)</span>
                      <span className="text-[10px] mt-0.5 text-amber-400">Offload Compression Pipeline</span>
                    </button>
                  </div>
                </div>

                {/* Channel & Caption */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Source Telegram Channel:</label>
                    <input
                      type="text"
                      value={sourceChannel}
                      onChange={(e) => setSourceChannel(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. cyber_vibes"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Video Stream URL:</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 truncate"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Video Caption:</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="Enter short caption..."
                  />
                </div>

                <button
                  onClick={handleSimulateWebhook}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Posting to /telegram/webhook...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Simulate Forwarding Clip to Telegram Bot
                    </>
                  )}
                </button>
              </div>

              {/* Webhook Response Box */}
              {lastResponse && (
                <div className={`p-3.5 rounded-xl border ${
                  lastResponse.status === 'published' 
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
                    : lastResponse.status === 'compression_offloaded'
                    ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                    : 'border-red-500/40 bg-red-950/20 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                    {lastResponse.status === 'published' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {lastResponse.status === 'compression_offloaded' && <Cpu className="w-4 h-4 text-amber-400" />}
                    <span>Status: {lastResponse.status}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-normal">{lastResponse.message}</p>
                  {lastResponse.videoId && (
                    <div className="mt-2 text-[10px] text-neutral-400 font-mono">
                      Published Video ID: {lastResponse.videoId}
                    </div>
                  )}
                </div>
              )}

              {/* Active Compression Pipeline Queue */}
              {activeJobs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <span>Active Transcode Tasks ({activeJobs.length})</span>
                    <span className="text-amber-400">Live WebSockets Sync</span>
                  </div>

                  {activeJobs.map((job) => (
                    <div key={job.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate max-w-[200px]">{job.caption}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          job.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {job.status.toUpperCase()} ({job.progress}%)
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>Original: {(job.original_size_bytes / (1024 * 1024)).toFixed(1)}MB</span>
                        {job.compressed_size_bytes ? (
                          <span className="text-emerald-400">
                            Compressed: {(job.compressed_size_bytes / (1024 * 1024)).toFixed(1)}MB (-{Math.round((1 - job.compressed_size_bytes / job.original_size_bytes) * 100)}%)
                          </span>
                        ) : (
                          <span>Target: 720p H.264 &lt; 15MB</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Cloudflare Architecture & Deployment Tab */
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-xs text-white mb-1">Production Wrangler v3 Setup</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  The application adheres strictly to Cloudflare Workers v3 and D1 bindings. You can deploy with Wrangler via:
                </p>
              </div>

              <div className="relative bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-sky-300 overflow-x-auto">
                <button
                  onClick={copyWranglerSnippet}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  title="Copy wrangler.toml"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre>{`# wrangler.toml
name = "teletok-mini-app"
main = "worker.js"
compatibility_date = "2024-04-01"

[[d1_databases]]
binding = "DB"
database_name = "teletok-production-db"
database_id = "d1-uuid-here"

[vars]
TELEGRAM_BOT_TOKEN = "your-telegram-bot-token"
TRANSCODE_API_URL = "https://transcode-engine.internal/api/compress"`}</pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-neutral-200">CLI Deployment Commands:</h4>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5 font-mono text-[10px] text-neutral-300">
                  <p className="text-neutral-500"># 1. Create Cloudflare D1 database</p>
                  <p className="text-emerald-400">wrangler d1 create teletok-production-db</p>
                  <p className="text-neutral-500 mt-2"># 2. Run SQLite migrations</p>
                  <p className="text-emerald-400">wrangler d1 execute teletok-production-db --file=./schema.sql</p>
                  <p className="text-neutral-500 mt-2"># 3. Deploy Worker</p>
                  <p className="text-emerald-400">wrangler deploy</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
