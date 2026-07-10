## Purely Health Nutra — Intelligent Product Recommendation Assistant

Upgrade the existing site-wide AI chat into an evidence-informed, RAG-powered health product recommender that only ever recommends products sold in our store.

---

### 1. NVIDIA NIM as primary provider (env-driven)

Rewire the chat backend to call NVIDIA NIM using env vars only — no hardcoded keys, URLs, or model names.

- Environment variables read server-side (edge function):
  - `NVIDIA_API_KEY_1` (primary key, already stored)
  - `NVIDIA_API_KEY_1_BASE_URL` (primary base URL, already stored)
  - `NVIDIA_API_KEY_2` + `NVIDIA_API_KEY_2_BASE_URL` (fallback endpoint)
  - New: `NVIDIA_MODEL_PRIMARY` (e.g. Nemotron Mini v2.5 free) — added via `set_secret`
  - New: `NVIDIA_MODEL_FALLBACK` (another NVIDIA free model)
- Primary → fallback logic: try primary model on primary endpoint, then primary model on fallback endpoint, then fallback model. Log each hop.
- Keep existing z.ai chain wired as a last-resort safety net so live customer chat never dies mid-conversation.

### 2. Unify every chat surface on the new backend

Currently the widget and pages route through `zai-chat` → `ai-orchestrator`. New flow:

- New edge function: `nvidia-chat` (streaming SSE, OpenAI-compatible payload, verify_jwt = false since it's public customer chat).
- Existing wrappers (`zai-chat`, `customer-ai`, `onemin-chat`) become thin proxies to `nvidia-chat` so the floating widget, `AIAssistantWidget`, product-page chat, hub Assistant page, mobile, and desktop all hit the same backend without changing any React code.
- Preserve the existing knowledge-base + product-context injection that `zai-chat` already does.

### 3. RAG knowledgebase (pgvector)

Build a real retrieval layer instead of the current "top 10 KB rows" stuffing.

- New table `kb_chunks` with `content text`, `embedding vector(1536)`, `source_type`, `source_id`, `url`, `title`, `metadata jsonb`, HNSW cosine index. Grants + RLS: `service_role` full, `authenticated`/`anon` SELECT (chunks are already public content).
- New `match_kb_chunks(query_embedding, match_count)` SQL function for similarity search.
- Indexer edge function `kb-index` (admin-only) that chunks and embeds:
  - Active products (name, short + long description, ingredients, price, stock, slug).
  - Categories.
  - Published blog posts.
  - Published CMS pages (About, Shipping, Refund, Store policies, Contact, FAQ, learn/hub pages).
  - Existing `knowledge_base` rows.
- Embeddings via Lovable AI Gateway (`google/gemini-embedding-001`, 1536-dim via `dimensions` param on the OpenAI models is not applicable — use `openai/text-embedding-3-small` at 1536 to match column).
- Auto-refresh: Postgres trigger on `products`, `blog_posts`, `pages` writes into a `kb_index_queue` table; a scheduled `kb-index-worker` (pg_cron every 15 min) drains the queue and re-embeds changed rows. Also a manual "Reindex" button in admin.
- Cache: in-memory LRU on the edge function instance keyed by query embedding hash (1 h TTL).

### 4. Recommendation engine + safety guardrails

Inside `nvidia-chat`:

- Retrieve top-k KB chunks + top-k in-stock products for the user query.
- System prompt enforces: only recommend items present in the retrieved product context, never suggest competitors or external brands, never diagnose, never claim to cure Cancer / Diabetes / autoimmune / heart / mental illness — use "may support / can assist / traditionally used / may contribute" phrasing, and always recommend a healthcare professional for serious symptoms.
- Structured follow-up flow: if the user reports a symptom cluster (stomach issues, bloating, low immunity, etc.), the assistant asks the clarifying questions before recommending.
- Response shape the assistant is prompted to emit when recommending:
  - Primary recommendation + why
  - Secondary recommendation (optional) + why
  - Lifestyle / diet / hydration advice
  - Safety disclaimer when applicable
- Product references returned as inline markdown links to `/product/<slug>` so the widget's existing markdown renderer shows image, price, stock, and add-to-cart via a lightweight `ProductRecommendationCard` component.

### 5. Widget UX upgrades (minimal, presentation only)

- `AIAssistantWidget`: detect `[[product:slug]]` tokens in streamed text and render `ProductRecommendationCard` (image, price, in-stock badge, View / Add to cart). Falls back to plain link if slug not found.
- Ensure widget mounts on: `Index`, `Products`, `ProductDetail`, `Blog`, `BlogPostDetail`, `Contact`, `hub/*`, `learn/*`, and admin-excluded routes. Verify mobile drawer + desktop popover both call the same hook.

### 6. Testing & deployment report

Automated Playwright + curl checks I will run after implementing:

- `curl_edge_functions` POST `/nvidia-chat` with a symptom prompt — assert SSE tokens stream and response mentions a real product slug from `products`.
- Confirm failover: temporarily unset primary model env in a test payload flag and assert fallback path returns 200.
- Playwright headless on `http://localhost:8080`: open Home, open floating widget, send "I have bloating and constipation, what do you recommend?", screenshot the reply, assert a product card renders with a working `/product/...` link.
- Repeat on mobile viewport (`375x812`).
- Product page (`/product/<slug>`): open widget, ask "is this good for gut health?", assert response references that product.
- Error handling: send malformed body, assert 400 + JSON error; simulate NVIDIA 500 by pointing to a bad base URL in a one-off test → assert graceful fallback message.
- Log every failure and iterate until green, then produce a short deployment report in chat.

---

### Technical section

**Edge functions to add:** `nvidia-chat`, `kb-index`, `kb-index-worker`, `kb-search` (internal helper reused by `nvidia-chat`).
**Edge functions to modify:** `zai-chat`, `customer-ai`, `onemin-chat` (thin proxies), `ai-orchestrator` (add NVIDIA branch before z.ai fallback).
**DB migration:** enable `vector`; create `kb_chunks`, `kb_index_queue`, triggers on `products/blog_posts/pages`, `match_kb_chunks` function, pg_cron schedule; grants per the public-schema rule.
**Secrets to add:** `NVIDIA_MODEL_PRIMARY`, `NVIDIA_MODEL_FALLBACK` (via `set_secret` — you tell me the exact model IDs, or I use sensible NVIDIA-free defaults: `nvidia/nemotron-mini-4b-instruct` primary, `meta/llama-3.1-8b-instruct` fallback).
**Frontend files touched:** `src/components/ai/AIAssistantWidget.tsx` (product-card rendering only), new `src/components/ai/ProductRecommendationCard.tsx`, small admin "Reindex knowledgebase" button in `src/pages/admin/KnowledgeBase.tsx`.
**No changes to:** payments, checkout, orders, auth, existing product/blog CRUD.

---

### Two things I need from you before I start

1. Confirm the exact NVIDIA model IDs for `NVIDIA_MODEL_PRIMARY` and `NVIDIA_MODEL_FALLBACK` (or say "use your defaults" and I'll pick two NVIDIA-hosted free models).
2. Confirm you want the RAG index to include every published blog post and CMS page (yes/no) — this affects embed cost on the first backfill (~100 chunks currently, negligible).

Once you confirm, I'll implement all of the above in one pass, run the automated test suite, iterate until green, and hand back the deployment report.
