import { describe, it, expect } from 'vitest';
import {
  TaniumAuthError,
  TaniumApiError,
  TaniumGraphQLError,
  TaniumRateLimitError,
  TaniumTimeoutError,
  CacheUnavailableError,
  ValidationError,
} from '../../src/errors/tanium.js';
import { handleToolError, mcpError } from '../../src/errors/mcp.js';

describe('Error classes', () => {
  it('TaniumApiError stores status code', () => {
    const err = new TaniumApiError('Not found', 404, 'ERR_NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.taniumCode).toBe('ERR_NOT_FOUND');
    expect(err.name).toBe('TaniumApiError');
  });

  it('TaniumGraphQLError stores errors array', () => {
    const errs = [{ message: 'field error' }];
    const err = new TaniumGraphQLError('GraphQL failed', errs);
    expect(err.errors).toEqual(errs);
    expect(err.name).toBe('TaniumGraphQLError');
  });

  it('TaniumRateLimitError stores retryAfterSeconds', () => {
    const err = new TaniumRateLimitError('Rate limited', 30);
    expect(err.retryAfterSeconds).toBe(30);
  });
});

describe('handleToolError', () => {
  it('maps ValidationError to INVALID_INPUT', () => {
    const result = handleToolError(new ValidationError('bad field'));
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_INPUT');
    expect(result.error?.message).toBe('bad field');
  });

  it('maps TaniumAuthError to AUTH_ERROR', () => {
    const result = handleToolError(new TaniumAuthError('token expired'));
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_ERROR');
    expect(result.error?.message).toContain('token expired');
  });

  it('maps TaniumRateLimitError with retryAfter', () => {
    const result = handleToolError(new TaniumRateLimitError('rate limited', 60));
    expect(result.error?.code).toBe('RATE_LIMIT');
    expect(result.error?.message).toContain('60s');
  });

  it('maps TaniumTimeoutError to TIMEOUT', () => {
    const result = handleToolError(new TaniumTimeoutError('timed out'));
    expect(result.error?.code).toBe('TIMEOUT');
  });

  it('maps CacheUnavailableError', () => {
    const result = handleToolError(new CacheUnavailableError('cache not ready'));
    expect(result.error?.code).toBe('CACHE_UNAVAILABLE');
  });

  it('maps TaniumApiError with status code', () => {
    const result = handleToolError(new TaniumApiError('not found', 404));
    expect(result.error?.code).toBe('API_ERROR_404');
  });

  it('maps generic Error to UNKNOWN_ERROR', () => {
    const result = handleToolError(new Error('something went wrong'));
    expect(result.error?.code).toBe('UNKNOWN_ERROR');
    expect(result.error?.message).toBe('something went wrong');
  });

  it('maps string errors', () => {
    const result = handleToolError('plain string error');
    expect(result.error?.code).toBe('UNKNOWN_ERROR');
  });
});

describe('mcpError', () => {
  it('creates error envelope', () => {
    const result = mcpError('MY_CODE', 'my message');
    expect(result).toEqual({
      success: false,
      error: { code: 'MY_CODE', message: 'my message' },
    });
  });
});
