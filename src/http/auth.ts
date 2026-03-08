import { TaniumAuthError } from '../errors/tanium.js';
import { buildFetchOptions, fetchWithAgent, getHttpsAgent, checkResponse } from './client.js';

interface TokenState {
  tokenString: string;
  expiresAt: Date | null;
}

let state: TokenState = { tokenString: '', expiresAt: null };
let graphqlUrl = '';
let proactiveTimer: ReturnType<typeof setTimeout> | undefined;

export function initAuth(tokenString: string, gqlUrl: string): void {
  state = { tokenString, expiresAt: null };
  graphqlUrl = gqlUrl;
}

export function getCurrentToken(): string {
  return state.tokenString;
}

export function setTokenExpiry(expiresAt: Date | null): void {
  state.expiresAt = expiresAt;
  scheduleProactiveRotation();
}

function scheduleProactiveRotation(): void {
  if (proactiveTimer) clearTimeout(proactiveTimer);
  if (!state.expiresAt) return;

  const ONE_HOUR_MS = 60 * 60 * 1000;
  const timeUntilRotation = state.expiresAt.getTime() - Date.now() - ONE_HOUR_MS;

  if (timeUntilRotation <= 0) {
    // Already within 1 hour of expiry — rotate soon
    setTimeout(() => rotateToken().catch(err => {
      console.error('[tanium-mcp] Proactive token rotation failed:', err);
    }), 0);
    return;
  }

  proactiveTimer = setTimeout(() => {
    rotateToken().catch(err => {
      console.error('[tanium-mcp] Proactive token rotation failed:', err);
    });
  }, timeUntilRotation);
}

const ROTATE_MUTATION = `
  mutation RotateToken($tokenString: String!) {
    apiTokenRotate(input: { tokenString: $tokenString }) {
      error { message }
      token {
        tokenString
        expiration
      }
    }
  }
`;

export async function rotateToken(): Promise<void> {
  const currentToken = state.tokenString;

  const body = JSON.stringify({
    query: ROTATE_MUTATION,
    variables: { tokenString: currentToken },
  });

  const init = buildFetchOptions('POST', currentToken, body);
  let response: Response;

  try {
    response = await fetchWithAgent(graphqlUrl, init, getHttpsAgent());
  } catch (err) {
    throw new TaniumAuthError('Token rotation request failed', err);
  }

  if (!response.ok) {
    throw new TaniumAuthError(
      `Token rotation HTTP error: ${response.status} ${response.statusText}`
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json() as Record<string, unknown>;
  } catch (err) {
    throw new TaniumAuthError('Token rotation response parse failed', err);
  }

  const payload = (data as {
    data?: { apiTokenRotate?: {
      error?: { message: string };
      token?: { tokenString: string; expiration: string };
    }};
  }).data?.apiTokenRotate;

  if (!payload) {
    throw new TaniumAuthError('Token rotation returned no payload');
  }
  if (payload.error) {
    throw new TaniumAuthError(`Token rotation error: ${payload.error.message}`);
  }
  if (!payload.token?.tokenString) {
    throw new TaniumAuthError('Token rotation returned no new token string');
  }

  state.tokenString = payload.token.tokenString;
  if (payload.token.expiration) {
    state.expiresAt = new Date(payload.token.expiration);
    scheduleProactiveRotation();
  }
}
