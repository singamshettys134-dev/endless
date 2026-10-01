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
# Endless

Endless is a feed architecture lab and product prototype for the classic challenge in modern recommendation products: how do you make an endless experience feel lightweight, smooth, and intelligent without detonating latency or cache quality?

The project models a YouTube-style recommendation system that behaves like a continuous infinite feed while using cursor-based pagination, prefetch buffering, session-scoped caching, and a ranked recommendation pipeline behind the scenes. It is designed to feel like a real product, while exposing the engineering trade-offs in a lab-friendly UI.

## Product thesis

Most platforms get trapped between two bad extremes:

- full infinite loading with brute-force recomputation and poor latency
- conservative pagination that feels slow, stale, and mechanical

Endless sits between those two worlds. It keeps the feed feeling continuous for the user while reducing the backend to a narrow, efficient, measured execution path.

## Why this project matters

The core product problem is not just "how do we show more videos". The real challenge is:

- preserve freshness without recomputing everything on every scroll
- keep the experience smooth without exposing loading jank
- avoid duplicate or drifted results as the session progresses
- make the system explainable and observable during debugging

Endless solves this with a practical system built around:

- cursor pagination instead of fragile offset paging
- session cache reuse for repeated recommendation work
- background prefetching to hide latency
- ranking + reranking for relevance and diversity
- live instrumentation for timing, cache hits, failures, and signal impact

## Feature set

- Infinite scrolling experience designed to feel continuous rather than visibly paginated
- Stable cursor-driven feed progression across a user session
- Background prefetch buffer for the next slice of content
- Session-scoped cache that avoids repeated ranking work
- Recommendation pipeline with weighted relevance, freshness, popularity, and diversity controls
- Live lab view that exposes cache hits, misses, failures, and timing behavior
- Search, trending, category, and explore flow over a synthetic catalog
- Optional Redis support for multi-instance shared session state
- No database required for default use; the app runs with generated in-memory data

## Stack

- Frontend: React, Vite, React Router
- UI layer: custom product-shell styling and responsive layout primitives
- Backend: Express.js
- Caching layer: in-memory session cache with optional Redis
- Data model: generated synthetic video catalog for exploration and demo scenarios

## Repository structure

```text
.
├── client/                     # React frontend and product UI
│   ├── src/
│   └── index.html
├── server/                     # Express API and recommendation logic
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
├── .gitignore
└── dist/                      # built frontend output for production
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Start in development mode

```bash
npm run dev
```

This boots the API and the frontend together:

- API: http://localhost:4000
- Frontend: http://localhost:5173

### Production build

```bash
npm run build
npm start
```

The Express server serves the built frontend from the dist directory.

## Environment configuration

```bash
PORT=4000
VIDEO_COUNT=100000
REDIS_URL=optional-redis-url
CURSOR_SECRET=your-secret-key
```

Notes:

- `PORT` controls the API port.
- `VIDEO_COUNT` changes the synthetic catalog size.
- `REDIS_URL` is optional; without it the app falls back to an in-memory cache.
- `CURSOR_SECRET` protects signed cursor tokens and prevents tampering.

## Routes

- `/` — personalized infinite feed
- `/trending` — trending and ranked stream
- `/explore` — discovery-oriented feed
- `/category/:name` — category-specific browsing
- `/search?q=` — search-based content flow
- `/watch/:id` — video detail view
- `/lab` — observable feed system behavior
- `/architecture` — engineering architecture overview

## API surface

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

## System architecture

The backbone of Endless is a straightforward but powerful flow:

1. the client requests the next feed slice with a session-aware cursor
2. the backend checks whether the session has a valid cached recommendation list
3. on a miss, the recommender generates candidates, ranks them, and stores the result for reuse
4. a background prefetch request keeps the next slice ready before the user reaches the end
5. the lab surfaces the timing, cache behavior, and system trade-offs in real time

This creates a feed system that balances:

- latency
- freshness
- personalization
- cache efficiency
- product smoothness

## Design assumptions

- The app intentionally uses generated synthetic video data rather than a production database.
- This is designed for learning, exploration, and architecture demonstration.
- Redis is optional and only needed when you want shared or multi-instance cache state.

## License

This project is built as an engineering exploration and local product prototype. It is intended for technical learning, feed-system experimentation, and product architecture demonstrations.
