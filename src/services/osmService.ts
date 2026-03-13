import { NearbyLandmark } from '../types';

export const fetchNearbyLandmarks = async (
  lat: number, 
  lng: number, 
  radius: number = 15000,
  categories: string[] = []
): Promise<NearbyLandmark[]> => {
  const categoryFilter = categories.length > 0 
    ? `["historic"~"${categories.join('|')}"]` 
    : '["historic"]';

  const query = `
    [out:json][timeout:25];
    (
      node${categoryFilter}(around:${radius}, ${lat}, ${lng});
      way${categoryFilter}(around:${radius}, ${lat}, ${lng});
      relation${categoryFilter}(around:${radius}, ${lat}, ${lng});
    );
    out center 100;
  `;
  
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('OSM API failure');
  
  const data = await response.json();
  
  const landmarks: NearbyLandmark[] = data.elements.map((el: any) => ({
    name: el.tags.name || el.tags.historic || "Historical Site",
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon
  })).filter((l: any) => l.lat && l.lng && l.name !== "Historical Site");

  return landmarks.map(lm => {
    const R = 6371; // Earth radius in km
    const dLat = (lm.lat - lat) * Math.PI / 180;
    const dLon = (lm.lng - lng) * Math.PI / 180;
    const lat1 = lat * Math.PI / 180;
    const lat2 = lm.lat * Math.PI / 180;

    // Distance calculation (Haversine)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Bearing calculation
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    
    return { ...lm, bearing: (brng + 360) % 360, distance };
  });
};
