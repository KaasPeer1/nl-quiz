import { useState, useMemo, useEffect } from 'react';
import type { City, CityConfig } from '../types';
import type { GameFeature, GameLogicInterface, GameStats, ReplayOptions } from '../../../types';
import _ from 'lodash';
import { useAliasContext } from '../../../core/context/AliasContext';

export const useCityGameLogic = (
  rawData: City[],
  config: CityConfig,
  replay?: ReplayOptions,
): GameLogicInterface => {
  const { aliases: customAliases } = useAliasContext();

  const totalAreaPopulation = useMemo(() => {
    return rawData
      .filter(c => config.selectedProvinces.length === 0 || config.selectedProvinces.includes(c.province))
      .reduce((sum, c) => sum + c.population, 0);
  }, [rawData, config.selectedProvinces]);

  const activePool = useMemo(() => {
    if (replay) {
      return rawData.filter(c => replay.toPlayIds.includes(c.id));
    }
    return rawData.filter(c =>
      c.population >= config.minPopulation &&
      c.population <= config.maxPopulation &&
      (config.selectedProvinces.length === 0 || config.selectedProvinces.includes(c.province))
    );
  }, [rawData, config, replay]);

  const solvedPool = useMemo(() => {
    if (replay) {
      return rawData.filter(c => replay.solvedIds.includes(c.id));
    }
    return [];
  }, [rawData, replay]);

  const [queue, setQueue] = useState<City[]>([]);
  const [correct, setCorrect] = useState<City[]>([]);
  const [wrong, setWrong] = useState<City[]>([]);
  const [current, setCurrent] = useState<City | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [lastWrong, setLastWrong] = useState<City | null>(null);
  const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Initialization
  useEffect(() => {
    if (activePool.length === 0) {
      setGameState('FINISHED');
      return;
    }

    if (config.mode === 'EXPLORE') {
      setGameState('PLAYING');
      setCurrent(null);
      return;  // don't need queue in explore
    }

    const shuffled = _.shuffle(activePool);
    setQueue(shuffled);
    setCurrent(shuffled[0]);
    setCorrect(solvedPool);
    setWrong([]);
    setFeedback(null);
    setGameState('PLAYING');
  }, [activePool, solvedPool, config.mode]);

  const normalize = (str: string) =>
    str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("-", "");

  const advance = (retryCurrent: boolean = false) => {
    const nextQueue = retryCurrent ? queue : queue.slice(1);

    if (nextQueue.length === 0) {
      setGameState('FINISHED');
      setCurrent(null);
    } else {
      setQueue(nextQueue);
      setCurrent(nextQueue[0]);
    }
  };

  const skip = () => {
    if (queue.length === 0) return;

    const head = queue[0];
    const tail = queue.slice(1);
    setQueue([...tail, head]);
    setCurrent(tail[0]);
  }

  const handleGuess = (input: string) => {
    if (!current || config.mode !== 'NAME') return;

    const normalizedInput = normalize(input);
    const normalizedName = normalize(current.name);
    const userAliases = customAliases[current.id] || [];

    const isCorrect =
      normalizedInput === normalizedName ||
      current.aliases.some(a => normalize(a) === normalizedInput) ||
      userAliases.some(a => normalize(a) === normalizedInput);

    if (isCorrect) {
      setFeedback('CORRECT');
      setCorrect(prev => [...prev, current]);
      advance();
      setTimeout(() => setFeedback(null), 500);
    } else if (normalizedInput === '?') {
      giveUp();
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const handleMapClick = (feature: GameFeature) => {
    const cityFeature = feature as City;

    if (selectedCity && selectedCity.id === cityFeature.id) {
      setSelectedCity(null);
      return;
    }

    if (config.mode === 'EXPLORE') {
      setSelectedCity(cityFeature);
      return;
    }

    const isAlreadyDone =
      correct.some(c => c.id === cityFeature.id) ||
      wrong.some(c => c.id === cityFeature.id)

    if (isAlreadyDone) {
      setSelectedCity(cityFeature);
      return;
    }

    setSelectedCity(null);

    if (config.mode === 'POINT') {
      if (!current) return;

      if (cityFeature.id === current.id) {
        setFeedback('CORRECT');
        setCorrect(prev => [...prev, current]);
        setLastWrong(null);
        advance();
        setTimeout(() => setFeedback(null), 500);
      } else {
        setFeedback('WRONG');
        setWrong(prev => [...prev, current]);
        setLastWrong(current); // Show where it actually was
        advance();
        setTimeout(() => setFeedback(null), 500);
      }
    }
  };

  const giveUp = () => {
    if (!current) return;
    setWrong(prev => [...prev, current]);
    setLastWrong(current);
    advance();
  };

  const sessionCorrectCount = correct.length - solvedPool.length;
  const sessionScore = useMemo(() => correct.reduce((sum, c) => sum + c.population, 0), [correct]);

  const stats: GameStats = {
    correct: sessionCorrectCount,
    wrong: wrong.length,
    remaining: queue.length,
    score: sessionScore,
    totalAreaPopulation: totalAreaPopulation,
  };

  return {
    gameState,
    currentStep: current,
    selectedFeature: selectedCity,
    feedback,
    stats,
    actions: {
      handleGuess,
      handleMapClick,
      skip: skip,
      giveUp,
      clearSelection: () => setSelectedCity(null),
    },
    layerData: {
      targets: [...activePool, ...solvedPool],
      correct,
      wrong,
      lastWrong,
    },
    meta: {
      mode: config.mode,
    }
  };
};
