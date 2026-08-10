# ElectraStore

ElectraStore is split into three independently deployable applications:

- `clientFrontend`: shopper experience, cart, checkout, and customer assistant.
- `adminFrontend`: authenticated seller dashboard and product/order management.
- `backend`: Express, MongoDB, Cloudinary, authentication, orders, and the OpenRouter RAG assistant.

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

## OpenRouter assistant and RAG

The chatbot uses OpenRouter for both tool-capable chat completion and embeddings. Add these values to `backend/.env`:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openrouter/free
OPENROUTER_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

After MongoDB is running, build the initial knowledge index:

```text
cd backend
npm run rag:index
```

The index includes live products and the maintained FAQ entries in `backend/data/knowledge.json`. Product creation and editing schedule an embedding refresh automatically, while product deletion removes its knowledge chunk. Re-run `npm run rag:index` after changing the embedding model or editing the static knowledge file.

Email verification requires the SMTP settings in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) and `CLIENT_APP_URL`. In local development it is bypassed when that configuration is incomplete; production remains fail-closed.

## Architecture notes

The browser only calls `/assistant/chat`; OpenRouter credentials remain server-side. Product reads support pagination and search query parameters. Order totals are recalculated from catalog prices on the server, and seller/customer routes are protected by role-aware JWT middleware.

The assistant uses a bounded OpenRouter function-calling loop. `searchProducts` and `getProductDetails` resolve requests against MongoDB, and the model can request typed browser actions for `addToCart`, `openProduct`, `openCart`, or `checkoutOrder`. Authenticated buyers can also use `getMyAccount`, `getMyOrders`, and `getMyOrder`; these tools derive identity exclusively from the signed session and never accept a buyer ID. Product IDs are validated by the backend before an action is returned. RAG embeddings are stored in MongoDB and ranked with cosine similarity, which is appropriate for the current small catalog; a production-scale deployment can replace that retrieval step with MongoDB Atlas Vector Search.
