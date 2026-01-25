import { useApp } from '../core/context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GameMap } from '../components/map/GameMap';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { QuizState } from '../core/types';
import type { GameFeature } from '../core/types';

export const ResultScreen = () => {
  const { t } = useTranslation();
  const { setScreen, startReplay, startNewGame, lastGameResult, clearReplay, activeAdapter, config } = useApp();
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  if (!lastGameResult) {
    setScreen('MENU');
    return null;
  }

  const { stats, history } = lastGameResult;

  const handleMenu = () => {
    clearReplay();
    setScreen('MENU');
  };

  // Construct a dummy state to reuse the MapLayers component
  // This ensures the result map looks exactly like the game map
  const resultState: QuizState<any> = {
    status: 'FINISHED',
    queue: [],
    currentQuestion: null,
    lastWrong: null,
    history: history,
    feedback: null,
    score: 0,
    stats: stats
  };

  const handleMapClick = (feature: GameFeature | null) => {
    if (!feature) {
      if (selectedFeature) setSelectedFeature(null);
      return
    }

    if (selectedFeature?.id === feature.id) {
      setSelectedFeature(null);
      return;
    }

    setSelectedFeature(feature);
  };

  return (
    <div className="h-screen w-screen relative flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center z-10 shadow-sm">
        <div className="font-bold text-blue-900">{t('header.title')}</div>
        <Button size="small" variant="ghost" onClick={handleMenu}>{t('finish.btn_menu')}</Button>
      </div>

      <div className="flex-1 relative">
        <GameMap>
          <activeAdapter.MapLayers
            gameState={resultState}
            onInteraction={handleMapClick}
            config={config}
            selectedFeature={selectedFeature}
          />
        </GameMap>

        {selectedFeature && activeAdapter.InfoCardComponent && (
          <div className="absolute top-4 right-4 z-[1000]">
            <activeAdapter.InfoCardComponent
              feature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onSelect={handleMapClick}
            />
          </div>
        )}

        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[1000]">
          <Card className="pointer-events-auto w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-900">{t('finish.title')}</h2>

            <div className="flex justify-center gap-8 mb-6 border-b pb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.correctCount}</div>
                <div className="text-xs text-gray-400 uppercase font-bold">{t('header.correct')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.wrongCount}</div>
                <div className="text-xs text-gray-400 uppercase font-bold">{t('finish.stat_incorrect')}</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={startReplay} variant="danger" fullWidth disabled={stats.wrongCount === 0}>
                {t('finish.btn_replay')}
              </Button>
              <Button onClick={startNewGame} variant="primary" fullWidth>
                {t('finish.btn_start')}
              </Button>
              <Button onClick={handleMenu} variant="outline" fullWidth>
                {t('finish.btn_menu')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
