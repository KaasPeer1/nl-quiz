import React from 'react';
import { type Road, type RoadConfig } from '../types';
import { Button } from '../../../components/ui/Button';
import { RangeSlider } from '../../../components/ui/RangeSlider';
import { useTranslation } from 'react-i18next';
import { useProgress } from '../../../core/context/ProgressContext';
import { LearningSettingsControl } from '../../../components/config/LearningSettingsControl';

export const RoadConfigPanel: React.FC<{
  config: RoadConfig;
  onChange: (c: RoadConfig) => void;
  data: Road[];
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  const { resetProgress } = useProgress();

  const toggleType = (type: 'A' | 'N' | 'E') => {
    const current = config.selectedTypes;
    if (current.includes(type)) {
      onChange({ ...config, selectedTypes: current.filter(t => t !== type) });
    } else {
      onChange({ ...config, selectedTypes: [...current, type] });
    }
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

      {/* Mode Selector */}
      <div>
        <h3 className="font-semibold mb-2">{t('menu.mode_select')}</h3>
        <div className="flex gap-2">
          <Button variant={config.mode === 'POINT' ? 'primary' : 'outline'} onClick={() => onChange({ ...config, mode: 'POINT' })} className="flex-1">{t('menu.mode_point')}</Button>
          <Button variant={config.mode === 'NAME' ? 'primary' : 'outline'} onClick={() => onChange({ ...config, mode: 'NAME' })} className="flex-1">{t('menu.mode_name')}</Button>
          {!config.learnMode && (<Button variant={config.mode === 'EXPLORE' ? 'secondary' : 'outline'} onClick={() => onChange({ ...config, mode: 'EXPLORE' })} className="flex-1">{t('menu.btn_explore')}</Button>)}
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
          {/* Road Type Filter */}
          <div>
            <h3 className="font-semibold mb-2">{t('menu.modes.road.type_filter')}</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.selectedTypes.includes('A')} onChange={() => toggleType('A')} className="w-5 h-5 accent-blue-600" />
                <span className="font-bold text-red-600 bg-red-100 px-2 rounded border border-red-200">{t('menu.modes.road.type.highway')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.selectedTypes.includes('N')} onChange={() => toggleType('N')} className="w-5 h-5 accent-blue-600" />
                <span className="font-bold text-yellow-600 bg-yellow-100 px-2 rounded border border-yellow-200">{t('menu.modes.road.type.provincial')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.selectedTypes.includes('E')} onChange={() => toggleType('E')} className="w-5 h-5 accent-blue-600" />
                <span className="font-bold text-teal-600 bg-teal-100 px-2 rounded border border-teal-200">{t('menu.modes.road.type.european')}</span>
              </label>
            </div>
          </div>

          {/* Length Slider */}
          <div>
            <h3 className="font-semibold mb-2">{t('menu.modes.road.length_filter')}</h3>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm w-12 text-right">{config.minLength}km</span>
              <RangeSlider
                min={0} max={300}
                value={[config.minLength, config.maxLength]}
                onChange={([min, max]) => onChange({ ...config, minLength: min, maxLength: max })}
              />
              <span className="font-mono text-sm w-12">{config.maxLength === 200 ? '200+' : `${config.maxLength}km`}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
