import React, { useMemo } from 'react';
import type { City, CityConfig } from '../types';
import { Button } from '../../../components/ui/Button';
import { RangeSlider } from '../../../components/ui/RangeSlider';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useProgress } from '../../../core/context/ProgressContext';
import { LearningSettingsControl } from '../../../components/config/LearningSettingsControl';

// Helpers for the logarithmic slider
const toSlider = (val: number) => {
  if (val < 10000) return Math.round(val / 100);
  if (val < 100000) return 100 + Math.round(Math.log10(val / 10000) * 100);
  return 200 + Math.round(Math.log10(val / 100000) * 100);
};
const fromSlider = (val: number) => {
  if (val <= 100) return Math.round(val * 100);
  if (val <= 200) return Math.round(10000 * Math.pow(10, (val - 100) / 100));
  return Math.round(100000 * Math.pow(10, (val - 200) / 100));
};

export const CityConfigPanel: React.FC<{
  config: CityConfig;
  onChange: (c: CityConfig) => void;
  data: City[];
}> = ({ config, onChange, data }) => {
  const { t } = useTranslation();
  const { resetProgress } = useProgress();

  const provinces = useMemo(() => Array.from(new Set(data.map(c => c.province))).sort(), [data]);

  const toggleProv = (p: string) => {
    const current = config.selectedProvinces;
    if (current.includes(p)) onChange({ ...config, selectedProvinces: current.filter(x => x !== p) });
    else onChange({ ...config, selectedProvinces: [...current, p] });
  };

  const toggleAll = () => {
    if (config.selectedProvinces.length === provinces.length) onChange({ ...config, selectedProvinces: [] });
    else onChange({ ...config, selectedProvinces: provinces });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Learning Mode Toggle */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.learnMode}
            onChange={(e) => onChange({ ...config, learnMode: e.target.checked })}
            className="w-5 h-5 accent-blue-600"
          />
          <div>
            <span className="font-bold text-blue-900 block">{t('menu.learn_mode.title')}</span>
            <span className="text-xs text-blue-700">{t('menu.learn_mode.description')}</span>
          </div>
        </label>

        {config.learnMode && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <Button variant="danger" size="small" onClick={resetProgress}>
              {t('menu.learn_mode.btn_reset')}
            </Button>
          </div>
        )}
      </div>

      {/* Game Mode Selector */}
      <div>
        <h3 className="font-semibold mb-2">{t('menu.mode_select')}</h3>
        <div className="flex gap-2">
          <Button
            variant={config.mode === 'POINT' ? 'primary' : 'outline'}
            onClick={() => onChange({ ...config, mode: 'POINT' })}
            className="flex-1"
          >
            {t('menu.mode_point')}
          </Button>
          <Button
            variant={config.mode === 'NAME' ? 'primary' : 'outline'}
            onClick={() => onChange({ ...config, mode: 'NAME' })}
            className="flex-1"
          >
            {t('menu.mode_name')}
          </Button>
          {!config.learnMode && (
            <Button
              variant={config.mode === 'EXPLORE' ? 'secondary' : 'secondaryOutline'}
              onClick={() => onChange({ ...config, mode: 'EXPLORE' })}
              className="flex-1"
            >
              {t('menu.btn_explore')}
            </Button>
          )}
        </div>
      </div>

      {config.learnMode ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <LearningSettingsControl
            options={config.learningOptions}
            onChange={(opt) => onChange({ ...config, learningOptions: opt })}
          />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Filters are disabled. Questions are selected based on your progress and the mix settings above.
          </p>
        </div>
      ) : (
        <>
          {/* Population */}
          <div>
            <h3 className="font-semibold mb-2">{t('menu.pop_range')}</h3>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm w-16 text-right">{config.minPopulation > 1000 ? `${config.minPopulation / 1000}k` : config.minPopulation}</span>
              <RangeSlider
                min={0} max={300}
                value={[toSlider(config.minPopulation), toSlider(config.maxPopulation)]}
                onChange={([min, max]) => onChange({ ...config, minPopulation: fromSlider(min), maxPopulation: fromSlider(max) })}
              />
              <span className="font-mono text-sm w-16">{config.maxPopulation > 1000000 ? '1M+' : `${config.maxPopulation / 1000}k`}</span>
            </div>
          </div>

          {/* Provinces */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-semibold">{t('menu.provinces')}</h3>
              <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                {config.selectedProvinces.length === provinces.length ? t('menu.clear_all') : t('menu.select_all')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {provinces.map(p => (
                <button
                  key={p}
                  onClick={() => toggleProv(p)}
                  className={clsx(
                    "text-xs py-1 px-2 rounded border transition-colors",
                    config.selectedProvinces.includes(p) ? "bg-blue-100 border-blue-400 text-blue-800" : "bg-gray-50 text-gray-400"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
