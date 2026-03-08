import { z } from 'zod';
import {
  getConnections,
  createConnection,
  runConnection,
  stopConnectionRun,
  getConnectionRuns,
  getConnectionLogs,
  getConnectDestinations,
  createConnectDestination,
  getConnectSources,
  importConnection,
  exportConnection,
} from '../rest/connect.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

const DestinationType = z.enum([
  'sqlservers', 'databases', 'elasticsearches', 'smtps', 'files', 'https', 'sockets'
]);

const SourceType = z.enum([
  'actionlogs', 'events', 'questionlogs', 'savedquestions', 'serverinformations', 'systemstatuses'
]);

export const CreateConnectionInput = z.object({
  name: z.string(),
  source_type: z.string().optional(),
  destination_type: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

export const RunConnectionInput = z.object({
  connection_id: z.string(),
});

export const StopConnectionRunInput = z.object({
  connection_id: z.string(),
});

export const ListConnectionRunsInput = z.object({
  connection_id: z.string(),
});

export const GetConnectionLogsInput = z.object({
  connection_id: z.string(),
  run_id: z.string(),
});

export const ListConnectDestinationsInput = z.object({
  type: DestinationType,
});

export const CreateConnectDestinationInput = z.object({
  type: DestinationType,
  name: z.string(),
  config: z.record(z.unknown()).optional(),
});

export const ListConnectSourcesInput = z.object({
  type: SourceType,
});

export const ExportConnectionInput = z.object({
  connection_id: z.string(),
});

export async function listConnections(): Promise<ToolOutput<unknown>> {
  try {
    const connections = await getConnections();
    return { success: true, data: { connections } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createConnectionHandler(
  input: z.infer<typeof CreateConnectionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const connection = await createConnection(input);
    return { success: true, data: { connection } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function runConnectionHandler(
  input: z.infer<typeof RunConnectionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const run = await runConnection(input.connection_id);
    return { success: true, data: { run } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function stopConnectionRunHandler(
  input: z.infer<typeof StopConnectionRunInput>
): Promise<ToolOutput<unknown>> {
  try {
    await stopConnectionRun(input.connection_id);
    return { success: true, data: { stopped: true, connection_id: input.connection_id } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listConnectionRuns(
  input: z.infer<typeof ListConnectionRunsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const runs = await getConnectionRuns(input.connection_id);
    return { success: true, data: { runs } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getConnectionLogsHandler(
  input: z.infer<typeof GetConnectionLogsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const logs = await getConnectionLogs(input.connection_id, input.run_id);
    return { success: true, data: { logs } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listConnectDestinations(
  input: z.infer<typeof ListConnectDestinationsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const destinations = await getConnectDestinations(input.type);
    return { success: true, data: { destinations } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createConnectDestinationHandler(
  input: z.infer<typeof CreateConnectDestinationInput>
): Promise<ToolOutput<unknown>> {
  try {
    const destination = await createConnectDestination(input.type, { name: input.name, ...input.config });
    return { success: true, data: { destination } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listConnectSources(
  input: z.infer<typeof ListConnectSourcesInput>
): Promise<ToolOutput<unknown>> {
  try {
    const sources = await getConnectSources(input.type);
    return { success: true, data: { sources } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function importConnectionHandler(
  input: Record<string, unknown>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await importConnection(input);
    return { success: true, data: { imported: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function exportConnectionHandler(
  input: z.infer<typeof ExportConnectionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await exportConnection(input.connection_id);
    return { success: true, data: { exported: result } };
  } catch (err) {
    return handleToolError(err);
  }
}
