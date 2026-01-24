import L from 'leaflet';
import { type Road } from '../types';

const CLICK_TOLERANCE_PX = 15;

// Simple Bounds Interface (Leaflet-independent for raw speed)
export interface SimpleBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const getRoadBounds = (road: Road): SimpleBounds => {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

  const processCoord = (coord: number[]) => {
    const lng = coord[0];
    const lat = coord[1];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  const geom = road.geometry;
  if (geom.type === 'LineString') {
    (geom.coordinates as number[][]).forEach(processCoord);
  } else if (geom.type === 'MultiLineString') {
    (geom.coordinates as number[][][]).forEach(line => line.forEach(processCoord));
  }

  return { minLat, maxLat, minLng, maxLng };
};

export const isPointInBounds = (latlng: L.LatLng, b: SimpleBounds): boolean => {
  // Rough buffer: 0.01 degrees is ~1km, enough to cover the 15px tolerance
  const buffer = 0.01;
  return (
    latlng.lat >= b.minLat - buffer &&
    latlng.lat <= b.maxLat + buffer &&
    latlng.lng >= b.minLng - buffer &&
    latlng.lng <= b.maxLng + buffer
  );
};

export const findRoadsAtPoint = (
  clickLatLng: L.LatLng,
  map: L.Map,
  roads: Road[],
  boundsMap?: Map<string, SimpleBounds>
): Road[] => {
  const clickPoint = map.latLngToContainerPoint(clickLatLng);
  const matches: Road[] = [];

  for (const road of roads) {
    if (boundsMap) {
      const bounds = boundsMap.get(road.id);
      if (bounds && !isPointInBounds(clickLatLng, bounds)) {
        continue;
      }
    }

    let isHit = false;
    const geometry = road.geometry;
    const coords = geometry.type === 'MultiLineString'
      ? geometry.coordinates
      : [geometry.coordinates];

    // Check every segment
    for (const segment of coords) {
      if (isHit) break;
      for (let i = 0; i < segment.length - 1; i++) {
        const p1 = map.latLngToContainerPoint(L.latLng(segment[i][1], segment[i][0]));
        const p2 = map.latLngToContainerPoint(L.latLng(segment[i + 1][1], segment[i + 1][0]));

        // Pixel distance check
        const dist = L.LineUtil.pointToSegmentDistance(clickPoint, p1, p2);
        if (dist <= CLICK_TOLERANCE_PX) {
          isHit = true;
          break;
        }
      }
    }

    if (isHit) matches.push(road);
  }

  return matches;
};
