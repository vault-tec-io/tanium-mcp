import { autoPage } from '../graphql/client.js';
import { getAllSensors } from '../rest/platform.js';
import { SENSORS_QUERY } from '../graphql/queries/sensors.js';
import type { CachedSensor } from '../types/graphql.js';
import { saveToDisk, loadFromDisk } from './disk.js';
import config from '../config.js';

let sensorCache: CachedSensor[] = [];
let sensorCacheReady = false;

const DISK_FILENAME = 'sensor-cache.json';

export async function fetchAndCacheSensors(): Promise<void> {
  // Try disk first
  if (config.cacheDiskPath) {
    const disk = loadFromDisk<CachedSensor[]>(config.cacheDiskPath, DISK_FILENAME, config.cacheTtlSeconds);
    if (disk) {
      sensorCache = disk;
      sensorCacheReady = true;
      return;
    }
  }

  // Fetch from GraphQL
  const gqlSensors = await autoPage<{
    name: string;
    description?: string;
    category?: string;
    contentSetName?: string;
    hidden?: boolean;
    parameters: Array<{ name: string; type: string; label?: string; defaultValue?: string }>;
    columns?: Array<{ name: string; valueType: string }>;
  }, {
    edges: Array<{ cursor: string; node: { name: string; description?: string; category?: string; contentSetName?: string; hidden?: boolean; parameters: Array<{ name: string; type: string; label?: string; defaultValue?: string }>; columns?: Array<{ name: string; valueType: string }> } }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string };
    totalRecords?: number;
  }>(
    SENSORS_QUERY,
    (cursor) => ({ after: cursor }),
    (data) => {
      const d = data as { sensors: { edges: Array<{ cursor: string; node: { name: string; description?: string; category?: string; contentSetName?: string; hidden?: boolean; parameters: Array<{ name: string; type: string; label?: string; defaultValue?: string }>; columns?: Array<{ name: string; valueType: string }> } }>; pageInfo: { hasNextPage: boolean; endCursor?: string }; totalRecords?: number } };
      return d.sensors;
    },
    5000
  );

  // Supplement with Platform REST for id/hash
  let platformSensors: Array<{ id: number; name: string; hash?: number }> = [];
  try {
    platformSensors = await getAllSensors();
  } catch (err) {
    console.warn('[tanium-mcp] Could not fetch platform sensor IDs:', err);
  }

  const platformByName = new Map(platformSensors.map(s => [s.name, s]));

  sensorCache = gqlSensors.map(s => {
    const platform = platformByName.get(s.name);
    return {
      id: platform ? String(platform.id) : '',
      hash: platform?.hash,
      name: s.name,
      description: s.description,
      category: s.category,
      contentSetName: s.contentSetName,
      hidden: s.hidden ?? false,
      harvested: false,
      parameters: s.parameters.map(p => ({
        name: p.name,
        type: p.type,
        description: p.label,
        defaultValue: p.defaultValue,
        label: p.label,
      })),
      columns: s.columns,
    };
  });

  sensorCacheReady = true;

  if (config.cacheDiskPath) {
    saveToDisk(config.cacheDiskPath, DISK_FILENAME, sensorCache);
  }
}

export function isSensorCacheReady(): boolean {
  return sensorCacheReady;
}

export function searchSensors(keyword: string, limit = 20): CachedSensor[] {
  const kw = keyword.toLowerCase();
  const exactName: CachedSensor[] = [];
  const prefixName: CachedSensor[] = [];
  const substringName: CachedSensor[] = [];
  const substringOther: CachedSensor[] = [];

  for (const s of sensorCache) {
    const name = s.name.toLowerCase();
    const desc = (s.description ?? '').toLowerCase();
    const cat = (s.category ?? '').toLowerCase();

    if (name === kw) {
      exactName.push(s);
    } else if (name.startsWith(kw)) {
      prefixName.push(s);
    } else if (name.includes(kw)) {
      substringName.push(s);
    } else if (desc.includes(kw) || cat.includes(kw)) {
      substringOther.push(s);
    }
  }

  return [...exactName, ...prefixName, ...substringName, ...substringOther].slice(0, limit);
}

export function getSensorByName(name: string): CachedSensor | undefined {
  return sensorCache.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function getAllCachedSensors(): CachedSensor[] {
  return sensorCache;
}

export function invalidateSensorCache(): void {
  sensorCacheReady = false;
  sensorCache = [];
}
