-- ============================================================================
-- TeleTok Cloudflare D1 Database Schema & Migration
-- Supports Telegram Video Ingestion, Reactions, Channel Feeds & Hashtag Search
-- ============================================================================

-- 1. Videos catalog
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,               -- Unique UUID (e.g. vid-ocean-surf-02)
    telegram_file_id TEXT NOT NULL,    -- Telegram File ID from Bot API
    caption TEXT,                      -- Video description / title
    source_channel TEXT,               -- Channel handle or title (e.g. surflife_daily)
    file_size INTEGER,                 -- Size in bytes
    duration INTEGER,                  -- Duration in seconds
    likes_count INTEGER DEFAULT 0,     -- Cached count of likes
    views_count INTEGER DEFAULT 0,     -- Cached count of views
    tags TEXT,                         -- JSON array of parsed hashtags (e.g. ["surf","pipeline"])
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Reactions & Interactions (Unique constraint prevents spam)
CREATE TABLE IF NOT EXISTS video_reactions (
    id TEXT PRIMARY KEY,               -- UUID
    video_id TEXT NOT NULL,            -- Reference to videos.id
    user_id TEXT NOT NULL,             -- Telegram User ID (e.g. tg_12345678)
    reaction_type TEXT NOT NULL,       -- 'like', 'fire', 'heart', 'laugh'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE(video_id, user_id, reaction_type)
);

-- 3. Comments (Community discussion drawer)
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,               -- UUID
    video_id TEXT NOT NULL,            -- Reference to videos.id
    user_id TEXT NOT NULL,             -- Telegram User ID
    user_name TEXT NOT NULL,           -- Display name
    user_photo TEXT,                   -- Avatar URL
    text TEXT NOT NULL,                -- Comment text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 4. Indexes for rapid queries
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(source_channel);
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos(tags);
CREATE INDEX IF NOT EXISTS idx_reactions_video_user ON video_reactions(video_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
