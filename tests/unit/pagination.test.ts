import { describe, it, expect } from 'vitest';
import { encodeOffsetCursor, encodeAssetIdCursor, decodeCursor } from '../../src/pagination/rest.js';
import { buildGQLPaginatedOutput } from '../../src/pagination/graphql.js';

describe('REST pagination cursor encoding', () => {
  it('encodes and decodes offset cursor', () => {
    const cursor = encodeOffsetCursor(50);
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual({ type: 'offset', offset: 50 });
  });

  it('encodes and decodes assetId cursor', () => {
    const cursor = encodeAssetIdCursor('asset-12345');
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual({ type: 'assetId', id: 'asset-12345' });
  });

  it('returns null for invalid cursor', () => {
    const decoded = decodeCursor('not-valid-base64!!!');
    expect(decoded).toBeNull();
  });

  it('returns null for random base64 without type field', () => {
    const cursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
    const decoded = decodeCursor(cursor);
    expect(decoded).toBeNull();
  });
});

describe('GQL pagination output', () => {
  it('builds pagination with next cursor when hasNextPage=true', () => {
    const connection = {
      edges: [
        { cursor: 'c1', node: { id: '1', name: 'test' } },
      ],
      pageInfo: { hasNextPage: true, endCursor: 'c1' },
      totalRecords: 100,
    };

    const { items, pagination } = buildGQLPaginatedOutput(connection);
    expect(items).toHaveLength(1);
    expect(pagination?.hasMore).toBe(true);
    expect(pagination?.nextCursor).toBe('c1');
    expect(pagination?.totalRecords).toBe(100);
  });

  it('does not include nextCursor when hasNextPage=false', () => {
    const connection = {
      edges: [{ cursor: 'c1', node: { id: '1' } }],
      pageInfo: { hasNextPage: false, endCursor: 'c1' },
    };

    const { pagination } = buildGQLPaginatedOutput(connection);
    expect(pagination?.hasMore).toBe(false);
    expect(pagination?.nextCursor).toBeUndefined();
  });

  it('extracts node data from edges', () => {
    const connection = {
      edges: [
        { cursor: 'a', node: { id: 'item-1', value: 'foo' } },
        { cursor: 'b', node: { id: 'item-2', value: 'bar' } },
      ],
      pageInfo: { hasNextPage: false },
    };

    const { items } = buildGQLPaginatedOutput(connection);
    expect(items).toEqual([
      { id: 'item-1', value: 'foo' },
      { id: 'item-2', value: 'bar' },
    ]);
  });
});
