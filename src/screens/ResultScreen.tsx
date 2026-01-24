import { useApp } from '../core/context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GameMap } from '../components/map/GameMap';
import { useTranslation } from 'react-i18next';
import type { GameLogicInterface } from '../types';
import { type GameFeature } from '../types';
import { useState } from 'react';

export const ResultScreen = () => {
  const { t } = useTranslation();
  const { setScreen, startReplay, lastGameResult, clearReplay, activeMode } = useApp();

  const [selectedFeature, setSelectedFeature] = useState<GameFeature | null>(null);

  if (!lastGameResult) {
    // Fallback if accessed directly without a game
    setScreen('MENU');
    return null;
  }

  const { stats, correct, wrong, targets } = lastGameResult;

  const handleMenu = () => {
    clearReplay();
    setScreen('MENU');
  };

  const mockGameLogic: GameLogicInterface = {
    gameState: 'FINISHED',
    currentStep: null,
    selectedFeature: selectedFeature,
    feedback: null,
    stats: stats,
    layerData: {
      targets: targets,
      correct: correct,
      wrong: wrong,
      lastWrong: null
    },
    actions: {
      // Clicking map items just selects them for the InfoCard
      handleMapClick: (f) => setSelectedFeature(f),
      clearSelection: () => setSelectedFeature(null),
      // No-ops
      handleGuess: () => { },
      skip: () => { },
      giveUp: () => { },
    },
    meta: {
      mode: 'EXPLORE'
    }
  };

  const InfoCard = activeMode.InfoCardComponent;
  const isCityMode = activeMode.id === 'city-quiz';

  const percentage = (isCityMode && stats.totalAreaPopulation > 0)
    ? ((stats.score / stats.totalAreaPopulation) * 100)
    : 0;

  return (
    <div className="h-screen w-screen relative flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center z-10 shadow-sm">
        <div
          onClick={handleMenu}
          className="font-bold text-blue-900 cursor-pointer hover:text-blue-700 transition-colors select-none"
        >
          {t('header.title')}
        </div>
        <Button size="small" variant="ghost" onClick={handleMenu}>{t('finish.btn_menu')}</Button>
      </div>

      <div className="flex-1 relative">
        <GameMap center={[52.1326, 5.2913]} zoom={8}>
          <activeMode.MapLayers
            logic={mockGameLogic}
            onFeatureClick={mockGameLogic.actions.handleMapClick}
          />
        </GameMap>

        {selectedFeature && InfoCard && (
          <div className="absolute top-4 right-4 z-[1000]">
            <InfoCard
              feature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onSelect={setSelectedFeature}
            />
          </div>
        )}

        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[1000]">
          <Card className="pointer-events-auto w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 shadow-2xl">

            <h2 className="text-2xl font-bold mb-4 text-center text-blue-900">{t('finish.title')}</h2>

            {isCityMode && (
              <div className="mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">{t('finish.coverage_title')}</span>
                  <span className="text-2xl font-bold text-blue-600">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  <span dangerouslySetInnerHTML={{
                    __html: t('finish.coverage_text', {
                      correct: stats.score.toLocaleString(),
                      total: stats.totalAreaPopulation.toLocaleString()
                    })
                  }} />
                </p>
              </div>
            )}

            <div className="flex justify-center gap-8 mb-6 border-b pb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-xs text-gray-400 uppercase font-bold">{t('header.correct')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.wrong}</div>
                <div className="text-xs text-gray-400 uppercase font-bold">{t('finish.stat_incorrect')}</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={startReplay}
                variant="danger"
                fullWidth
                disabled={stats.wrong === 0}
              >
                {t('finish.btn_replay')}
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
