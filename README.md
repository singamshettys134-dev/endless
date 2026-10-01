# Endless

Endless is a YouTube-style infinite feed demo built to explore the trade-offs between infinite scrolling, cursor-based pagination, session caching, prefetching, and low-latency recommendation systems.

The project shows how a feed can feel endless to the user while actually fetching only the next small slice of data, keeping the UI responsive and the backend efficient.

## Why this project exists

Modern feed products often struggle with a core design problem:

- infinite scrolling makes the user experience feel continuous
- the backend still needs to respect latency, cacheability, and freshness
- naive pagination can produce duplicate results, stale ranking, or expensive recomputation

Endless addresses this with a practical demo that combines:

- cursor pagination instead of offset pagination
- session-scoped caching
- background prefetching to hide latency
- candidate generation + ranking + MMR reranking
- observability in a live lab interface

## Key features

- Infinite feed with smooth scrolling and no visible loader during normal operation
- Cursor-based pagination for stable session continuity
- Prefetching of the next batch in the background
- Session cache to avoid repeated ranking work for the same user session
- Recommendation pipeline with scoring, diversity, and freshness controls
- Lab view for debugging cache hits, misses, latency, and request flow
- Search and category browsing over a synthetic catalog
- Optional Redis support for shared cache state across instances

## Tech stack

- Frontend: React + Vite + React Router
- UI: custom layout and component system
- Backend: Express.js
- Caching: in-memory LRU session cache, optional Redis
- Data: generated synthetic video catalog

## Project structure

```text
.
├── client/                 # React frontend
│   ├── src/
│   └── index.html
├── server/                 # Express server and business logic
│   ├── cache/
│   ├── data/
│   ├── recommender/
│   ├── routes/
│   ├── config.js
│   └── index.js
├── scripts/
├── docs/
├── package.json
├── vite.config.js
├── README.md
└── .gitignore
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the app in development mode

```bash
npm run dev
```

This starts:

- API server on http://localhost:4000
- Vite frontend on http://localhost:5173 (or the next available port)

### Production build

```bash
npm run build
npm start
```

In production, the Express server serves the built frontend from the dist folder.

## Environment variables

The app supports these environment variables:

```bash
PORT=4000
VIDEO_COUNT=100000
REDIS_URL=optional-redis-url
CURSOR_SECRET=your-secret-key
```

Notes:

- `PORT` controls the API port.
- `VIDEO_COUNT` changes the synthetic catalog size.
- `REDIS_URL` is optional; if unset, the app uses in-memory fallback caching.
- `CURSOR_SECRET` is used for signed cursor tokens.

## Main routes

- `/` — personalized infinite feed
- `/trending` — trending and ranked content views
- `/explore` — feed exploration
- `/category/:name` — category-specific feed
- `/search?q=` — search-based feed
- `/watch/:id` — video detail page
- `/lab` — live proof of timing and cache behavior
- `/architecture` — system design explanation

## API overview

```text
GET /api/feed?session=&cursor=&limit=&cache=on|off&simulateSlow=0|1&simulateFail=0|1
GET /api/browse?kind=trending|popular|new|category|related&value=&cursor=
GET /api/search?q=&cursor=
GET /api/video/:id
GET /api/categories
GET /api/metrics
GET /api/health
POST /api/feed/signal
```

## Architecture summary

The core idea is simple:

1. The client requests the next feed slice using a cursor.
2. The server reuses or rebuilds a session-scoped recommendation list.
3. A prefetch request fills the next page in the background.
4. The cache avoids recomputing ranking when the session is still valid.
5. The lab view exposes the trade-offs in real time.

This is designed to show how feed systems balance:

- latency
- freshness
- personalization
- cache efficiency
- smooth UX

## Development notes

- The demo data is generated locally and is intentionally synthetic.
- The project is meant for learning and exploration, not for production-grade data persistence.
- Redis is optional and only needed when you want distributed or shared cache state.

## License

This project is provided as a learning/demo project and is intended for local experimentation and technical exploration.
