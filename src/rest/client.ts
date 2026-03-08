import { getCurrentToken } from '../http/auth.js';
import { buildFetchOptions, fetchWithAgent, getHttpsAgent, checkResponse } from '../http/client.js';
import { withAuth401Retry } from '../http/retry.js';
import { TaniumApiError } from '../errors/tanium.js';

export async function restGet<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const fullUrl = buildUrl(url, params);
  return withAuth401Retry(() => doGet<T>(fullUrl));
}

export async function restPost<T>(url: string, body?: unknown): Promise<T> {
  return withAuth401Retry(() => doPost<T>(url, body));
}

export async function restPut<T>(url: string, body?: unknown): Promise<T> {
  return withAuth401Retry(() => doPut<T>(url, body));
}

export async function restPatch<T>(url: string, body?: unknown): Promise<T> {
  return withAuth401Retry(() => doPatchReq<T>(url, body));
}

export async function restDelete<T>(url: string): Promise<T> {
  return withAuth401Retry(() => doDelete<T>(url));
}

function buildUrl(base: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return base;
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
  if (!filtered.length) return base;
  const qs = filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return `${base}?${qs}`;
}

async function doGet<T>(url: string): Promise<T> {
  const init = buildFetchOptions('GET', getCurrentToken());
  const response = await fetchWithAgent(url, init, getHttpsAgent());
  await checkResponse(response);
  return response.json() as Promise<T>;
}

async function doPost<T>(url: string, body?: unknown): Promise<T> {
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const init = buildFetchOptions('POST', getCurrentToken(), bodyStr);
  const response = await fetchWithAgent(url, init, getHttpsAgent());
  await checkResponse(response);
  // Some endpoints return 204 No Content
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function doPut<T>(url: string, body?: unknown): Promise<T> {
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const init = buildFetchOptions('PUT', getCurrentToken(), bodyStr);
  const response = await fetchWithAgent(url, init, getHttpsAgent());
  await checkResponse(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function doPatchReq<T>(url: string, body?: unknown): Promise<T> {
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const init = buildFetchOptions('PATCH', getCurrentToken(), bodyStr);
  const response = await fetchWithAgent(url, init, getHttpsAgent());
  await checkResponse(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function doDelete<T>(url: string): Promise<T> {
  const init = buildFetchOptions('DELETE', getCurrentToken());
  const response = await fetchWithAgent(url, init, getHttpsAgent());
  await checkResponse(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
