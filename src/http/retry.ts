import { TaniumAuthError, TaniumRateLimitError } from '../errors/tanium.js';
import { rotateToken } from './auth.js';

const MAX_RATE_LIMIT_RETRIES = 3;

/**
 * Wraps an HTTP call with:
 * 1. 401 → rotate token → retry once
 * 2. 429 → wait for Retry-After → retry up to 3 times
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { allow401Retry?: boolean } = {}
): Promise<T> {
  const { allow401Retry = true } = options;

  let rateLimitAttempts = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof TaniumRateLimitError && rateLimitAttempts < MAX_RATE_LIMIT_RETRIES) {
        rateLimitAttempts++;
        const waitMs = (err.retryAfterSeconds ?? 5) * 1000;
        console.warn(`[tanium-mcp] Rate limited. Waiting ${waitMs}ms before retry ${rateLimitAttempts}/${MAX_RATE_LIMIT_RETRIES}`);
        await sleep(waitMs);
        continue;
      }

      if (err instanceof TaniumAuthError && allow401Retry) {
        // Don't retry auth errors from rotation itself
        throw err;
      }

      // Re-throw anything else
      throw err;
    }
  }
}

/**
 * Wraps a fetch call with 401 detection + token rotation + single retry.
 * The caller passes a factory that builds the request, so we can re-build
 * after rotation (token will have changed).
 */
export async function withAuth401Retry<T>(
  executeRequest: () => Promise<T>
): Promise<T> {
  try {
    return await executeRequest();
  } catch (err) {
    // We check for 401-like errors: TaniumApiError with status 401
    if (isUnauthorized(err)) {
      // Rotate token
      await rotateToken();
      // Retry once
      return await executeRequest();
    }
    throw err;
  }
}

function isUnauthorized(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { statusCode?: number; name?: string };
  return e.statusCode === 401;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
