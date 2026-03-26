import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNearbyLandmarks } from './osmService';

describe('fetchNearbyLandmarks', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetch with default parameters when no categories are provided', async () => {
    // Mock successful fetch response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] })
    } as Response);

    await fetchNearbyLandmarks(51.5074, -0.1278);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Check if the correct URL was built
    const fetchArgs = vi.mocked(global.fetch).mock.calls[0][0] as string;
    expect(fetchArgs).toContain('https://overpass-api.de/api/interpreter?data=');

    const decodedQuery = decodeURIComponent(fetchArgs.split('=')[1]);
    expect(decodedQuery).toContain('node["historic"](around:15000, 51.5074, -0.1278)');
  });

  it('includes custom categories in the query when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] })
    } as Response);

    await fetchNearbyLandmarks(51.5074, -0.1278, 10000, ['monument', 'ruins']);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchArgs = vi.mocked(global.fetch).mock.calls[0][0] as string;
    const decodedQuery = decodeURIComponent(fetchArgs.split('=')[1]);

    expect(decodedQuery).toContain('node["historic"~"monument|ruins"](around:10000, 51.5074, -0.1278)');
  });

  it('throws an error if the API response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(fetchNearbyLandmarks(51.5074, -0.1278)).rejects.toThrow('OSM API failure');
  });

  it('filters out elements missing coordinates or valid names', async () => {
    const mockElements = [
      { tags: { name: 'Valid Landmark' }, lat: 51.5, lon: -0.1 },
      { tags: { name: 'No Coords' } },
      { tags: { historic: 'monument' }, lat: 51.6, lon: -0.2 }, // Use historic if name is missing
      { tags: {}, lat: 51.7, lon: -0.3 }, // Will result in "Historical Site" and get filtered out
      { tags: { name: 'Center Coords' }, center: { lat: 51.8, lon: -0.4 } }, // Uses center for relation/way
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: mockElements })
    } as Response);

    const result = await fetchNearbyLandmarks(51.5074, -0.1278);

    expect(result).toHaveLength(3);
    expect(result.map(r => r.name)).toEqual(['Valid Landmark', 'monument', 'Center Coords']);
  });

  it('correctly calculates distance and bearing', async () => {
    // We are at (0, 0)
    const lat = 0;
    const lng = 0;

    const mockElements = [
      // Due North (bearing 0)
      { tags: { name: 'North Point' }, lat: 1, lon: 0.0000001 },
      // Due East (bearing 90)
      { tags: { name: 'East Point' }, lat: 0.0000001, lon: 1 },
      // Due South (bearing 180)
      { tags: { name: 'South Point' }, lat: -1, lon: 0.0000001 },
      // Due West (bearing 270)
      { tags: { name: 'West Point' }, lat: 0.0000001, lon: -1 },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: mockElements })
    } as Response);

    const result = await fetchNearbyLandmarks(lat, lng);

    expect(result).toHaveLength(4);

    // 1 degree of latitude is approx 111.19 km
    // distance = 6371 * c, for 1 degree it's close to 111.19
    const expectedDistance = 111.19;

    const northPoint = result.find(r => r.name === 'North Point')!;
    expect(northPoint.distance).toBeCloseTo(expectedDistance, 1);
    expect(northPoint.bearing).toBeCloseTo(0, 1);

    const eastPoint = result.find(r => r.name === 'East Point')!;
    expect(eastPoint.distance).toBeCloseTo(expectedDistance, 1);
    expect(eastPoint.bearing).toBeCloseTo(90, 1);

    const southPoint = result.find(r => r.name === 'South Point')!;
    expect(southPoint.distance).toBeCloseTo(expectedDistance, 1);
    expect(southPoint.bearing).toBeCloseTo(180, 1);

    const westPoint = result.find(r => r.name === 'West Point')!;
    expect(westPoint.distance).toBeCloseTo(expectedDistance, 1);
    expect(westPoint.bearing).toBeCloseTo(270, 1);
  });

});
