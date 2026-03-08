import { fetchAndCacheSensors, invalidateSensorCache } from './sensors.js';
import { fetchAndCachePackages, invalidatePackageCache } from './packages.js';
import config from '../config.js';

let degradedMode = false;
let degradedReason = '';
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

export function isDegradedMode(): boolean {
  return degradedMode;
}

export function getDegradedReason(): string {
  return degradedReason;
}

export async function warmCache(): Promise<void> {
  try {
    await Promise.all([
      fetchAndCacheSensors(),
      fetchAndCachePackages(),
    ]);
    degradedMode = false;
    degradedReason = '';
    console.error('[tanium-mcp] Cache warmed successfully');
    startRefreshLoop();
  } catch (err) {
    degradedMode = true;
    degradedReason = err instanceof Error ? err.message : String(err);
    console.error('[tanium-mcp] Cache warm failed — running in degraded mode:', degradedReason);
    scheduleRetry();
  }
}

function startRefreshLoop(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  const ttlMs = config.cacheTtlSeconds * 1000;
  refreshTimer = setInterval(async () => {
    console.error('[tanium-mcp] Refreshing cache...');
    try {
      invalidateSensorCache();
      invalidatePackageCache();
      await Promise.all([fetchAndCacheSensors(), fetchAndCachePackages()]);
      console.error('[tanium-mcp] Cache refreshed');
    } catch (err) {
      console.error('[tanium-mcp] Cache refresh failed:', err);
    }
  }, ttlMs);
  // Don't block process exit
  if (refreshTimer.unref) refreshTimer.unref();
}

function scheduleRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(async () => {
    console.error('[tanium-mcp] Retrying cache warm...');
    await warmCache();
  }, 60_000);
  if (retryTimer.unref) retryTimer.unref();
}
