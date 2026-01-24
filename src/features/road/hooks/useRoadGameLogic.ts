import { useState, useMemo, useEffect } from 'react';
import { type Road, type RoadConfig } from '../types';
import { type GameLogicInterface, type GameFeature, type GameStats, type ReplayOptions } from '../../../types';
import _ from 'lodash';
import { useAliasContext } from '../../../core/context/AliasContext';

export const useRoadGameLogic = (rawData: Road[], config: RoadConfig, replay?: ReplayOptions): GameLogicInterface => {
  const { aliases: customAliases } = useAliasContext();

  const activePool = useMemo(() => {
    if (replay) return rawData.filter(r => replay.toPlayIds.includes(r.id));

    return rawData.filter(r =>
      r.lengthKm >= config.minLength &&
      r.lengthKm <= config.maxLength &&
      config.selectedTypes.includes(r.type)
    );
  }, [rawData, config, replay]);

  const solvedPool = useMemo(() => {
    if (replay) return rawData.filter(r => replay.solvedIds.includes(r.id));
    return [];
  }, [rawData, replay]);

  const [queue, setQueue] = useState<Road[]>([]);
  const [correct, setCorrect] = useState<Road[]>([]);
  const [wrong, setWrong] = useState<Road[]>([]);
  const [current, setCurrent] = useState<Road | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [lastWrong, setLastWrong] = useState<Road | null>(null);
  const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null);

  useEffect(() => {
    if (activePool.length === 0) { setGameState('FINISHED'); return; }
    if (config.mode === 'EXPLORE') { setGameState('PLAYING'); setCurrent(null); return; }

    const shuffled = _.shuffle(activePool);
    setQueue(shuffled);
    setCurrent(shuffled[0]);
    setCorrect(solvedPool); setWrong([]); setFeedback(null); setSelectedRoad(null); setGameState('PLAYING');
  }, [activePool, solvedPool, config.mode]);

  const advance = (retry: boolean = false) => {
    const next = retry ? queue : queue.slice(1);
    if (next.length === 0) { setGameState('FINISHED'); setCurrent(null); }
    else { setQueue(next); setCurrent(next[0]); }
  };

  const skip = () => {
    if (queue.length === 0) return;

    const head = queue[0];
    const tail = queue.slice(1);
    setQueue([...tail, head]);
    setCurrent(tail[0]);
  }

  const normalize = (str: string) => str.toLowerCase().replace(/[\s-]/g, "");

  const handleGuess = (input: string) => {
    if (!current || config.mode !== 'NAME') return;
    const normInput = normalize(input);
    const isCorrect =
      normInput === normalize(current.name) ||
      normInput === normalize(current.label) || // Check short label (A1)
      current.aliases.some(a => normalize(a) === normInput) ||
      (customAliases[current.id] || []).some(a => normalize(a) === normInput);

    if (isCorrect) {
      setFeedback('CORRECT'); setCorrect(p => [...p, current]); advance(); setTimeout(() => setFeedback(null), 500);
    } else if (input === '?') {
      giveUp();
    } else {
      setFeedback('WRONG'); setTimeout(() => setFeedback(null), 500);
    }
  };

  const handleMapClick = (feature: GameFeature) => {
    const road = feature as Road;
    if (selectedRoad?.id === road.id) { setSelectedRoad(null); return; }
    if (config.mode === 'EXPLORE') { setSelectedRoad(road); return; }

    if (correct.some(r => r.id === road.id) || wrong.some(r => r.id === road.id)) {
      setSelectedRoad(road); return;
    }

    const isAlreadyDone =
      correct.some(c => c.id === road.id) ||
      wrong.some(c => c.id === road.id)

    if (isAlreadyDone) {
      setSelectedRoad(road);
      return;
    }

    setSelectedRoad(null);

    if (config.mode === 'POINT') {
      if (!current) return;
      if (road.id === current.id) {
        setFeedback('CORRECT'); setCorrect(p => [...p, current]); setLastWrong(null); advance(); setTimeout(() => setFeedback(null), 500);
      } else {
        setFeedback('WRONG'); setWrong(p => [...p, current]); setLastWrong(current); advance(); setTimeout(() => setFeedback(null), 500);
      }
    }
  };

  const giveUp = () => {
    if (!current) return;
    setWrong(p => [...p, current]); setLastWrong(current); advance();
  };

  const sessionScore = Math.round(correct.reduce((sum, r) => sum + r.lengthKm, 0)) - Math.round(solvedPool.reduce((sum, r) => sum + r.lengthKm, 0));

  // Stats Logic: Score based on Length (km) makes more sense than Population for roads
  const stats: GameStats = {
    correct: correct.length - solvedPool.length,
    wrong: wrong.length,
    remaining: queue.length,
    score: sessionScore,
    totalAreaPopulation: Math.round(rawData.reduce((sum, r) => sum + r.lengthKm, 0)) // Total km in DB
  };

  return {
    gameState, currentStep: current, selectedFeature: selectedRoad, feedback, stats,
    actions: { handleGuess, handleMapClick, skip: skip, giveUp, clearSelection: () => setSelectedRoad(null) },
    layerData: { targets: [...activePool, ...solvedPool], correct, wrong, lastWrong },
    meta: { mode: config.mode }
  };
};
