import { Tabs } from '../components/ui/Tabs';
import { HFGrid } from '../components/hf/HFGrid';
import MetricsDashboard from './MetricsDashboard';

export default function HFDownloadsPage() {
  const tabs = [
    {
      id: 'models',
      label: '🤖 مدل‌ها',
      content: <HFGrid kind="models" />
    },
    {
      id: 'datasets',
      label: '📊 دیتاست‌ها',
      content: <HFGrid kind="datasets" />
    },
    {
      id: 'tts',
      label: '🔊 TTS',
      content: <HFGrid kind="tts" />
    },
    {
      id: 'metrics',
      label: '📈 متریک‌ها',
      content: <div data-testid="metrics-dashboard"><MetricsDashboard /></div>
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            دانلود مدل‌ها و دیتاست‌ها
          </h1>
          <p className="text-gray-600">
            دسترسی مستقیم به مدل‌ها و دیتاست‌های Hugging Face با امنیت کامل
          </p>
        </header>

        {/* Tabs Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Tabs tabs={tabs} defaultIndex={0} />
        </div>
      </div>
    </main>
  );
}
