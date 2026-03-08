import { execute } from '../graphql/client.js';
import { ACTION_QUERY } from '../graphql/queries/actions.js';
import type { Action, ActionResults } from '../types/graphql.js';
import { TaniumTimeoutError } from '../errors/tanium.js';
import config from '../config.js';

export interface ActionPollResult {
  action: Action;
  status: 'running' | 'completed' | 'timed_out';
  timedOut: boolean;
}

function isTerminal(results: ActionResults): boolean {
  const total = results.expected;
  if (total === 0) return false;
  const done = results.completed + results.failed + results.expired + results.failedVerification;
  return done >= total;
}

export async function pollActionStatus(
  actionId: string,
  timeoutMs = config.pollTimeoutMs,
  intervalMs = config.pollIntervalMs
): Promise<ActionPollResult> {
  const deadline = Date.now() + timeoutMs;

  while (true) {
    const result = await execute<{ action: Action }>(ACTION_QUERY, { id: actionId });
    const action = result.data.action;

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    if (action.stopped || isTerminal(action.results)) {
      return { action, status: 'completed', timedOut: false };
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { action, status: 'timed_out', timedOut: true };
    }

    await sleep(Math.min(intervalMs, remaining));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
