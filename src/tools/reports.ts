import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { REPORTS_QUERY, REPORT_RESULT_DATA_QUERY } from '../graphql/queries/reports.js';
import { REPORT_EXPORT_MUTATION, REPORT_IMPORT_MUTATION, REPORT_DELETE_MUTATION } from '../graphql/mutations/reports.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListReportsInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
});

export const GetReportDataInput = z.object({
  report_id: z.string(),
  first: z.number().int().default(50),
  cursor: z.string().optional().describe('Pagination cursor — pass back nextCursor to get next page'),
});

export const ExportReportInput = z.object({
  report_id: z.string(),
});

export const ImportReportInput = z.object({
  import_data: z.string().describe('Report definition export data (JSON string)'),
});

export const DeleteReportInput = z.object({
  report_id: z.string(),
});

export async function listReports(
  input: z.infer<typeof ListReportsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      reports: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(REPORTS_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.reports);
    return { success: true, data: { reports: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getReportData(
  input: z.infer<typeof GetReportDataInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      reportResultData: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(REPORT_RESULT_DATA_QUERY, { id: input.report_id, first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.reportResultData);
    return { success: true, data: { rows: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function exportReport(
  input: z.infer<typeof ExportReportInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      reportExport: { error?: { message: string }; exportData?: string };
    }>(REPORT_EXPORT_MUTATION, { id: input.report_id });

    const payload = result.data.reportExport;
    if (payload.error) {
      return { success: false, error: { code: 'EXPORT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { exportData: payload.exportData } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function importReport(
  input: z.infer<typeof ImportReportInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      reportImport: { error?: { message: string }; report?: unknown };
    }>(REPORT_IMPORT_MUTATION, { input: { data: input.import_data } });

    const payload = result.data.reportImport;
    if (payload.error) {
      return { success: false, error: { code: 'IMPORT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { report: payload.report } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function deleteReport(
  input: z.infer<typeof DeleteReportInput>
): Promise<ToolOutput<unknown>> {
  try {
    // NOTE: reportDelete is Stability 1.2 (Experimental RC) — may change
    const result = await execute<{
      reportDelete: { error?: { message: string } };
    }>(REPORT_DELETE_MUTATION, { id: input.report_id });

    const payload = result.data.reportDelete;
    if (payload.error) {
      return { success: false, error: { code: 'DELETE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { deleted: true, id: input.report_id } };
  } catch (err) {
    return handleToolError(err);
  }
}
