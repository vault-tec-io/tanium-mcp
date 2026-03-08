import { restGet, restPost } from './client.js';
import config from '../config.js';
import type { Connection, ConnectionRun, ConnectDestination, ConnectSource } from '../types/rest.js';

const base = () => config.connectRestUrl;

export async function getConnections(): Promise<Connection[]> {
  const res = await restGet<{ data: Connection[] } | Connection[]>(`${base()}/v1/connections`);
  return Array.isArray(res) ? res : ((res as { data: Connection[] }).data ?? []);
}

export async function createConnection(body: unknown): Promise<Connection> {
  return restPost(`${base()}/v1/connections`, body);
}

export async function runConnection(id: string, body?: unknown): Promise<ConnectionRun> {
  return restPost(`${base()}/v1/connections/${id}/runs`, body);
}

export async function stopConnectionRun(id: string): Promise<void> {
  await restPost(`${base()}/v1/connections/${id}/stop`);
}

export async function getConnectionRuns(id: string): Promise<ConnectionRun[]> {
  const res = await restGet<{ data: ConnectionRun[] } | ConnectionRun[]>(`${base()}/v1/connections/${id}/runs`);
  return Array.isArray(res) ? res : ((res as { data: ConnectionRun[] }).data ?? []);
}

export async function getConnectionLogs(id: string, runId: string): Promise<unknown> {
  return restGet(`${base()}/v1/connections/${id}/runs/${runId}/logs`);
}

export async function getConnectDestinations(type: string): Promise<ConnectDestination[]> {
  const res = await restGet<{ data: ConnectDestination[] } | ConnectDestination[]>(`${base()}/v1/destinations/${type}`);
  return Array.isArray(res) ? res : ((res as { data: ConnectDestination[] }).data ?? []);
}

export async function createConnectDestination(type: string, body: unknown): Promise<ConnectDestination> {
  return restPost(`${base()}/v1/destinations/${type}`, body);
}

export async function getConnectSources(type: string): Promise<ConnectSource[]> {
  const res = await restGet<{ data: ConnectSource[] } | ConnectSource[]>(`${base()}/v1/sources/${type}`);
  return Array.isArray(res) ? res : ((res as { data: ConnectSource[] }).data ?? []);
}

export async function importConnection(body: unknown): Promise<unknown> {
  return restPost(`${base()}/v1/import`, body);
}

export async function exportConnection(id: string): Promise<unknown> {
  return restPost(`${base()}/v1/export/${id}`);
}
