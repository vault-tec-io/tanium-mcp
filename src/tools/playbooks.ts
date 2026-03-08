import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { PLAYBOOKS_QUERY, PLAYBOOK_RUNS_QUERY, PLAYBOOK_RUN_QUERY } from '../graphql/queries/playbooks.js';
import {
  PLAYBOOK_START_MUTATION,
  PLAYBOOK_UPSERT_MUTATION,
  PLAYBOOK_SCHEDULE_UPSERT_MUTATION,
} from '../graphql/mutations/playbooks.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListPlaybooksInput = z.object({
  first: z.number().int().default(50),
  cursor: z.string().optional(),
});

export const StartPlaybookInput = z.object({
  playbook_id: z.string().optional(),
  playbook_name: z.string().optional(),
  params: z.record(z.unknown()).optional(),
});

export const ListPlaybookRunsInput = z.object({
  playbook_id: z.string().optional(),
  first: z.number().int().default(50),
  cursor: z.string().optional(),
});

export const GetPlaybookRunInput = z.object({
  run_id: z.string(),
});

export const UpsertPlaybookInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  definition: z.record(z.unknown()).optional(),
});

export const UpsertPlaybookScheduleInput = z.object({
  playbook_id: z.string(),
  schedule: z.record(z.unknown()),
});

export async function listPlaybooks(
  input: z.infer<typeof ListPlaybooksInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      playbooks: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(PLAYBOOKS_QUERY, { first: input.first, after: input.cursor });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.playbooks);
    return { success: true, data: { playbooks: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function startPlaybook(
  input: z.infer<typeof StartPlaybookInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (!input.playbook_id && !input.playbook_name) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Either playbook_id or playbook_name is required' } };
    }

    const result = await execute<{
      playbookStart: { error?: { message: string }; run?: unknown };
    }>(PLAYBOOK_START_MUTATION, {
      input: {
        id: input.playbook_id,
        name: input.playbook_name,
        params: input.params,
      },
    });

    const payload = result.data.playbookStart;
    if (payload.error) {
      return { success: false, error: { code: 'START_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { run: payload.run } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function listPlaybookRuns(
  input: z.infer<typeof ListPlaybookRunsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      playbookRuns: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(PLAYBOOK_RUNS_QUERY, { first: input.first, after: input.cursor, playbookId: input.playbook_id });

    const { items, pagination } = buildGQLPaginatedOutput(result.data.playbookRuns);
    return { success: true, data: { runs: items }, pagination };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getPlaybookRun(
  input: z.infer<typeof GetPlaybookRunInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{ playbookRun: unknown }>(PLAYBOOK_RUN_QUERY, { id: input.run_id });
    return { success: true, data: { run: result.data.playbookRun } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function upsertPlaybook(
  input: z.infer<typeof UpsertPlaybookInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      playbookUpsert: { error?: { message: string }; playbook?: unknown };
    }>(PLAYBOOK_UPSERT_MUTATION, { input });

    const payload = result.data.playbookUpsert;
    if (payload.error) {
      return { success: false, error: { code: 'UPSERT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { playbook: payload.playbook } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function upsertPlaybookSchedule(
  input: z.infer<typeof UpsertPlaybookScheduleInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      playbookScheduleUpsert: { error?: { message: string } };
    }>(PLAYBOOK_SCHEDULE_UPSERT_MUTATION, {
      input: { playbookId: input.playbook_id, schedule: input.schedule },
    });

    const payload = result.data.playbookScheduleUpsert;
    if (payload.error) {
      return { success: false, error: { code: 'UPSERT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { scheduled: true } };
  } catch (err) {
    return handleToolError(err);
  }
}
