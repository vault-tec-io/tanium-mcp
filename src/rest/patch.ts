import { restGet, restPost, restPut, restDelete } from './client.js';
import config from '../config.js';
import type { PatchDeployment, PatchList, PatchScanConfig, MaintenanceWindow, PatchBlocklist, PatchRepo } from '../types/rest.js';

const base = () => config.patchRestUrl;

// Deployments
export async function getPatchDeployments(params?: Record<string, string | number | boolean | undefined>): Promise<PatchDeployment[]> {
  const res = await restGet<{ data: PatchDeployment[] } | PatchDeployment[]>(`${base()}/patch/v2/deployments`, params);
  return Array.isArray(res) ? res : ((res as { data: PatchDeployment[] }).data ?? []);
}

export async function getPatchDeployment(id: string): Promise<PatchDeployment> {
  const res = await restGet<PatchDeployment | { data: PatchDeployment }>(`${base()}/patch/v2/deployments/${id}`);
  return (res as { data: PatchDeployment }).data ?? res as PatchDeployment;
}

// Patch lists
export async function getPatchLists(): Promise<PatchList[]> {
  const res = await restGet<{ data: PatchList[] } | PatchList[]>(`${base()}/patch/v1/patch-lists`);
  return Array.isArray(res) ? res : ((res as { data: PatchList[] }).data ?? []);
}

// Scan configurations
export async function getPatchScanConfigurations(): Promise<PatchScanConfig[]> {
  const res = await restGet<{ data: PatchScanConfig[] } | PatchScanConfig[]>(`${base()}/patch/v1/scan-configurations`);
  return Array.isArray(res) ? res : ((res as { data: PatchScanConfig[] }).data ?? []);
}

export async function createPatchScanConfiguration(body: unknown): Promise<PatchScanConfig> {
  return restPost(`${base()}/patch/v1/scan-configurations`, body);
}

// Maintenance windows
export async function getPatchMaintenanceWindows(): Promise<MaintenanceWindow[]> {
  const res = await restGet<{ data: MaintenanceWindow[] } | MaintenanceWindow[]>(`${base()}/patch/v1/maintenance-windows`);
  return Array.isArray(res) ? res : ((res as { data: MaintenanceWindow[] }).data ?? []);
}

export async function createPatchMaintenanceWindow(body: unknown): Promise<MaintenanceWindow> {
  return restPost(`${base()}/patch/v1/maintenance-windows`, body);
}

// Blocklists
export async function getPatchBlocklists(): Promise<PatchBlocklist[]> {
  const res = await restGet<{ data: PatchBlocklist[] } | PatchBlocklist[]>(`${base()}/patch/v1/blacklists`);
  return Array.isArray(res) ? res : ((res as { data: PatchBlocklist[] }).data ?? []);
}

export async function createPatchBlocklist(body: unknown): Promise<PatchBlocklist> {
  return restPost(`${base()}/patch/v1/blacklists`, body);
}

export async function updatePatchBlocklist(id: string, body: unknown): Promise<PatchBlocklist> {
  return restPut(`${base()}/patch/v1/blacklists/${id}`, body);
}

export async function deletePatchBlocklist(id: string): Promise<void> {
  await restDelete(`${base()}/patch/v1/blacklists/${id}`);
}

// Repos
export async function getPatchRepos(): Promise<PatchRepo[]> {
  const res = await restGet<{ data: PatchRepo[] } | PatchRepo[]>(`${base()}/patch/v1/repos`);
  return Array.isArray(res) ? res : ((res as { data: PatchRepo[] }).data ?? []);
}
