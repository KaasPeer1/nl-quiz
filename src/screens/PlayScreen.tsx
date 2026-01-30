import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../core/context/AppContext';
import { useProgress } from '../core/context/ProgressContext';
import { useQuizEngine } from '../core/engine/useQuizEngine';
import { GameMap } from '../components/map/GameMap';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAliasContext } from '../core/context/AliasContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { GameFeature } from '../core/types';

export const PlayScreen = () => {
  const { t } = useTranslation();
  const {
    activeAdapter, config, data,
    setScreen, setLastGameResult, replayOptions, clearReplay
  } = useApp();
  const { aliases } = useAliasContext();
  const { progress, updateProgress } = useProgress();

  const [inputValue, setInputValue] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<GameFeature | null>(null);

  // Generate Questions
  const { queue, initialCorrect } = useMemo(() => {
    const currentDataset = activeAdapter.id === 'city-quiz' ? data.cities : data.roads;
    return activeAdapter.generateQuestions(currentDataset, config, replayOptions || undefined, { progress });
  }, [activeAdapter, data, config, replayOptions, progress]);

  // Initialize Engine
  const { state, actions } = useQuizEngine({
    questions: queue,
    initialCorrect: initialCorrect,
    scoreCalculator: activeAdapter.getScoreValue
  });

  const hasSavedRef = useRef(false);

  // Handle End Game
  useEffect(() => {
    if (state.status === 'FINISHED' && !hasSavedRef.current) {
      hasSavedRef.current = true;

      const correctIds = state.history.correct.map(q => q.payload.id);
      const wrongIds = state.history.wrong.map(q => q.payload.id);

      if (config.learnMode && (correctIds.length > 0 || wrongIds.length > 0)) {
        updateProgress(correctIds, wrongIds);
      }

      setLastGameResult({
        stats: state.stats,
        history: state.history,
      });
      setScreen('RESULTS');
    }
  }, [state.status, state.history, state.stats, config.learnMode, updateProgress, setLastGameResult, setScreen]);

  // Interactions
  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentQuestion) return;

    const isCorrect = activeAdapter.validate(state.currentQuestion, inputValue, { aliases });

    actions.submitAnswer(isCorrect);
    setInputValue('');
  };

  const handleMapClick = (feature: GameFeature | null) => {
    if (!feature) {
      if (selectedFeature) setSelectedFeature(null);
      return
    }

    if (selectedFeature?.id === feature.id) { //  || (selectedFeature && feature['_overlaps'] && feature['_overlaps'].some((f: GameFeature) => f.id === selectedFeature.id))
      setSelectedFeature(null);
      return;
    }

    if (config.mode === 'POINT' && state.currentQuestion && activeAdapter.validate(state.currentQuestion, feature)) {
      actions.submitAnswer(true);
      return;
    }

    const correctMatch = state.history.correct.find(q => q.payload.id === feature.id || (feature['_overlaps'] && feature['_overlaps'].some((f: GameFeature) => q.payload.id === f.id)));
    const wrongMatch = state.history.wrong.find(q => q.payload.id === feature.id || (feature['_overlaps'] && feature['_overlaps'].some((f: GameFeature) => q.payload.id === f.id)));

    if (config.mode === 'EXPLORE' || correctMatch || wrongMatch) {
      if (correctMatch) {
        setSelectedFeature(correctMatch.payload);
        return;
      } else if (wrongMatch) {
        setSelectedFeature(wrongMatch.payload);
        return;
      }
      setSelectedFeature(feature);
      return;
    }

    // Gameplay Logic
    if (config.mode === 'POINT' && state.currentQuestion) {
      const isCorrect = activeAdapter.validate(state.currentQuestion, feature);
      actions.submitAnswer(isCorrect);
    }
  };

  const InfoCard = activeAdapter.InfoCardComponent;
  const isExplore = config.mode === 'EXPLORE';

  return (
    <div className="h-screen w-screen relative flex flex-col">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center z-10 shadow-sm">
        <div className="font-bold text-blue-900 cursor-pointer" onClick={() => setScreen('MENU')}>
          {t('header.title')}
        </div>
        {!isExplore && (
          <div className="flex gap-4 text-sm font-mono">
            <span>{t('header.remaining')}: {state.stats.remaining}</span>
            <span className="text-red-600">{t('header.wrong')}: {state.stats.wrongCount}</span>
            <span className="text-green-600">{t('header.correct')}: {state.stats.correctCount}</span>
          </div>
        )}
        <Button variant="ghost" onClick={() => { clearReplay(); setScreen('MENU'); }}>{t('header.quit')}</Button>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative">
        <GameMap>
          <activeAdapter.MapLayers
            gameState={state}
            onInteraction={handleMapClick}
            config={config}
            selectedFeature={selectedFeature}
          />
        </GameMap>

        {/* INFO CARD */}
        {selectedFeature && InfoCard && (
          <div className="absolute top-4 right-4 z-[1000]">
            <InfoCard
              feature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onSelect={handleMapClick}
            />
          </div>
        )}

        {/* INPUT CARD */}
        {!isExplore && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[1000]">
            <Card className="pointer-events-auto w-full max-w-md p-4 animate-in slide-in-from-bottom-4">
              {/* Feedback Overlay */}
              {state.feedback === 'CORRECT' && <div className="absolute -top-12 left-0 right-0 text-center text-4xl font-bold text-green-600 animate-bounce shadow-text">{t('game.feedback.correct')}</div>}
              {state.feedback === 'WRONG' && <div className="absolute -top-12 left-0 right-0 text-center text-4xl font-bold text-red-600 animate-shake shadow-text">{t('game.feedback.wrong')}</div>}

              {config.mode === 'NAME' ? (
                <form onSubmit={handleSubmitText} className="flex gap-2">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={t('game.placeholder')}
                    className={clsx(
                      "flex-1 border-2 rounded px-4 py-2 outline-none transition-colors",
                      state.feedback === 'WRONG' ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                    )}
                  />
                  <Button type="submit">{t('game.btn_guess')}</Button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="text-xs uppercase font-bold text-gray-500">{t('menu.mode_point')}</div>
                  <div className="text-2xl font-bold text-blue-900">{state.currentQuestion?.prompt}</div>
                </div>
              )}

              <div className="flex justify-between mt-2 text-sm">
                <button onClick={actions.skip} className="text-gray-400 hover:text-gray-600 underline">{t('game.btn_skip')}</button>
                <button onClick={actions.giveUp} className="text-red-300 hover:text-red-500 underline">{t('game.btn_giveup')}</button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
