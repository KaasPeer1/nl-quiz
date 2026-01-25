import React, { useState } from 'react';
import type { City } from '../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAliasContext } from '../../../core/context/AliasContext';
import { useTranslation } from 'react-i18next';

interface Props {
  feature: City;
  onClose: () => void;
  onSelect: (feature: City) => void;
}

export const CityInfoCard: React.FC<Props> = ({ feature, onClose }) => {
  const city = feature;
  const { t } = useTranslation();
  const { aliases, addAlias, removeAlias } = useAliasContext();
  const [newAlias, setNewAlias] = useState('');

  const cityAliases = aliases[city.id] || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlias.trim()) {
      addAlias(city.id, newAlias);
      setNewAlias('');
    }
  };

  return (
    <Card className="w-72 shadow-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900">{city.name}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>
      <div className="h-1 w-12 bg-blue-500 mb-4"></div>

      {/* Stats */}
      <div className="text-sm text-gray-600 space-y-2 mb-4 border-b pb-4">
        <div className="flex justify-between">
          <span>{t('general.province')}:</span>
          <span className="font-medium text-gray-900">{city.province}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('general.population')}:</span>
          <span className="font-medium text-gray-900">{city.population.toLocaleString()}</span>
        </div>
      </div>

      {/* Aliases */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('explore.aliases')}</h4>

        {/* Built-in */}
        <div className="flex flex-wrap gap-1 mb-2">
          {city.aliases.map(a => (
            <span key={a} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
              {a}
            </span>
          ))}
          {city.aliases.length === 0 && <span className="text-xs text-gray-400 italic">{t('explore.no_aliases')}</span>}
        </div>

        {/* Custom */}
        <div className="flex flex-wrap gap-1 mb-3">
          {cityAliases.map(a => (
            <span key={a} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100 flex items-center gap-1 group">
              {a}
              <button
                onClick={() => removeAlias(city.id, a)}
                className="text-blue-400 hover:text-red-500 font-bold px-1"
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
            className="flex-1 min-w-0 text-xs border rounded px-2 py-1 outline-none focus:border-blue-500"
          />
          <Button type="submit" className="py-0 px-2 text-xs" disabled={!newAlias.trim()}>
            {t('explore.btn_add')}
          </Button>
        </form>
      </div>

      <Button variant="outline" onClick={onClose}>
        {t('explore.close')}
      </Button>
    </Card>
  );
};
