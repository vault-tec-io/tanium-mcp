import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, GQL_URL, DEPLOY_URL, mockToken } from '../mocks/tanium-server.js';

vi.stubEnv('TANIUM_BASE_URL', 'https://test-api.cloud.tanium.com');
vi.stubEnv('TANIUM_API_TOKEN', mockToken);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Deploy REST round-trip', () => {
  beforeEach(() => {
    server.use(
      http.get(`${DEPLOY_URL}/v3/deployments`, () => {
        return HttpResponse.json([
          {
            id: 'deploy-001',
            name: 'Install Security Patches',
            status: 'ACTIVE',
            softwarePackageId: 'pkg-001',
            targetGroup: 'All Computers',
            createdAt: '2026-03-01T00:00:00Z',
          },
        ]);
      }),
      http.post(`${DEPLOY_URL}/v3/deployments`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          data: {
            id: 'deploy-002',
            name: body.name,
            status: 'PENDING',
          },
        }, { status: 201 });
      }),
      http.get(`${DEPLOY_URL}/v1/profiles`, () => {
        return HttpResponse.json([
          { id: 'profile-001', name: 'Standard Deployment', description: 'Default profile' },
        ]);
      }),
      http.get(`${DEPLOY_URL}/v2/software-package-bundles`, () => {
        return HttpResponse.json([
          { id: 'bundle-001', name: 'Security Bundle', description: 'Security packages' },
        ]);
      })
    );
  });

  it('lists deploy deployments', async () => {
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { getDeployDeployments } = await import('../../src/rest/deploy.js');
    const deployments = await getDeployDeployments();

    expect(deployments).toHaveLength(1);
    expect(deployments[0].id).toBe('deploy-001');
    expect(deployments[0].name).toBe('Install Security Patches');
  });

  it('creates a deploy deployment', async () => {
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { createDeployDeployment } = await import('../../src/rest/deploy.js');
    const deployment = await createDeployDeployment({
      name: 'New Deployment',
      softwarePackageId: 'pkg-002',
    });

    expect(deployment).toBeDefined();
  });

  it('lists deploy profiles', async () => {
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { getDeployProfiles } = await import('../../src/rest/deploy.js');
    const profiles = await getDeployProfiles();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Standard Deployment');
  });

  it('lists software bundles', async () => {
    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { getSoftwareBundles } = await import('../../src/rest/deploy.js');
    const bundles = await getSoftwareBundles();

    expect(bundles).toHaveLength(1);
    expect(bundles[0].name).toBe('Security Bundle');
  });
});
