# Production deployment

ElectraMarket AI can run as three independent services or as one Docker Compose stack. The public marketplace is a Next.js server, the seller dashboard is a static site, and the API is a stateless Express service backed by MongoDB, Redis, and Cloudinary.

## Fast production smoke test

Install Docker Desktop, copy `.env.production.example` to `.env.production`, replace every placeholder, then run:

```powershell
docker compose --env-file .env.production up --build -d
docker compose ps
```

Open the marketplace at `http://localhost:3000`, the seller dashboard at `http://localhost:3001`, and the API readiness endpoint at `http://localhost:4500/health/ready`.

Stop the stack without deleting its database volumes:

```powershell
docker compose down
```

## Recommended public layout

Use separate deploy targets so each tier can scale independently:

| Component | Runtime | Required public hostname |
| --- | --- | --- |
| `clientFrontend` | Node 20, Next.js standalone server | `www.example.com` |
| `adminFrontend` | Static hosting or its Nginx container | `admin.example.com` |
| `backend` | Node 20 container, one or more replicas | `api.example.com` |
| MongoDB | Managed replica set | Private connection string |
| Redis | Managed Redis with TLS | Private connection string |

The public client can be imported into a Next.js host using `clientFrontend` as its root directory. The backend and admin dashboard can be built directly from their Dockerfiles on any container host. Set the backend health check to `/health/ready`; use `/health/live` only as the process liveness probe.

## Production environment map

### Public client

```env
NEXT_PUBLIC_API_URL=https://api.example.com
API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
REVALIDATE_SECRET=<same-long-random-value-as-backend>
```

`NEXT_PUBLIC_*` values are embedded during the build, so rebuild after changing a hostname.

### Seller dashboard

```env
REACT_APP_API_URL=https://api.example.com
```

This value is also embedded during the build.

### API

Start from `backend/.env.example` and use production values. At minimum, configure:

```env
NODE_ENV=production
CLIENT_ORIGINS=https://www.example.com,https://admin.example.com
CLIENT_APP_URL=https://www.example.com
MONGODB_URI=<managed-mongodb-uri>
REDIS_URL=<managed-redis-uri>
JWT_SECRET=<long-random-secret>
FRONTEND_REVALIDATE_URL=https://www.example.com/api/revalidate
REVALIDATE_SECRET=<same-value-as-public-client>
CLOUDINARY_NAME=<value>
CLOUDINARY_API_KEY=<value>
CLOUDINARY_API_SECRET=<value>
OPENROUTER_API_KEY=<value>
OPENROUTER_MODEL=<model-id>
OPENROUTER_EMBEDDING_MODEL=<embedding-model-id>
```

Configure SMTP before requiring production email verification. Never expose `JWT_SECRET`, OpenRouter, Cloudinary, SMTP, MongoDB, Redis, or revalidation secrets through a `NEXT_PUBLIC_*` or `REACT_APP_*` variable.

## Load balancing and scaling

The API does not require sticky sessions. Authentication is token-based, images live in Cloudinary, and Redis shares rate-limit counters and product events between replicas. A load balancer can therefore distribute traffic across two or more backend containers.

Use these operating rules:

- Keep `REDIS_URL` configured whenever more than one API replica is running.
- Divide the MongoDB connection allowance across replicas. For example, five replicas with `MONGODB_MAX_POOL_SIZE=20` can open roughly 100 application connections.
- Allow long-lived `text/event-stream` responses and disable proxy buffering for `/product/events/*`.
- Send SIGTERM during deployments and allow at least 10 seconds for graceful shutdown.
- Autoscale on sustained CPU and request latency, not on the number of open SSE connections alone.
- Put a CDN in front of the public site and cache hashed static assets for one year. Product API GET responses already emit short stale-while-revalidate cache headers.
- Schedule `npm run rag:index` as a one-off job after the first deployment and after bulk imports. Normal product mutations update their own RAG chunks.

## SEO launch checklist

Before opening the site to search engines:

1. Point `NEXT_PUBLIC_SITE_URL` at the final HTTPS domain and rebuild.
2. Confirm `/robots.txt`, `/sitemap.xml`, and a product page return `200` publicly.
3. Inspect a product page source for its canonical URL and Product JSON-LD.
4. Submit the sitemap URL to the relevant webmaster consoles.
5. Redirect the bare domain to one canonical hostname and force HTTPS.
6. Keep product URLs stable; legacy `/product/:id` links permanently redirect to `/products/:id`.

## Automated checks

`.github/workflows/ci.yml` installs locked dependencies and builds all three applications on every branch push and pull request. Do not deploy a revision whose workflow is failing.
