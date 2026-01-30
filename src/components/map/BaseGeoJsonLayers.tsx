import React, { useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import type L from 'leaflet';
import type { Question, GameFeature } from '../../core/types';
import { FlashingLayer } from './FlashingLayer';

type LayerKind = 'bg' | 'correct' | 'wrong' | 'current' | 'selected';

interface BaseGeoJsonLayersProps<T extends GameFeature> {
  remainingData: any;
  correctData: any;
  wrongData: any;
  selectedData: any | null;
  lastWrong: T | null;
  currentQuestion: Question<T> | null;
  showCurrent: boolean;
  getStyle: (type: LayerKind, feature?: any) => L.PathOptions;
  onEachFeature?: (feature: any, layer: L.Layer) => void;
  interactive?: Partial<Record<LayerKind, boolean>>;
  flashBold?: boolean;
  selectedKey?: string | number;
  remainingKey?: string | number;
  correctKey?: string | number;
  wrongKey?: string | number;
  currentKey?: string | number;
}

export function BaseGeoJsonLayers<T extends GameFeature>({
  remainingData,
  correctData,
  wrongData,
  selectedData,
  lastWrong,
  currentQuestion,
  showCurrent,
  getStyle,
  onEachFeature,
  interactive,
  flashBold,
  selectedKey,
  remainingKey,
  correctKey,
  wrongKey,
  currentKey
}: BaseGeoJsonLayersProps<T>) {
  const remainingRef = useRef<L.GeoJSON>(null);
  const correctRef = useRef<L.GeoJSON>(null);
  const wrongRef = useRef<L.GeoJSON>(null);
  const currentRef = useRef<L.GeoJSON>(null);
  const selectedRef = useRef<L.GeoJSON>(null);

  const isInteractive = (type: LayerKind, defaultValue: boolean) =>
    interactive?.[type] ?? defaultValue;

  useEffect(() => {
    if (!remainingRef.current) return;
    remainingRef.current.clearLayers();
    remainingRef.current.addData(remainingData as any);
  }, [remainingData]);

  useEffect(() => {
    if (!correctRef.current) return;
    correctRef.current.clearLayers();
    correctRef.current.addData(correctData as any);
  }, [correctData]);

  useEffect(() => {
    if (!wrongRef.current) return;
    wrongRef.current.clearLayers();
    wrongRef.current.addData(wrongData as any);
  }, [wrongData]);

  useEffect(() => {
    if (!selectedRef.current) return;
    if (!selectedData) {
      selectedRef.current.clearLayers();
      return;
    }
    selectedRef.current.clearLayers();
    selectedRef.current.addData(selectedData as any);
  }, [selectedData]);

  useEffect(() => {
    if (!currentRef.current) return;
    currentRef.current.clearLayers();
    if (showCurrent && currentQuestion) {
      currentRef.current.addData(currentQuestion.payload.geometry as any);
    }
  }, [showCurrent, currentQuestion]);

  return (
    <>
      <GeoJSON
        key={remainingKey}
        ref={remainingRef}
        data={remainingData as any}
        style={(feature) => getStyle('bg', feature)}
        onEachFeature={onEachFeature}
        interactive={isInteractive('bg', true)}
      />

      <GeoJSON
        key={correctKey}
        ref={correctRef}
        data={correctData as any}
        style={(feature) => getStyle('correct', feature)}
        onEachFeature={onEachFeature}
        interactive={isInteractive('correct', true)}
      />

      <GeoJSON
        key={wrongKey}
        ref={wrongRef}
        data={wrongData as any}
        style={(feature) => getStyle('wrong', feature)}
        onEachFeature={onEachFeature}
        interactive={isInteractive('wrong', true)}
      />

      {showCurrent && currentQuestion && (
        <GeoJSON
          key={currentKey}
          ref={currentRef}
          data={currentQuestion.payload.geometry}
          style={getStyle('current')}
          interactive={isInteractive('current', false)}
        />
      )}

      {lastWrong && (
        <FlashingLayer feature={lastWrong} onEachFeature={onEachFeature} bold={flashBold} />
      )}

      {selectedData && (
        <GeoJSON
          key={selectedKey}
          ref={selectedRef}
          data={selectedData}
          style={(feature) => getStyle('selected', feature)}
          onEachFeature={onEachFeature}
          interactive={isInteractive('selected', true)}
        />
      )}
    </>
  );
}
