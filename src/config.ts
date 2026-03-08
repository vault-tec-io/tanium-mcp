import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Config } from './types/config.js';

// Load .env if present (non-fatal)
try {
  const { config } = await import('dotenv');
  config();
} catch {
  // dotenv not available or no .env file
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return val.trim();
}

function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function loadConfig(): Config {
  const baseUrl = requireEnv('TANIUM_BASE_URL').replace(/\/$/, '');
  const apiToken = requireEnv('TANIUM_API_TOKEN');
  const tlsCaBundle = optionalEnv('TANIUM_TLS_CA_BUNDLE');
  const tlsVerifyStr = optionalEnv('TANIUM_TLS_VERIFY');
  const tlsVerify = tlsVerifyStr !== undefined ? tlsVerifyStr !== 'false' : true;
  const cacheTtlSeconds = parseInt(optionalEnv('TANIUM_CACHE_TTL_SECONDS') ?? '1800', 10);
  const cacheDiskPath = optionalEnv('TANIUM_CACHE_DISK_PATH');
  const pollIntervalMs = parseInt(optionalEnv('TANIUM_POLL_INTERVAL_MS') ?? '5000', 10);
  const pollTimeoutMs = parseInt(optionalEnv('TANIUM_POLL_TIMEOUT_MS') ?? '300000', 10);

  if (!tlsVerify) {
    console.warn(
      '[tanium-mcp] WARNING: TLS verification is disabled (TANIUM_TLS_VERIFY=false). ' +
      'This is insecure and should only be used in dev/lab environments.'
    );
  }

  // Validate CA bundle exists if specified
  if (tlsCaBundle) {
    try {
      readFileSync(tlsCaBundle);
    } catch {
      throw new Error(`TANIUM_TLS_CA_BUNDLE file not readable: ${tlsCaBundle}`);
    }
  }

  return {
    baseUrl,
    apiToken,
    tlsCaBundle,
    tlsVerify,
    cacheTtlSeconds,
    cacheDiskPath,
    pollIntervalMs,
    pollTimeoutMs,
    graphqlUrl: `${baseUrl}/plugin/products/gateway/graphql`,
    platformRestUrl: `${baseUrl}/api/v2`,
    patchRestUrl: `${baseUrl}/plugin/products/patch`,
    deployRestUrl: `${baseUrl}/plugin/products/deploy`,
    connectRestUrl: `${baseUrl}/plugin/products/connect`,
    complyRestUrl: `${baseUrl}/plugin/products/comply`,
    assetRestUrl: `${baseUrl}/plugin/products/asset`,
  };
}

export const config = loadConfig();
export default config;
