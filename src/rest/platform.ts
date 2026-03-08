import { restGet, restPost, restPut, restPatch, restDelete } from './client.js';
import config from '../config.js';
import type { PlatformSensor, PlatformPackage } from '../types/rest.js';

const base = () => config.platformRestUrl;

// Sensors
export async function getAllSensors(): Promise<PlatformSensor[]> {
  const url = `${base()}/sensors`;
  const res = await restGet<{ data: { result_object: { sensor: PlatformSensor[] } } }>(url);
  return res.data?.result_object?.sensor ?? [];
}

export async function createSensor(body: unknown): Promise<PlatformSensor> {
  const res = await restPost<{ data: { result_object: { sensor: PlatformSensor[] } } }>(
    `${base()}/sensors`, body
  );
  const arr = res.data?.result_object?.sensor;
  return Array.isArray(arr) ? arr[0] : arr as unknown as PlatformSensor;
}

export async function updateSensor(id: string, body: unknown): Promise<PlatformSensor> {
  const res = await restPatch<{ data: { result_object: { sensor: PlatformSensor[] } } }>(
    `${base()}/sensors/${id}`, body
  );
  const arr = res.data?.result_object?.sensor;
  return Array.isArray(arr) ? arr[0] : arr as unknown as PlatformSensor;
}

export async function deleteSensor(id: string): Promise<void> {
  await restDelete(`${base()}/sensors/${id}`);
}

// Packages
export async function getAllPackages(): Promise<PlatformPackage[]> {
  const url = `${base()}/packages`;
  const res = await restGet<{ data: { result_object: { package_spec: PlatformPackage[] } } }>(url);
  return res.data?.result_object?.package_spec ?? [];
}

export async function createPackage(body: unknown): Promise<PlatformPackage> {
  const res = await restPost<{ data: { result_object: { package_spec: PlatformPackage[] } } }>(
    `${base()}/packages`, body
  );
  const arr = res.data?.result_object?.package_spec;
  return Array.isArray(arr) ? arr[0] : arr as unknown as PlatformPackage;
}

export async function updatePackage(id: string, body: unknown): Promise<PlatformPackage> {
  const res = await restPatch<{ data: { result_object: { package_spec: PlatformPackage[] } } }>(
    `${base()}/packages/${id}`, body
  );
  const arr = res.data?.result_object?.package_spec;
  return Array.isArray(arr) ? arr[0] : arr as unknown as PlatformPackage;
}

export async function deletePackage(id: string): Promise<void> {
  await restDelete(`${base()}/packages/${id}`);
}

// Saved Questions
export async function getSavedQuestions(params?: { count?: number; start?: number }): Promise<unknown[]> {
  const url = `${base()}/saved_questions`;
  const res = await restGet<{ data: { result_object: { saved_question: unknown[] } } }>(url, params);
  return res.data?.result_object?.saved_question ?? [];
}

export async function getSavedQuestionResults(id: string): Promise<unknown> {
  return restGet(`${base()}/result_data/saved_question/${id}`);
}

// Question results
export async function getQuestionResultInfo(id: string): Promise<unknown> {
  return restGet(`${base()}/result_info/question/${id}`);
}

export async function getQuestionResultData(id: string): Promise<unknown> {
  return restGet(`${base()}/result_data/question/${id}`);
}

// Action approvals (fallback)
export async function createActionApproval(body: unknown): Promise<unknown> {
  return restPost(`${base()}/saved_action_approvals`, body);
}
