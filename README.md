# ElectraStore

ElectraStore is split into three independently deployable applications:

- `clientFrontend`: mobile-first public listing discovery, owner contact details, sharing, likes, comments, and the assistant.
- `adminFrontend`: authenticated seller profile, listing management, and engagement analytics.
- `backend`: Express, MongoDB, Cloudinary, authentication, listing engagement, and the OpenRouter RAG assistant.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and fill in the values.
2. Copy each frontend `.env.example` to `.env.local` if the API is not on `http://localhost:4500`.
3. Install dependencies and run each app from its folder:

```text
backend:        npm install && npm run dev
clientFrontend: npm install && npm start
adminFrontend:  npm install && npm start
```

The API exposes `/health` for deployment probes. The production frontend builds are created with `npm run build` in their respective folders.

New products automatically belong to the authenticated seller. If this database contains products created before ownership was introduced, preview and then run the explicit migration for the correct seller account:

```text
cd backend
npm run migrate:legacy-owner -- --seller-email=owner@example.com
npm run migrate:legacy-owner -- --seller-email=owner@example.com --apply
```

The command is dry-run by default and changes only products whose `salerId` is missing.

## OpenRouter assistant and RAG

The chatbot uses OpenRouter for both tool-capable chat completion and embeddings. Add these values to `backend/.env`:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openrouter/free
OPENROUTER_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_WEB_SEARCH_ENABLED=false
OPENROUTER_WEB_SEARCH_ENGINE=auto
OPENROUTER_WEB_SEARCH_MAX_RESULTS=3
```

After MongoDB is running, build the initial knowledge index:

```text
cd backend
npm run rag:index
```

The index includes live products and the maintained FAQ entries in `backend/data/knowledge.json`. Product creation and editing schedule an embedding refresh automatically, while product deletion removes its knowledge chunk. Re-run `npm run rag:index` after changing the embedding model or editing the static knowledge file.

Email verification requires the SMTP settings in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) and `CLIENT_APP_URL`. In local development it is bypassed when that configuration is incomplete; production remains fail-closed.

## Architecture notes

The browser only calls `/assistant/chat`; OpenRouter credentials remain server-side. Product reads support pagination and search query parameters. Seller and viewer mutations are protected by role-aware JWT middleware. ElectraStore intentionally does not expose cart, checkout, payment, shipping, or order APIs; viewers contact listing owners directly.

For every prompt, an LLM judge selects one primary pipeline: database function calling, RAG, OpenRouter web search, or the base LLM. Function results and the top three RAG documents are returned to the LLM for a natural final answer. If the chosen pipeline has no usable result, the base LLM provides a transparent fallback without inventing store data. Mutating tools remain limited to explicit signed-in like/unlike/comment requests.

Web search uses OpenRouter's `openrouter:web_search` server tool and is disabled by default because search requests have a separate cost even with free chat models. Set `OPENROUTER_WEB_SEARCH_ENABLED=true` to enable it. Search is capped at one use and three results per prompt.

`searchProducts` and `getProductDetails` resolve live MongoDB data; `openProduct` navigates to a listing. `getMyAccount` derives identity exclusively from the session. RAG embeddings are stored in MongoDB and ranked with hybrid semantic and lexical similarity; a production-scale deployment can replace retrieval with MongoDB Atlas Vector Search.
