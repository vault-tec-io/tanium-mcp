import { z } from 'zod';
import { execute } from '../graphql/client.js';
import {
  ACTION_PERFORM_MUTATION,
  ACTION_STOP_MUTATION,
  SCHEDULED_ACTION_CREATE_MUTATION,
  SCHEDULED_ACTION_APPROVE_MUTATION,
  SCHEDULED_ACTION_DELETE_MUTATION,
  ACTION_GROUP_CREATE_MUTATION,
  ACTION_GROUP_DELETE_MUTATION,
} from '../graphql/mutations/actions.js';
import {
  ACTION_QUERY,
  ACTIONS_QUERY,
  SCHEDULED_ACTIONS_QUERY,
  ACTION_GROUPS_QUERY,
  ACTION_GROUP_QUERY,
} from '../graphql/queries/actions.js';
import { createActionApproval } from '../rest/platform.js';
import { pollActionStatus } from '../polling/actions.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import { getPackageByName } from '../cache/packages.js';
import type { ToolOutput } from '../types/rest.js';

// Shared schemas
const PackageRefInput = z.object({
  name: z.string().optional(),
  id: z.string().optional(),
  params: z.record(z.string()).optional().describe('Package parameter key-value pairs'),
});

const ActionTargetsInput = z.object({
  action_group: z.object({ name: z.string().optional(), id: z.string().optional() }).optional(),
  target_group: z.object({ name: z.string().optional(), id: z.string().optional() }).optional(),
});

export const PerformActionInput = z.object({
  package_name: z.string().describe('Package name (use search_packages first to find exact name)'),
  package_params: z.record(z.string()).optional().describe('Package parameter overrides'),
  target_group_name: z.string().optional().describe('Computer group name to target'),
  action_group_name: z.string().optional().describe('Action group name'),
  comment: z.string().optional().describe('Action comment/description'),
  expire_seconds: z.number().int().optional().describe('Action expiry in seconds'),
  distribute_seconds: z.number().int().optional().describe('Seconds to distribute action delivery'),
  wait_for_results: z.boolean().default(false).describe('Wait for action to complete before returning'),
});

export const CreateScheduledActionInput = z.object({
  name: z.string().describe('Scheduled action name'),
  package_name: z.string().describe('Package name'),
  package_params: z.record(z.string()).optional(),
  target_group_name: z.string().optional(),
  action_group_name: z.string().optional(),
  comment: z.string().optional(),
  schedule: z.record(z.unknown()).optional().describe('Schedule configuration'),
  expire_seconds: z.number().int().optional(),
  distribute_seconds: z.number().int().optional(),
});

export const ListActionsInput = z.object({
  first: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  filter: z.record(z.unknown()).optional(),
});

export const ListScheduledActionsInput = z.object({
  first: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  filter: z.record(z.unknown()).optional(),
});

export const GetActionStatusInput = z.object({
  action_id: z.string().describe('Action ID'),
});

export const StopActionInput = z.object({
  action_id: z.string().describe('Action ID to stop'),
});

export const ApproveActionInput = z.object({
  scheduled_action_id: z.string().describe('Scheduled action ID to approve'),
});

export const DeleteScheduledActionInput = z.object({
  scheduled_action_id: z.string().describe('Scheduled action ID to delete'),
});

export const ListActionGroupsInput = z.object({
  first: z.number().int().default(500),
  cursor: z.string().optional(),
});

export const CreateActionGroupInput = z.object({
  name: z.string().describe('Action group name'),
  any: z.boolean().default(false).describe('Match any or all computer groups'),
  computer_group_names: z.array(z.string()).optional().describe('Computer group names'),
  computer_group_ids: z.array(z.string()).optional().describe('Computer group IDs'),
});

export async function performAction(
  input: z.infer<typeof PerformActionInput>
): Promise<ToolOutput<unknown>> {
  try {
    // Build params array from package_params
    const params = input.package_params
      ? Object.entries(input.package_params).map(([key, value]) => ({ key, value }))
      : undefined;

    const gqlInput: Record<string, unknown> = {
      package: {
        name: input.package_name,
        params,
      },
      comment: input.comment,
      expireSeconds: input.expire_seconds,
      distributeSeconds: input.distribute_seconds,
    };

    if (input.target_group_name) {
      gqlInput.targets = { targetGroup: { name: input.target_group_name } };
    }
    if (input.action_group_name) {
      gqlInput.targets = {
        ...(gqlInput.targets as Record<string, unknown> ?? {}),
        actionGroup: { name: input.action_group_name },
      };
    }

    const result = await execute<{
      actionPerform: {
        error?: { message: string };
        action?: {
          id: string;
          name: string;
          status: string;
          results: { completed: number; running: number; waiting: number; downloading: number; failed: number; expired: number; expected: number };
        };
        scheduledAction?: { id: string; name: string; status: string };
      };
    }>(ACTION_PERFORM_MUTATION, { input: gqlInput });

    const payload = result.data.actionPerform;
    if (payload.error) {
      return { success: false, error: { code: 'ACTION_ERROR', message: payload.error.message } };
    }

    // Detect approval_required
    const scheduledAction = payload.scheduledAction;
    const approvalRequired = scheduledAction?.status === 'DISABLED';

    if (!input.wait_for_results) {
      return {
        success: true,
        data: {
          action: payload.action,
          scheduledAction,
          approval_required: approvalRequired,
          approval_note: approvalRequired
            ? 'Action requires approval. Use approve_action with the scheduled_action_id to approve.'
            : undefined,
        },
      };
    }

    // Poll
    const actionId = payload.action?.id;
    if (!actionId) {
      return { success: false, error: { code: 'NO_ACTION_ID', message: 'No action ID returned' } };
    }

    const pollResult = await pollActionStatus(actionId);
    return {
      success: true,
      data: {
        action: pollResult.action,
        status: pollResult.status,
        timedOut: pollResult.timedOut,
        approval_required: approvalRequired,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createScheduledAction(
  input: z.infer<typeof CreateScheduledActionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const params = input.package_params
      ? Object.entries(input.package_params).map(([key, value]) => ({ key, value }))
      : undefined;

    const gqlInput: Record<string, unknown> = {
      name: input.name,
      package: { name: input.package_name, params },
      comment: input.comment,
      schedule: input.schedule,
      expireSeconds: input.expire_seconds,
      distributeSeconds: input.distribute_seconds,
    };

    if (input.target_group_name) {
      gqlInput.targets = { targetGroup: { name: input.target_group_name } };
    }
    if (input.action_group_name) {
      gqlInput.targets = {
        ...(gqlInput.targets as Record<string, unknown> ?? {}),
        actionGroup: { name: input.action_group_name },
      };
    }

    const result = await execute<{
      scheduledActionCreate: {
        error?: { message: string };
        scheduledAction?: { id: string; name: string; status: string; approver?: { id: string; name: string } };
      };
    }>(SCHEDULED_ACTION_CREATE_MUTATION, { input: gqlInput });

    const payload = result.data.scheduledActionCreate;
    if (payload.error) {
      return { success: false, error: { code: 'SCHEDULED_ACTION_ERROR', message: payload.error.message } };
    }

    const approvalRequired = payload.scheduledAction?.status === 'DISABLED';
    return {
      success: true,
      data: {
        scheduledAction: payload.scheduledAction,
        approval_required: approvalRequired,
        approval_note: approvalRequired ? 'Use approve_action with scheduled_action_id to approve.' : undefined,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listActions(
  input: z.infer<typeof ListActionsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      actions: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(ACTIONS_QUERY, { first: input.first, after: input.cursor, filter: input.filter });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.actions);
    return {
      success: true,
      data: { actions: items },
      pagination,
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listScheduledActions(
  input: z.infer<typeof ListScheduledActionsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      scheduledActions: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(SCHEDULED_ACTIONS_QUERY, { first: input.first, after: input.cursor, filter: input.filter });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.scheduledActions);
    return {
      success: true,
      data: { scheduledActions: items },
      pagination,
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getActionStatus(
  input: z.infer<typeof GetActionStatusInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{ action: unknown }>(ACTION_QUERY, { id: input.action_id });
    return { success: true, data: { action: result.data.action } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function stopAction(
  input: z.infer<typeof StopActionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      actionStop: { error?: { message: string } };
    }>(ACTION_STOP_MUTATION, { id: input.action_id });

    const payload = result.data.actionStop;
    if (payload.error) {
      return { success: false, error: { code: 'STOP_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { stopped: true, action_id: input.action_id } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function approveAction(
  input: z.infer<typeof ApproveActionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      scheduledActionApprove: {
        error?: { message: string };
        scheduledAction?: { id: string; name: string; status: string };
      };
    }>(SCHEDULED_ACTION_APPROVE_MUTATION, { id: input.scheduled_action_id });

    const payload = result.data.scheduledActionApprove;
    if (payload.error) {
      // Fallback to Platform REST
      try {
        const approval = await createActionApproval({ saved_action_id: input.scheduled_action_id });
        return { success: true, data: { approved: true, result: approval } };
      } catch (restErr) {
        return { success: false, error: { code: 'APPROVE_ERROR', message: payload.error.message } };
      }
    }

    return { success: true, data: { scheduledAction: payload.scheduledAction } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function deleteScheduledAction(
  input: z.infer<typeof DeleteScheduledActionInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      scheduledActionDelete: { error?: { message: string } };
    }>(SCHEDULED_ACTION_DELETE_MUTATION, { id: input.scheduled_action_id });

    const payload = result.data.scheduledActionDelete;
    if (payload.error) {
      return { success: false, error: { code: 'DELETE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { deleted: true, id: input.scheduled_action_id } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listActionGroups(
  input: z.infer<typeof ListActionGroupsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      actionGroups: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(ACTION_GROUPS_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.actionGroups);
    return { success: true, data: { actionGroups: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function createActionGroup(
  input: z.infer<typeof CreateActionGroupInput>
): Promise<ToolOutput<unknown>> {
  try {
    const computerGroups = [
      ...(input.computer_group_names?.map(name => ({ name })) ?? []),
      ...(input.computer_group_ids?.map(id => ({ id })) ?? []),
    ];

    const result = await execute<{
      actionGroupCreate: {
        error?: { message: string };
        actionGroup?: unknown;
      };
    }>(ACTION_GROUP_CREATE_MUTATION, {
      input: { name: input.name, any: input.any, computerGroups },
    });

    const payload = result.data.actionGroupCreate;
    if (payload.error) {
      return { success: false, error: { code: 'CREATE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { actionGroup: payload.actionGroup } };
  } catch (err) {
    return handleToolError(err);
  }
}
