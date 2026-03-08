import { restGet, restPost } from './client.js';
import config from '../config.js';
import type { DeployDeployment, DeployProfile, SoftwareBundle, TempFile } from '../types/rest.js';

const base = () => config.deployRestUrl;

// Deployments (v3)
export async function getDeployDeployments(params?: Record<string, string | number | boolean | undefined>): Promise<DeployDeployment[]> {
  const res = await restGet<{ data: DeployDeployment[] } | DeployDeployment[]>(`${base()}/v3/deployments`, params);
  return Array.isArray(res) ? res : ((res as { data: DeployDeployment[] }).data ?? []);
}

export async function createDeployDeployment(body: unknown): Promise<DeployDeployment> {
  const res = await restPost<{ data: DeployDeployment } | DeployDeployment>(`${base()}/v3/deployments`, body);
  return (res as { data: DeployDeployment }).data ?? res as DeployDeployment;
}

// Maintenance windows (v2)
export async function getDeployMaintenanceWindows(): Promise<unknown[]> {
  const res = await restGet<{ data: unknown[] } | unknown[]>(`${base()}/v2/maintenance-windows`);
  return Array.isArray(res) ? res : ((res as { data: unknown[] }).data ?? []);
}

export async function createDeployMaintenanceWindow(body: unknown): Promise<unknown> {
  return restPost(`${base()}/v2/maintenance-windows`, body);
}

// Profiles (v1)
export async function getDeployProfiles(): Promise<DeployProfile[]> {
  const res = await restGet<{ data: DeployProfile[] } | DeployProfile[]>(`${base()}/v1/profiles`);
  return Array.isArray(res) ? res : ((res as { data: DeployProfile[] }).data ?? []);
}

// Temp files (v1)
export async function uploadTempFile(body: unknown): Promise<TempFile> {
  return restPost(`${base()}/v1/tempfiles`, body);
}

// Software package bundles (v2)
export async function getSoftwareBundles(): Promise<SoftwareBundle[]> {
  const res = await restGet<{ data: SoftwareBundle[] } | SoftwareBundle[]>(`${base()}/v2/software-package-bundles`);
  return Array.isArray(res) ? res : ((res as { data: SoftwareBundle[] }).data ?? []);
}
