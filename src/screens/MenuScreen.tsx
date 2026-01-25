import { useApp, AVAILABLE_ADAPTERS } from '../core/context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';

export const MenuScreen = () => {
  const { t } = useTranslation();
  const { activeAdapter, setActiveAdapter, config, setConfig, setScreen, isLoading } = useApp();

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading Data...</div>;

  return (
    <div className="max-w-xl mx-auto py-12 px-4 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-900">{t('header.title')}</h1>
        <p className="text-gray-500">{t('header.subtitle')}</p>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-4">{t('menu.settings')}</h2>

        <div className="mb-6 pb-6 border-b">
          <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Quiz Type</label>
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
        </div>

        {/* Adapter Specific Settings */}
        <activeAdapter.ConfigComponent config={config} onChange={setConfig} />

        <div className="mt-8">
          <Button fullWidth onClick={() => setScreen('PLAY')}>
            {config.mode === 'EXPLORE' ? t('menu.btn_explore') : t('menu.btn_start')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
