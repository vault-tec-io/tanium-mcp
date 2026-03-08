import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { SENSOR_BY_NAME_QUERY } from '../graphql/queries/sensors.js';
import { SENSOR_HARVEST_MUTATION } from '../graphql/mutations/sensors.js';
import { searchSensors, getSensorByName, isSensorCacheReady } from '../cache/sensors.js';
import { CacheUnavailableError } from '../errors/tanium.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const SearchSensorsInput = z.object({
  keyword: z.string().describe('Search keyword to match against sensor name, description, and category'),
  limit: z.number().int().min(1).max(50).default(20).describe('Maximum number of results (default: 20)'),
});

export const GetSensorInput = z.object({
  name: z.string().describe('Exact sensor name'),
});

export const HarvestSensorInput = z.object({
  name: z.string().describe('Sensor name to harvest/unregister'),
  action: z.enum(['REGISTER', 'UNREGISTER']).describe('Harvest action'),
});

export async function searchSensorsHandler(
  input: z.infer<typeof SearchSensorsInput>
): Promise<ToolOutput<unknown>> {
  try {
    if (!isSensorCacheReady()) {
      throw new CacheUnavailableError(
        'Sensor cache is not ready. Discovery tools are temporarily unavailable. Other tools still work. The server will retry cache warm automatically.'
      );
    }

    const results = searchSensors(input.keyword, input.limit);
    return {
      success: true,
      data: {
        sensors: results.map(s => ({
          name: s.name,
          description: s.description,
          category: s.category,
          contentSetName: s.contentSetName,
          parameters: s.parameters,
          columns: s.columns,
          hidden: s.hidden,
        })),
        count: results.length,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getSensor(
  input: z.infer<typeof GetSensorInput>
): Promise<ToolOutput<unknown>> {
  try {
    // Try cache first
    const cached = getSensorByName(input.name);
    if (cached) {
      return { success: true, data: { sensor: cached } };
    }

    // Fall back to GQL
    const result = await execute<{
      sensors: {
        edges: Array<{ node: unknown }>;
      };
    }>(SENSOR_BY_NAME_QUERY, {
      filter: {
        op: 'EQ',
        path: 'name',
        value: input.name,
      },
    });

    const edges = result.data.sensors?.edges ?? [];
    if (!edges.length) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Sensor "${input.name}" not found` },
      };
    }

    return { success: true, data: { sensor: edges[0].node } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function harvestSensor(
  input: z.infer<typeof HarvestSensorInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      sensorHarvest: { error?: { message: string } };
    }>(SENSOR_HARVEST_MUTATION, {
      input: { name: input.name, action: input.action },
    });

    const payload = result.data.sensorHarvest;
    if (payload.error) {
      return {
        success: false,
        error: { code: 'HARVEST_ERROR', message: payload.error.message },
      };
    }

    return { success: true, data: { harvested: true, name: input.name, action: input.action } };
  } catch (err) {
    return handleToolError(err);
  }
}
