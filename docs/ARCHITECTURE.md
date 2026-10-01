# Endless architecture

```mermaid
flowchart LR
  A[Client UI] --> B[API Feed Route]
  B --> C[Feed Service]
  C --> D[Recommender]
  D --> E[Candidates]
  D --> F[Ranker]
  D --> G[Reranker]
  C --> H[Session Cache]
  H --> I[Data Store]
  C --> J[Cursor]
  C --> K[Resilience]
```

## Sequence diagrams

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant Cache
  participant Recommender
  participant Store

  Client->>API: GET /api/feed?session=abc
  API->>Cache: read session key
  alt cache hit
    Cache-->>API: warm feed
  else cache miss
    API->>Recommender: generate candidates + rank + rerank
    Recommender->>Store: fetch 100k catalog slice
    Store-->>Recommender: ranked ids
    Recommender-->>API: video list
    API->>Cache: store feed
  end
  API-->>Client: paged batch + cursor
```

## Data model

- Video: id, title, creatorName, category, views, likes, durationSec, quality, topicVector(16), thumbSeed
- Session: interest profile over 12 categories and feedVersion
- Cursor: sid, offset, feedVersion, lastScore, issuedAt, signature

## Scale estimates

- 100k videos stored in memory: roughly tens of MB
- 1,500 candidate set per request
- 20-item page payload in a single response
- 15 minute sliding TTL per session cache

## Trade-offs

| Decision | Benefit | Trade-off |
|---|---|---|
| Freshness vs hit rate | warm cache reduces latency | stale interest tuning can lag |
| Personalization vs latency | strong relevance from profile | recomputation cost rises |
| Memory per session | low overhead and quick access | many sessions increase RAM |
| In-memory vs Redis | simple and low-latency | not durable or shared across nodes |
| Sticky sessions | strong locality | uneven load balancing |

## Why cursor beats offset

Offset pagination is expensive on large datasets because servers must scan from the start of the collection. A cursor provides a signed opaque token referencing a stable position and last score, so the next page can continue without re-reading the entire dataset.
