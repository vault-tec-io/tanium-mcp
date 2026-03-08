import type { ToolOutput } from '../types/rest.js';
import {
  TaniumAuthError,
  TaniumApiError,
  TaniumGraphQLError,
  TaniumRateLimitError,
  TaniumTimeoutError,
  CacheUnavailableError,
  ValidationError,
} from './tanium.js';

export function mcpError<T = never>(
  code: string,
  message: string
): ToolOutput<T> {
  return { success: false, error: { code, message } };
}

export function handleToolError<T = never>(error: unknown): ToolOutput<T> {
  if (error instanceof ValidationError) {
    return mcpError<T>('INVALID_INPUT', error.message);
  }
  if (error instanceof TaniumAuthError) {
    return mcpError<T>(
      'AUTH_ERROR',
      `Authentication failed — check token and permissions: ${error.message}`
    );
  }
  if (error instanceof TaniumRateLimitError) {
    const retryMsg = error.retryAfterSeconds
      ? ` Retry after ${error.retryAfterSeconds}s.`
      : '';
    return mcpError<T>('RATE_LIMIT', `Rate limited by Tanium API.${retryMsg}`);
  }
  if (error instanceof TaniumTimeoutError) {
    return mcpError<T>('TIMEOUT', error.message);
  }
  if (error instanceof CacheUnavailableError) {
    return mcpError<T>('CACHE_UNAVAILABLE', error.message);
  }
  if (error instanceof TaniumGraphQLError) {
    return mcpError<T>('GRAPHQL_ERROR', error.message);
  }
  if (error instanceof TaniumApiError) {
    return mcpError<T>(
      `API_ERROR_${error.statusCode}`,
      error.message
    );
  }
  if (error instanceof Error) {
    return mcpError<T>('UNKNOWN_ERROR', error.message);
  }
  return mcpError<T>('UNKNOWN_ERROR', String(error));
}
