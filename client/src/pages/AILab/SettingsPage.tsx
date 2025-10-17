import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import { Settings, FolderOpen, Cpu, Save, RefreshCw, HardDrive } from 'lucide-react';
import { useAILab } from '@/hooks/api/useAILab';
import { toast } from 'react-hot-toast';

export function AILabSettingsPage() {
  const { settings, updateSettings, refreshSettings } = useAILab();
  const [localSettings, setLocalSettings] = useState({
    baseDirectory: '',
    gpuEnabled: false,
    maxConcurrentJobs: 2,
    autoSaveCheckpoints: true,
    checkpointInterval: 10
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      toast.success('تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDirectory = () => {
    // In a real implementation, this would open a directory picker
    // For now, we'll just show a message
    toast.info('انتخاب دایرکتوری در حال حاضر در مرورگر پشتیبانی نمی‌شود. لطفاً مسیر را به صورت دستی وارد کنید.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-[color:var(--c-primary)]" />
          تنظیمات آزمایشگاه AI
        </h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={refreshSettings}
          >
            بازخوانی
          </Button>
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={isLoading}
          >
            ذخیره تنظیمات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            تنظیمات ذخیره‌سازی
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">مسیر پایه ذخیره‌سازی</label>
              <div className="flex gap-2">
                <Input
                  value={localSettings.baseDirectory}
                  onChange={(e) => setLocalSettings({ ...localSettings, baseDirectory: e.target.value })}
                  placeholder="/workspace/storage/ai-lab"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  icon={<FolderOpen className="w-4 h-4" />}
                  onClick={handleSelectDirectory}
                >
                  انتخاب
                </Button>
              </div>
              <p className="text-xs text-[color:var(--c-text-secondary)] mt-1">
                مسیری که مدل‌ها، دیتاست‌ها و چک‌پوینت‌ها در آن ذخیره می‌شوند
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">ذخیره خودکار چک‌پوینت‌ها</label>
                <p className="text-xs text-[color:var(--c-text-secondary)] mt-1">
                  ذخیره خودکار وضعیت مدل در حین آموزش
                </p>
              </div>
              <Switch
                checked={localSettings.autoSaveCheckpoints}
                onChange={(checked) => setLocalSettings({ ...localSettings, autoSaveCheckpoints: checked })}
              />
            </div>

            {localSettings.autoSaveCheckpoints && (
              <div>
                <label className="block text-sm font-medium mb-2">فاصله ذخیره چک‌پوینت (Epoch)</label>
                <Input
                  type="number"
                  value={localSettings.checkpointInterval}
                  onChange={(e) => setLocalSettings({ ...localSettings, checkpointInterval: parseInt(e.target.value) })}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-[color:var(--c-text-secondary)] mt-1">
                  هر چند Epoch یک چک‌پوینت ذخیره شود
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Processing Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            تنظیمات پردازش
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">استفاده از GPU</label>
                <p className="text-xs text-[color:var(--c-text-secondary)] mt-1">
                  {localSettings.gpuEnabled 
                    ? 'GPU فعال است و برای آموزش استفاده می‌شود'
                    : 'فقط از CPU برای آموزش استفاده می‌شود'
                  }
                </p>
              </div>
              <Switch
                checked={localSettings.gpuEnabled}
                onChange={(checked) => setLocalSettings({ ...localSettings, gpuEnabled: checked })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">حداکثر کارهای همزمان</label>
              <Input
                type="number"
                value={localSettings.maxConcurrentJobs}
                onChange={(e) => setLocalSettings({ ...localSettings, maxConcurrentJobs: parseInt(e.target.value) })}
                min={1}
                max={10}
              />
              <p className="text-xs text-[color:var(--c-text-secondary)] mt-1">
                تعداد کارهای آموزش که می‌توانند همزمان اجرا شوند
              </p>
            </div>
          </div>
        </Card>

        {/* System Information */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">اطلاعات سیستم</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[color:var(--c-bg-elevated)] p-4 rounded-lg">
              <div className="text-sm text-[color:var(--c-text-secondary)] mb-1">وضعیت GPU</div>
              <div className="font-semibold">
                {settings?.gpuEnabled ? 'فعال (TensorFlow GPU)' : 'غیرفعال (CPU)'}
              </div>
            </div>
            <div className="bg-[color:var(--c-bg-elevated)] p-4 rounded-lg">
              <div className="text-sm text-[color:var(--c-text-secondary)] mb-1">نسخه TensorFlow.js</div>
              <div className="font-semibold">4.x</div>
            </div>
            <div className="bg-[color:var(--c-bg-elevated)] p-4 rounded-lg">
              <div className="text-sm text-[color:var(--c-text-secondary)] mb-1">حافظه در دسترس</div>
              <div className="font-semibold">نامحدود</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}