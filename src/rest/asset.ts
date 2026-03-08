import { restGet, restPost } from './client.js';
import config from '../config.js';
import type { Asset, AssetAttribute, AssetView } from '../types/rest.js';

const base = () => config.assetRestUrl;

export interface AssetListResponse {
  assets: Asset[];
  nextAssetId?: string;
  totalCount?: number;
}

export async function getAssets(params?: {
  minimumAssetId?: string;
  limit?: number;
  filter?: string;
}): Promise<AssetListResponse> {
  const res = await restGet<AssetListResponse | Asset[]>(`${base()}/v1/assets`, params as Record<string, string | number | boolean | undefined>);
  if (Array.isArray(res)) return { assets: res };
  return res as AssetListResponse;
}

export async function getAsset(id: string): Promise<Asset> {
  return restGet<Asset>(`${base()}/v1/assets/${id}`);
}

export async function getAssetAttributes(): Promise<AssetAttribute[]> {
  const res = await restGet<{ data: AssetAttribute[] } | AssetAttribute[]>(`${base()}/v1/attributes`);
  return Array.isArray(res) ? res : ((res as { data: AssetAttribute[] }).data ?? []);
}

export async function getAssetViews(): Promise<AssetView[]> {
  const res = await restGet<{ data: AssetView[] } | AssetView[]>(`${base()}/v1/views`);
  return Array.isArray(res) ? res : ((res as { data: AssetView[] }).data ?? []);
}

export async function createAssetView(body: unknown): Promise<AssetView> {
  return restPost(`${base()}/v1/views`, body);
}
