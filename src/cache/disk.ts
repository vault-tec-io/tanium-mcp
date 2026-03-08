import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

interface DiskCache<T> {
  cachedAt: string;
  data: T;
}

export function saveToDisk<T>(dir: string, filename: string, data: T): void {
  try {
    mkdirSync(dir, { recursive: true });
    const payload: DiskCache<T> = { cachedAt: new Date().toISOString(), data };
    const tmpPath = join(dir, `${filename}.tmp`);
    const finalPath = join(dir, filename);
    writeFileSync(tmpPath, JSON.stringify(payload), 'utf8');
    renameSync(tmpPath, finalPath);
  } catch (err) {
    console.warn(`[tanium-mcp] Cache disk write failed (${filename}):`, err);
  }
}

export function loadFromDisk<T>(dir: string, filename: string, ttlSeconds: number): T | null {
  try {
    const path = join(dir, filename);
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as DiskCache<T>;
    const cachedAt = new Date(parsed.cachedAt);
    const ageSeconds = (Date.now() - cachedAt.getTime()) / 1000;
    if (ageSeconds > ttlSeconds) {
      return null; // expired
    }
    return parsed.data;
  } catch {
    return null;
  }
}
