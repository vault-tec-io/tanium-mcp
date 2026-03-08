import { getCurrentToken } from '../http/auth.js';
import { buildFetchOptions, fetchWithAgent, getHttpsAgent } from '../http/client.js';
import { withAuth401Retry } from '../http/retry.js';
import { TaniumGraphQLError, TaniumApiError } from '../errors/tanium.js';
import config from '../config.js';

interface GQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

export interface GQLResult<T> {
  data: T;
  warnings?: Array<{ message: string }>;
}

export async function execute<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<GQLResult<T>> {
  return withAuth401Retry(() => executeOnce<T>(query, variables));
}

async function executeOnce<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<GQLResult<T>> {
  const body = JSON.stringify({ query, variables });
  const init = buildFetchOptions('POST', getCurrentToken(), body);

  const response = await fetchWithAgent(config.graphqlUrl, init, getHttpsAgent());

  if (response.status === 401) {
    throw new TaniumApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    let msg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const b = await response.json() as Record<string, unknown>;
      if (typeof b.message === 'string') msg = b.message;
    } catch { /* ignore */ }
    throw new TaniumApiError(msg, response.status);
  }

  const json = await response.json() as GQLResponse<T>;

  // Partial data + errors → warnings
  if (json.data && json.errors?.length) {
    return {
      data: json.data,
      warnings: json.errors.map(e => ({ message: e.message })),
    };
  }

  // Errors only → throw
  if (json.errors?.length && !json.data) {
    throw new TaniumGraphQLError(
      json.errors[0].message,
      json.errors
    );
  }

  if (!json.data) {
    throw new TaniumGraphQLError('GraphQL response contained no data', []);
  }

  return { data: json.data };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface PagedResult<T> {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: PageInfo;
  totalRecords?: number;
}

/**
 * Auto-pages through a GraphQL connection until hasNextPage=false.
 * WARNING: Do NOT use for large collections (endpoints, sensors, packages) — expose nextCursor instead.
 * Safe for small collections (<500 records): computer groups, action groups, etc.
 */
export async function autoPage<T, R extends PagedResult<T>>(
  query: string,
  buildVariables: (cursor?: string) => Record<string, unknown>,
  extractConnection: (data: unknown) => R,
  pageSize = 500,
  maxRecords = 10000
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;
  let lastPageTime = Date.now();
  const CURSOR_EXPIRY_WARN_MS = 4 * 60 * 1000; // 4 min

  while (true) {
    const now = Date.now();
    if (cursor && now - lastPageTime > CURSOR_EXPIRY_WARN_MS) {
      console.warn('[tanium-mcp] WARNING: >4 min between GraphQL pages — cursor may be expired');
    }
    lastPageTime = now;

    const vars = buildVariables(cursor);
    const result = await execute<unknown>(query, { ...vars, first: pageSize });
    const connection = extractConnection(result.data);

    for (const edge of connection.edges) {
      results.push(edge.node);
    }

    if (!connection.pageInfo.hasNextPage || results.length >= maxRecords) break;
    cursor = connection.pageInfo.endCursor;
    if (!cursor) break;
  }

  return results;
}
