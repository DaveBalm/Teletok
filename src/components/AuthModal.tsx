import React, { useState } from 'react';
import { X, ShieldCheck, User, Key, LogOut, CheckCircle2 } from 'lucide-react';
import type { TelegramUser } from '../types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser | null;
  onUserChange: (user: TelegramUser | null) => void;
}

const PRESET_USERS: TelegramUser[] = [
  {
    id: "tg_durov_01",
    first_name: "Pavel",
    last_name: "Durov",
    username: "durov",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    is_verified: true
  },
  {
    id: "tg_curator_02",
    first_name: "Alex",
    last_name: "Kovalev",
    username: "alex_curator",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    is_verified: true
  },
  {
    id: "tg_guest_03",
    first_name: "Mia",
    last_name: "Chen",
    username: "mia_creates",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    is_verified: false
  }
];

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange
}: AuthModalProps) {
  const [customHandle, setCustomHandle] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = async (user: TelegramUser) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      if (res.ok) {
        const data = await res.json();
        onUserChange(data.user);
        onClose();
      }
    } catch (err) {
      console.error('Failed to authenticate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customUser: TelegramUser = {
      id: `tg_custom_${Date.now().toString().slice(-6)}`,
      first_name: customName.trim(),
      username: customHandle.replace('@', '').trim() || 'user',
      photo_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      is_verified: false
    };

    handleSelectUser(customUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onUserChange(null);
      onClose();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#13141f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Telegram OAuth & JWT Session</h2>
              <p className="text-[11px] text-neutral-400">HMAC-SHA256 InitData · Secure Cookies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-300">
          {currentUser ? (
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src={currentUser.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
                  alt="avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-sky-500/50" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{currentUser.first_name} {currentUser.last_name || ''}</span>
                    {currentUser.is_verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-sky-400">@{currentUser.username}</span>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {currentUser.id}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Session: <span className="text-emerald-400 font-medium">Valid JWT Cookie</span></span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
              Select or enter a Telegram identity to sign likes, comments, and curation interactions with a cryptographically verified JWT token.
            </div>
          )}

          {/* Quick Identities */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Select Telegram Profile
            </div>
            <div className="space-y-2">
              {PRESET_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={loading}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    currentUser?.id === user.id
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <img src={user.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-white flex items-center gap-1">
                      {user.first_name} {user.last_name}
                      {user.is_verified && <span className="text-[10px] text-sky-400">✓</span>}
                    </div>
                    <span className="text-[10px] text-neutral-400">@{user.username}</span>
                  </div>
                  {currentUser?.id === user.id && (
                    <span className="text-[10px] font-semibold text-sky-400">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="pt-2 border-t border-neutral-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Or Use Custom Telegram Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Satoshi)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="@username"
                value={customHandle}
                onChange={(e) => setCustomHandle(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={!customName.trim() || loading}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-medium text-xs transition"
            >
              Set Active Telegram User
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
