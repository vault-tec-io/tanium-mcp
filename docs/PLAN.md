# Tanium MCP Server — Planning Prompt for Claude Code

You have access to the Tanium Developer Docs MCP and the following project files:
- `tanium_gateway_schema.graphql` — GraphQL Gateway API schema (primary API)
- `platform.json` — Tanium Core Platform REST API spec
- `patch.json` — Patch module REST API spec
- `deploy.json` — Deploy module REST API spec
- `connect.json` — Connect module REST API spec
- `comply.json` — Comply module REST API spec
- `asset.json` — Asset module REST API spec

Plan the implementation of a production-quality MCP server that wraps the Tanium APIs.
Do NOT write any code yet. Produce a structured plan covering all of the sections below.

---

## 1. Authentication

- All API calls use an API token passed as the `session: token-XXXXXXXX` header (the `token-` prefix is required).
- Tokens are IP-scoped and expire (default 7 days).
- Token rotation must be implemented:
  - GraphQL: `apiTokenRotate` mutation
  - Platform REST: corresponding REST endpoint
- The plan must describe a single shared auth/HTTP client layer used by both GraphQL and REST calls.
- Token rotation failures should be surfaced clearly, not swallowed.

---

## 2. Deployment Model Support (Cloud vs. On-Prem)

The MCP server must support both Tanium Cloud and on-premises deployments. The URL structure differs only in the base hostname — all API paths are identical after the base:

| Deployment | Base URL pattern |
|---|---|
| Cloud | `https://<customerName>-api.cloud.tanium.com` |
| On-Prem | `https://<tanium-server-hostname>` |

**Design requirement:** Two environment variables only — `TANIUM_BASE_URL` and `TANIUM_API_TOKEN`. All endpoint URLs are constructed from `TANIUM_BASE_URL`:

```
GraphQL Gateway:  {TANIUM_BASE_URL}/plugin/products/gateway/graphql
Deploy REST:      {TANIUM_BASE_URL}/plugin/products/deploy
Connect REST:     {TANIUM_BASE_URL}/plugin/products/connect
Platform REST:    {TANIUM_BASE_URL}/api/v2
```

No hostnames or deployment-type flags should be hardcoded anywhere in the implementation.

---

## 3. API Routing Strategy (GraphQL vs. REST Hybrid)

GraphQL Gateway is the primary, preferred API for all operations it supports. REST is used only for gaps:

- **GraphQL Gateway** (primary): endpoint querying, sensor reads, actions, questions, packages, patch, comply, asset data, token rotation
- **Deploy REST** (`/plugin/products/deploy`): deployments, software packages/bundles, temp file uploads, maintenance windows — use for any Deploy functionality not yet available in GraphQL
- **Connect REST** (`/plugin/products/connect`): connection configurations and data transfers
- **Platform REST** (`/api/v2`): use only for operations with no GraphQL equivalent (e.g., direct sensor/package CRUD, saved questions)
- **Never** fall back to Platform REST for things that exist in GraphQL

The plan must explicitly document which tools route to which API.

---

## 4. Tool Analysis — Schema-Driven Tool Definition

**Read all six API schema files and the GraphQL schema in full before writing this section.**

For each file, enumerate the operations available and propose MCP tool definitions derived from them. Group tools by domain/module. For each proposed tool, specify:

- Tool name (snake_case)
- Which API and endpoint/operation it maps to
- Brief description
- Key input parameters
- Expected output shape

Aim to identify a comprehensive but non-redundant tool set. Prefer broader tools that cover multiple related operations over hyper-specific one-operation tools where it makes sense. Flag any operations that are deprecated or should be excluded.

Suggested groupings to analyze:

| Domain | Primary Schema Source |
|---|---|
| Endpoint querying (sensors, questions) | GraphQL |
| Actions & packages | GraphQL + Platform REST |
| Patch management | GraphQL + patch.json |
| Software deployment | deploy.json + GraphQL |
| Compliance (Comply) | GraphQL + comply.json |
| Asset inventory | GraphQL + asset.json |
| Connect (data pipelines) | connect.json |
| Sensor/package management (CRUD) | Platform REST |
| Token management | GraphQL |

---

## 5. Sensor & Package Discovery — Two-Layer Cache Architecture

Tanium deployments can have 500+ sensors and hundreds of packages. The MCP must handle this without overwhelming the LLM context or hammering the server on every call.

**Design a two-layer architecture:**

**Layer 1 — Startup Cache**
- On MCP server startup, fetch all sensors and packages from the Tanium server once
- Store in memory (with optional disk persistence for restart recovery)
- Refresh on a configurable TTL (default: 30–60 minutes)
- Cache should store per sensor: `name`, `hash`, `id`, `description`, `category/content_set`, `parameter_definitions`
- Cache should store per package: `name`, `id`, `command`, `description`
- Token expiry during a cache refresh must trigger rotation + retry before surfacing an error

**Layer 2 — Semantic Search Tool**
- Expose a `search_sensors` MCP tool that lets the LLM search the in-memory cache by keyword or intent
- Expose a `search_packages` MCP tool similarly
- These are discovery tools — the LLM calls them first, then uses the result to call the actual query/action tool
- This keeps prompts lean and supports the full sensor catalog without context bloat

The plan must describe how these two layers interact and what the data structure of the cache looks like.

---

## 6. Transport

- Evaluate `stdio` vs. SSE transport.
- Recommend one with justification. Consider: Claude Desktop integration, multi-client scenarios, deployment complexity.
- Note that stdio is simpler and works well for single-client use (Claude Code / Desktop).

---

## 7. Project Structure

Propose a directory and file layout. At minimum address:
- Entry point
- Auth/HTTP client module
- GraphQL client
- REST client(s) per module
- Tool definitions (how they're organized — one file per domain or grouped)
- Sensor/package cache module
- Config / environment variable handling
- Type definitions
- Test layout

Recommend a language (TypeScript is the conventional MCP SDK choice) and list key dependencies.

---

## 8. Error Handling

Address:
- Tanium API errors (4xx, 5xx) — how surfaced to the MCP caller
- Token expiry mid-request — rotation + retry flow
- Cache warm failure on startup — should the server start degraded or fail hard?
- GraphQL partial errors (errors alongside data)
- Rate limiting / timeout behavior

---

## 9. RBAC / Permission Requirements

The MCP server's service account needs specific Tanium permissions. Document the minimum required role/privileges for the full tool set proposed in section 4. Reference the `x-tanium-rbac` fields in the REST specs and GraphQL schema documentation where available.

---

## 10. TLS / Certificate Handling

On-premises Tanium deployments frequently use self-signed certificates or internal CA certificates that are not trusted by the system's default certificate store. The MCP server must handle this without requiring users to disable TLS verification entirely.

The plan must define:
- A `TANIUM_TLS_CA_BUNDLE` environment variable (path to a custom CA certificate file or bundle) for on-prem deployments with internal CAs
- A `TANIUM_TLS_VERIFY` environment variable (default: `true`) that can be set to `false` to disable verification — only for lab/dev use, must be clearly documented as insecure
- How these settings are applied to both the GraphQL client and all REST clients through the shared HTTP client layer
- Cloud deployments use public CAs and require no special configuration; this should be the zero-config default

---

## 11. Pagination Strategy

The APIs use two different pagination models that the MCP must handle transparently:

- **GraphQL**: Cursor-based pagination (`after`/`before` + `first`/`last`). Cursors expire after 5 minutes of inactivity with a 1-hour maximum lifetime. The `endpoints` query also supports a `refresh` cursor for live Tanium Server queries where data accumulates over time.
- **REST (Deploy, Comply, etc.)**: Offset/limit-based pagination.

The plan must define:
- When tools should auto-paginate vs. return a single page with a continuation cursor exposed to the caller
- How to handle the GraphQL cursor expiry window during slow pagination
- A consistent output pattern so the LLM caller doesn't need to know which pagination model the underlying API uses
- Maximum page/result limits per tool to prevent runaway data fetches

---

## 11. Async Operation Handling

Several Tanium operations are asynchronous and require polling:

- **Actions**: issuing an action returns an action ID; the caller must poll for `ActionStatus` and `ActionResults`
- **Questions**: questions are issued against live endpoints and results accumulate over time (`respondedPercentage`, `respondedTotal` vs `expectedTotal`)
- **Deploy deployments**: deployment status must be polled after creation

The plan must define:
- Whether tools should block-and-poll (simpler for the LLM, potentially slow), expose a `get_action_results` follow-up tool (more flexible), or both
- Recommended polling intervals and timeout behavior
- How to surface partial results (e.g., 60% of endpoints have responded) to the LLM caller in a useful way

---

## 12. Action Approval Workflow

Tanium can require action approval before a scheduled action executes (`require_action_approval` global setting). The plan must address:
- How tools that create actions communicate approval-required status to the LLM caller
- Whether an `approve_action` tool should be included
- The GraphQL `scheduledActionApprove` mutation vs. Platform REST `/api/v2/saved_action_approvals`

---

## 13. Testing Approach

- Unit tests: auth layer, cache logic, URL construction, tool input validation
- Integration tests: recommend using a mock Tanium server or recorded fixtures rather than a live server
- What test framework to use
- How to test token rotation logic
- How to test cloud vs. on-prem URL construction
- How to test async polling (actions, questions)

---

## Instructions

1. Read all schema files fully before writing the plan.
2. Use the `tanium-docs` MCP to look up any behavioral details not captured in the schemas (e.g., specific error codes, pagination behavior, action status polling patterns).
3. In section 4, be exhaustive — do not skip API operations just because they seem minor.
4. Call out any ambiguities or gaps in the schemas that need to be resolved before implementation.
5. Do not write any implementation code. The output of this task is a structured plan document only.
6. **GraphQL stability levels**: Every field and type in the GraphQL schema is tagged with a stability level: `0 = Deprecated`, `1 = Experimental`, `2 = Legacy`, `3 = Stable`. When proposing tools in section 4, prefer Stability 3 fields exclusively. Do not build tools around Stability 0 (Deprecated) fields. Stability 1 (Experimental) fields may be used only when there is no Stable equivalent and the capability is important — flag these explicitly in the plan as subject to breaking changes. Stability 2 (Legacy) fields should be avoided in favor of their documented replacements.
