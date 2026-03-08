import { z } from 'zod';
import {
  getComplianceResults,
  getCVEs,
  getComplianceExceptions,
  createComplianceException,
  getBenchmarks,
  getCustomChecks,
  getComplyBundles,
  getVulnerabilitySources,
} from '../rest/comply.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const QueryComplianceResultsInput = z.object({
  hash: z.string().describe('Sensor/rule hash to query results for'),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

export const ListCVEsInput = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).optional(),
  platform: z.string().optional().describe('OS platform filter (e.g., Windows, Linux)'),
  limit: z.number().int().optional(),
});

export const ListComplianceExceptionsInput = z.object({
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

export const CreateComplianceExceptionInput = z.object({
  rule_id: z.string().optional(),
  endpoint_id: z.string().optional(),
  reason: z.string().describe('Reason for the exception'),
  expires_at: z.string().optional().describe('ISO 8601 expiry datetime'),
});

export async function queryComplianceResults(
  input: z.infer<typeof QueryComplianceResultsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const results = await getComplianceResults(input.hash, {
      limit: input.limit,
      offset: input.offset,
    });
    return { success: true, data: { results } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listCVEs(
  input: z.infer<typeof ListCVEsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const body: Record<string, unknown> = {};
    if (input.severity) body.severity = input.severity;
    if (input.platform) body.platform = input.platform;
    if (input.limit) body.limit = input.limit;

    const cves = await getCVEs(body);
    return { success: true, data: { cves } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listComplianceExceptions(
  input: z.infer<typeof ListComplianceExceptionsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const exceptions = await getComplianceExceptions({ limit: input.limit, offset: input.offset });
    return { success: true, data: { exceptions } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createComplianceExceptionHandler(
  input: z.infer<typeof CreateComplianceExceptionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const exception = await createComplianceException({
      ruleId: input.rule_id,
      endpointId: input.endpoint_id,
      reason: input.reason,
      expiresAt: input.expires_at,
    });
    return { success: true, data: { exception } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listBenchmarks(): Promise<ToolOutput<unknown>> {
  try {
    const benchmarks = await getBenchmarks();
    return { success: true, data: { benchmarks } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listCustomChecks(): Promise<ToolOutput<unknown>> {
  try {
    const checks = await getCustomChecks();
    return { success: true, data: { customChecks: checks } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listComplyBundles(): Promise<ToolOutput<unknown>> {
  try {
    const bundles = await getComplyBundles();
    return { success: true, data: { bundles } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listVulnerabilitySources(): Promise<ToolOutput<unknown>> {
  try {
    const sources = await getVulnerabilitySources();
    return { success: true, data: { sources } };
  } catch (err) {
    return handleToolError(err);
  }
}
