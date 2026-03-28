# GOAL.md — North Star (Architectural Blueprint)

**Audience:** Human team + AI coding agents (TRAE, Cursor, etc.)

**Canonical docs in this repo:** only **`GOAL.md`** (this file) and **`PROGRESS.md`**. Do not add parallel architecture files without folding them here or into **PROGRESS**.

---

## Rules of engagement

- **GOAL.md** is the **immutable product + architecture contract** unless a **human** explicitly changes it.
- **Before writing code:** read **`docs/PROGRESS.md`** (live state, blockers, next task).
- **After a merge-worthy milestone:** update **`docs/PROGRESS.md`** (done / in progress / blocked).
- Prefer **small, shippable steps** over features that depend on **non-existent consumer APIs** (bulk chat history OAuth, etc.).

---

## 1. Core directives for AI agents

**Role:** Expert full-stack + AI systems architect; ship a **hackathon-grade**, **honest** product.

**Architecture**

- **Skinny controllers** — orchestration and vendor calls live in **`api/services/`** (and the same idea in **`packages/imessage-agent/`** for messaging-side logic).
- **Primary runtime LLM (event rules):** **MiniMax** — prefer **strict JSON** for extraction (summary, `action_items[]`, `sources[]`) so storage and UI stay predictable. *(See **PROGRESS.md** for what is wired today.)*

**Hackathon narrative (align pitch + code)**

- **TRAE** as primary IDE (`@Chat` / `@Builder` where applicable).
- **At least one MiniMax API** in the shipped product.
- **Photon / iMessage** = optional **bonus track** — macOS agent in **`packages/imessage-agent/`**.

---

## 2. Vision and product direction

### 2.1 Problem (wedge)

Generic summaries (OS, email) fail for **messy, multi-platform** coordination: long group chats, links, screenshots, and half-formed plans **disappear** from working memory.

### 2.2 Solution (positioning)

**Deep-Context Social Copilot:** combines **personalized context** with **actionable, retrievable memory** — catch-up, recall, next steps, export.

### 2.3 Idea evolution (context for agents)

| Stage | Idea | Critique |
|-------|------|----------|
| v1 | Decision Maker — persona/values | Crowded; generic “persona bot” risk |
| v2 | Recall — second brain for chats | Crowded vs OS summaries |
| **Target** | **Deep-Context Social Copilot** | Wins if **grounding**, **next steps**, **honest data paths** are obvious |

---

## 3. Core user stories

### 3.1 “Catch me up”

User returns to a noisy thread; agent summarizes **what they missed**, **next steps for them**, with **sources** (excerpts, uploads, or **labeled demo fixtures** — never fake “official API” claims).

### 3.2 “Cross-platform recall”

User asks e.g. *“What was that place in LA?”* — agent retrieves from **ingested memory** with **citations**. MVP inputs: **paste, export, upload, local Mac paths** — not imaginary TikTok/iMessage OAuth.

### 3.3 “Export and execute”

Structured output (tasks, decisions, owners where known) → **Notion** (in codebase) and/or copy-friendly formats.

---

## 4. Technical stack and constraints

### 4.1 Stack (target vs repo)

| Layer | Choice |
|--------|--------|
| IDE / story | **TRAE** |
| Runtime LLM | **MiniMax** (required by event; verify **PROGRESS** for current provider) |
| Messaging bonus | **Photon** — **`packages/imessage-agent/`**, macOS |
| Frontend | **React + Vite + Tailwind** — **`web/`** |
| HTTP API | **Node + Express** — **`api/`** |
| Database | **Supabase (Postgres)** — schema in **`supabase/migrations/`** |

### 4.2 Data ingestion (honest MVP)

1. **Photon** — live watch / send / recent messages on Mac (+ permissions as required).  
2. **Optional `chat.db`** — only if explicitly built; fragile; document in **PROGRESS**.  
3. **User export / paste / upload** — preferred for reproducible demos.  
4. **Staged fixtures** — OK if **disclosed** in UI and pitch.

**Unacceptable claims:** “We read all your WhatsApp/WeChat/iMessage via official consumer APIs” when those do not exist for this use case.

### 4.3 Platform reality (short)

- **iMessage:** no general third-party bulk-history API; **Photon** (and optional local tooling) are the real paths.  
- **WhatsApp / WeChat:** consumer history APIs are not available like a normal SaaS integration — exports / paste / extensions with consent, scoped to time.  
- **TikTok Data Portability:** approval-heavy; **not** hackathon-critical path.

### 4.4 Deployment (Vercel)

- **Frontend:** Vite build output → repo root **`dist/`** (see **`web/vite.config.ts`**).  
- **API:** **`api/index.ts`** as serverless handler; **`vercel.json`** rewrites **`/api/*`** → that function and **`/*`** → **`index.html`**.  
- **`packages/imessage-agent/`** is **not** part of the Vercel deployment (see **`.vercelignore`**).  
- **Secrets:** set in Vercel Project → Environment Variables (e.g. `OPENAI_API_KEY` today; MiniMax keys when added). **Never commit secrets.**

---

## 5. Repository layout (monorepo)

```
second-brain-recall/
├── docs/
│   ├── GOAL.md          ← this file (North Star)
│   └── PROGRESS.md      ← living build state — update after milestones
├── web/                 ← frontend (Vite root); build → ../dist
├── api/                 ← Express; server.ts (local), index.ts (Vercel)
├── packages/
│   └── imessage-agent/  ← Photon agent; npm workspace: imessage-agent
├── supabase/migrations/
├── vercel.json
├── .env.example         ← API-oriented vars; agent has its own .env.example
└── package.json         ← workspaces: packages/*
```

**`.vercel/`** — local link to Vercel project (CLI); optional to commit for team alignment.

**`.trae/`** — **gitignored** TRAE Solo scratch; do not treat as source of truth.

**MVC mapping**

| Layer | Path |
|--------|------|
| View | `web/src/`, `web/public/` |
| Controller | `api/routes/`, `api/app.ts` |
| Model | `supabase/migrations/`, `api/lib/supabase.ts` |
| Services | `api/services/` |
| Messaging | `packages/imessage-agent/` |

**Rule:** add domain logic in **`api/services/`** first; routes validate and delegate.

---

## 6. Execution rules for AI agents

1. Read **`docs/PROGRESS.md` first** — do not assume MiniMax, RAG, or `chat.db` exist until checked there.  
2. Keep route handlers thin; services own orchestration.  
3. Prefer **structured LLM outputs** when extracting facts for storage.  
4. Update **PROGRESS.md** after meaningful changes.  
5. **No secrets in Git** — env only; rotate leaked keys before public repo.

---

## 7. UX north star vs honesty

Ideal UX is “connect everything in one click.” **Build** either a **real** path (Photon, exports, optional local ingest) or a **transparent** simulated onboarding — never silent fake enterprise integrations.

---

*End of GOAL.md*
