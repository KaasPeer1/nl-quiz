import { useCallback, useMemo } from 'react';
import type { GameFeature, Question, QuizState } from '../types';

interface UseGameMapLayersOptions<T extends GameFeature> {
  gameState: QuizState<T>;
  selectedFeature: T | null;
  featureToProperties?: (feature: T) => Record<string, any>;
  featureToGeometry?: (feature: T) => any;
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Array<{ type: 'Feature'; properties: Record<string, any>; geometry: any }>;
}

export function useGameMapLayers<T extends GameFeature>({
  gameState,
  selectedFeature,
  featureToProperties,
  featureToGeometry
}: UseGameMapLayersOptions<T>) {
  const getProperties = useCallback(
    (feature: T) => (featureToProperties ? featureToProperties(feature) : { id: feature.id }),
    [featureToProperties]
  );
  const getGeometry = useCallback(
    (feature: T) => (featureToGeometry ? featureToGeometry(feature) : feature.geometry),
    [featureToGeometry]
  );

  const toFeature = (feature: T) => ({
    type: 'Feature' as const,
    properties: getProperties(feature),
    geometry: getGeometry(feature)
  });

  const toCollection = (qs: Question<T>[]): FeatureCollection => ({
    type: 'FeatureCollection',
    features: qs.map(q => toFeature(q.payload))
  });

  const remainingData = useMemo(() => toCollection(gameState.queue), [gameState.queue, getProperties, getGeometry]);
  const correctData = useMemo(() => toCollection(gameState.history.correct), [gameState.history.correct, getProperties, getGeometry]);
  const wrongData = useMemo(() => toCollection(gameState.history.wrong), [gameState.history.wrong, getProperties, getGeometry]);
  const lastWrong = useMemo(() => gameState.lastWrong?.payload ?? null, [gameState.lastWrong]);
  const selectedData = useMemo(() => {
    if (!selectedFeature) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [toFeature(selectedFeature)]
    };
  }, [selectedFeature, getProperties, getGeometry]);

  return {
    remainingData,
    correctData,
    wrongData,
    selectedData,
    lastWrong
  };
}
