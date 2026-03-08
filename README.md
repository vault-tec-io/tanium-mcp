# Tanium MCP Server

A Model Context Protocol (MCP) server that exposes [Tanium](https://www.tanium.com/) security platform capabilities as tools consumable by Claude Code and Claude Desktop.

## What it does

The server wraps Tanium's hybrid API surface — GraphQL Gateway (primary) and multiple REST modules (fallback) — into 63 MCP tools spanning endpoint querying, patch management, software deployment, compliance, asset inventory, data pipelines, reports, playbooks, and more.

## Requirements

- Node.js 18+
- A Tanium instance (cloud or on-prem)
- A Tanium API token with appropriate permissions

## Installation

```bash
git clone <repo>
cd tanium-mcp
npm install
npm run build
```

## Configuration

Set the following environment variables, or place them in a `.env` file in the project root.

| Variable | Required | Default | Description |
|---|---|---|---|
| `TANIUM_BASE_URL` | Yes | — | Base URL of your Tanium instance. No trailing slash. |
| `TANIUM_API_TOKEN` | Yes | — | API token string **without** the `token-` prefix. |
| `TANIUM_TLS_CA_BUNDLE` | No | — | Absolute path to a PEM CA certificate file (on-prem self-signed certs). |
| `TANIUM_TLS_VERIFY` | No | `true` | Set `false` to skip TLS verification. Dev/lab only — logs a warning. |
| `TANIUM_CACHE_TTL_SECONDS` | No | `1800` | How long the sensor/package cache is valid before refresh. |
| `TANIUM_CACHE_DISK_PATH` | No | — | Directory for persisting the sensor/package cache to disk across restarts. |
| `TANIUM_POLL_INTERVAL_MS` | No | `5000` | Polling interval for async operations (actions, questions). |
| `TANIUM_POLL_TIMEOUT_MS` | No | `300000` | Maximum time to wait when polling with `wait_for_results=true`. |

### Cloud

```bash
TANIUM_BASE_URL=https://acme-api.cloud.tanium.com
TANIUM_API_TOKEN=your-token-here
```

### On-premises

```bash
TANIUM_BASE_URL=https://192.168.1.10
TANIUM_API_TOKEN=your-token-here
TANIUM_TLS_CA_BUNDLE=/etc/ssl/certs/tanium-ca.pem
```

All API endpoint URLs are derived from `TANIUM_BASE_URL` — no hostnames are hardcoded.

## Usage

### With Claude Code

Add to your MCP configuration (`.claude/settings.json` or equivalent):

```json
{
  "mcpServers": {
    "tanium": {
      "command": "node",
      "args": ["/path/to/tanium-mcp/dist/index.js"],
      "env": {
        "TANIUM_BASE_URL": "https://acme-api.cloud.tanium.com",
        "TANIUM_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tanium": {
      "command": "node",
      "args": ["/path/to/tanium-mcp/dist/index.js"],
      "env": {
        "TANIUM_BASE_URL": "https://acme-api.cloud.tanium.com",
        "TANIUM_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Dev mode (watch)

```bash
TANIUM_BASE_URL=https://... TANIUM_API_TOKEN=... npm run dev
```

## Available tools

### Endpoint querying
| Tool | Description |
|---|---|
| `query_endpoints` | Query endpoints with filtering, sorting, and pagination |
| `query_sensor_data` | Query live sensor data from endpoints |
| `get_question_results` | Retrieve results for a previously submitted question |

### Sensor discovery
| Tool | Description |
|---|---|
| `search_sensors` | Search the sensor catalog by keyword (call first before `query_sensor_data`) |
| `get_sensor` | Get full sensor details including parameters |
| `harvest_sensor` | Register or unregister a sensor for data harvesting |

### Sensor CRUD
| Tool | Description |
|---|---|
| `create_sensor` | Create a new sensor |
| `update_sensor` | Update an existing sensor |
| `delete_sensor` | Delete a sensor |

### Package management
| Tool | Description |
|---|---|
| `search_packages` | Search the package catalog by keyword (call first before `perform_action`) |
| `get_package` | Get full package details |
| `create_package` | Create a new package |
| `update_package` | Update an existing package |
| `delete_package` | Delete a package |

### Actions
| Tool | Description |
|---|---|
| `perform_action` | Deploy a package to target endpoints |
| `create_scheduled_action` | Create a recurring scheduled action |
| `list_actions` | List recent actions `[Experimental RC]` |
| `list_scheduled_actions` | List scheduled actions |
| `get_action_status` | Get action status and completion counts |
| `stop_action` | Stop an action in progress |
| `approve_action` | Approve an action pending approval |
| `delete_scheduled_action` | Delete a scheduled action |
| `list_action_groups` | List action groups |
| `create_action_group` | Create an action group |

### Computer groups
| Tool | Description |
|---|---|
| `list_computer_groups` | List all computer groups |
| `get_computer_group` | Get a computer group by name or ID |
| `create_computer_group` | Create a new computer group |
| `delete_computer_group` | Delete a computer group |

### Patch management
| Tool | Description |
|---|---|
| `list_patch_deployments` | List patch deployments |
| `create_patch_deployment` | Create a patch deployment |
| `stop_patch_deployment` | Stop a running patch deployment |
| `get_patch_deployment` | Get patch deployment details |
| `list_patch_lists` | List patch lists |
| `upsert_patch_list` | Create or update a patch list |
| `list_patch_definitions` | List patch definitions `[Experimental Early]` |
| `list_patch_scan_configurations` | List scan configurations |
| `create_patch_scan_configuration` | Create a scan configuration |
| `list_maintenance_windows_patch` | List patch maintenance windows |
| `create_maintenance_window_patch` | Create a patch maintenance window |
| `list_patch_blocklists` | List patch blocklists |
| `manage_patch_blocklist` | Create, update, or delete a blocklist entry |
| `list_patch_repos` | List patch repositories |

### Software deployment
| Tool | Description |
|---|---|
| `list_software_packages` | List software packages |
| `get_software_deployment` | Get deployment details |
| `manage_software` | Install, update, or remove software |
| `list_deployments_deploy` | List deployments via Deploy REST API |
| `create_deployment_deploy` | Create a deployment |
| `list_maintenance_windows_deploy` | List deploy maintenance windows |
| `create_maintenance_window_deploy` | Create a deploy maintenance window |
| `list_deploy_profiles` | List deployment profiles |
| `upload_temp_file` | Upload a temporary file for package creation |
| `list_software_bundles` | List software package bundles |

### Compliance
| Tool | Description |
|---|---|
| `query_compliance_results` | Query compliance results by rule hash |
| `list_cves` | List CVEs with severity and platform filtering |
| `list_compliance_exceptions` | List compliance exceptions |
| `create_compliance_exception` | Create a compliance exception |
| `list_benchmarks` | List compliance benchmarks (CIS, DISA STIG, etc.) |
| `list_custom_checks` | List custom compliance checks |
| `list_comply_bundles` | List compliance content bundles |
| `list_vulnerability_sources` | List vulnerability data sources |

### Asset inventory
| Tool | Description |
|---|---|
| `list_asset_products` | List software products tracked by Asset |
| `list_asset_product_endpoints` | List endpoints associated with a product |
| `list_assets` | List assets with cursor-based pagination |
| `get_asset` | Get a specific asset by ID |
| `list_asset_attributes` | List available asset attributes |
| `list_asset_views` | List asset views |
| `create_asset_view` | Create a new asset view |

### Connect (data pipelines)
| Tool | Description |
|---|---|
| `list_connections` | List data pipeline connections |
| `create_connection` | Create a connection |
| `run_connection` | Trigger a connection to run |
| `stop_connection_run` | Stop a running connection |
| `list_connection_runs` | List run history for a connection |
| `get_connection_logs` | Get logs for a connection run |
| `list_connect_destinations` | List destinations by type |
| `create_connect_destination` | Create a destination |
| `list_connect_sources` | List sources by type |
| `import_connection` | Import a connection from exported definition |
| `export_connection` | Export a connection definition |

### Reports
| Tool | Description |
|---|---|
| `list_reports` | List reports |
| `get_report_data` | Get paginated report data |
| `export_report` | Export a report definition |
| `import_report` | Import a report |
| `delete_report` | Delete a report `[Experimental RC]` |

### Playbooks (Automate)
| Tool | Description |
|---|---|
| `list_playbooks` | List Automate playbooks |
| `start_playbook` | Start a playbook run |
| `list_playbook_runs` | List playbook run history |
| `get_playbook_run` | Get a specific run |
| `upsert_playbook` | Create or update a playbook |
| `upsert_playbook_schedule` | Create or update a playbook schedule |

### Saved questions
| Tool | Description |
|---|---|
| `list_saved_questions` | List saved questions |
| `get_saved_question_results` | Get results for a saved question |

### Token management
| Tool | Description |
|---|---|
| `list_api_tokens` | List your API tokens |
| `grant_api_token` | Create a new API token |
| `rotate_api_token` | Rotate an API token |
| `revoke_api_token` | Revoke an API token |

## Workflow patterns

### Querying endpoint data

The sensor catalog can contain thousands of sensors. Always search first:

```
1. search_sensors "operating system"       → find exact sensor name
2. query_endpoints with sensor filter      → get endpoint list
3. get_question_results with question_id   → retrieve data
```

### Deploying a package

```
1. search_packages "deploy tanium"         → find exact package name
2. list_computer_groups                    → find target group
3. perform_action with package + group     → deploy (returns action_id)
4. get_action_status with action_id        → check progress
```

Or set `wait_for_results: true` on `perform_action` to block until completion.

### Action approval workflow

Some actions require approval before running. When `perform_action` or `create_scheduled_action` returns `approval_required: true`:

```
approve_action with scheduled_action_id   → approve the pending action
```

### Async operations

All long-running operations support two modes via `wait_for_results`:

- `false` (default) — returns immediately with an operation ID; poll manually with `get_action_status` / `get_question_results`
- `true` — blocks internally until terminal state or `TANIUM_POLL_TIMEOUT_MS`

## API routing

The server routes operations to the most stable available API:

| Stability | Label | Usage |
|---|---|---|
| 3 | Stable | Always preferred |
| 1.2 | Experimental RC | Used when no Stability 3 alternative; noted in tool description |
| 1.0 | Experimental Early | Used with caution; flagged prominently |
| 0 | Deprecated | Never used; REST is the fallback |

Notable routing decisions:
- Asset listing → Asset REST (GQL deprecated)
- Patch deployment reads → Patch REST (GQL Stability 1.0)
- Connect connections → Connect REST (GQL Stability 1.2)
- Comply results → Comply REST (no stable GQL equivalent)

## Permissions

Create a dedicated API persona (`tanium-mcp-service`) with a scoped role. Minimum permissions by capability:

| Capability | Permissions needed |
|---|---|
| Token rotation | `Token - Use` |
| Endpoint querying | Sensor read, question_write, question_log_read |
| Actions | action_read, action_write, action_stop, saved_action_write |
| Sensors / Packages CRUD | sensor_read/write, package_read/write |
| Patch | Patch Deployment Read/Write/Execute, Patchlist write/execute |
| Deploy | Deploy deployment read/write/delete, software read/write |
| Comply | showComply, complyExceptionRead/Write, complyResultsRead, complyBundleRead |
| Asset | asset api user read/write |
| Connect | Connect - Read, Connect - Run |
| Reports | Report Read/Write |
| Playbooks | Automate Playbook Read/Write/Execute |

## Development

```bash
npm run dev          # watch mode
npm test             # all tests
npm run test:unit    # unit tests only
npm run test:integration  # integration tests only
npm run typecheck    # type check without building
npm run lint         # lint src/
```

Tests use [Vitest](https://vitest.dev/) and [MSW](https://mswjs.io/) — no live Tanium server required.

## Project structure

```
src/
├── index.ts          # Entry point
├── server.ts         # MCP server + tool registration (63 tools)
├── config.ts         # Environment config + URL construction
├── http/             # Fetch wrapper, auth, retry
├── graphql/          # GraphQL client, queries, mutations
├── rest/             # REST clients (platform, patch, deploy, connect, comply, asset)
├── cache/            # Sensor/package cache (warm, search, disk persistence)
├── polling/          # Async polling (actions, questions, deployments)
├── pagination/       # Cursor helpers (GraphQL + REST normalized)
├── errors/           # Error types + MCP error helpers
├── tools/            # One file per domain
└── types/            # TypeScript interfaces

resources/
├── tanium_gateway_schema.graphql  # GraphQL API schema
├── platform.json                  # Platform REST API spec
├── patch.json                     # Patch module REST spec
├── deploy.json                    # Deploy module REST spec
├── connect.json                   # Connect module REST spec
├── comply.json                    # Comply module REST spec
└── asset.json                     # Asset module REST spec
```
