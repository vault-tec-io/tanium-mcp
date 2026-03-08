# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a TypeScript MCP (Model Context Protocol) server that wraps the Tanium security platform APIs. It exposes Tanium capabilities — endpoint querying, patch management, software deployment, compliance, asset inventory, Connect data pipelines — as MCP tools consumable by Claude Code/Desktop.

The implementation plan is in `docs/PLAN.md`. The API schemas are in `resources/`.

## Build & Dev Commands

```bash
# Install dependencies
npm install

# Build
npm run build          # tsc

# Run in dev mode (watch)
npm run dev            # tsx watch src/index.ts

# Run server
npm start              # node dist/index.js

# Test
npm test               # vitest run
npm run test:watch     # vitest
npm run test:unit      # vitest run tests/unit
npm run test:integration  # vitest run tests/integration

# Type check
npm run typecheck      # tsc --noEmit

# Lint
npm run lint           # eslint src
```

## Architecture

The server uses **stdio transport** (`@modelcontextprotocol/sdk`). On startup it warms the sensor/package cache, then accepts tool calls.

```
src/
├── index.ts          # Entry: warm cache → connect stdio
├── server.ts         # MCP server factory, tool registration
├── config.ts         # Env vars (TANIUM_BASE_URL, TANIUM_API_TOKEN, TLS settings)
│
├── http/
│   ├── client.ts     # All HTTP flows through here: session header, TLS agent
│   ├── auth.ts       # Token state machine: proactive + reactive rotation via apiTokenRotate
│   └── retry.ts      # 401 → rotate token → retry once
│
├── graphql/
│   ├── client.ts     # execute<T>(), autoPage() cursor helper
│   ├── queries/      # One file per domain
│   └── mutations/    # One file per domain
│
├── rest/
│   ├── client.ts     # Base REST wrapper (get/post/put/delete)
│   ├── platform.ts   # /api/v2
│   ├── patch.ts      # /plugin/products/patch
│   ├── deploy.ts     # /plugin/products/deploy
│   ├── connect.ts    # /plugin/products/connect
│   ├── comply.ts     # /plugin/products/comply
│   └── asset.ts      # /plugin/products/asset
│
├── cache/
│   ├── manager.ts    # warm(), TTL refresh, degraded-mode handling
│   ├── sensors.ts    # Sensor cache: fetch + search
│   ├── packages.ts   # Package cache: fetch + search
│   └── disk.ts       # Optional atomic JSON persistence
│
├── tools/            # One file per domain — see routing table below
├── polling/          # actions.ts (5s), questions.ts (5s, 95%), deployments.ts (30s)
├── pagination/       # graphql.ts (cursor), rest.ts (offset/limit → unified envelope)
├── errors/           # TaniumAuthError, TaniumApiError, TaniumGraphQLError, etc.
└── types/            # graphql.ts, rest.ts, config.ts
```

## API Routing Strategy

**GraphQL Gateway is primary**. REST is used only where GraphQL has no stable equivalent.

URL construction (never hardcoded — always from `TANIUM_BASE_URL`):
- GraphQL: `${base}/plugin/products/gateway/graphql`
- Platform REST: `${base}/api/v2`
- Patch REST: `${base}/plugin/products/patch`
- Deploy REST: `${base}/plugin/products/deploy`
- Connect REST: `${base}/plugin/products/connect`
- Comply REST: `${base}/plugin/products/comply`
- Asset REST: `${base}/plugin/products/asset`

GraphQL stability levels (from `@tanium_stability` directive in schema):
- **3 = Stable** — always prefer, production-safe
- **1.2 = Experimental RC** — use when no Stability 3 alternative; document as subject to change
- **1.0 = Experimental Early** — use with caution; flag prominently in tool descriptions
- **2 = Legacy / 0 = Deprecated** — never use; REST is the fallback

Key routing decisions:
- `list_assets` → Asset REST (GQL `assets` is Stability 0 — deprecated)
- `list_connections` → Connect REST (GQL `connectConnections` is Stability 1.2)
- `list_patch_deployments` → Patch REST (GQL `patchDeployment` is Stability 1.0)
- `create/stop_patch_deployment` → GQL mutations (Stability 3)
- Comply results → Comply REST (no stable GQL equivalent)
- Sensor/package CRUD → Platform REST (no GQL mutations exist)

## Auth Layer

- Session header: `session: token-${tokenString}` (HTTP client prepends `token-`; auth module stores the raw string without prefix)
- `TANIUM_API_TOKEN` env var stores the raw token without `token-` prefix
- Rotation: proactive (1hr before expiry) + reactive (401 → rotate → retry once) via `apiTokenRotate` GraphQL mutation
- Rotation failure throws `TaniumAuthError` — never silently swallowed

## Cache Architecture

Two layers:
1. **Startup warm**: fetch all sensors + packages once (GraphQL for structure, Platform REST for `id`/`description` fields the GQL schema lacks). Disk persistence optional (`TANIUM_CACHE_DISK_PATH`). Warm failure → degraded mode (other tools still work; discovery tools return graceful error; retry every 60s).
2. **Search tools**: `search_sensors` / `search_packages` — in-memory keyword search (exact name → prefix → substring), top 20 results. LLM calls these first, then uses results for subsequent action/query tools.

Known schema gaps (handled during cache warm):
- GQL `Sensor` type has no `id` field → cross-reference Platform REST `/api/v2/sensors` by name
- GQL `PackageSpec` has no `description` field → supplement from Platform REST `/api/v2/packages`

## Tool Output Envelope

All tools return:
```typescript
{
  success: boolean
  data?: T
  error?: { code: string; message: string }
  pagination?: { nextCursor?: string; totalRecords?: number; hasMore: boolean }
  meta?: { respondedPercentage?: number; respondedTotal?: number; expectedTotal?: number }
}
```

REST pagination (offset/limit or `nextAssetId`) is normalized: encode as string in `nextCursor` so the LLM never needs to know which underlying model is used.

## Async Operations

Actions, questions, and software deployments are async. All relevant tools accept `wait_for_results: boolean` (default `false`):
- `false` → return immediately with operation ID; LLM polls via `get_action_status` / `get_question_results`
- `true` → block and poll internally until terminal state or `TANIUM_POLL_TIMEOUT_MS`

Polling intervals: actions/questions = 5s; deployments = 30s. Question threshold: 95% responded OR no increase for 2 consecutive checks.

## Environment Variables

| Variable | Required | Default |
|---|---|---|
| `TANIUM_BASE_URL` | Yes | — |
| `TANIUM_API_TOKEN` | Yes | — |
| `TANIUM_TLS_CA_BUNDLE` | No | — |
| `TANIUM_TLS_VERIFY` | No | `true` |
| `TANIUM_CACHE_TTL_SECONDS` | No | `1800` |
| `TANIUM_CACHE_DISK_PATH` | No | — |
| `TANIUM_POLL_INTERVAL_MS` | No | `5000` |
| `TANIUM_POLL_TIMEOUT_MS` | No | `300000` |

TLS: `TANIUM_TLS_CA_BUNDLE` creates a custom `https.Agent` (for on-prem self-signed certs). `TANIUM_TLS_VERIFY=false` disables verification — dev/lab only, logs a warning.

## API Schema Files

Located in `resources/`:
- `tanium_gateway_schema.graphql` — Primary. All queries/mutations tagged with `@tanium_stability`.
- `platform.json` — Platform REST (`/api/v2`), OpenAPI 3.0
- `patch.json` — Patch module REST, ~79 endpoints
- `deploy.json` — Deploy module REST, ~80+ endpoints (versions v1-v4 per endpoint)
- `connect.json` — Connect module REST, ~100+ endpoints
- `comply.json` — Comply module REST, ~100+ endpoints
- `asset.json` — Asset module REST, ~10 endpoints

## Testing

Framework: **Vitest** + **MSW** (Mock Service Worker) for HTTP mocking — no live Tanium server needed.

Unit tests use `vi.useFakeTimers()` for polling logic. Integration tests use recorded fixture responses in `tests/integration/fixtures/`.
