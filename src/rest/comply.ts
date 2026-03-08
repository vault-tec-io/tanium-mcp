import { restGet, restPost } from './client.js';
import config from '../config.js';
import type { ComplianceResult, CVE, ComplianceException, Benchmark, CustomCheck, ComplyBundle, VulnerabilitySource } from '../types/rest.js';

const base = () => config.complyRestUrl;

export async function getComplianceResults(hash: string, params?: Record<string, string | number | boolean | undefined>): Promise<ComplianceResult[]> {
  const res = await restGet<{ data: ComplianceResult[] } | ComplianceResult[]>(
    `${base()}/v1/results/aggregate/${hash}`, params
  );
  return Array.isArray(res) ? res : ((res as { data: ComplianceResult[] }).data ?? []);
}

export async function getCVEs(body: unknown): Promise<CVE[]> {
  const res = await restPost<{ data: CVE[] } | CVE[]>(`${base()}/v1/vulnerability/cves`, body);
  return Array.isArray(res) ? res : ((res as { data: CVE[] }).data ?? []);
}

export async function getComplianceExceptions(params?: Record<string, string | number | boolean | undefined>): Promise<ComplianceException[]> {
  const res = await restGet<{ data: ComplianceException[] } | ComplianceException[]>(`${base()}/v2/exceptions`, params);
  return Array.isArray(res) ? res : ((res as { data: ComplianceException[] }).data ?? []);
}

export async function createComplianceException(body: unknown): Promise<ComplianceException> {
  return restPost(`${base()}/v2/exceptions`, body);
}

export async function getBenchmarks(): Promise<Benchmark[]> {
  const res = await restGet<{ data: Benchmark[] } | Benchmark[]>(`${base()}/v1/benchmarks`);
  return Array.isArray(res) ? res : ((res as { data: Benchmark[] }).data ?? []);
}

export async function getCustomChecks(): Promise<CustomCheck[]> {
  const res = await restGet<{ data: CustomCheck[] } | CustomCheck[]>(`${base()}/v1/custom-checks`);
  return Array.isArray(res) ? res : ((res as { data: CustomCheck[] }).data ?? []);
}

export async function getComplyBundles(): Promise<ComplyBundle[]> {
  const res = await restGet<{ data: ComplyBundle[] } | ComplyBundle[]>(`${base()}/v1/bundles`);
  return Array.isArray(res) ? res : ((res as { data: ComplyBundle[] }).data ?? []);
}

export async function getVulnerabilitySources(): Promise<VulnerabilitySource[]> {
  const res = await restGet<{ data: VulnerabilitySource[] } | VulnerabilitySource[]>(`${base()}/v1/vulnerability-sources`);
  return Array.isArray(res) ? res : ((res as { data: VulnerabilitySource[] }).data ?? []);
}
