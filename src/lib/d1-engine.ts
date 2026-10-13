/**
 * Cloudflare D1 Emulation Engine
 * Implements the exact Cloudflare D1 Database API:
 *   env.DB.prepare(sql).bind(...params).run()
 *   env.DB.prepare(sql).bind(...params).all()
 *   env.DB.prepare(sql).bind(...params).first()
 *
 * Backed by persistent JSON storage at data/d1_database.json
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { VideoRecord, VideoReaction, VideoComment, CompressionJob } from '../types.js';

interface DatabaseSchema {
  videos: VideoRecord[];
  video_reactions: VideoReaction[];
  comments: VideoComment[];
  compression_jobs: CompressionJob[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'd1_database.json');

// High-quality vertical short videos to seed the TikTok feed
const SEED_VIDEOS: VideoRecord[] = [
  {
    id: "vid-cyber-tokyo-01",
    telegram_file_id: "BAACAgIAAxkBAAIBYWR9z1l_tokyo_cyber_neon_4k",
    caption: "Cyberpunk Tokyo rainy midnight vibes in Shinjuku 🌧️ neon reflections hitting different!",
    source_channel: "cyber_vibes",
    file_size: 14680064, // ~14MB (<= 18MB direct save)
    duration: 14,
    likes_count: 1420,
    views_count: 12400,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-video-of-a-futuristic-city-at-night-42861-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=720&q=80",
    sound_title: "Synthwave After Dark - Retrowavz",
    tags: ["cyberpunk", "tokyo", "aesthetic", "nightcity"]
  },
  {
    id: "vid-ocean-surf-02",
    telegram_file_id: "BAACAgIAAxkBAAIBZmK0x8a_pipeline_barrel_drone",
    caption: "Golden hour barrel ride in Oahu. The barrel perspective is unreal 🌊🤙 #surf #pipeline",
    source_channel: "surflife_daily",
    file_size: 17290000, // ~16.5MB (<= 18MB direct save)
    duration: 18,
    likes_count: 3840,
    views_count: 42100,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-during-sunset-41484-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=720&q=80",
    sound_title: "Ocean Breeze - Pacific Beats",
    tags: ["surf", "goldenhour", "nature", "hawaii"]
  },
  {
    id: "vid-coder-ai-03",
    telegram_file_id: "BAACAgIAAxkBAAIBAwT2k4j_gemini_terminal_matrix",
    caption: "Building a Telegram TikTok Mini App with Cloudflare Workers + D1 in 10 minutes ⚡ #dev #cloudflare",
    source_channel: "tech_architects",
    file_size: 9840120, // 9.8MB
    duration: 12,
    likes_count: 2190,
    views_count: 19800,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-41706-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=720&q=80",
    sound_title: "Lo-Fi Coding Beats - ChillHop Cafe",
    tags: ["coding", "cloudflare", "telegram", "serverless"]
  },
  {
    id: "vid-skate-urban-04",
    telegram_file_id: "BAACAgIAAxkBAAIBCmQ8l0p_skate_kickflip_barcelona",
    caption: "Clean tre flip down the Barcelona museum stairs on first try 🔥🛹 #skateboarding #street",
    source_channel: "skate_culture",
    file_size: 13200500, // 13.2MB
    duration: 16,
    likes_count: 890,
    views_count: 7320,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-young-man-skateboarding-on-the-street-41716-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=720&q=80",
    sound_title: "90s Boom Bap - Urban Groove",
    tags: ["skate", "barcelona", "tricks", "streetwear"]
  },
  {
    id: "vid-aurora-boreal-05",
    telegram_file_id: "BAACAgIAAxkBAAIBDgH5x2v_aurora_norway_tromso",
    caption: "Aurora Borealis dancing over the Norwegian fjords in Tromsø 🌌 Magical northern lights!",
    source_channel: "nordic_expeditions",
    file_size: 15400200, // 15.4MB
    duration: 20,
    likes_count: 5120,
    views_count: 63000,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-northern-lights-over-a-snowy-landscape-42867-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=720&q=80",
    sound_title: "Celestial Wonder - Ambient Stars",
    tags: ["aurora", "norway", "tromso", "wanderlust"]
  },
  {
    id: "vid-espresso-craft-06",
    telegram_file_id: "BAACAgIAAxkBAAIBEfR7j9w_latte_art_swan_barista",
    caption: "Pouring a swan latte art with silky flat white microfoam ☕ Morning routine perfection.",
    source_channel: "specialty_coffee",
    file_size: 11200000, // 11.2MB
    duration: 15,
    likes_count: 1740,
    views_count: 15600,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-coffee-into-a-cup-41551-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=720&q=80",
    sound_title: "Morning Acoustic - Coffeehouse Jazz",
    tags: ["latteart", "coffee", "barista", "morning"]
  }
];

const SEED_COMMENTS: VideoComment[] = [
  {
    id: "c-1",
    video_id: "vid-cyber-tokyo-01",
    user_id: "tg_99812",
    user_name: "Kenji Sato",
    user_handle: "@kenjisato",
    avatar_color: "from-blue-500 to-indigo-600",
    text: "The cyberpunk atmosphere in Shinjuku never gets old! Rain makes neon pop x10 🔥",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    likes: 34
  },
  {
    id: "c-2",
    video_id: "vid-cyber-tokyo-01",
    user_id: "tg_44120",
    user_name: "Elena Rostova",
    user_handle: "@elena_tokyo",
    avatar_color: "from-purple-500 to-pink-500",
    text: "Telegram Mini App playback is so smooth! Loving the instant stream proxy 🚀",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    likes: 19
  },
  {
    id: "c-3",
    video_id: "vid-coder-ai-03",
    user_id: "tg_77199",
    user_name: "Pavel Durov Fan",
    user_handle: "@durov_watcher",
    avatar_color: "from-emerald-500 to-teal-600",
    text: "Cloudflare D1 is super fast for random feed fetching. Great architecture!",
    created_at: new Date(Date.now() - 900000).toISOString(),
    likes: 42
  }
];

class D1Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        return {
          videos: parsed.videos?.length ? parsed.videos : [...SEED_VIDEOS],
          video_reactions: parsed.video_reactions || [],
          comments: parsed.comments?.length ? parsed.comments : [...SEED_COMMENTS],
          compression_jobs: parsed.compression_jobs || []
        };
      }
    } catch (e) {
      console.warn('Could not read existing D1 file, initializing defaults:', e);
    }

    const initialData: DatabaseSchema = {
      videos: [...SEED_VIDEOS],
      video_reactions: [
        {
          id: "r-1",
          video_id: "vid-cyber-tokyo-01",
          user_id: "tg_guest_01",
          reaction_type: "like",
          created_at: new Date().toISOString()
        }
      ],
      comments: [...SEED_COMMENTS],
      compression_jobs: []
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist D1 database to disk:', err);
    }
  }

  public prepare(sql: string) {
    return new D1PreparedStatement(this, sql);
  }

  // Direct accessor for internal backend needs
  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public mutate(fn: (data: DatabaseSchema) => void) {
    fn(this.data);
    this.saveData(this.data);
  }
}

export class D1PreparedStatement {
  private db: D1Database;
  private sql: string;
  private boundParams: any[] = [];

  constructor(db: D1Database, sql: string) {
    this.db = db;
    this.sql = sql.trim();
  }

  public bind(...params: any[]): this {
    this.boundParams = params;
    return this;
  }

  public async run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }> {
    const s = this.sql.toUpperCase();
    const data = this.db.getRawData();

    // 1. INSERT INTO videos (id, telegram_file_id, caption, source_channel, file_size, duration, tags) VALUES (?, ?, ?, ?, ?, ?, ?)
    if (s.startsWith('INSERT INTO VIDEOS')) {
      const [id, telegram_file_id, caption, source_channel, file_size, duration, tagsParam] = this.boundParams;
      
      // Automatically extract hashtags from caption or parse provided tags
      let providedTags: string[] = [];
      if (tagsParam) {
        if (Array.isArray(tagsParam)) {
          providedTags = tagsParam.map(t => String(t).replace('#', '').toLowerCase().trim());
        } else if (typeof tagsParam === 'string') {
          try {
            const parsed = JSON.parse(tagsParam);
            if (Array.isArray(parsed)) providedTags = parsed.map(t => String(t).replace('#', '').toLowerCase().trim());
          } catch {
            providedTags = tagsParam.split(',').map(t => t.replace('#', '').toLowerCase().trim());
          }
        }
      }

      const captionText = caption || 'Shared Clip';
      const extractedTags = Array.from(new Set([
        ...providedTags,
        ...((captionText.match(/#[\p{L}\p{N}_]+/gu) || []).map((t: string) => t.slice(1).toLowerCase())),
        (source_channel || 'telegram').toLowerCase().replace('@', ''),
        'shortvideo'
      ])).filter(Boolean);

      const newVideo: VideoRecord = {
        id,
        telegram_file_id,
        caption: captionText,
        source_channel: source_channel || 'Telegram Community',
        file_size: Number(file_size) || 0,
        duration: Number(duration) || 15,
        likes_count: 0,
        views_count: 0,
        created_at: new Date().toISOString(),
        media_url: '', // can be streamed via /api/stream/:id or direct file
        sound_title: 'Original Audio - @' + (source_channel || 'telegram'),
        tags: extractedTags
      };

      this.db.mutate((d) => {
        d.videos.unshift(newVideo);
      });

      return { success: true, meta: { changes: 1, last_row_id: data.videos.length } };
    }

    // 2. INSERT INTO video_reactions (id, video_id, user_id, reaction_type) VALUES (?, ?, ?, ?)
    if (s.startsWith('INSERT INTO VIDEO_REACTIONS')) {
      const [id, video_id, user_id, reaction_type] = this.boundParams;

      // Check UNIQUE(video_id, user_id, reaction_type)
      const existing = data.video_reactions.find(
        r => r.video_id === video_id && r.user_id === user_id && r.reaction_type === reaction_type
      );

      if (existing) {
        throw new Error('UNIQUE constraint failed: video_reactions.video_id, video_reactions.user_id, video_reactions.reaction_type');
      }

      this.db.mutate((d) => {
        d.video_reactions.push({
          id: id || crypto.randomUUID(),
          video_id,
          user_id,
          reaction_type,
          created_at: new Date().toISOString()
        });
      });

      return { success: true, meta: { changes: 1, last_row_id: data.video_reactions.length } };
    }

    // 3. UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?
    if (s.includes('UPDATE VIDEOS SET LIKES_COUNT = LIKES_COUNT + 1 WHERE ID = ?')) {
      const videoId = this.boundParams[0];
      let updated = false;

      this.db.mutate((d) => {
        const vid = d.videos.find(v => v.id === videoId);
        if (vid) {
          vid.likes_count = (vid.likes_count || 0) + 1;
          updated = true;
        }
      });

      return { success: updated, meta: { changes: updated ? 1 : 0, last_row_id: 0 } };
    }

    // 4. UPDATE videos SET views_count = views_count + 1 WHERE id = ?
    if (s.includes('UPDATE VIDEOS SET VIEWS_COUNT = VIEWS_COUNT + 1 WHERE ID = ?')) {
      const videoId = this.boundParams[0];
      let updated = false;

      this.db.mutate((d) => {
        const vid = d.videos.find(v => v.id === videoId);
        if (vid) {
          vid.views_count = (vid.views_count || 0) + 1;
          updated = true;
        }
      });

      return { success: updated, meta: { changes: updated ? 1 : 0, last_row_id: 0 } };
    }

    // Generic schema statements or no-op
    return { success: true, meta: { changes: 0, last_row_id: 0 } };
  }

  public async all<T = any>(): Promise<{ results: T[]; success: boolean }> {
    const s = this.sql.toUpperCase();
    const data = this.db.getRawData();

    // 1. SELECT * FROM videos WHERE LOWER(source_channel) = LOWER(?) or WHERE source_channel = ?
    if (s.includes('FROM VIDEOS') && s.includes('SOURCE_CHANNEL')) {
      const channelParam = (this.boundParams[0] || '').toLowerCase().replace('@', '');
      const filtered = data.videos.filter(v => 
        v.source_channel.toLowerCase().replace('@', '') === channelParam
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { results: filtered as unknown as T[], success: true };
    }

    // 1b. SELECT * FROM videos WHERE LOWER(tags) LIKE ? or caption LIKE ? (Hashtag Search)
    if (s.includes('FROM VIDEOS') && (s.includes('TAGS') || s.includes('HASHTAG') || s.includes('TAG'))) {
      const searchTag = (this.boundParams[0] || '').toLowerCase().replace(/[%#]/g, '').trim();
      const filtered = data.videos.filter(v => {
        const inTags = v.tags && v.tags.some(t => t.toLowerCase() === searchTag || t.toLowerCase().includes(searchTag));
        const inCaption = (v.caption || '').toLowerCase().includes('#' + searchTag) || (v.caption || '').toLowerCase().includes(searchTag);
        return inTags || inCaption;
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { results: filtered as unknown as T[], success: true };
    }

    // 2. SELECT * FROM videos ORDER BY RANDOM() LIMIT 10
    if (s.includes('SELECT * FROM VIDEOS') && s.includes('ORDER BY RANDOM()')) {
      // Shuffled copy
      const copy = [...data.videos];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      const limitMatch = s.match(/LIMIT\s+(\d+)/);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;
      return { results: copy.slice(0, limit) as unknown as T[], success: true };
    }

    // 3. Standard SELECT * FROM videos
    if (s.startsWith('SELECT * FROM VIDEOS')) {
      return { results: [...data.videos] as unknown as T[], success: true };
    }

    // 4. SELECT * FROM video_reactions WHERE video_id = ?
    if (s.includes('SELECT * FROM VIDEO_REACTIONS WHERE VIDEO_ID = ?')) {
      const vid = this.boundParams[0];
      const reactions = data.video_reactions.filter(r => r.video_id === vid);
      return { results: reactions as unknown as T[], success: true };
    }

    return { results: [] as T[], success: true };
  }

  public async first<T = any>(colName?: string): Promise<T | null> {
    const s = this.sql.toUpperCase();
    const data = this.db.getRawData();

    // 1. SELECT telegram_file_id FROM videos WHERE id = ?
    if (s.includes('FROM VIDEOS WHERE ID = ?')) {
      const videoId = this.boundParams[0];
      const found = data.videos.find(v => v.id === videoId);
      if (!found) return null;
      if (colName) {
        return (found as any)[colName] || null;
      }
      return found as unknown as T;
    }

    // 2. General fallback
    const res = await this.all<T>();
    if (res.results && res.results.length > 0) {
      return res.results[0];
    }
    return null;
  }
}

export const D1 = new D1Database();
