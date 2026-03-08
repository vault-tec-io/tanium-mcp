import { z } from 'zod';
import { execute } from '../graphql/client.js';
import {
  COMPUTER_GROUPS_QUERY,
  COMPUTER_GROUP_QUERY,
} from '../graphql/queries/computer-groups.js';
import {
  COMPUTER_GROUP_CREATE_MUTATION,
  COMPUTER_GROUP_DELETE_MUTATION,
} from '../graphql/mutations/computer-groups.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListComputerGroupsInput = z.object({
  first: z.number().int().default(500),
  cursor: z.string().optional(),
});

export const GetComputerGroupInput = z.object({
  name: z.string().optional().describe('Computer group name'),
  id: z.string().optional().describe('Computer group ID'),
});

export const CreateComputerGroupInput = z.object({
  name: z.string().describe('Computer group name'),
  text: z.string().optional().describe('Filter expression text (e.g., "Operating System contains Windows")'),
  type: z.string().optional().describe('Group type (e.g., MANUAL, FILTER_BASED)'),
});

export const DeleteComputerGroupInput = z.object({
  name: z.string().optional().describe('Computer group name'),
  id: z.string().optional().describe('Computer group ID'),
});

export async function listComputerGroups(
  input: z.infer<typeof ListComputerGroupsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      computerGroups: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(COMPUTER_GROUPS_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.computerGroups);
    return { success: true, data: { computerGroups: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getComputerGroup(
  input: z.infer<typeof GetComputerGroupInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (!input.name && !input.id) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Either name or id is required' } };
    }

    const result = await execute<{ computerGroup: unknown }>(
      COMPUTER_GROUP_QUERY,
      { name: input.name, id: input.id }
    );

    if (!result.data.computerGroup) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Computer group not found' } };
    }

    return { success: true, data: { computerGroup: result.data.computerGroup } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createComputerGroup(
  input: z.infer<typeof CreateComputerGroupInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      computerGroupCreate: {
        error?: { message: string };
        computerGroup?: unknown;
      };
    }>(COMPUTER_GROUP_CREATE_MUTATION, {
      input: { name: input.name, text: input.text, type: input.type },
    });

    const payload = result.data.computerGroupCreate;
    if (payload.error) {
      return { success: false, error: { code: 'CREATE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { computerGroup: payload.computerGroup } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function deleteComputerGroup(
  input: z.infer<typeof DeleteComputerGroupInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (!input.name && !input.id) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Either name or id is required' } };
    }

    const result = await execute<{
      computerGroupDelete: { error?: { message: string } };
    }>(COMPUTER_GROUP_DELETE_MUTATION, { name: input.name, id: input.id });

    const payload = result.data.computerGroupDelete;
    if (payload.error) {
      return { success: false, error: { code: 'DELETE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { deleted: true, name: input.name, id: input.id } };
  } catch (err) {
    return handleToolError(err);
  }
}
