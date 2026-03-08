import { autoPage } from '../graphql/client.js';
import { getAllPackages } from '../rest/platform.js';
import { PACKAGES_QUERY } from '../graphql/queries/packages.js';
import type { CachedPackage } from '../types/graphql.js';
import { saveToDisk, loadFromDisk } from './disk.js';
import config from '../config.js';

let packageCache: CachedPackage[] = [];
let packageCacheReady = false;

const DISK_FILENAME = 'package-cache.json';

interface GQLPackageNode {
  name: string;
  command?: string;
  contentSetName?: string;
  commandTimeoutSeconds?: number;
  expireSeconds?: number;
  params?: Array<{ name: string; label?: string; defaultValue?: string }>;
}

interface GQLPackageConnection {
  edges: Array<{ cursor: string; node: GQLPackageNode }>;
  pageInfo: { hasNextPage: boolean; endCursor?: string };
  totalRecords?: number;
}

export async function fetchAndCachePackages(): Promise<void> {
  // Try disk first
  if (config.cacheDiskPath) {
    const disk = loadFromDisk<CachedPackage[]>(config.cacheDiskPath, DISK_FILENAME, config.cacheTtlSeconds);
    if (disk) {
      packageCache = disk;
      packageCacheReady = true;
      return;
    }
  }

  // Fetch from GraphQL
  const gqlPackages = await autoPage<GQLPackageNode, GQLPackageConnection>(
    PACKAGES_QUERY,
    (cursor) => ({ after: cursor }),
    (data) => {
      const d = data as { packageSpecs: GQLPackageConnection };
      return d.packageSpecs;
    },
    5000
  );

  // Supplement with Platform REST for id/description
  let platformPackages: Array<{ id: number; name: string; description?: string }> = [];
  try {
    platformPackages = await getAllPackages();
  } catch (err) {
    console.warn('[tanium-mcp] Could not fetch platform package descriptions:', err);
  }

  const platformByName = new Map(platformPackages.map(p => [p.name, p]));

  packageCache = gqlPackages.map(p => {
    const platform = platformByName.get(p.name);
    return {
      id: platform ? String(platform.id) : '',
      name: p.name,
      command: p.command,
      description: platform?.description,
      contentSetName: p.contentSetName,
      commandTimeoutSeconds: p.commandTimeoutSeconds,
      expireSeconds: p.expireSeconds,
      params: p.params?.map(param => ({
        name: param.name,
        description: param.label,
        defaultValue: param.defaultValue,
        label: param.label,
      })),
    };
  });

  packageCacheReady = true;

  if (config.cacheDiskPath) {
    saveToDisk(config.cacheDiskPath, DISK_FILENAME, packageCache);
  }
}

export function isPackageCacheReady(): boolean {
  return packageCacheReady;
}

export function searchPackages(keyword: string, limit = 20): CachedPackage[] {
  const kw = keyword.toLowerCase();
  const exactName: CachedPackage[] = [];
  const prefixName: CachedPackage[] = [];
  const substringName: CachedPackage[] = [];
  const substringOther: CachedPackage[] = [];

  for (const p of packageCache) {
    const name = p.name.toLowerCase();
    const desc = (p.description ?? '').toLowerCase();

    if (name === kw) {
      exactName.push(p);
    } else if (name.startsWith(kw)) {
      prefixName.push(p);
    } else if (name.includes(kw)) {
      substringName.push(p);
    } else if (desc.includes(kw)) {
      substringOther.push(p);
    }
  }

  return [...exactName, ...prefixName, ...substringName, ...substringOther].slice(0, limit);
}

export function getPackageByName(name: string): CachedPackage | undefined {
  return packageCache.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function getAllCachedPackages(): CachedPackage[] {
  return packageCache;
}

export function invalidatePackageCache(): void {
  packageCacheReady = false;
  packageCache = [];
}
