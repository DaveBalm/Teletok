import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Server, 
  Bot, 
  Database, 
  Radio, 
  Film, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import type { DiagnosticsReport, DiagnosticCheck } from '../types.js';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'checklist'>('audit');

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnostics/readiness');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyWranglerChecklist = () => {
    const text = `# TeleTok Real-World Production Deployment Checklist

1. Setup Telegram Bot via @BotFather:
   /newbot -> Obtain TELEGRAM_BOT_TOKEN
   /setprivacy -> Disable (Allows bot to receive channel posts)

2. Create Cloudflare D1 Database:
   wrangler d1 create teletok-production-db

3. Apply Database Schema:
   wrangler d1 execute teletok-production-db --file=./schema.sql

4. Deploy Worker & Set Webhook Secret:
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler deploy

5. Register Webhook with Telegram Cloud:
   curl -F "url=https://your-worker.workers.dev/telegram/webhook" https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook

6. Add Bot as Channel Administrator:
   Add @YourBot to your Telegram Channel with "Post Messages" permission.`;
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />;
    }
  };

  const getCategoryIcon = (category: DiagnosticCheck['category']) => {
    switch (category) {
      case 'telegram_bot':
        return <Bot className="w-4 h-4 text-sky-400" />;
      case 'cloudflare_d1':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'transcode_engine':
        return <Film className="w-4 h-4 text-amber-400" />;
      case 'stream_proxy':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'websocket_auth':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-[#13141f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Real-World Test Readiness Suite</h2>
              <p className="text-[11px] text-neutral-400">Pre-Flight Production Audit · 5 Infrastructure Pillars</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAudit}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Rerun Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Readiness Score Banner */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${
              (report?.readinessScore || 0) >= 90
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {report?.readinessScore || 0}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">System Readiness Assessment:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (report?.readinessScore || 0) >= 90
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {(report?.readinessScore || 0) >= 90 ? 'READY FOR REAL-WORLD TESTS' : 'ACTION REQUIRED'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Evaluates live Telegram API, Cloudflare D1 query speeds, chunked HTTP/2 streaming, and WebSocket resilience.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex border border-neutral-800 rounded-lg p-0.5 bg-neutral-900/60 text-xs">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'audit' ? 'bg-sky-500 text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pillar Checks
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'checklist' ? 'bg-sky-500 text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Deploy Guide
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
          {activeTab === 'audit' ? (
            <div className="space-y-3">
              {loading && !report ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <p className="text-xs">Running pre-flight diagnostic benchmarks...</p>
                </div>
              ) : (
                report?.checks.map((check) => (
                  <div
                    key={check.id}
                    className="p-3.5 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-neutral-800">
                          {getCategoryIcon(check.category)}
                        </div>
                        <span className="font-semibold text-xs text-white">{check.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {check.latencyMs !== undefined && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {check.latencyMs}ms
                          </span>
                        )}
                        {getStatusIcon(check.status)}
                      </div>
                    </div>

                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      {check.message}
                    </p>

                    {check.details && (
                      <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[10px] font-mono text-neutral-400 leading-normal">
                        {check.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Checklist & Deployment Guide */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-white">Cloudflare Workers + Telegram Production Guide</h3>
                  <p className="text-[11px] text-neutral-400">Step-by-step instructions to take this app live on Telegram</p>
                </div>
                <button
                  onClick={copyWranglerChecklist}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? 'Copied' : 'Copy Guide'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                  <div className="font-bold text-sky-400 text-xs mb-1">Step 1: Bot Privacy Mode for Channel Posts</div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Open <span className="text-white font-mono">@BotFather</span> in Telegram, send <span className="font-mono text-sky-300">/setprivacy</span>, select your bot, and set to <span className="text-white font-mono">Disable</span>. This allows the bot to receive <span className="font-mono text-emerald-400">channel_post</span> events when added as a channel admin.
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                  <div className="font-bold text-sky-400 text-xs mb-1">Step 2: Add Bot as Channel Administrator</div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    In your Telegram Channel settings, go to <span className="text-white">Administrators &gt; Add Administrator</span>, find your bot, and grant the <span className="text-white font-semibold">Post Messages</span> permission. The bot will automatically stream every video posted to the channel!
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                  <div className="font-bold text-sky-400 text-xs mb-1">Step 3: Register Production Webhook</div>
                  <div className="mt-1 p-2 rounded-lg bg-neutral-950 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                    curl -F &quot;url=https://YOUR_WORKER.workers.dev/telegram/webhook&quot; https://api.telegram.org/botYOUR_TOKEN/setWebhook
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
