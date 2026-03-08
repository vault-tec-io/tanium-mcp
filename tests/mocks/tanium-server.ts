import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const BASE_URL = 'https://test-api.cloud.tanium.com';
export const GQL_URL = `${BASE_URL}/plugin/products/gateway/graphql`;
export const PLATFORM_URL = `${BASE_URL}/api/v2`;
export const PATCH_URL = `${BASE_URL}/plugin/products/patch`;
export const DEPLOY_URL = `${BASE_URL}/plugin/products/deploy`;
export const CONNECT_URL = `${BASE_URL}/plugin/products/connect`;
export const COMPLY_URL = `${BASE_URL}/plugin/products/comply`;
export const ASSET_URL = `${BASE_URL}/plugin/products/asset`;

export const mockToken = 'test-token-12345';
export const rotatedToken = 'rotated-token-99999';

// Default handlers
export const defaultHandlers = [
  // GraphQL endpoint
  http.post(GQL_URL, async ({ request }) => {
    const body = await request.json() as { query: string; variables?: Record<string, unknown> };

    // Token rotation
    if (body.query.includes('apiTokenRotate')) {
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

    // sensors query
    if (body.query.includes('sensors')) {
      return HttpResponse.json({
        data: {
          sensors: {
            edges: [
              {
                cursor: 'cursor1',
                node: {
                  name: 'Operating System',
                  description: 'Returns the OS name',
                  category: 'Operating System',
                  contentSetName: 'Default',
                  hidden: false,
                  parameters: [],
                  columns: [{ name: 'Operating System', valueType: 'String' }],
                },
              },
              {
                cursor: 'cursor2',
                node: {
                  name: 'IP Address',
                  description: 'Returns the IP address',
                  category: 'Network',
                  contentSetName: 'Default',
                  hidden: false,
                  parameters: [],
                  columns: [{ name: 'IP Address', valueType: 'String' }],
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'cursor2' },
            totalRecords: 2,
          },
        },
      });
    }

    // packageSpecs query
    if (body.query.includes('packageSpecs')) {
      return HttpResponse.json({
        data: {
          packageSpecs: {
            edges: [
              {
                cursor: 'pkg1',
                node: {
                  name: 'Deploy Tanium Client',
                  command: 'deploy.exe',
                  contentSetName: 'Default',
                  commandTimeoutSeconds: 300,
                  expireSeconds: 600,
                  params: [],
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'pkg1' },
            totalRecords: 1,
          },
        },
      });
    }

    // endpoints query
    if (body.query.includes('endpoints')) {
      return HttpResponse.json({
        data: {
          endpoints: {
            edges: [
              {
                cursor: 'ep1',
                node: {
                  id: 'ep-001',
                  computerName: 'DESKTOP-001',
                  ipAddress: '192.168.1.10',
                  os: { platform: 'Windows', name: 'Windows 11' },
                  lastSeen: '2026-03-07T00:00:00Z',
                  status: 'online',
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'ep1' },
            totalRecords: 1,
          },
        },
      });
    }

    // actionPerform
    if (body.query.includes('actionPerform')) {
      return HttpResponse.json({
        data: {
          actionPerform: {
            error: null,
            action: {
              id: 'action-001',
              name: 'Deploy Test Package',
              status: 'RUNNING',
              results: {
                completed: 0,
                running: 5,
                waiting: 0,
                downloading: 0,
                failed: 0,
                expired: 0,
                expected: 5,
              },
            },
            scheduledAction: null,
          },
        },
      });
    }

    // computerGroups
    if (body.query.includes('computerGroups')) {
      return HttpResponse.json({
        data: {
          computerGroups: {
            edges: [
              {
                cursor: 'cg1',
                node: { id: 'cg-001', name: 'All Computers', text: '', type: 'ALL', computerCount: 100 },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'cg1' },
            totalRecords: 1,
          },
        },
      });
    }

    // Default fallback
    return HttpResponse.json({ data: {} });
  }),

  // Platform REST - sensors
  http.get(`${PLATFORM_URL}/sensors`, () => {
    return HttpResponse.json({
      data: {
        result_object: {
          sensor: [
            { id: 1, name: 'Operating System', description: 'Returns the OS', hash: 12345 },
            { id: 2, name: 'IP Address', description: 'Returns IP', hash: 67890 },
          ],
        },
      },
    });
  }),

  // Platform REST - packages
  http.get(`${PLATFORM_URL}/packages`, () => {
    return HttpResponse.json({
      data: {
        result_object: {
          package_spec: [
            { id: 100, name: 'Deploy Tanium Client', description: 'Deploys the Tanium client' },
          ],
        },
      },
    });
  }),
];

export const server = setupServer(...defaultHandlers);
