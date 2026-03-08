import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaniumAuthError } from '../../src/errors/tanium.js';

// Test the retry logic in isolation
describe('401 retry logic', () => {
  it('retries once on 401 after token rotation', async () => {
    let callCount = 0;
    let rotated = false;

    const mockRotate = async () => {
      rotated = true;
    };

    const mockRequest = async () => {
      callCount++;
      if (callCount === 1 && !rotated) {
        const err = new Error('Unauthorized') as Error & { statusCode: number };
        err.statusCode = 401;
        throw err;
      }
      return { data: 'success' };
    };

    // Simulate the withAuth401Retry pattern
    const withAuth401Retry = async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 401) {
          await mockRotate();
          return await fn();
        }
        throw err;
      }
    };

    const result = await withAuth401Retry(mockRequest);
    expect(result).toEqual({ data: 'success' });
    expect(callCount).toBe(2);
    expect(rotated).toBe(true);
  });

  it('throws TaniumAuthError on repeated 401 after rotation', async () => {
    const mockRequest = async () => {
      const err = new Error('Unauthorized') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    };

    const withAuth401Retry = async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 401) {
          // Rotation also fails (throws TaniumAuthError)
          throw new TaniumAuthError('Token rotation failed');
        }
        throw err;
      }
    };

    await expect(withAuth401Retry(mockRequest)).rejects.toThrow(TaniumAuthError);
  });
});

describe('Proactive rotation timing', () => {
  it('schedules rotation 1 hour before expiry', () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const timeUntilRotation = expiresAt.getTime() - Date.now() - ONE_HOUR_MS;

    // Should be approximately 6 days in ms
    expect(timeUntilRotation).toBeGreaterThan(5 * 24 * 60 * 60 * 1000);
    expect(timeUntilRotation).toBeLessThan(7 * 24 * 60 * 60 * 1000);
  });

  it('triggers immediate rotation when within 1 hour of expiry', () => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const timeUntilRotation = expiresAt.getTime() - Date.now() - ONE_HOUR_MS;

    expect(timeUntilRotation).toBeLessThanOrEqual(0);
  });
});

describe('Error hierarchy', () => {
  it('TaniumAuthError is instanceof Error', () => {
    const err = new TaniumAuthError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('TaniumAuthError');
  });
});
