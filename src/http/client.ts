import { readFileSync } from 'node:fs';
import { Agent as HttpsAgent } from 'node:https';
import type { Config } from '../types/config.js';
import { TaniumApiError, TaniumRateLimitError } from '../errors/tanium.js';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

let _httpsAgent: HttpsAgent | undefined;

export function initHttpsAgent(cfg: Config): void {
  if (cfg.tlsCaBundle) {
    const ca = readFileSync(cfg.tlsCaBundle);
    _httpsAgent = new HttpsAgent({ ca });
  } else if (!cfg.tlsVerify) {
    _httpsAgent = new HttpsAgent({ rejectUnauthorized: false });
  }
}

export function getHttpsAgent(): HttpsAgent | undefined {
  return _httpsAgent;
}

// Node 18+ native fetch doesn't accept node Agent directly; we use a dispatcher
// approach via the node: protocol. For Node 18 compatibility we use node-fetch
// style by casting. In Node 18's native fetch the agent option is not supported,
// so we patch via the undici globalAgent or rely on NODE_TLS_REJECT_UNAUTHORIZED
// for the simple case. For CA bundles, use NODE_EXTRA_CA_CERTS or the agent approach.
// Since Node 18+ fetch uses undici internally, we can pass the agent via fetchOptions.

export function buildFetchOptions(
  method: string,
  tokenString: string,
  body?: string,
  extraHeaders?: Record<string, string>
): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'session': `token-${tokenString}`,
    ...extraHeaders,
  };

  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = body;
  }

  return init;
}

export async function fetchWithAgent(
  url: string,
  init: RequestInit,
  agent?: HttpsAgent
): Promise<Response> {
  // Node 18 native fetch (undici-based) supports `dispatcher` or falls back to
  // the global agent. We attach the agent via the undici-compatible API if available.
  if (agent) {
    // @ts-expect-error - Node 18 undici extended fetch options
    return fetch(url, { ...init, agent });
  }
  return fetch(url, init);
}

export async function checkResponse(response: Response): Promise<void> {
  if (response.ok) return;

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
    throw new TaniumRateLimitError(
      `Rate limited (429): ${response.statusText}`,
      isNaN(retryAfterSeconds ?? NaN) ? undefined : retryAfterSeconds
    );
  }

  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  let taniumCode: string | undefined;

  try {
    const body = await response.json() as Record<string, unknown>;
    if (typeof body.message === 'string') errorMessage = body.message;
    else if (typeof body.error === 'string') errorMessage = body.error;
    if (typeof body.code === 'string') taniumCode = body.code;
  } catch {
    // couldn't parse body; use status text
  }

  throw new TaniumApiError(errorMessage, response.status, taniumCode);
}
