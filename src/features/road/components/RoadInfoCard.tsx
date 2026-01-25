import React, { useEffect, useState } from 'react';
import { type Road } from '../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAliasContext } from '../../../core/context/AliasContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface Props {
  feature: Road;
  onClose: () => void;
  onSelect: (feature: Road) => void;
}

interface EnhancedRoad extends Road {
  _overlaps?: Road[];
}

export const RoadInfoCard: React.FC<Props> = ({ feature, onClose, onSelect }) => {
  const [activeRoad, setActiveRoad] = useState<EnhancedRoad>(feature as EnhancedRoad);

  useEffect(() => setActiveRoad(feature as EnhancedRoad), [feature]);

  const { t } = useTranslation();
  const { aliases, addAlias, removeAlias } = useAliasContext();
  const [newAlias, setNewAlias] = useState('');

  const road = activeRoad;
  const overlaps = feature['_overlaps'] as Road[] || [];
  const roadAliases = aliases[road.id] || [];

  const handleSwitch = (target: Road, keepSame: boolean = false) => {
    if (keepSame && target.id === activeRoad.id) return;
    const preservedFeature = {
      ...target,
      _overlaps: overlaps
    };
    onSelect(preservedFeature);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlias.trim()) {
      addAlias(road.id, newAlias);
      setNewAlias('');
    }
  };

  let typeLabel;
  let typeColorClass;
  let barColorClass;
  switch (road.type) {
    case 'A':
      typeLabel = t('explore.road.highway');
      typeColorClass = 'bg-red-100 text-red-800 border-red-200';
      barColorClass = 'bg-red-500';
      break;
    case 'N':
      typeLabel = t('explore.road.provincial');
      typeColorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      barColorClass = 'bg-yellow-500';
      break;
    case 'S':
      typeLabel = t('explore.road.city');
      typeColorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      barColorClass = 'bg-blue-500';
      break;
    case 'E':
      typeLabel = t('explore.road.european');
      typeColorClass = 'bg-teal-100 text-teal-800 border-teal-200';
      barColorClass = 'bg-teal-500';
      break;
  }

  return (
    <Card className="w-80 shadow-xl animate-in fade-in zoom-in-95 duration-200">
      {/* OVERLAP SELECTOR */}
      {overlaps.length > 1 && (
        <div className="mb-3 border-b pb-2 flex items-center gap-2">

          <div className="flex-1 flex gap-1 overflow-x-auto min-w-0">
            {overlaps.map(ov => (
              <button
                key={ov.id}
                onClick={() => handleSwitch(ov, true)}
                className={clsx(
                  "px-2 py-1 text-xs font-bold rounded border transition-colors whitespace-nowrap shrink-0",
                  ov.id === activeRoad.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                )}
              >
                {ov.name}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-xl font-bold px-1"
            title="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col items-start gap-1">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">{road.name}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${typeColorClass}`}>
            {typeLabel}
          </span>
        </div>
        {overlaps.length <= 1 && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold px-1">×</button>
        )}
      </div>

      <div className={`h-1 w-full rounded-full mb-4 ${barColorClass}`}></div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4 border-b pb-4">
        <div className="font-semibold text-gray-500">{t('menu.modes.road.length_filter')}:</div>
        <div className="text-right font-medium text-gray-900">{Math.round(road.lengthKm)} km</div>
      </div>

      {/* Aliases */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('explore.aliases')}</h4>

        {/* Built-in */}
        <div className="flex flex-wrap gap-1 mb-2">
          {road.aliases.map(a => (
            <span key={a} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
              {a}
            </span>
          ))}
          {road.aliases.length === 0 && <span className="text-xs text-gray-400 italic">{t('explore.no_aliases')}</span>}
        </div>

        {/* Custom */}
        <div className="flex flex-wrap gap-1 mb-3">
          {roadAliases.map(a => (
            <span key={a} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100 flex items-center gap-1 group">
              {a}
              <button
                onClick={() => removeAlias(road.id, a)}
                className="ml-1 text-blue-300 hover:text-red-500 font-bold focus:outline-none"
              >×</button>
            </span>
          ))}
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newAlias}
            onChange={e => setNewAlias(e.target.value)}
            placeholder={t('explore.add_placeholder')}
            className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500 transition-colors"
          />
          <Button type="submit" className="py-0 px-3 text-xs" disabled={!newAlias.trim()}>
            {t('explore.btn_add')}
          </Button>
        </form>
      </div>
    </Card>
  );
};
