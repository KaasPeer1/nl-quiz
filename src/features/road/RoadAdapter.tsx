import { useMemo, useRef, useEffect } from 'react';
import { GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import _ from 'lodash';
import type { GameModeAdapter, Question } from '../../core/types';
import type { Road, RoadConfig } from './types';
import { RoadConfigPanel } from './components/RoadConfigPanel';
import { RoadInfoCard } from './components/RoadInfoCard';
import { FlashingLayer } from '../../components/map/FlashingLayer';
import { findRoadsAtPoint, getRoadBounds, type SimpleBounds } from './utils/geo';
import { normalizeString } from '../../utils';
import { createLearningQueue } from '../../core/engine/learning';
import { toQuestion } from './utils';
import { DEFAULT_MIX_OPTIONS } from '../../core/types/learning';

export const RoadAdapter: GameModeAdapter<RoadConfig, Road> = {
  id: 'road-quiz',
  label: "menu.modes.road.label",
  description: "menu.modes.road.description",

  defaultConfig: {
    minLength: 0,
    maxLength: 300,
    selectedTypes: ['A'],
    selectedProvinces: [],
    mode: 'POINT',
    learnMode: false,
    learningOptions: DEFAULT_MIX_OPTIONS,
  },

  generateQuestions: (data, config, replay, context) => {
    let queuePool: Road[] = [];
    let solvedPool: Road[] = [];

    if (replay) {
      queuePool = data.filter(r => replay.toPlayIds.includes(r.id));
      solvedPool = data.filter(r => replay.solvedIds.includes(r.id));
      return { queue: queuePool.map(toQuestion), initialCorrect: solvedPool.map(toQuestion) }
    }

    if (config.learnMode && context?.progress) {
      const queue = createLearningQueue(data.filter(r => r.type !== 'E'), context.progress, (r) => r.lengthKm, config.learningOptions);

      return { queue: queue.map(toQuestion), initialCorrect: [] };
    }

    queuePool = data.filter(r =>
      r.lengthKm >= config.minLength &&
      r.lengthKm <= config.maxLength &&
      config.selectedTypes.includes(r.type)
    );

    const shuffledQueue = _.shuffle(queuePool);

    return {
      queue: shuffledQueue.map(toQuestion),
      initialCorrect: solvedPool.map(toQuestion)
    };
  },

  validate: (question, input, context) => {
    if (typeof input === 'string') {
      const normInput = normalizeString(input);
      const r = question.payload;

      const matchesName =
        normInput === normalizeString(r.name) ||
        normInput === normalizeString(r.id) ||
        r.aliases.some(a => normalizeString(a) === normInput);

      if (matchesName) return true;

      if (context?.aliases) {
        const custom = context.aliases[r.id] || [];
        if (custom.some((a: string) => normalizeString(a) === normInput)) return true;
      }
      return false;
    } else {
      if (input['_overlaps']) {
        return input['_overlaps'].some((a: Road) => a.id === question.payload.id);
      }
      return input.id === question.payload.id;
    }
  },

  getScoreValue: (road) => Math.round(road.lengthKm),

  ConfigComponent: RoadConfigPanel,
  InfoCardComponent: RoadInfoCard,

  MapLayers: ({ gameState, onInteraction, config, selectedFeature }) => {
    const { history, currentQuestion, queue } = gameState;
    const mode = config.mode;

    // Prepare data for hit detection
    const allActive = useMemo(() => [
      ...queue.map(q => q.payload),
      ...history.correct.map(q => q.payload),
      ...history.wrong.map(q => q.payload)
    ], [queue, history]);

    // Cached bounds for each road
    const boundsCache = useMemo(() => {
      const map = new Map<string, SimpleBounds>();
      allActive.forEach(road => map.set(road.id, getRoadBounds(road)));
      return map;
    }, [allActive]);

    const stateRef = useRef({ gameState, config, onInteraction, allActive, boundsCache });
    useEffect(() => {
      stateRef.current = { gameState, config, onInteraction, allActive, boundsCache };
    }, [gameState, config, onInteraction, allActive, boundsCache]);

    const mapRef = useRef<L.Map | null>(null);

    // Renderer
    const roadRenderer = useMemo(() => L.canvas({ tolerance: 15 }), []);

    // Styles
    const getStyle = (type: string) => {
      const base = { weight: 3, renderer: roadRenderer, opacity: 1 };
      if (type === 'bg') return { ...base, color: '#bbbbbb', opacity: 0.8, weight: 2 };
      if (type === 'correct') return { ...base, color: '#16a34a' };
      if (type === 'wrong') return { ...base, color: '#dc2626' };
      if (type === 'current') return { ...base, color: '#2563eb' };
      if (type === 'selected') return { ...base, color: '#2563eb' };
      return base;
    };

    // Click Handling (Specific to Roads because of pixel tolerance)
    const map = useMapEvents({
      click: (e) => {
        const { onInteraction, allActive, boundsCache } = stateRef.current;

        const matches = findRoadsAtPoint(e.latlng, map, allActive, boundsCache);

        if (matches.length === 0) {
          onInteraction(null);
          return;
        }

        // Sort priority (Highways first)
        const getPriority = (t: string) => (t === 'A' ? 0 : t === 'N' ? 1 : 2);
        matches.sort((a, b) => getPriority(a.type) - getPriority(b.type));

        const top = matches[0];
        const enhancedFeature = {
          ...top,
          _overlaps: matches
        };

        onInteraction(enhancedFeature);
      },
      mousemove: _.throttle((e) => {
        const { allActive: currAllActive, boundsCache: currBoundsCache } = stateRef.current;

        mapRef.current = map;

        if (!mapRef.current) return;

        const hits = findRoadsAtPoint(e.latlng, mapRef.current, currAllActive, currBoundsCache);
        const container = mapRef.current.getContainer();

        if (hits.length > 0) {
          container.style.cursor = 'pointer';
        } else {
          container.style.cursor = ''; // Reset to default (grab)
        }
      }, 50)
    });

    // Convert to GeoJSON Format
    const toGeo = (qs: Question<Road>[]) => ({
      type: "FeatureCollection", features: qs.map(q => ({
        type: "Feature", properties: q.payload, geometry: q.payload.geometry
      }))
    });

    const bgData = useMemo(() => toGeo(queue), [queue]);
    const correctData = useMemo(() => toGeo(history.correct), [history.correct]);
    const wrongData = useMemo(() => toGeo(history.wrong), [history.wrong]);
    const lastWrongData = useMemo(() => gameState.lastWrong?.payload, [gameState.lastWrong]);
    const selectedData = useMemo(() => ({
      type: "FeatureCollection" as const,
      features: [{
        type: "Feature", properties: { id: selectedFeature?.id }, geometry: selectedFeature?.geometry
      }]
    }), [selectedFeature]);

    return (
      <>
        <GeoJSON data={bgData as any} style={getStyle('bg')} interactive={false} />
        <GeoJSON key={`c-${history.correct.length}`} data={correctData as any} style={getStyle('correct')} interactive={false} />
        <GeoJSON key={`w-${history.wrong.length}`} data={wrongData as any} style={getStyle('wrong')} interactive={false} />

        {mode === 'NAME' && currentQuestion && (
          <GeoJSON key={`curr-${currentQuestion.id}`} data={currentQuestion.payload.geometry} style={getStyle('current')} interactive={false} />
        )}

        {lastWrongData && (
          <FlashingLayer feature={lastWrongData} bold />
        )}

        {selectedFeature && (
          <GeoJSON
            key={`selected-${selectedFeature.id}`}
            data={selectedData}
            style={getStyle('selected')}
            interactive={false}
          />
        )}
      </>
    );
  }
};
