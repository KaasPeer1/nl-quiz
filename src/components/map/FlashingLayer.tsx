import React, { useEffect, useRef, useMemo } from 'react';
import { GeoJSON, type GeoJSONProps } from 'react-leaflet';
import L from 'leaflet';
import type { GameFeature } from '../../types';

interface FlashingProps extends Omit<GeoJSONProps, "data"> {
  feature: GameFeature;
  bold?: boolean;
}

export const FlashingLayer: React.FC<FlashingProps> = ({ feature, bold, ...props }) => {
  const layerRef = useRef<L.GeoJSON>(null);

  const data = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: [{
      type: "Feature",
      properties: { id: feature.id },
      geometry: feature.geometry
    }]
  }), [feature]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    let isBright = true;
    const interval = setInterval(() => {
      isBright = !isBright;
      layer.setStyle({
        color: isBright ? '#dd6b20' : '#e53935',
        fillOpacity: isBright ? 1 : 0,
        fillColor: '#fb8c00',
        weight: (isBright && bold) ? 4 : 2,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [feature]);

  return (
    <GeoJSON
      ref={layerRef}
      key={`flash-${feature.id}`}
      data={data as any}
      style={{ color: '#e53935', weight: 2, fillOpacity: 0 }}
      {...props}
    />
  );
};
