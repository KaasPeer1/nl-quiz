import { useEffect, useMemo, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import _ from 'lodash';
import type { GameModeAdapter, Question } from '../../core/types';
import type { City, CityConfig } from './types';
import { CityConfigPanel } from './components/CityConfigPanel';
import { CityInfoCard } from './components/CityInfoCard';
import { FlashingLayer } from '../../components/map/FlashingLayer';
import { normalizeString } from '../../utils';
import { toQuestion } from './utils';
import { createLearningQueue } from '../../core/engine/learning';
import { DEFAULT_MIX_OPTIONS } from '../../core/types/learning';

export const CityAdapter: GameModeAdapter<CityConfig, City> = {
  id: 'city-quiz',
  label: "menu.modes.cities.label",
  description: "menu.modes.cities.description",

  defaultConfig: {
    minPopulation: 10000,
    maxPopulation: 1000000,
    selectedProvinces: [],
    mode: 'POINT',
    learnMode: false,
    learningOptions: DEFAULT_MIX_OPTIONS,
  },

  generateQuestions: (data, config, replay, context) => {
    let queuePool: City[] = [];
    let solvedPool: City[] = [];

    if (replay) {
      queuePool = data.filter(c => replay.toPlayIds.includes(c.id));
      solvedPool = data.filter(c => replay.solvedIds.includes(c.id));
      return { queue: queuePool.map(toQuestion), initialCorrect: solvedPool.map(toQuestion) }
    }

    if (config.learnMode && context?.progress) {
      const queue = createLearningQueue(data, context.progress, (c) => c.population, config.learningOptions);

      return { queue: queue.map(toQuestion), initialCorrect: [] };
    }

    queuePool = data.filter(c =>
      c.population >= config.minPopulation &&
      c.population <= config.maxPopulation &&
      (config.selectedProvinces.length === 0 || config.selectedProvinces.includes(c.province))
    );

    const shuffled = _.shuffle(queuePool);

    return {
      queue: shuffled.map(toQuestion),
      initialCorrect: solvedPool.map(toQuestion)
    };
  },

  validate: (question, input, context) => {
    // If input is a string (Name Mode)
    if (typeof input === 'string') {
      const targetName = normalizeString(question.payload.name);
      const inputName = normalizeString(input);
      // Check standard aliases
      if (question.payload.aliases.some(a => normalizeString(a) === inputName)) return true;
      // Check user aliases
      if (context?.aliases) {
        const custom = context.aliases[question.payload.id] || [];
        if (custom.some((a: string) => normalizeString(a) === inputName)) return true;
      }
      // Check name
      return targetName === inputName;
    }
    // If input is a Feature (Point Mode)
    else {
      return input.id === question.payload.id;
    }
  },

  getScoreValue: (city) => city.population,

  ConfigComponent: CityConfigPanel,
  InfoCardComponent: CityInfoCard,
  MapLayers: ({ gameState, onInteraction, config, selectedFeature }) => {
    const { history, currentQuestion, queue } = gameState;
    const { mode } = config;

    const stateRef = useRef({ gameState, onInteraction })
    useEffect(() => { stateRef.current = { gameState, onInteraction }; }, [gameState, onInteraction])

    // Styles
    const getStyle = (type: 'bg' | 'correct' | 'wrong' | 'current' | 'selected') => {
      switch (type) {
        case 'bg': return { color: '#9ca3af', weight: 1, fillColor: '#e5e7eb', fillOpacity: 0.4 };
        case 'correct': return { color: '#16a34a', weight: 1, fillColor: '#4ade80', fillOpacity: 0.8 };
        case 'wrong': return { color: '#e53935', weight: 1, fillColor: '#ef5350', fillOpacity: 0.8 };
        case 'current': return { color: '#2563eb', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.9 };
        case 'selected': return { color: '#2563eb', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.9 };
      }
    };

    // Helper to extract features from Questions
    const extract = (qs: Question<City>[]) => qs.map(q => ({
      type: "Feature", properties: { id: q.payload.id }, geometry: q.payload.geometry
    }));

    // Memoize Collections
    const correctData = useMemo(() => ({ type: "FeatureCollection", features: extract(history.correct) }), [history.correct]);
    const wrongData = useMemo(() => ({ type: "FeatureCollection", features: extract(history.wrong) }), [history.wrong]);
    const remainingData = useMemo(() => ({ type: "FeatureCollection", features: extract(queue) }), [queue]);
    const lastWrong = useMemo(() => gameState.lastWrong?.payload, [gameState.lastWrong]);
    const selectedData = useMemo(() => ({
      type: "FeatureCollection" as const,
      features: [{
        type: "Feature", properties: { id: selectedFeature?.id }, geometry: selectedFeature?.geometry
      }]
    }), [selectedFeature]);

    const handleLayerClick = (id: string) => {
      const { gameState: currentGameState, onInteraction: currentCb } = stateRef.current;

      const found =
        currentGameState.queue.find(q => q.id === id)?.payload ||
        currentGameState.history.correct.find(q => q.payload.id === id)?.payload ||
        currentGameState.history.wrong.find(q => q.payload.id === id)?.payload;

      if (found) currentCb(found);
    };

    // Handle Click
    const onEachFeature = (feature: any, layer: L.Layer) => {
      layer.on('click', () => {
        handleLayerClick(feature.properties.id);
      });
    };

    return (
      <>
        {/* Background / Remaining */}
        <GeoJSON
          data={remainingData as any}
          style={getStyle('bg')}
          onEachFeature={onEachFeature}
        />

        <GeoJSON key={`c-${history.correct.length}`} data={correctData as any} style={getStyle('correct')} onEachFeature={onEachFeature} />
        <GeoJSON key={`w-${history.wrong.length}`} data={wrongData as any} style={getStyle('wrong')} onEachFeature={onEachFeature} />

        {/* Current Highlight (Only for Name Mode) */}
        {mode === 'NAME' && currentQuestion && (
          <GeoJSON key={`curr-${currentQuestion.id}`} data={currentQuestion.payload.geometry} style={getStyle('current')} interactive={false} />
        )}

        {/* Flashing Last Wrong */}
        {lastWrong && (
          <FlashingLayer feature={lastWrong} onEachFeature={onEachFeature} />
        )}

        {selectedFeature && (
          <GeoJSON
            key={`selected-${selectedFeature.id}`}
            data={selectedData}
            style={getStyle('selected')}
            onEachFeature={onEachFeature}
          />
        )}
      </>
    );
  }
};
