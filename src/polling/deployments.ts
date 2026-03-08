import { execute } from '../graphql/client.js';
import { SOFTWARE_DEPLOYMENT_QUERY } from '../graphql/queries/deploy.js';
import type { SoftwareDeployment } from '../types/graphql.js';
import config from '../config.js';

const TERMINAL_STATES = new Set(['COMPLETE', 'FAILED', 'EXPIRED', 'STOPPED']);

export interface DeploymentPollResult {
  deployment: SoftwareDeployment;
  timedOut: boolean;
}

export async function pollDeploymentStatus(
  deploymentId: string,
  timeoutMs = config.pollTimeoutMs,
  intervalMs = 30_000
): Promise<DeploymentPollResult> {
  const deadline = Date.now() + timeoutMs;

  while (true) {
    const result = await execute<{ softwareDeployment: SoftwareDeployment }>(
      SOFTWARE_DEPLOYMENT_QUERY,
      { id: deploymentId }
    );
    const deployment = result.data.softwareDeployment;

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (TERMINAL_STATES.has(deployment.status?.toUpperCase() ?? '')) {
      return { deployment, timedOut: false };
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { deployment, timedOut: true };
    }

    await sleep(Math.min(intervalMs, remaining));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
