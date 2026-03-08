import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { PATCH_DEFINITIONS_QUERY } from '../graphql/queries/patch.js';
import {
  PATCH_CREATE_DEPLOYMENT_MUTATION,
  PATCH_STOP_DEPLOYMENT_MUTATION,
  PATCH_LIST_UPSERT_MUTATION,
} from '../graphql/mutations/patch.js';
import {
  getPatchDeployments,
  getPatchDeployment,
  getPatchLists,
  getPatchScanConfigurations,
  createPatchScanConfiguration,
  getPatchMaintenanceWindows,
  createPatchMaintenanceWindow,
  getPatchBlocklists,
  createPatchBlocklist,
  updatePatchBlocklist,
  deletePatchBlocklist,
  getPatchRepos,
} from '../rest/patch.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListPatchDeploymentsInput = z.object({
  status: z.string().optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

export const CreatePatchDeploymentInput = z.object({
  name: z.string(),
  patch_list_ids: z.array(z.string()).optional(),
  target_group_name: z.string().optional(),
  start_time: z.string().optional().describe('ISO 8601 datetime'),
  end_time: z.string().optional().describe('ISO 8601 datetime'),
  maintenance_window_id: z.string().optional(),
});

export const StopPatchDeploymentInput = z.object({
  deployment_id: z.string(),
});

export const GetPatchDeploymentInput = z.object({
  deployment_id: z.string(),
});

export const UpsertPatchListInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  patch_ids: z.array(z.string()).optional(),
});

export const ListPatchDefinitionsInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
});

export const CreatePatchScanConfigInput = z.object({
  name: z.string(),
  platforms: z.array(z.string()).optional(),
});

export const CreateMaintenanceWindowPatchInput = z.object({
  name: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  schedule: z.string().optional(),
});

export const ManagePatchBlocklistInput = z.object({
  action: z.enum(['create', 'update', 'delete']),
  id: z.string().optional().describe('Required for update and delete'),
  name: z.string().optional(),
  patches: z.array(z.string()).optional(),
});

export async function listPatchDeployments(
  input: z.infer<typeof ListPatchDeploymentsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const deployments = await getPatchDeployments({
      status: input.status,
      limit: input.limit,
      offset: input.offset,
    });
    return { success: true, data: { deployments } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createPatchDeployment(
  input: z.infer<typeof CreatePatchDeploymentInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      patchCreateDeployment: {
        error?: { message: string };
        deployment?: { id: string; name: string; status: string };
      };
    }>(PATCH_CREATE_DEPLOYMENT_MUTATION, {
      input: {
        name: input.name,
        patchListIds: input.patch_list_ids,
        targetGroup: input.target_group_name ? { name: input.target_group_name } : undefined,
        startTime: input.start_time,
        endTime: input.end_time,
        maintenanceWindowId: input.maintenance_window_id,
      },
    });

    const payload = result.data.patchCreateDeployment;
    if (payload.error) {
      return { success: false, error: { code: 'CREATE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { deployment: payload.deployment } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function stopPatchDeployment(
  input: z.infer<typeof StopPatchDeploymentInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      patchStopDeployment: { error?: { message: string } };
    }>(PATCH_STOP_DEPLOYMENT_MUTATION, { id: input.deployment_id });

    const payload = result.data.patchStopDeployment;
    if (payload.error) {
      return { success: false, error: { code: 'STOP_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { stopped: true, id: input.deployment_id } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getPatchDeploymentDetails(
  input: z.infer<typeof GetPatchDeploymentInput>
): Promise<ToolOutput<unknown>> {
  try {
    const deployment = await getPatchDeployment(input.deployment_id);
    return { success: true, data: { deployment } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPatchLists(): Promise<ToolOutput<unknown>> {
  try {
    const patchLists = await getPatchLists();
    return { success: true, data: { patchLists } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function upsertPatchList(
  input: z.infer<typeof UpsertPatchListInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      patchListUpsert: {
        error?: { message: string };
        patchList?: unknown;
      };
    }>(PATCH_LIST_UPSERT_MUTATION, {
      input: { name: input.name, description: input.description, patchIds: input.patch_ids },
    });

    const payload = result.data.patchListUpsert;
    if (payload.error) {
      return { success: false, error: { code: 'UPSERT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { patchList: payload.patchList } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPatchDefinitions(
  input: z.infer<typeof ListPatchDefinitionsInput>
): Promise<ToolOutput<unknown>> {
  try {
    // NOTE: patchDefinitions is Stability 1.0 (Experimental Early) — subject to breaking changes
    const result = await execute<{
      patchDefinitions: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(PATCH_DEFINITIONS_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.patchDefinitions);
    return {
      success: true,
      data: {
        patchDefinitions: items,
        stability_warning: 'This API is Stability 1.0 (Experimental Early) and may change without notice.',
      },
      pagination,
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPatchScanConfigurations(): Promise<ToolOutput<unknown>> {
  try {
    const configs = await getPatchScanConfigurations();
    return { success: true, data: { scanConfigurations: configs } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createPatchScanConfig(
  input: z.infer<typeof CreatePatchScanConfigInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await createPatchScanConfiguration({ name: input.name, platforms: input.platforms });
    return { success: true, data: { scanConfiguration: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listMaintenanceWindowsPatch(): Promise<ToolOutput<unknown>> {
  try {
    const windows = await getPatchMaintenanceWindows();
    return { success: true, data: { maintenanceWindows: windows } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createMaintenanceWindowPatch(
  input: z.infer<typeof CreateMaintenanceWindowPatchInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await createPatchMaintenanceWindow(input);
    return { success: true, data: { maintenanceWindow: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPatchBlocklists(): Promise<ToolOutput<unknown>> {
  try {
    const blocklists = await getPatchBlocklists();
    return { success: true, data: { blocklists } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function managePatchBlocklist(
  input: z.infer<typeof ManagePatchBlocklistInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (input.action === 'create') {
      const result = await createPatchBlocklist({ name: input.name, patches: input.patches });
      return { success: true, data: { blocklist: result } };
    } else if (input.action === 'update') {
      if (!input.id) return { success: false, error: { code: 'INVALID_INPUT', message: 'id is required for update' } };
      const result = await updatePatchBlocklist(input.id, { name: input.name, patches: input.patches });
      return { success: true, data: { blocklist: result } };
    } else {
      if (!input.id) return { success: false, error: { code: 'INVALID_INPUT', message: 'id is required for delete' } };
      await deletePatchBlocklist(input.id);
      return { success: true, data: { deleted: true, id: input.id } };
    }
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPatchRepos(): Promise<ToolOutput<unknown>> {
  try {
    const repos = await getPatchRepos();
    return { success: true, data: { repos } };
  } catch (err) {
    return handleToolError(err);
  }
}
