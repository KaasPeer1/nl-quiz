import React from 'react';
import type { LearningMixOptions } from '../../core/types/learning';
import { SimpleSlider } from '../ui/RangeSlider'; // <--- Import the new component
import { Card } from '../ui/Card';
import { useTranslation } from 'react-i18next';

interface Props {
  options: LearningMixOptions;
  onChange: (opt: LearningMixOptions) => void;
}

export const LearningSettingsControl: React.FC<Props> = ({ options, onChange }) => {
  const { t } = useTranslation();

  const setNew = (val: number) => {
    const max = 100 - Math.round(options.activeRatio * 100);
    const safeVal = Math.min(val, max);
    onChange({ ...options, newRatio: safeVal / 100 });
  };

  const setActive = (val: number) => {
    const max = 100 - Math.round(options.newRatio * 100);
    const safeVal = Math.min(val, max);
    onChange({ ...options, activeRatio: safeVal / 100 });
  };

  const maxActive = options.maxActive ?? options.batchSize * 3;
  const newPct = Math.round(options.newRatio * 100);
  const activePct = Math.round(options.activeRatio * 100);
  const reviewPct = 100 - newPct - activePct;

  return (
    <Card className="!p-4 bg-gray-50 border border-gray-200 shadow-none">
      <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">{t('menu.learn_mode.config.title')}</h4>

      {/* Batch Size */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{t('menu.learn_mode.config.q_per_r')}</span>
          <span className="font-mono font-bold">{options.batchSize}</span>
        </div>
        <SimpleSlider
          min={5} max={50} step={5}
          value={options.batchSize}
          onChange={(val) => onChange({ ...options, batchSize: val, maxActive: val * 3 })}
        />
      </div>

      {/* Ratios */}
      <div className="mb-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-600 font-semibold">{t('menu.learn_mode.config.new_ratio', { "maxActive": maxActive })}</span>
            <span className="font-mono">{newPct}%</span>
          </div>
          <SimpleSlider
            min={0} max={100} step={5}
            value={newPct}
            onChange={setNew}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-orange-600 font-semibold">{t('menu.learn_mode.config.active_ratio')}</span>
            <span className="font-mono">{activePct}%</span>
          </div>
          <SimpleSlider
            min={0} max={100} step={5}
            value={activePct}
            onChange={setActive}
          />
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
          <span className="text-green-600 font-semibold">{t('menu.learn_mode.config.review_ratio')}</span>
          <span className="font-mono">{reviewPct}%</span>
        </div>
      </div>
    </Card>
  );
};
