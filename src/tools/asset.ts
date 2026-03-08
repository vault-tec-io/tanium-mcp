import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { ASSET_PRODUCTS_QUERY, ASSET_PRODUCT_ENDPOINTS_QUERY } from '../graphql/queries/asset.js';
import { getAssets, getAsset, getAssetAttributes, getAssetViews, createAssetView } from '../rest/asset.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { encodeAssetIdCursor, decodeCursor } from '../pagination/rest.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListAssetProductsInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
  filter: z.record(z.unknown()).optional(),
});

export const ListAssetProductEndpointsInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
  filter: z.record(z.unknown()).optional(),
});

export const ListAssetsInput = z.object({
  limit: z.number().int().default(50),
  cursor: z.string().optional().describe('Pagination cursor from previous call'),
  filter: z.string().optional().describe('Filter expression'),
});

export const GetAssetInput = z.object({
  asset_id: z.string(),
});

export const CreateAssetViewInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  attributes: z.array(z.string()).optional().describe('Attribute names to include in view'),
});

export async function listAssetProducts(
  input: z.infer<typeof ListAssetProductsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      assetProducts: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
      };
    }>(ASSET_PRODUCTS_QUERY, { first: input.first, after: input.cursor, filter: input.filter });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.assetProducts);
    return { success: true, data: { products: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listAssetProductEndpoints(
  input: z.infer<typeof ListAssetProductEndpointsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      assetProductEndpoints: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
      };
    }>(ASSET_PRODUCT_ENDPOINTS_QUERY, { first: input.first, after: input.cursor, filter: input.filter });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.assetProductEndpoints);
    return { success: true, data: { endpoints: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listAssets(
  input: z.infer<typeof ListAssetsInput>
): Promise<ToolOutput<unknown>> {
  try {
    // Decode cursor to get nextAssetId for offset pagination
    let minimumAssetId: string | undefined;
    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);
      if (decoded?.type === 'assetId') {
        minimumAssetId = decoded.id;
      }
    }

    const response = await getAssets({
      minimumAssetId,
      limit: input.limit,
      filter: input.filter,
    });

    const nextCursor = response.nextAssetId
      ? encodeAssetIdCursor(response.nextAssetId)
      : undefined;

    return {
      success: true,
      data: { assets: response.assets },
      pagination: {
        hasMore: !!response.nextAssetId,
        nextCursor,
        totalRecords: response.totalCount,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getAssetHandler(
  input: z.infer<typeof GetAssetInput>
): Promise<ToolOutput<unknown>> {
  try {
    const asset = await getAsset(input.asset_id);
    return { success: true, data: { asset } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listAssetAttributes(): Promise<ToolOutput<unknown>> {
  try {
    const attributes = await getAssetAttributes();
    return { success: true, data: { attributes } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listAssetViews(): Promise<ToolOutput<unknown>> {
  try {
    const views = await getAssetViews();
    return { success: true, data: { views } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createAssetViewHandler(
  input: z.infer<typeof CreateAssetViewInput>
): Promise<ToolOutput<unknown>> {
  try {
    const view = await createAssetView(input);
    return { success: true, data: { view } };
  } catch (err) {
    return handleToolError(err);
  }
}
