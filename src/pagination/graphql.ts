import type { ToolOutput } from '../types/rest.js';

export interface GQLPage<T> {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: { hasNextPage: boolean; endCursor?: string };
  totalRecords?: number;
}

export function buildGQLPaginatedOutput<T>(
  connection: GQLPage<T>
): { items: T[]; pagination: ToolOutput<T>['pagination'] } {
  const items = connection.edges.map(e => e.node);
  const pagination: ToolOutput<T>['pagination'] = {
    hasMore: connection.pageInfo.hasNextPage,
    nextCursor: connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : undefined,
    totalRecords: connection.totalRecords,
  };
  return { items, pagination };
}
