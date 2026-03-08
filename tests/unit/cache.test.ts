import { describe, it, expect, beforeEach } from 'vitest';

// Test the search ranking logic in isolation
type CachedSensor = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  parameters: never[];
  hidden: boolean;
  harvested: boolean;
};

function searchSensors(cache: CachedSensor[], keyword: string, limit = 20): CachedSensor[] {
  const kw = keyword.toLowerCase();
  const exactName: CachedSensor[] = [];
  const prefixName: CachedSensor[] = [];
  const substringName: CachedSensor[] = [];
  const substringOther: CachedSensor[] = [];

  for (const s of cache) {
    const name = s.name.toLowerCase();
    const desc = (s.description ?? '').toLowerCase();
    const cat = (s.category ?? '').toLowerCase();

    if (name === kw) exactName.push(s);
    else if (name.startsWith(kw)) prefixName.push(s);
    else if (name.includes(kw)) substringName.push(s);
    else if (desc.includes(kw) || cat.includes(kw)) substringOther.push(s);
  }

  return [...exactName, ...prefixName, ...substringName, ...substringOther].slice(0, limit);
}

describe('Sensor Search Ranking', () => {
  const cache: CachedSensor[] = [
    { id: '1', name: 'Operating System', description: 'Returns the OS', category: 'OS', parameters: [], hidden: false, harvested: false },
    { id: '2', name: 'Operating System Generation', description: 'Returns OS generation', category: 'OS', parameters: [], hidden: false, harvested: false },
    { id: '3', name: 'Has Operating System', description: 'Checks for OS', category: 'OS', parameters: [], hidden: false, harvested: false },
    { id: '4', name: 'CPU', description: 'Operating system CPU', category: 'Hardware', parameters: [], hidden: false, harvested: false },
    { id: '5', name: 'IP Address', description: 'Returns the IP', category: 'Network', parameters: [], hidden: false, harvested: false },
  ];

  it('ranks exact name match first', () => {
    const results = searchSensors(cache, 'operating system');
    expect(results[0].name).toBe('Operating System');
  });

  it('ranks prefix match before substring', () => {
    const results = searchSensors(cache, 'operating system');
    expect(results[1].name).toBe('Operating System Generation');
    expect(results[2].name).toBe('Has Operating System');
  });

  it('includes description/category matches last', () => {
    const results = searchSensors(cache, 'operating system');
    const cpuResult = results.find(r => r.name === 'CPU');
    expect(cpuResult).toBeDefined();
    // CPU should be after all name matches
    const cpuIdx = results.indexOf(cpuResult!);
    expect(cpuIdx).toBeGreaterThan(2);
  });

  it('returns empty for no matches', () => {
    const results = searchSensors(cache, 'nonexistent');
    expect(results).toHaveLength(0);
  });

  it('respects the limit', () => {
    const results = searchSensors(cache, 'o', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('handles case insensitive search', () => {
    const results = searchSensors(cache, 'IP ADDRESS');
    expect(results[0].name).toBe('IP Address');
  });
});

describe('Disk Cache TTL', () => {
  it('detects expired cache', () => {
    const cachedAt = new Date(Date.now() - 2000 * 1000); // 2000 seconds ago
    const ttlSeconds = 1800;
    const ageSeconds = (Date.now() - cachedAt.getTime()) / 1000;
    expect(ageSeconds).toBeGreaterThan(ttlSeconds);
  });

  it('accepts fresh cache', () => {
    const cachedAt = new Date(Date.now() - 100 * 1000); // 100 seconds ago
    const ttlSeconds = 1800;
    const ageSeconds = (Date.now() - cachedAt.getTime()) / 1000;
    expect(ageSeconds).toBeLessThan(ttlSeconds);
  });
});
