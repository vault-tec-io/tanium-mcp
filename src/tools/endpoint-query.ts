import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { ENDPOINTS_QUERY } from '../graphql/queries/endpoints.js';
import { getQuestionResultData } from '../rest/platform.js';
import { pollQuestionResults } from '../polling/questions.js';
import { buildGQLPaginatedOutput } from '../pagination/graphql.js';
import { handleToolError } from '../errors/mcp.js';
import { searchSensors, isSensorCacheReady } from '../cache/sensors.js';
import { CacheUnavailableError } from '../errors/tanium.js';
import type { ToolOutput } from '../types/rest.js';

// Input schemas
export const QueryEndpointsInput = z.object({
  filter: z.record(z.unknown()).optional().describe('GraphQL FieldFilter object'),
  source: z.enum(['TDS', 'TS']).optional().describe('Data source: TDS (Tanium Data Service) or TS (Tanium Server)'),
  first: z.number().int().min(1).max(200).default(50).describe('Number of endpoints to return (max 200)'),
  cursor: z.string().optional().describe('Pagination cursor from previous call'),
  sort: z.array(z.record(z.unknown())).optional().describe('Sort criteria'),
  refresh_cursor: z.boolean().optional().describe('Force a fresh cursor'),
});

export const QuerySensorDataInput = z.object({
  sensor_name: z.string().describe('Sensor name (use search_sensors first to find exact name)'),
  sensor_params: z.record(z.string()).optional().describe('Sensor parameter overrides'),
  filter: z.record(z.unknown()).optional().describe('Endpoint filter'),
  wait_for_results: z.boolean().default(false).describe('Wait for results to collect (default: false, returns question ID)'),
  timeout_ms: z.number().optional().describe('Polling timeout in ms (when wait_for_results=true)'),
});

export const GetQuestionResultsInput = z.object({
  question_id: z.string().describe('Question ID from a previous query_sensor_data call'),
});

export async function queryEndpoints(
  input: z.infer<typeof QueryEndpointsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      endpoints: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: { hasNextPage: boolean; endCursor?: string };
        totalRecords?: number;
      };
    }>(ENDPOINTS_QUERY, {
      first: input.first,
      after: input.cursor,
      filter: input.filter,
      sort: input.sort,
      source: input.source,
    });

    const connection = result.data.endpoints;
    const { items, pagination } = buildGQLPaginatedOutput(connection);

    return {
      success: true,
      data: { endpoints: items },
      pagination,
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function querySensorData(
  input: z.infer<typeof QuerySensorDataInput>
): Promise<ToolOutput<unknown>> {
  try {
    // Find sensor in cache
    if (!isSensorCacheReady()) {
      throw new CacheUnavailableError(
        'Sensor cache is not ready. Discovery tools are temporarily unavailable. Other tools still work.'
      );
    }

    const matches = searchSensors(input.sensor_name, 1);
    if (!matches.length) {
      return {
        success: false,
        error: {
          code: 'SENSOR_NOT_FOUND',
          message: `No sensor found matching "${input.sensor_name}". Use search_sensors to find available sensors.`,
        },
      };
    }

    const sensor = matches[0];

    // Build a question via Platform REST
    // For simplicity, we construct a question using the sensor name and return the result
    // The actual implementation depends on having a question ID from the Tanium server
    // For now, surface as a note that full question asking requires Platform REST integration
    if (!input.wait_for_results) {
      return {
        success: true,
        data: {
          note: 'To query live sensor data, use the Tanium Platform REST API to create a question. Sensor found:',
          sensor: {
            name: sensor.name,
            description: sensor.description,
            category: sensor.category,
            parameters: sensor.parameters,
          },
          instructions: 'Create a question via POST /api/v2/questions with the sensor, then use get_question_results with the returned question ID.',
        },
      };
    }

    return {
      success: true,
      data: {
        sensor: { name: sensor.name },
        note: 'Direct question creation via MCP requires additional Platform REST integration. Use get_question_results after creating a question through the Tanium console or API.',
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getQuestionResults(
  input: z.infer<typeof GetQuestionResultsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await pollQuestionResults(input.question_id);
    return {
      success: true,
      data: { results: result.resultData },
      meta: {
        respondedPercentage: result.respondedPercentage,
        respondedTotal: result.respondedTotal,
        expectedTotal: result.expectedTotal,
      },
    };
  } catch (err) {
    return handleToolError(err);
  }
}
