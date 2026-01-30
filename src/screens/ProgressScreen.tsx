import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useApp, AVAILABLE_ADAPTERS } from '../core/context/AppContext';
import { useProgress } from '../core/context/ProgressContext';
import { DEFAULT_LEARNING_CONFIG, type ItemProgress } from '../core/types/progress';
import type { City } from '../features/city/types';
import type { Road } from '../features/road/types';
import { CityAdapter } from '../features/city/CityAdapter';
import { RoadAdapter } from '../features/road/RoadAdapter';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RangeSlider } from '../components/ui/RangeSlider';

type ProgressStatus = 'all' | 'new' | 'active' | 'mastered';
type SortOption = 'name' | 'level' | 'streak' | 'correct' | 'wrong' | 'score';

interface CityFilters {
  minPopulation: number;
  maxPopulation: number;
  selectedProvinces: string[];
  status: ProgressStatus;
  sort: SortOption;
}

interface RoadFilters {
  minLength: number;
  maxLength: number;
  selectedTypes: ('A' | 'N')[];
  status: ProgressStatus;
  sort: SortOption;
}

const DEFAULT_CITY_FILTERS: CityFilters = {
  minPopulation: CityAdapter.defaultConfig.minPopulation,
  maxPopulation: CityAdapter.defaultConfig.maxPopulation,
  selectedProvinces: [],
  status: 'all',
  sort: 'score',
};

const DEFAULT_ROAD_FILTERS: RoadFilters = {
  minLength: RoadAdapter.defaultConfig.minLength,
  maxLength: RoadAdapter.defaultConfig.maxLength,
  selectedTypes: ['A', 'N'],
  status: 'all',
  sort: 'score',
};

const emptyProgress: ItemProgress = {
  level: 0,
  streak: 0,
  totalCorrect: 0,
  totalWrong: 0,
  lastSeen: 0,
};

// Helpers for the logarithmic city slider
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

export const ProgressScreen = () => {
  const { t } = useTranslation();
  const { progress, exportProgressData, importProgressData } = useProgress();
  const { setScreen, activeAdapter, setActiveAdapter, data, isLoading } = useApp();
  const [cityFilters, setCityFilters] = useState<CityFilters>(DEFAULT_CITY_FILTERS);
  const [roadFilters, setRoadFilters] = useState<RoadFilters>(DEFAULT_ROAD_FILTERS);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { maxLevel } = DEFAULT_LEARNING_CONFIG;

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading Data...</div>;

  const isCity = activeAdapter.id === 'city-quiz';
  const currentData = (isCity ? data.cities : data.roads) as (City | Road)[];
  const filters = isCity ? cityFilters : roadFilters;
  const deferredFilters = useDeferredValue(filters);

  const provinces = useMemo(() => {
    if (!isCity) return [];
    return Array.from(new Set((currentData as City[]).map(c => c.province))).sort();
  }, [currentData, isCity]);

  const items = useMemo(() => {
    return currentData.map((feature) => {
      const entry = progress[feature.id] || emptyProgress;
      const status: ProgressStatus =
        entry.level === 0 ? 'new' : entry.level >= maxLevel ? 'mastered' : 'active';
      const score = isCity
        ? (feature as City).population
        : Math.round((feature as Road).lengthKm);
      return { feature, progress: entry, status, score };
    });
  }, [currentData, progress, maxLevel, isCity]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (deferredFilters.status !== 'all' && item.status !== deferredFilters.status) return false;

      if (isCity) {
        const city = item.feature as City;
        const cityFilters = deferredFilters as Partial<CityFilters>;
        const maxPopValue = cityFilters.maxPopulation ?? DEFAULT_CITY_FILTERS.maxPopulation;
        const minPop = cityFilters.minPopulation ?? DEFAULT_CITY_FILTERS.minPopulation;
        const provincesFilter = cityFilters.selectedProvinces ?? DEFAULT_CITY_FILTERS.selectedProvinces;
        const maxPop = maxPopValue >= 1000000 ? Infinity : maxPopValue;
        if (city.population < minPop || city.population > maxPop) return false;
        if (provincesFilter.length > 0 && !provincesFilter.includes(city.province)) return false;
      } else {
        const road = item.feature as Road;
        const roadFilters = deferredFilters as Partial<RoadFilters>;
        const maxLenValue = roadFilters.maxLength ?? DEFAULT_ROAD_FILTERS.maxLength;
        const minLen = roadFilters.minLength ?? DEFAULT_ROAD_FILTERS.minLength;
        const types = roadFilters.selectedTypes ?? DEFAULT_ROAD_FILTERS.selectedTypes;
        const maxLen = maxLenValue >= 300 ? Infinity : maxLenValue;
        if (road.lengthKm < minLen || road.lengthKm > maxLen) return false;
        if (!types.includes(road.type as 'A' | 'N')) return false;
      }

      return true;
    });
  }, [items, deferredFilters, isCity]);

  const sorted = useMemo(() => {
    const sort = deferredFilters.sort;
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sort) {
        case 'name': return a.feature.name.localeCompare(b.feature.name);
        case 'level': return b.progress.level - a.progress.level;
        case 'streak': return b.progress.streak - a.progress.streak;
        case 'correct': return b.progress.totalCorrect - a.progress.totalCorrect;
        case 'wrong': return b.progress.totalWrong - a.progress.totalWrong;
        case 'score': return b.score - a.score;
        default: return 0;
      }
    });
    return list;
  }, [filtered, deferredFilters.sort]);

  const summary = useMemo(() => {
    const totals = {
      total: filtered.length,
      new: 0,
      active: 0,
      mastered: 0,
      correct: 0,
      wrong: 0,
    };

    filtered.forEach((item) => {
      totals[item.status]++;
      totals.correct += item.progress.totalCorrect;
      totals.wrong += item.progress.totalWrong;
    });

    return totals;
  }, [filtered]);

  const handleResetFilters = () => {
    if (isCity) setCityFilters(DEFAULT_CITY_FILTERS);
    else setRoadFilters(DEFAULT_ROAD_FILTERS);
  };

  useEffect(() => {
    setPage(1);
  }, [isCity, cityFilters, roadFilters]);

  const toggleProvince = (province: string) => {
    if (!isCity) return;
    const current = (filters as CityFilters).selectedProvinces;
    if (current.includes(province)) {
      setCityFilters({ ...(filters as CityFilters), selectedProvinces: current.filter(p => p !== province) });
    } else {
      setCityFilters({ ...(filters as CityFilters), selectedProvinces: [...current, province] });
    }
  };

  const toggleProvinceAll = () => {
    if (!isCity) return;
    const current = (filters as CityFilters).selectedProvinces;
    if (current.length === provinces.length) {
      setCityFilters({ ...(filters as CityFilters), selectedProvinces: [] });
    } else {
      setCityFilters({ ...(filters as CityFilters), selectedProvinces: provinces });
    }
  };

  const toggleRoadType = (type: 'A' | 'N') => {
    if (isCity) return;
    const current = (filters as RoadFilters).selectedTypes;
    if (current.includes(type)) {
      setRoadFilters({ ...(filters as RoadFilters), selectedTypes: current.filter(t => t !== type) });
    } else {
      setRoadFilters({ ...(filters as RoadFilters), selectedTypes: [...current, type] });
    }
  };

  const formatNumber = (value: number) => value.toLocaleString();

  const handleDownload = () => {
    const payload = exportProgressData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date(payload.exportedAt).toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nl-quiz-progress-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importProgressData(data, importMode);
      if (!result.ok) {
        setImportStatus({ type: 'error', message: result.message || t('progress.transfer.status_error') });
        return;
      }
      setImportStatus({ type: 'success', message: t('progress.transfer.status_success') });
    } catch (err) {
      console.error(err);
      setImportStatus({ type: 'error', message: t('progress.transfer.status_error') });
    }
  };

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = pageSize === 0
    ? sorted
    : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">{t('progress.title')}</h1>
          <p className="text-gray-500">{t('progress.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => setScreen('MENU')}>
          {t('progress.btn_back')}
        </Button>
      </div>

      <Card>
        <h2 className="text-lg font-bold mb-4">{t('progress.type_select')}</h2>
        <div className="flex gap-2 overflow-x-auto">
          {AVAILABLE_ADAPTERS.map(adapter => (
            <Button
              key={adapter.id}
              variant={activeAdapter.id === adapter.id ? 'primary' : 'outline'}
              onClick={() => setActiveAdapter(adapter)}
            >
              {t(adapter.label)}
            </Button>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-2">{t(activeAdapter.description)}</p>
      </Card>

      <Card className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-900">{summary.total}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.total')}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-600">{summary.new}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.new')}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-700">{summary.active}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.active')}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-700">{summary.mastered}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.mastered')}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{summary.correct}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.correct')}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{summary.wrong}</div>
          <div className="text-xs uppercase text-gray-400 font-semibold">{t('progress.summary.wrong')}</div>
        </div>
      </Card>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-gray-600">{t('progress.filters.status')}</span>
            {(['all', 'new', 'active', 'mastered'] as ProgressStatus[]).map((status) => (
              <Button
                key={status}
                size="small"
                variant={filters.status === status ? 'primary' : 'outline'}
                onClick={() => {
                  if (isCity) setCityFilters({ ...cityFilters, status });
                  else setRoadFilters({ ...roadFilters, status });
                }}
              >
                {t(`progress.filters.status_${status}`)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600" htmlFor="progress-sort">
              {t('progress.filters.sort')}
            </label>
            <select
              id="progress-sort"
              className="border rounded px-2 py-1 text-sm"
              value={filters.sort}
              onChange={(e) => {
                const sort = e.target.value as SortOption;
                if (isCity) setCityFilters({ ...cityFilters, sort });
                else setRoadFilters({ ...roadFilters, sort });
              }}
            >
              <option value="name">{t('progress.filters.sort_name')}</option>
              <option value="level">{t('progress.filters.sort_level')}</option>
              <option value="streak">{t('progress.filters.sort_streak')}</option>
              <option value="correct">{t('progress.filters.sort_correct')}</option>
              <option value="wrong">{t('progress.filters.sort_wrong')}</option>
              <option value="score">{isCity ? t('progress.filters.sort_population') : t('progress.filters.sort_length')}</option>
            </select>
            <Button size="small" variant="outline" onClick={handleResetFilters}>
              {t('progress.filters.reset')}
            </Button>
          </div>
        </div>

        {isCity ? (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-semibold mb-2">{t('menu.pop_range')}</h3>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm w-16 text-right">
                  {cityFilters.minPopulation > 1000 ? `${cityFilters.minPopulation / 1000}k` : cityFilters.minPopulation}
                </span>
                <RangeSlider
                  min={0} max={300}
                  value={[toSlider(cityFilters.minPopulation), toSlider(cityFilters.maxPopulation)]}
                  onChange={([min, max]) => setCityFilters({
                    ...cityFilters,
                    minPopulation: fromSlider(min),
                    maxPopulation: fromSlider(max)
                  })}
                />
                <span className="font-mono text-sm w-16">
                  {cityFilters.maxPopulation >= 1000000 ? '1M+' : `${cityFilters.maxPopulation / 1000}k`}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <h3 className="font-semibold">{t('menu.provinces')}</h3>
                <button onClick={toggleProvinceAll} className="text-xs text-blue-600 hover:underline">
                  {cityFilters.selectedProvinces.length === provinces.length ? t('menu.clear_all') : t('menu.select_all')}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {provinces.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleProvince(p)}
                    className={clsx(
                      "text-xs py-1 px-2 rounded border transition-colors",
                      cityFilters.selectedProvinces.includes(p) ? "bg-blue-100 border-blue-400 text-blue-800" : "bg-gray-50 text-gray-400"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-semibold mb-2">{t('menu.modes.road.type_filter')}</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roadFilters.selectedTypes.includes('A')} onChange={() => toggleRoadType('A')} className="w-5 h-5 accent-blue-600" />
                  <span className="font-bold text-red-600 bg-red-100 px-2 rounded border border-red-200">{t('menu.modes.road.type.highway')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roadFilters.selectedTypes.includes('N')} onChange={() => toggleRoadType('N')} className="w-5 h-5 accent-blue-600" />
                  <span className="font-bold text-yellow-600 bg-yellow-100 px-2 rounded border border-yellow-200">{t('menu.modes.road.type.provincial')}</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('menu.modes.road.length_filter')}</h3>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm w-12 text-right">{roadFilters.minLength}km</span>
                <RangeSlider
                  min={0} max={300}
                  value={[roadFilters.minLength, roadFilters.maxLength]}
                  onChange={([min, max]) => setRoadFilters({ ...roadFilters, minLength: min, maxLength: max })}
                />
                <span className="font-mono text-sm w-12">{roadFilters.maxLength === 300 ? '300+' : `${roadFilters.maxLength}km`}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('progress.transfer.title')}</h2>
          <div className="text-xs text-gray-400">{t('progress.transfer.note')}</div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="outline" onClick={handleDownload}>
            {t('progress.transfer.download')}
          </Button>
          <Button variant="primary" onClick={handleFilePick}>
            {t('progress.transfer.import')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.currentTarget.value = '';
            }}
          />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label className="font-semibold">{t('progress.transfer.mode_label')}</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
            >
              <option value="replace">{t('progress.transfer.mode_replace')}</option>
              <option value="merge">{t('progress.transfer.mode_merge')}</option>
            </select>
          </div>
        </div>
        {importStatus && (
          <div className={clsx(
            "text-sm px-3 py-2 rounded border",
            importStatus.type === 'success' && "bg-green-50 border-green-200 text-green-700",
            importStatus.type === 'error' && "bg-red-50 border-red-200 text-red-700"
          )}>
            {importStatus.message}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t('progress.list_title')}</h2>
          <div className="text-sm text-gray-500">
            {t('progress.list_count', { shown: pageItems.length, total: items.length })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 uppercase text-xs border-b">
                <th className="py-2 pr-4">{t('progress.columns.name')}</th>
                <th className="py-2 pr-4">{t('progress.columns.details')}</th>
                <th className="py-2 pr-4 text-center">{t('progress.columns.level')}</th>
                <th className="py-2 pr-4 text-center">{t('progress.columns.streak')}</th>
                <th className="py-2 pr-4 text-center">{t('progress.columns.correct')}</th>
                <th className="py-2 pr-4 text-center">{t('progress.columns.wrong')}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => {
                const levelBadge = clsx(
                  "px-2 py-1 rounded text-xs font-semibold",
                  item.status === 'new' && "bg-gray-100 text-gray-600",
                  item.status === 'active' && "bg-blue-100 text-blue-700",
                  item.status === 'mastered' && "bg-green-100 text-green-700"
                );

                return (
                  <tr key={item.feature.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-semibold text-gray-900">{item.feature.name}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {isCity ? (
                        <span>
                          {(item.feature as City).province} · {formatNumber((item.feature as City).population)}
                        </span>
                      ) : (
                        <span>
                          {(item.feature as Road).type} · {Math.round((item.feature as Road).lengthKm)}km
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <span className={levelBadge}>L{item.progress.level}/{maxLevel}</span>
                    </td>
                    <td className="py-2 pr-4 text-center font-mono">{item.progress.streak}</td>
                    <td className="py-2 pr-4 text-center text-green-700">{item.progress.totalCorrect}</td>
                    <td className="py-2 pr-4 text-center text-red-700">{item.progress.totalWrong}</td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-gray-500" colSpan={6}>
                    {t('progress.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="text-sm text-gray-500">
            {t('progress.pagination.page', { page: safePage, total: totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('progress.pagination.rows')}</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={0}>{t('progress.pagination.all')}</option>
            </select>
            <Button size="small" variant="outline" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}>
              {t('progress.pagination.prev')}
            </Button>
            <Button size="small" variant="outline" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}>
              {t('progress.pagination.next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
