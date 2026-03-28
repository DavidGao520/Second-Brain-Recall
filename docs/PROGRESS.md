# PROGRESS.md — Current state (living document)

**Last updated:** 2026-03-28  
**Package name:** `second-brain-recall` (root `package.json`)

> Update this file after every merge-worthy milestone. **Accuracy over optimism.**

**Read first for coding:** this file. **Read for product contract:** `GOAL.md`.

---

## Alignment

**North Star:** `docs/GOAL.md` — **Deep-Context Social Copilot** (catch-up + grounded recall + export).

**Current code path:** Recall-style **web dashboard** + **Express API** + **Photon iMessage agent**. Close gaps to **GOAL** via MiniMax, structured extraction, citations, and ingestion UX.

---

## Done (verified in repo)

### Web — `web/`

- [x] Vite + React + TypeScript + Tailwind (`vite.config.ts` sets `root` to `web/`, build output to repo `dist/`)
- [x] Routes: Landing, Login, Dashboard
- [x] Supabase Auth (client)
- [x] Dashboard: POST body `content` (URL/text) → `/api/message`; list via `GET /api/knowledge_items/:userId`
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
| **MiniMax** | Event expects MiniMax in product; summarize path is still **OpenAI** in `api/services/llm.ts`. |
| **Structured JSON** | No enforced schema for actions/sources on ingest. |
| **Citations / RAG** | No chunk store or grounded Q&A. |
| **Ingestion UX** | No first-class paste/upload of long chats (only string `content` on dashboard). |
| **`chat.db`** | Not implemented. |
| **Agent ↔ API** | Agent is a **separate process**; no authenticated HTTP from agent to `api/` yet. |
| **Auth API** | `/api/auth/*` unused; session is Supabase client-side. |
| **Secrets** | Move Supabase URL/keys to **env** (`VITE_*` + server service role); rotate if ever committed. |
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
- [ ] Multiline paste textarea + file upload UI (maps to `source_type`)
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
  source_type: 'text' | 'url' | 'chat_export' | 'image'; // NEW — default 'text'
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
  source_type?: 'text' | 'url' | 'chat_export' | 'image'; // optional, defaults to 'text'
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

**Agent** — `packages/imessage-agent/.env` from that folder’s `.env.example` (`RECALL_TRIGGER`, `MAX_MESSAGES`, `MY_PHONE`, future LLM keys).

---

## Commands

```bash
npm install
cp .env.example .env          # API keys at repo root for local dev
npm run dev                   # Vite (web/) + Express :3001

# macOS only
cp packages/imessage-agent/.env.example packages/imessage-agent/.env
npm run agent:start
```

Other useful scripts: `npm run build`, `npm run check`, `npm run lint`, `npm run agent:dev`, `npm run agent:test:imessage`.

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

- **2026-03-28** — Refreshed **GOAL** + **PROGRESS**: deploy/env sections, gap table, workspace naming, doc policy.  
- **2026-03-28** — Docs trimmed to two files; monorepo `web/`, `api/`, `packages/imessage-agent/`.
