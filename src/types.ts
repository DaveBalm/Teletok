/**
 * Core type definitions for TeleTok
 */

export interface VideoRecord {
  id: string;
  telegram_file_id: string;
  caption: string;
  source_channel: string;
  file_size: number;
  duration: number;
  likes_count: number;
  views_count: number;
  created_at: string;
  // Dynamic frontend and stream enhancements
  stream_url?: string;
  media_url?: string;
  thumbnail_url?: string;
  sound_title?: string;
  tags?: string[];
  user_has_liked?: boolean;
  user_reactions?: string[];
  comments_count?: number;
}

export interface VideoReaction {
  id: string;
  video_id: string;
  user_id: string;
  reaction_type: 'like' | 'fire' | 'heart' | 'laugh';
  created_at: string;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  user_handle?: string;
  avatar_color?: string;
  text: string;
  created_at: string;
  likes?: number;
}

export interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_verified?: boolean;
}

export interface TelegramChannel {
  handle: string;
  title: string;
  video_count: number;
  total_likes: number;
  total_views: number;
  subscribers_count: number;
  avatar_color: string;
  is_verified: boolean;
  latest_video_id?: string;
  bio?: string;
}

export interface CompressionJob {
  id: string;
  file_name: string;
  original_size_bytes: number;
  compressed_size_bytes?: number;
  status: 'queued' | 'transcoding' | 'optimizing' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0 - 100
  preset: string; // e.g., '720p H.264 Fast CRF 28'
  chat_id: number | string;
  caption: string;
  source_channel: string;
  created_at: string;
  completed_at?: string;
}

export interface DiagnosticCheck {
  id: string;
  category: 'telegram_bot' | 'cloudflare_d1' | 'transcode_engine' | 'stream_proxy' | 'websocket_auth';
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'running';
  latencyMs?: number;
  message: string;
  details?: string;
}

export interface DiagnosticsReport {
  overallStatus: 'ready' | 'needs_config' | 'error';
  readinessScore: number; // 0 - 100
  timestamp: string;
  checks: DiagnosticCheck[];
  environment: {
    nodeEnv: string;
    d1Status: string;
    telegramBotTokenConfigured: boolean;
    transcodeEngineConfigured: boolean;
    storagePath: string;
  };
}

export interface WebSocketNotification {
  type: 'video:new' | 'reaction:update' | 'comment:new' | 'compression:update' | 'stats:update' | 'channel:live';
  data: any;
  timestamp: string;
}
