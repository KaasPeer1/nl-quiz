import type L from 'leaflet';
import type { GameFeature, Question, QuizState } from '../../core/types';
import { BaseGeoJsonLayers } from './BaseGeoJsonLayers';
import { useGameMapLayers } from '../../core/engine/useGameMapLayers';
import type { MapLayersConfig } from '../../core/engine/mapLayersConfig';

interface ConfiguredMapLayersProps<T extends GameFeature> {
  gameState: QuizState<T>;
  selectedFeature: T | null;
  currentQuestion: Question<T> | null;
  config: MapLayersConfig<T>;
  onEachFeature?: (feature: any, layer: L.Layer) => void;
  selectedKey?: string | number;
  remainingKey?: string | number;
  correctKey?: string | number;
  wrongKey?: string | number;
  currentKey?: string | number;
}

export function ConfiguredMapLayers<T extends GameFeature>({
  gameState,
  selectedFeature,
  currentQuestion,
  config,
  onEachFeature,
  selectedKey,
  remainingKey,
  correctKey,
  wrongKey,
  currentKey
}: ConfiguredMapLayersProps<T>) {
  const { remainingData, correctData, wrongData, selectedData, lastWrong } = useGameMapLayers({
    gameState,
    selectedFeature,
    featureToProperties: config.featureToProperties,
    featureToGeometry: config.featureToGeometry
  });

  return (
    <BaseGeoJsonLayers
      remainingData={remainingData}
      correctData={correctData}
      wrongData={wrongData}
      selectedData={selectedData}
      lastWrong={lastWrong}
      currentQuestion={currentQuestion}
      showCurrent={config.showCurrent ?? false}
      getStyle={config.getStyle}
      onEachFeature={onEachFeature}
      interactive={config.interactive}
      flashBold={config.flashBold}
      selectedKey={selectedKey}
      remainingKey={remainingKey}
      correctKey={correctKey}
      wrongKey={wrongKey}
      currentKey={currentKey}
    />
  );
}
