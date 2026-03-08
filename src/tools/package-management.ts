import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { PACKAGE_BY_NAME_QUERY } from '../graphql/queries/packages.js';
import { createPackage, updatePackage, deletePackage } from '../rest/platform.js';
import { searchPackages, getPackageByName, isPackageCacheReady } from '../cache/packages.js';
import { CacheUnavailableError } from '../errors/tanium.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const SearchPackagesInput = z.object({
  keyword: z.string().describe('Search keyword to match against package name and description'),
  limit: z.number().int().min(1).max(50).default(20).describe('Maximum number of results (default: 20)'),
});

export const GetPackageInput = z.object({
  name: z.string().describe('Exact package name'),
});

export const CreatePackageInput = z.object({
  name: z.string().describe('Package name'),
  command: z.string().describe('Command to execute'),
  command_timeout: z.number().int().optional().describe('Command timeout in seconds'),
  expire_seconds: z.number().int().optional().describe('Expiry in seconds'),
  content_set_name: z.string().optional().describe('Content set name'),
  params: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    default_value: z.string().optional(),
  })).optional().describe('Package parameters'),
  files: z.array(z.record(z.unknown())).optional().describe('Package file references'),
});

export const UpdatePackageInput = z.object({
  id: z.string().describe('Package ID'),
  name: z.string().optional(),
  command: z.string().optional(),
  command_timeout: z.number().int().optional(),
  expire_seconds: z.number().int().optional(),
});

export const DeletePackageInput = z.object({
  id: z.string().describe('Package ID'),
});

export async function searchPackagesHandler(
  input: z.infer<typeof SearchPackagesInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (!isPackageCacheReady()) {
      throw new CacheUnavailableError(
        'Package cache is not ready. Discovery tools are temporarily unavailable. Other tools still work.'
      );
    }

    const results = searchPackages(input.keyword, input.limit);
    return {
      success: true,
      data: {
        packages: results.map(p => ({
          name: p.name,
          description: p.description,
          command: p.command,
          contentSetName: p.contentSetName,
          params: p.params,
          commandTimeoutSeconds: p.commandTimeoutSeconds,
          expireSeconds: p.expireSeconds,
        })),
        count: results.length,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getPackage(
  input: z.infer<typeof GetPackageInput>
): Promise<ToolOutput<unknown>> {
  try {
    const cached = getPackageByName(input.name);
    if (cached) {
      return { success: true, data: { package: cached } };
    }

    const result = await execute<{
      packageSpecs: { edges: Array<{ node: unknown }> };
    }>(PACKAGE_BY_NAME_QUERY, {
      filter: { op: 'EQ', path: 'name', value: input.name },
    });

    const edges = result.data.packageSpecs?.edges ?? [];
    if (!edges.length) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Package "${input.name}" not found` },
      };
    }

    return { success: true, data: { package: edges[0].node } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createPackageHandler(
  input: z.infer<typeof CreatePackageInput>
): Promise<ToolOutput<unknown>> {
  try {
    const body = {
      name: input.name,
      command: input.command,
      command_timeout: input.command_timeout,
      expire_seconds: input.expire_seconds,
      content_set: input.content_set_name ? { name: input.content_set_name } : undefined,
      params: input.params,
      files: input.files,
    };
    const result = await createPackage(body);
    return { success: true, data: { package: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function updatePackageHandler(
  input: z.infer<typeof UpdatePackageInput>
): Promise<ToolOutput<unknown>> {
  try {
    const body = {
      name: input.name,
      command: input.command,
      command_timeout: input.command_timeout,
      expire_seconds: input.expire_seconds,
    };
    const result = await updatePackage(input.id, body);
    return { success: true, data: { package: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function deletePackageHandler(
  input: z.infer<typeof DeletePackageInput>
): Promise<ToolOutput<unknown>> {
  try {
    await deletePackage(input.id);
    return { success: true, data: { deleted: true, id: input.id } };
  } catch (err) {
    return handleToolError(err);
  }
}
