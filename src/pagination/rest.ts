import type { ToolOutput } from '../types/rest.js';

/**
 * Encode an offset or nextAssetId into a unified nextCursor string.
 */
export function encodeOffsetCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ type: 'offset', offset })).toString('base64');
}

export function encodeAssetIdCursor(nextAssetId: string): string {
  return Buffer.from(JSON.stringify({ type: 'assetId', id: nextAssetId })).toString('base64');
}

export function decodeCursor(cursor: string): { type: 'offset'; offset: number } | { type: 'assetId'; id: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as unknown;
    if (typeof decoded === 'object' && decoded !== null && 'type' in decoded) {
      return decoded as { type: 'offset'; offset: number } | { type: 'assetId'; id: string };
    }
    return null;
  } catch {
    return null;
  }
}

export function buildRestPagination<T>(
  items: T[],
  hasMore: boolean,
  nextCursor?: string,
  totalRecords?: number
): { items: T[]; pagination: ToolOutput<T>['pagination'] } {
  return {
    items,
    pagination: { hasMore, nextCursor, totalRecords },
  };
}
