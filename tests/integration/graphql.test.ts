import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, GQL_URL, PLATFORM_URL, mockToken, rotatedToken } from '../mocks/tanium-server.js';

// Set up environment before importing modules
vi.stubEnv('TANIUM_BASE_URL', 'https://test-api.cloud.tanium.com');
vi.stubEnv('TANIUM_API_TOKEN', mockToken);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GraphQL client', () => {
  it('executes a query and returns data', async () => {
    const { execute } = await import('../../src/graphql/client.js');
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const result = await execute<{ endpoints: { edges: unknown[]; pageInfo: { hasNextPage: boolean } } }>(
      `query { endpoints(first: 10) { edges { cursor node { id computerName } } pageInfo { hasNextPage } } }`
    );

    expect(result.data.endpoints.edges).toHaveLength(1);
    expect(result.data.endpoints.pageInfo.hasNextPage).toBe(false);
  });

  it('handles GraphQL errors properly', async () => {
    server.use(
      http.post(GQL_URL, () => {
        return HttpResponse.json({
          errors: [{ message: 'You do not have permission', extensions: { code: 'FORBIDDEN' } }],
        });
      })
    );

    const { execute } = await import('../../src/graphql/client.js');
    const { TaniumGraphQLError } = await import('../../src/errors/tanium.js');
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    await expect(
      execute(`query { sensors { edges { node { name } } } }`)
    ).rejects.toThrow(TaniumGraphQLError);
  });

  it('rotates token on 401 and retries', async () => {
    let rotated = false;
    let requestCount = 0;

    server.use(
      http.post(GQL_URL, async ({ request }) => {
        const body = await request.json() as { query: string };
        requestCount++;

        if (body.query.includes('apiTokenRotate')) {
          rotated = true;
          return HttpResponse.json({
            data: {
              apiTokenRotate: {
                error: null,
                token: {
                  tokenString: rotatedToken,
                  expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
              },
            },
          });
        }

        // First call returns 401, second succeeds
        if (requestCount === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return HttpResponse.json({
          data: {
            endpoints: {
              edges: [],
              pageInfo: { hasNextPage: false },
              totalRecords: 0,
            },
          },
        });
      })
    );

    const { execute } = await import('../../src/graphql/client.js');
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const result = await execute<{
      endpoints: { edges: unknown[]; pageInfo: { hasNextPage: boolean }; totalRecords: number };
    }>(`query { endpoints { edges { node { id } } pageInfo { hasNextPage } totalRecords } }`);

    expect(result.data.endpoints.totalRecords).toBe(0);
    expect(rotated).toBe(true);
  });
});

describe('REST platform client', () => {
  it('fetches sensors list', async () => {
    const { getAllSensors } = await import('../../src/rest/platform.js');
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const sensors = await getAllSensors();
    expect(sensors.length).toBeGreaterThan(0);
    expect(sensors[0]).toHaveProperty('id');
    expect(sensors[0]).toHaveProperty('name');
  });
});
