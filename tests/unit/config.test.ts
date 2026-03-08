import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('throws when TANIUM_BASE_URL is missing', async () => {
    delete process.env.TANIUM_BASE_URL;
    process.env.TANIUM_API_TOKEN = 'test-token';

    await expect(import('../../src/config.js')).rejects.toThrow('TANIUM_BASE_URL');
  });

  it('throws when TANIUM_API_TOKEN is missing', async () => {
    process.env.TANIUM_BASE_URL = 'https://test.cloud.tanium.com';
    delete process.env.TANIUM_API_TOKEN;

    await expect(import('../../src/config.js')).rejects.toThrow('TANIUM_API_TOKEN');
  });

  it('constructs correct URLs from base URL', async () => {
    process.env.TANIUM_BASE_URL = 'https://acme-api.cloud.tanium.com';
    process.env.TANIUM_API_TOKEN = 'my-token';

    const { config } = await import('../../src/config.js');

    expect(config.graphqlUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/gateway/graphql');
    expect(config.platformRestUrl).toBe('https://acme-api.cloud.tanium.com/api/v2');
    expect(config.patchRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/patch');
    expect(config.deployRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/deploy');
    expect(config.connectRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/connect');
    expect(config.complyRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/comply');
    expect(config.assetRestUrl).toBe('https://acme-api.cloud.tanium.com/plugin/products/asset');
  });

  it('strips trailing slash from base URL', async () => {
    process.env.TANIUM_BASE_URL = 'https://test.tanium.com/';
    process.env.TANIUM_API_TOKEN = 'my-token';

    const { config } = await import('../../src/config.js');
    expect(config.baseUrl).toBe('https://test.tanium.com');
    expect(config.graphqlUrl).toBe('https://test.tanium.com/plugin/products/gateway/graphql');
  });

  it('uses defaults for optional env vars', async () => {
    process.env.TANIUM_BASE_URL = 'https://test.tanium.com';
    process.env.TANIUM_API_TOKEN = 'my-token';

    const { config } = await import('../../src/config.js');
    expect(config.cacheTtlSeconds).toBe(1800);
    expect(config.pollIntervalMs).toBe(5000);
    expect(config.pollTimeoutMs).toBe(300000);
    expect(config.tlsVerify).toBe(true);
    expect(config.tlsCaBundle).toBeUndefined();
    expect(config.cacheDiskPath).toBeUndefined();
  });

  it('parses TANIUM_TLS_VERIFY=false correctly', async () => {
    process.env.TANIUM_BASE_URL = 'https://192.168.1.10';
    process.env.TANIUM_API_TOKEN = 'my-token';
    process.env.TANIUM_TLS_VERIFY = 'false';

    const { config } = await import('../../src/config.js');
    expect(config.tlsVerify).toBe(false);
  });

  it('supports on-prem IP-based URL', async () => {
    process.env.TANIUM_BASE_URL = 'https://192.168.10.50';
    process.env.TANIUM_API_TOKEN = 'my-token';

    const { config } = await import('../../src/config.js');
    expect(config.graphqlUrl).toBe('https://192.168.10.50/plugin/products/gateway/graphql');
    expect(config.platformRestUrl).toBe('https://192.168.10.50/api/v2');
  });
});
