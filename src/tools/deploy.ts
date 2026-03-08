import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { SOFTWARE_PACKAGES_QUERY, SOFTWARE_DEPLOYMENT_QUERY } from '../graphql/queries/deploy.js';
import { MANAGE_SOFTWARE_MUTATION } from '../graphql/mutations/deploy.js';
import {
  getDeployDeployments,
  createDeployDeployment,
  getDeployMaintenanceWindows,
  createDeployMaintenanceWindow,
  getDeployProfiles,
  uploadTempFile,
  getSoftwareBundles,
} from '../rest/deploy.js';
import { pollDeploymentStatus } from '../polling/deployments.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListSoftwarePackagesInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
});

export const GetSoftwareDeploymentInput = z.object({
  deployment_id: z.string(),
});

export const ManageSoftwareInput = z.object({
  software_package_id: z.string(),
  operation: z.enum(['INSTALL', 'UPDATE', 'REMOVE']),
  target_group_name: z.string().optional(),
  wait_for_results: z.boolean().default(false),
});

export const ListDeployDeploymentsInput = z.object({
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
  status: z.string().optional(),
});

export const CreateDeployDeploymentInput = z.object({
  name: z.string(),
  software_package_id: z.string().optional(),
  target_group: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export const CreateMaintenanceWindowDeployInput = z.object({
  name: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  schedule: z.string().optional(),
});

export const UploadTempFileInput = z.object({
  filename: z.string(),
  content_base64: z.string().optional().describe('Base64-encoded file content'),
});

export async function listSoftwarePackages(
  input: z.infer<typeof ListSoftwarePackagesInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      softwarePackages: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(SOFTWARE_PACKAGES_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.softwarePackages);
    return { success: true, data: { softwarePackages: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getSoftwareDeployment(
  input: z.infer<typeof GetSoftwareDeploymentInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{ softwareDeployment: unknown }>(
      SOFTWARE_DEPLOYMENT_QUERY, { id: input.deployment_id }
    );
    return { success: true, data: { deployment: result.data.softwareDeployment } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function manageSoftware(
  input: z.infer<typeof ManageSoftwareInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      manageSoftware: {
        error?: { message: string };
        deployment?: { id: string; name: string; status: string; completedCount?: number; failedCount?: number; pendingCount?: number };
      };
    }>(MANAGE_SOFTWARE_MUTATION, {
      input: {
        softwarePackageId: input.software_package_id,
        operation: input.operation,
        targets: input.target_group_name ? { targetGroup: { name: input.target_group_name } } : undefined,
      },
    });

    const payload = result.data.manageSoftware;
    if (payload.error) {
      return { success: false, error: { code: 'MANAGE_ERROR', message: payload.error.message } };
    }

    if (!input.wait_for_results) {
      return { success: true, data: { deployment: payload.deployment } };
    }

    const deploymentId = payload.deployment?.id;
    if (!deploymentId) {
      return { success: false, error: { code: 'NO_DEPLOYMENT_ID', message: 'No deployment ID returned' } };
    }

    const pollResult = await pollDeploymentStatus(deploymentId);
    return {
      success: true,
      data: { deployment: pollResult.deployment, timedOut: pollResult.timedOut },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listDeployDeployments(
  input: z.infer<typeof ListDeployDeploymentsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const deployments = await getDeployDeployments({
      limit: input.limit,
      offset: input.offset,
      status: input.status,
    });
    return { success: true, data: { deployments } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createDeployDeploymentHandler(
  input: z.infer<typeof CreateDeployDeploymentInput>
): Promise<ToolOutput<unknown>> {
  try {
    const deployment = await createDeployDeployment({
      name: input.name,
      softwarePackageId: input.software_package_id,
      targetGroup: input.target_group,
      startTime: input.start_time,
      endTime: input.end_time,
    });
    return { success: true, data: { deployment } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listMaintenanceWindowsDeploy(): Promise<ToolOutput<unknown>> {
  try {
    const windows = await getDeployMaintenanceWindows();
    return { success: true, data: { maintenanceWindows: windows } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createMaintenanceWindowDeploy(
  input: z.infer<typeof CreateMaintenanceWindowDeployInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await createDeployMaintenanceWindow(input);
    return { success: true, data: { maintenanceWindow: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listDeployProfiles(): Promise<ToolOutput<unknown>> {
  try {
    const profiles = await getDeployProfiles();
    return { success: true, data: { profiles } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function uploadTempFileHandler(
  input: z.infer<typeof UploadTempFileInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await uploadTempFile({ filename: input.filename, content: input.content_base64 });
    return { success: true, data: { file: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listSoftwareBundles(): Promise<ToolOutput<unknown>> {
  try {
    const bundles = await getSoftwareBundles();
    return { success: true, data: { bundles } };
  } catch (err) {
    return handleToolError(err);
  }
}
