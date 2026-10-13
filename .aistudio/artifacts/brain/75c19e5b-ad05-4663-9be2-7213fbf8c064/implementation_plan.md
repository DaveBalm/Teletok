# Implementation Plan: Admin Bulk TXT Ingest & Embedded Video Player

## Overview
This plan establishes a comprehensive **Admin Bulk TXT Ingest** feature that allows admins to upload or paste a `.txt` file containing video URLs, embed iframe codes, and BBCode snippets (such as exported from video sharing platforms like SpankBang, YouTube, TikTok, or direct stream links). The system automatically parses, cleans, and converts these links into TeleTok feed items with title extraction, tags, responsive iframe/HTML5 playback, and D1 database persistence.

---

## 1. Supported Input Formats in TXT Files
The parser will intelligently handle dirty exports containing multiple formats in a single block or line-by-line:
1. **Raw / Direct URLs**: e.g., `https://spankbang.com/5rs5e/video/she+top+3+for+sure`
2. **Iframe Embed Snippets**: e.g., `<iframe src="https://spankbang.com/5rs5e/embed/" frameborder="0" scrolling="no" width="100%" height="100%" allowfullscreen></iframe>`
3. **BBCode Snippets**: e.g., `[url=https://spankbang.com/5rs5e/video/she+top+3+for+sure]She top 3 for sure[/url]`
4. **Copy-paste clutter stripping**: Automatically trims boilerplate such as `Sharing Links`, `Direct link`, `Copy Embed code`, `Copy BB Code`, and duplicate `Copy` tokens.
5. **Slug & Title Extraction**: Converts URL slugs (e.g., `she+top+3+for+sure`) and BBCode link text into human-readable captions and auto-generated hashtags.

---

## 2. Proposed Architecture & Schema Updates

### Database & Types (`src/types.ts` & `d1-engine.ts`)
- Extend `VideoRecord` with:
  - `embed_url?: string` — Direct URL intended for `<iframe>` rendering (e.g. `https://spankbang.com/5rs5e/embed/`)
  - `is_embed?: boolean` — Flag indicating whether to use an iframe embed or standard HTML5 `<video>` tag
  - `embed_type?: 'iframe' | 'direct' | 'telegram'`
- Update Cloudflare D1 tables (`schema.sql` and `d1-engine.ts` memory store) to persist `embed_url`, `is_embed`, and `embed_type`.

### Backend API (`server.ts` & `worker.js`)
- **`POST /api/admin/bulk-import`**:
  - Accepts an array of parsed video objects: `{ embed_url, stream_url, caption, source_channel, tags, duration, is_embed }`
  - Validates and performs batch `INSERT INTO videos` in Cloudflare D1
  - Emits real-time WebSocket notifications (`video:new`) so the feed updates instantly
  - Returns count of inserted items and list of inserted video records

---

## 3. UI & Frontend Implementation

### Admin Interface (`src/components/CuratorBotModal.tsx`)
- Add a new dedicated **"Bulk TXT Ingest"** tab alongside the single-item Simulator and Code tabs.
- **Drag & Drop / File Selector**: Upload `.txt` files directly or paste raw text into a syntax-highlighted textarea.
- **Auto-Detection & Parser Preview**:
  - Live table preview of parsed videos before committing to database.
  - Visual badge for each detected entry (`iframe embed`, `BBCode`, `direct URL`).
  - Extracted caption and generated hashtags with editable fields.
  - Preview card modal to test the embed player before importing.
- **Batch Metadata Configuration**:
  - Target Channel override (e.g. `@spankbang_curated` or `@web_highlights`).
  - Additional batch tags (e.g. `#embed #viral`).
- **One-Click Import Action**:
  - Animated progress indicator showing batch ingestion progress.
  - Auto-refreshes the main feed upon completion.

### Feed Video Player Enhancement (`src/components/VideoCard.tsx`)
- Add hybrid player rendering:
  - **Native `<video>` player**: Used for Telegram MP4 files and direct video URLs (with tap-to-pause, volume toggle, progress bar).
  - **Embedded `<iframe>` player**: When `video.is_embed` is true or an `embed_url` is present:
    - Renders a responsive, full-height sandboxed iframe with `allow="autoplay; fullscreen; encrypted-media"`.
    - Preserves TikTok overlay UI (caption with clickable hashtags, channel avatar, like/fire/laugh reaction buttons, comment drawer, share button).
    - Provides smooth fallback and load states.

---

## 4. Verification Plan

1. **Parser Unit Verification**: Test all user-provided sample strings (iframe tag, direct link, BBCode snippet, multi-line dirty text) to ensure clean extraction of embed URLs and captions.
2. **Batch Import Test**: Upload sample `.txt` file in the Admin modal, verify successful insertion into D1 and immediate display in the TikTok feed.
3. **Embed Playback Test**: Verify `VideoCard` renders the embedded iframe smoothly with correct vertical scaling and responsive constraints.
4. **Build & Lint Verification**: Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
