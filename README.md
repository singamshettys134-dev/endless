# Endless

Infinite feed. Finite fetch. A YouTube-style feed that proves four mechanisms live:
cursor pagination, prefetching, a ranking pipeline (candidates → rank → MMR re-rank) and a session cache.

## Run
```bash
npm install
npm run dev        # API :4000 + client http://localhost:5173
```
Production: `npm run build && npm start` (API serves the built client on :4000).

## Pages
| Route | What it shows |
|---|---|
| `/` | Personalised feed, auto-loads, batch dividers show HIT/MISS/latency |
| `/watch/:id` | Video page + auto-loading "Up next" |
| `/trending` | Trending / Most viewed / Newest ranked lists |
| `/explore`, `/category/:name` | Category browser, one infinite feed per category |
| `/search?q=` | Search over 100k titles, cached per query |
| `/lab` | Live proof: heatmap, cache, latency, stage timings, cursor, profile, A/B race |
| `/architecture` | Diagram, request flow, trade-offs |

## API
- `GET /api/feed?session=&cursor=&limit=&cache=on|off&simulateSlow=0|1&simulateFail=0|1`
- `GET /api/browse?kind=trending|popular|new|category|related&value=&cursor=`
- `GET /api/search?q=&cursor=` · `GET /api/video/:id` · `GET /api/categories`
- `POST /api/feed/signal` · `GET /api/metrics` · `GET /api/health`

## Env
`PORT` (4000) · `VIDEO_COUNT` (100000) · `REDIS_URL` (optional) · `CURSOR_SECRET`

## Judge demo (3 minutes)
1. Home: scroll fast. Nothing ever shows a loader, dividers say `prefetched`.
2. Lab: "fetched 200 of 100,000", heatmap, HIT 0.5 ms vs MISS ~100 ms.
3. Lab: turn Prefetch off, scroll Home again, now skeletons appear. Turn it back on.
4. Hover a card: score breakdown. Open a video, go Home: the feed re-ranks.
5. Lab: Run race (cache+prefetch vs neither). Then "Recommender failure" to show the fallback.
