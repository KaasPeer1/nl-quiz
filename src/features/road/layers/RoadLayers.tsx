import React, { useRef, useMemo, useCallback } from 'react';
import { GeoJSON, useMapEvents } from 'react-leaflet';
import { type GameLogicInterface, type GameFeature } from '../../../types';
import { type Road } from '../types';
import L from 'leaflet';
import { FlashingLayer } from '../../../components/map/FlashingLayer';
import { findRoadsAtPoint, getRoadBounds, type SimpleBounds } from '../utils/geo';
import _ from 'lodash';

interface Props {
  logic: GameLogicInterface;
  onFeatureClick: (feature: GameFeature) => void;
}

export const RoadLayers: React.FC<Props> = ({ logic, onFeatureClick }) => {
  const { layerData, currentStep, selectedFeature, meta } = logic;
  const mode = meta?.mode || 'NAME';
  const targets = layerData.targets as Road[];

  const boundsCache = useMemo(() => {
    const map = new Map<string, SimpleBounds>();
    targets.forEach(road => {
      map.set(road.id, getRoadBounds(road));
    });
    return map;
  }, [targets]);

  const mapRef = useRef<L.Map | null>(null);

  const handleMouseMove = useCallback(
    _.throttle((e: L.LeafletMouseEvent) => {
      if (!mapRef.current) return;

      const hits = findRoadsAtPoint(e.latlng, mapRef.current, targets, boundsCache);
      const container = mapRef.current.getContainer();

      if (hits.length > 0) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = ''; // Reset to default (grab)
      }
    }, 50, { leading: true, trailing: false }), // 50ms throttle = 20fps check, very cheap
    [targets, boundsCache]
  );

  const getPriority = (type: string) => {
    if (type === 'A') return 0;
    if (type === 'N') return 1;
    if (type === 'S') return 2;
    if (type === 'E') return 3;
    return 4;
  };

  const map = useMapEvents({
    click: (e) => {
      const matches = findRoadsAtPoint(e.latlng, map, targets, boundsCache);

      // --- DESELECTION LOGIC ---
      if (matches.length === 0) {
        if (selectedFeature) {
          logic.actions.clearSelection();
        }
        return;
      }

      if (selectedFeature && matches.some(r => r.id === selectedFeature.id)) {
        logic.actions.clearSelection();
        return;
      }

      matches.sort((a, b) => getPriority(a.type) - getPriority(b.type));

      // --- SELECTION LOGIC ---
      if (mode === 'POINT' && currentStep) {
        const hitCorrect = matches.find(r => r.id === currentStep.id);
        onFeatureClick(hitCorrect || matches[0]);
        return;
      }

      if (mode === 'EXPLORE') {
        const top = matches[0];
        const enhancedFeature = { ...top, _overlaps: matches };
        onFeatureClick(enhancedFeature);
        return;
      }

      onFeatureClick(matches[0]);
    },
    mousemove: (e) => {
      // Store map reference for the throttled handler
      mapRef.current = map;
      handleMouseMove(e);
    }
  });

  const roadRenderer = useMemo(() => L.canvas({ tolerance: 5 }), [])

  const getBackgroundStyle = useCallback((feature: any) => {
    if (mode !== 'EXPLORE') return {
      color: '#bbbbbb',
      weight: 2,
      opacity: 0.8,
      renderer: roadRenderer
    }

    const road = feature?.properties as Road;

    let color;
    switch (road.type) {
      case 'A': color = '#ffbcc1'; break;
      case 'N': color = '#ffe0b2'; break;
      case 'S': color = '#bbdefb'; break;
      case 'E': color = '#b2dfdb'; break;
    }

    return {
      color: color,
      weight: 2,
      opacity: 1,
      renderer: roadRenderer
    }
  }, [roadRenderer]);

  const getCorrectStyle = useCallback(() => ({ color: '#16a34a', weight: 3, opacity: 1, renderer: roadRenderer }), [roadRenderer]);
  const getWrongStyle = useCallback(() => ({ color: '#dc2626', weight: 3, opacity: 1, renderer: roadRenderer }), [roadRenderer]);
  const getCurrentStyle = useCallback(() => ({ color: '#2563eb', weight: 3, opacity: 1, renderer: roadRenderer }), [roadRenderer]);
  const getSelectedStyle = useCallback(() => ({ color: '#3b82f6', weight: 3, opacity: 1, renderer: roadRenderer }), [roadRenderer]);
  const getLastWrongStyle = useCallback(() => ({ renderer: roadRenderer }), [roadRenderer]);

  // Convert generic targets to GeoJSON structure
  const makeCollection = (features: GameFeature[]) => {
    const roads = features as Road[];
    roads.sort((a, b) => getPriority(b.type) - getPriority(a.type));
    return {
      type: "FeatureCollection" as const,
      features: roads.map(r => ({
        type: "Feature", properties: { id: r.id, type: r.type }, geometry: r.geometry
      }))
    }
  };

  const backgroundData = useMemo(() => makeCollection(layerData.targets), [layerData.targets]);
  const correctData = useMemo(() => makeCollection(layerData.correct), [layerData.correct]);
  const wrongData = useMemo(() => makeCollection(layerData.wrong), [layerData.wrong]);
  const currentData = useMemo(() => makeCollection(currentStep ? [currentStep] : []), [currentStep]);

  const showCurrent = currentStep && mode !== 'POINT';

  return (
    <>
      <GeoJSON
        data={backgroundData}
        style={getBackgroundStyle}
        interactive={false}
      />

      <GeoJSON
        key={`correct-${layerData.correct.length}`}
        data={correctData}
        style={getCorrectStyle}
        interactive={false}
      />

      <GeoJSON
        key={`wrong-${layerData.wrong.length}`}
        data={wrongData}
        style={getWrongStyle}
        interactive={false}
      />

      {showCurrent && (
        <GeoJSON
          key={`current-${currentStep.id}`}
          data={currentData}
          style={getCurrentStyle}
          interactive={false}
        />
      )}

      {layerData.lastWrong && (
        <FlashingLayer
          feature={layerData.lastWrong}
          bold={true}
          style={getLastWrongStyle}
          interactive={false}
        />
      )}

      {selectedFeature && (
        <GeoJSON
          key={`selected-${selectedFeature.id}`}
          data={selectedFeature.geometry}
          style={getSelectedStyle}
          interactive={false}
        />
      )}
    </>
  );
};
