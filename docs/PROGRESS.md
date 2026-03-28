# PROGRESS.md — Current state (living document)

**Last updated:** 2026-03-28  
**Package name:** `second-brain-recall` (root `package.json`)

> Update this file after every merge-worthy milestone. **Accuracy over optimism.**

**Read first for coding:** this file. **Read for product contract:** `GOAL.md`.

---

## Alignment

**North Star:** `docs/GOAL.md` — **Autonomous Background Brain** (omni-channel ingest → Bento dashboard → optional pings + Mirror Memory).

**Current code path:** **`/connect`** chooses **simulated** iMessage sample vs real **paste / .txt export** (WeChat/WhatsApp/etc.) → same `POST /api/message` pipeline; dashboard lists items. Photon agent still separate from this ingest path.

---

## Done (verified in repo)

### Web — `web/`

- [x] Vite + React + TypeScript + Tailwind (`vite.config.ts` sets `root` to `web/`, build output to repo `dist/`)
- [x] Routes: Landing, Login, **`/connect`** (source picker + multiline ingest), Dashboard
- [x] Supabase Auth (client)
- [x] Ingest: `POST /api/message` with `content` + `source_type` (`text` | `url` | `chat_export` | `image`); list via `GET /api/knowledge_items/:userId`
- [x] Settings (Radix): Notion token + database ID on `users`

### API — `api/`

- [x] `app.ts` mounts routes; `server.ts` local dev (`PORT` default 3001); `index.ts` Vercel entry
- [x] `POST /api/message` — insert `knowledge_items` → LLM summarize → update row → optional Notion page
- [x] `GET /api/knowledge_items/:userId`
- [x] `GET /api/health`
- [x] `routes/auth.ts` — stubs only (TODO)

### Data — Supabase

- [x] `supabase/migrations/` — `users`, `knowledge_items`; `users.imessage_id` present (not wired to UI/agent)

### iMessage — `packages/imessage-agent/`

- [x] Workspace package name: **`imessage-agent`** (`npm run agent:start` = `-w imessage-agent`)
- [x] `@photon-ai/imessage-kit` — watch DM/group, trigger string, `getMessages`, `send`, `processRecall`
- [x] `ai-stub.ts` — no production LLM yet
- [x] Tests: `agent:test:imessage`, `agent:test:send`, `agent:test:watch`

### Tooling / deploy

- [x] ESLint ignores `packages/imessage-agent/**`
- [x] `.vercelignore` excludes `packages/imessage-agent`
- [x] Docs: **only** `GOAL.md` + `PROGRESS.md` (layout in **GOAL §5**)

---

## Gaps vs GOAL.md

| Gap | Notes |
|-----|--------|
| **MiniMax** | Wired in `api/services/llm.ts` (verify env in deploy). |
| **Structured JSON** | Zod in `api/services/extract.ts` on ingest. |
| **Citations / RAG** | No chunk store or grounded Q&A yet. |
| **Vision** | Screenshot card on `/connect` is **text/caption** only until MiniMax Vision is wired. |
| **Ingestion UX** | **`/connect`** covers simulated iMessage + exports + paste; not auto-reading WeChat backup folders. |
| **小红书 / TikTok 收藏** | **No** reliable third-party favorites API; UX = paste link + on-screen text; optional official **personal data** export (slow). Cards: `source_type` **`rednote`** \| **`tiktok`**. |
| **`chat.db`** | Not implemented. |
| **Agent ↔ API** | Optional: `SECOND_BRAIN_INGEST_ON_RECALL` POSTs transcript to `POST /api/message` (see `packages/imessage-agent/.env.example`). |
| **Auth API** | `/api/auth/*` unused; session is Supabase client-side. |
| **Secrets** | Supabase via **env** (`VITE_*` + `SUPABASE_SERVICE_KEY`); rotate if ever committed. |
| **Duplicate `.env`** | Prefer **one** root `.env` for `npm run dev` (nodemon cwd = repo root). Avoid relying on `api/.env` unless nodemon is changed to load it. |

---

## Suggested next tasks (priority)

1. **MiniMax** — wire API + agent `processRecall`; env + Vercel vars.
2. **JSON extraction** — Zod/schema for summary + `action_items` + `sources` on ingest.
3. **DB** — migration for chunks or extended columns (`source_type`, citations).
4. **Dashboard** — multiline paste or file → same pipeline.
5. **Demo fixtures** — optional `demo/` JSON + “Load sample” (clearly labeled).
6. **Agent → API** (optional) — service token or user JWT to persist iMessage recalls.
7. **`chat.db` script** — stretch only; document macOS + permissions here if built.

---

## Team Split (Hackathon)

### Person A — Data Pipeline
- [ ] Task 1: DB migration — add structured columns (`supabase/migrations/0001_enrich_knowledge_items.sql`)
- [ ] Task 2: MiniMax wiring — replace OpenAI, return structured JSON (`api/services/llm.ts`)
- [ ] Task 3: Zod extraction schema + parse helper (`api/services/extract.ts`)
- [ ] Task 4: Update ingestion route to store all new fields (`api/routes/message.ts`)
- [ ] Task 5: Demo fixtures for pitch (`demo/sample_data.json` + `demo/load-fixtures.ts`)

### Person B — Dashboard UX
- [ ] Bento box category filter tabs + item cards with category/location badges
- [ ] Recharts “Digital Diet” pie/bar chart (category breakdown)
- [x] Multiline paste + `.txt` load + source cards on **`/connect`** (maps to `source_type`)
- [ ] Mirror Memory chatbot widget (stretch)

> **Coordination:** Person A does Task 1 (DB migration) first — Person B is unblocked for card UI once schema is live. See API Contract below for the shared data shapes to code against.

---

## API Contract

Both teammates code against these TypeScript shapes. Person B can use them as types in the frontend immediately.

### `GET /api/knowledge_items/:userId` — item shape (after Task 1+4)
```typescript
interface KnowledgeItem {
  id: string;
  user_id: string;
  original_content_url: string;     // existing — raw input text/URL
  summary: string;                  // existing — 2-sentence summary
  category: 'Food' | 'Events' | 'Sports' | 'Ideas' | 'Medical' | null; // NEW (null = still processing)
  location_city: string | null;     // NEW — e.g. “Los Angeles”
  location_name: string | null;     // NEW — e.g. “Philz Coffee”
  action_items: { task: string; owner: string }[]; // NEW — always array, never null
  source_context: string | null;    // NEW — original snippet
  source_type: 'text' | 'url' | 'chat_export' | 'image' | 'rednote' | 'tiktok'; // default 'text'
  notion_page_id: string | null;    // existing
  created_at: string;               // existing
}
```

### `POST /api/message` — request body (after Task 4)
```typescript
interface MessageRequest {
  userId: string;    // required
  type: string;      // required (keep for now)
  content: string;   // required — text, URL, or multiline chat dump
  source_type?: 'text' | 'url' | 'chat_export' | 'image' | 'rednote' | 'tiktok'; // optional
}
```

### Frontend notes for Person B
- `category: null` = item still being processed by LLM — show a pending/loading badge
- `action_items` is always an array — safe to `.map()` without null check
- Render `location_city` / `location_name` conditionally (both can be null)

---

## Environment variables

**Root** (see `.env.example`) — loaded by `api/server.ts` via `dotenv` when cwd is repo root:

- `OPENAI_API_KEY` — current summarizer  
- `PORT` — optional; default `3001`  

**Vercel:** set the same keys (and future MiniMax vars) in the project dashboard.

**Agent** — `packages/imessage-agent/.env`: `RECALL_TRIGGER`, `MAX_MESSAGES`, optional **`SECOND_BRAIN_API_URL`**, **`SECOND_BRAIN_USER_ID`**, **`SECOND_BRAIN_INGEST_ON_RECALL`**.

**Bulk local ingest (WeChat backup dirs, exported `.txt`, notes)** — not model training; each file chunk hits **MiniMax** via `POST /api/message`. Start API first, then:

```bash
USER_ID=<auth.users uuid> npm run ingest:local -- "/path/to/wechat/.../files" ~/exports
# dry run: add --dry-run
```

**Where to put files:** see **`data/README.md`** (fixtures vs `data/samples/` vs gitignored **`data/local/`**).

---

## Commands

```bash
npm install
cp .env.example .env          # API keys at repo root for local dev
npm run dev                   # Vite (web/) + Express :3001

# Seed DB from folders of .txt / .md / .log (API must be up)
USER_ID=<uuid> npm run ingest:local -- --dry-run "/path/to/folder"
USER_ID=<uuid> npm run ingest:local -- "/path/to/wechat/Backup/.../files"

# macOS only — Photon agent; copy .env and set SECOND_BRAIN_* to match local API + USER_ID
cp packages/imessage-agent/.env.example packages/imessage-agent/.env
npm run agent:start
```

Other useful scripts: `npm run build`, `npm run check`, `npm run lint`, `npm run agent:dev`, `npm run agent:test:imessage`, `npm run demo:load`.

---

## Decisions / blockers (edit during hackathon)

| Topic | Status | Notes |
|-------|--------|--------|
| MiniMax model + base URL | Open | Keys in Vercel + local `.env` |
| OpenAI allowed alongside MiniMax? | Open | Confirm rules |
| Link `imessage_id` to users | Open | Column exists |
| UI product name | Open | Align with “copilot” / “recall” pitch |

---

## Changelog

- **2026-03-28** — **`data/README.md` §2b**: optional [WeFlow](https://github.com/hicccc77/WeFlow) export → **`ingest:local`**; notes on Backup folder vs live WeChat 4.0 + DB connection.
- **2026-03-28** — **`npm run ingest:seed`**: `--mode db` (direct `knowledge_items` insert) or `--mode api` (MiniMax via `POST /api/message`); reads **`data/output/seed_posts.json`**.
- **2026-03-28** — **`scripts/ingest/parse_cn_us_posts.py`**: `data/raw_posts/*.txt` → **`data/output/seed_posts.json`** (rule-based 标题/城市/店名/标签/category/vibes/signals); **`npm run ingest:parse-cn`**.
- **2026-03-28** — **`data/`** layout + **`data/README.md`** (samples, fixtures, local-only exports); **`scripts/ingest/`** placeholder for download parsers.
- **2026-03-28** — **`/connect`**: 小红书 / TikTok 收藏夹 cards (`rednote` / `tiktok` source types); honest paste-first story vs favorites API.
- **2026-03-28** — **`scripts/bulk-ingest-local.ts`** + **`npm run ingest:local`**; Photon agent optional **`SECOND_BRAIN_*`** forward to `POST /api/message`.
- **2026-03-28** — Added **`/connect`** ingestion UX (simulated iMessage + export/paste paths, honest demo copy); login lands on Connect; **PROGRESS** aligned with **GOAL** Feature 1.
- **2026-03-28** — Refreshed **GOAL** + **PROGRESS**: deploy/env sections, gap table, workspace naming, doc policy.  
- **2026-03-28** — Docs trimmed to two files; monorepo `web/`, `api/`, `packages/imessage-agent/`.
