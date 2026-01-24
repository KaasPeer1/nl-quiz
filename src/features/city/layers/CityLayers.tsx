import React, { useEffect, useMemo, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { GameLogicInterface } from '../../../types';
import type { City } from '../types';
import { FlashingLayer } from '../../../components/map/FlashingLayer';
import L from 'leaflet';

interface Props {
  logic: GameLogicInterface;
  onFeatureClick: (c: City) => void;
}

export const CityLayers: React.FC<Props> = ({ logic, onFeatureClick }) => {
  const { layerData, currentStep, selectedFeature, meta } = logic;
  const mode = meta?.mode || 'NAME';

  const onClickRef = useRef(onFeatureClick);
  useEffect(() => { onClickRef.current = onFeatureClick; }, [onFeatureClick]);

  // Optimize: Create FeatureCollections only when data changes
  const backgroundData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: layerData.targets.map(c => ({
      type: "Feature",
      properties: { id: c.id },
      geometry: c.geometry
    }))
  }), [layerData.targets]);

  const correctData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: layerData.correct.map(c => ({
      type: "Feature", properties: { id: c.id }, geometry: c.geometry
    }))
  }), [layerData.correct]);

  const wrongData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: layerData.wrong.map(c => ({
      type: "Feature", properties: { id: c.id }, geometry: c.geometry
    }))
  }), [layerData.wrong]);

  const selectedData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: [{
      type: "Feature", properties: { id: selectedFeature?.id }, geometry: selectedFeature?.geometry
    }]
  }), [selectedFeature]);

  const handleLayerClick = (id: string) => {
    const found = layerData.targets.find(c => c.id === id);
    if (found && onClickRef.current) onClickRef.current(found as City);
  }

  // Handle Clicks
  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => handleLayerClick(feature.properties.id)
    });
  };

  const showCurrentTarget = mode !== 'POINT';

  return (
    <>
      {/* Background (Gray) */}
      <GeoJSON
        data={backgroundData as any}
        onEachFeature={onEachFeature}
        style={{ color: '#9ca3af', weight: 1, fillColor: '#e5e7eb', fillOpacity: 0.4 }}
      />

      {/* Correct (Green) */}
      <GeoJSON
        key={`correct-${layerData.correct.length}`} // Force re-render
        data={correctData as any}
        style={{ color: '#16a34a', weight: 1, fillColor: '#4ade80', fillOpacity: 0.8 }}
        onEachFeature={onEachFeature}
      />

      {/* Wrong (Red) */}
      <GeoJSON
        key={`wrong-${layerData.wrong.length}`}
        data={wrongData as any}
        style={{ color: '#e53935', weight: 1, fillColor: '#ef5350', fillOpacity: 0.8 }}
        onEachFeature={onEachFeature}
      />

      {/* Current Target Highlight (Blue) */}
      {showCurrentTarget && currentStep && (
        <GeoJSON
          key={`current-${currentStep.id}`}
          data={currentStep.geometry}
          style={{ color: '#2563eb', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.9 }}
          interactive={false}
        />
      )}

      {/* Flashing Last Wrong Guess */}
      {layerData.lastWrong && <FlashingLayer feature={layerData.lastWrong} onEachFeature={onEachFeature} />}

      {/* Selected Feature (Bright Blue) - Always on top if selected */}
      {selectedFeature && (
        <GeoJSON
          key={`selected-${selectedFeature.id}`}
          data={selectedData}
          style={{ color: '#2563eb', weight: 4, fillColor: '#3b82f6', fillOpacity: 0.9 }}
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
};
