import React, { useState, useEffect } from 'react';
import { useApp } from '../core/context/AppContext';
import { GameMap } from '../components/map/GameMap';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const PlayScreen = () => {
  const { t } = useTranslation();
  const { activeMode, config, data, setScreen, setLastGameResult, replayOptions, clearReplay } = useApp();
  const [inputValue, setInputValue] = useState('');

  // Instantiate the logic for the specific mode
  const game = activeMode.useGameLogic(data, config, replayOptions || undefined);
  const InfoCard = activeMode.InfoCardComponent;

  // Watch for Game Over
  useEffect(() => {
    if (game.gameState === 'FINISHED') {
      setLastGameResult({
        stats: game.stats,
        targets: game.layerData.targets,
        correct: game.layerData.correct,
        wrong: game.layerData.wrong,
      });
      setScreen('RESULTS');
    }
  }, [game.gameState, game.stats, game.layerData, setLastGameResult, setScreen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    game.actions.handleGuess(inputValue);
    setInputValue('');
  };

  const handleHome = () => {
    clearReplay(); // Clear replay state so next game is fresh
    setScreen('MENU');
  };

  return (
    <div className="h-screen w-screen relative flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            onClick={handleHome}
            className="font-bold text-blue-900 cursor-pointer hover:text-blue-700 transition-colors select-none"
            title={t('header.quit')}
          >
            {t('header.title')}
          </div>
        </div>

        {config.mode !== 'EXPLORE' && (
          <div className="flex gap-4 text-sm font-mono">
            <span>{t('header.remaining')}: {game.stats.remaining}</span>
            <span className="text-red-600">{t('header.wrong')}: {game.stats.wrong}</span>
            <span className="text-green-600">{t('header.correct')}: {game.stats.correct}</span>
          </div>
        )}

        <Button variant="ghost" onClick={handleHome}>{t('header.quit')}</Button>
      </div>

      <div className="flex-1 relative">
        <GameMap>
          <activeMode.MapLayers logic={game} onFeatureClick={game.actions.handleMapClick} />
        </GameMap>

        {/* Info Card Overlay */}
        {game.selectedFeature && InfoCard && (
          <div className="absolute top-4 right-4 z-[1000]">
            <InfoCard
              feature={game.selectedFeature}
              onClose={game.actions.clearSelection}
              onSelect={game.actions.handleMapClick}
            />
          </div>
        )}

        {config.mode !== 'EXPLORE' && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[1000]">
            <Card className="pointer-events-auto w-full max-w-md p-4 animate-in slide-in-from-bottom-4">
              {game.feedback === 'CORRECT' && <div className="absolute -top-12 left-0 right-0 text-center text-4xl font-bold text-green-600 animate-bounce shadow-text">{t('game.feedback.correct')}</div>}
              {game.feedback === 'WRONG' && <div className="absolute -top-12 left-0 right-0 text-center text-4xl font-bold text-red-600 animate-shake shadow-text">{t('game.feedback.wrong')}</div>}

              {config.mode === 'NAME' ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={t('game.placeholder')}
                    className={clsx(
                      "flex-1 border-2 rounded px-4 py-2 outline-none transition-colors",
                      game.feedback === 'WRONG' ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                    )}
                  />
                  <Button type="submit">{t('game.btn_guess')}</Button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="text-xs uppercase font-bold text-gray-500">{t('menu.mode_point')}</div>
                  <div className="text-2xl font-bold text-blue-900">{game.currentStep?.name}</div>
                </div>
              )}

              <div className="flex justify-between mt-2 text-sm">
                <button onClick={game.actions.skip} className="text-gray-400 hover:text-gray-600 underline">{t('game.btn_skip')}</button>
                <button onClick={game.actions.giveUp} className="text-red-300 hover:text-red-500 underline">{t('game.btn_giveup')}</button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
