import { describe, it, expect, afterEach, vi } from 'vitest';

describe('URL construction — cloud vs on-prem', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('cloud URL produces correct endpoint paths', async () => {
    vi.stubEnv('TANIUM_BASE_URL', 'https://acme-api.cloud.tanium.com');
    vi.stubEnv('TANIUM_API_TOKEN', 'test-token');

    const { config } = await import('../../src/config.js');

    expect(config.graphqlUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/gateway/graphql');
    expect(config.platformRestUrl).toBe('https://acme-api.cloud.tanium.com/api/v2');
    expect(config.patchRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/patch');
    expect(config.deployRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/deploy');
    expect(config.connectRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/connect');
    expect(config.complyRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/comply');
    expect(config.assetRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/asset');
  });

  it('on-prem IP URL produces identical path structure', async () => {
    vi.stubEnv('TANIUM_BASE_URL', 'https://192.168.1.50');
    vi.stubEnv('TANIUM_API_TOKEN', 'test-token');

    const { config } = await import('../../src/config.js');

    expect(config.graphqlUrl).toBe('https://192.168.1.50/plugin/products/gateway/graphql');
    expect(config.platformRestUrl).toBe('https://192.168.1.50/api/v2');
    expect(config.patchRestUrl).toBe('https://192.168.1.50/plugin/products/patch');
  });

  it('on-prem hostname URL produces identical path structure', async () => {
    vi.stubEnv('TANIUM_BASE_URL', 'https://tanium-server.corp.example.com');
    vi.stubEnv('TANIUM_API_TOKEN', 'test-token');

    const { config } = await import('../../src/config.js');

    expect(config.graphqlUrl).toBe('https://tanium-server.corp.example.com/plugin/products/gateway/graphql');
    expect(config.assetRestUrl).toBe('https://tanium-server.corp.example.com/plugin/products/asset');
  });

  it('URLs contain no hardcoded hostnames', async () => {
    vi.stubEnv('TANIUM_BASE_URL', 'https://custom-host.example.com');
    vi.stubEnv('TANIUM_API_TOKEN', 'test-token');

    const { config } = await import('../../src/config.js');

    // None of the URL strings should contain hardcoded patterns
    const allUrls = [
      config.graphqlUrl, config.platformRestUrl, config.patchRestUrl,
      config.deployRestUrl, config.connectRestUrl, config.complyRestUrl, config.assetRestUrl
    ];

    for (const url of allUrls) {
      expect(url).toContain('custom-host.example.com');
      expect(url).not.toContain('tanium.com'); // no hardcoded domains
      expect(url).not.toContain('cloud.tanium'); // no hardcoded cloud domains
    }
  });
});
