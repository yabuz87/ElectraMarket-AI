# ElectraStore

ElectraStore is split into three independently deployable applications:

- `clientFrontend`: shopper experience, cart, checkout, and customer assistant.
- `adminFrontend`: authenticated seller dashboard and product/order management.
- `backend`: Express, MongoDB, Cloudinary, authentication, orders, and the Gemini assistant endpoint.

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

Email verification requires the SMTP settings in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) and `CLIENT_APP_URL`. New buyers receive a 30-minute verification link and cannot log in until it is used.

## Architecture notes

The browser only calls the backend assistant endpoint; Gemini credentials remain server-side. Product reads support pagination and search query parameters. Order totals are recalculated from catalog prices on the server, and seller/customer routes are protected by role-aware JWT middleware.

The assistant endpoint now uses server-side Gemini function calling. `searchProducts` resolves natural-language requests against the catalog, and the model can request `addToCart`, `openProduct`, `openCart`, or `checkoutOrder`. Search results and product IDs are always loaded and validated by the backend; the model cannot invent catalog data. The browser should execute the returned UI actions (cart and navigation), while checkout/order mutation remains subject to the normal authenticated checkout flow.

The next RAG phase should add a server-side ingestion job and vector store, then expose semantic retrieval as another tool in this orchestration. Keep tool declarations narrow and validate every mutating action at the application boundary.
