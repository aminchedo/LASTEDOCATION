import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Monitor, Sun, Moon } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { useTheme, AppSettings } from '@/core/contexts/ThemeContext';
import toast from 'react-hot-toast';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [isOpen, settings]);

  const handleGeneralChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (key: string, nestedKey: string, value: any) => {
    setLocalSettings(prev => {
      const updated = { ...prev };
      if (key === 'api') {
        updated.api = { ...prev.api, [nestedKey]: value };
      } else if (key === 'voice') {
        updated.voice = { ...prev.voice, [nestedKey]: value };
      }
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
    toast.success('تنظیمات ذخیره شد!');
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      theme: 'auto',
      direction: 'rtl',
      fontSize: 16,
      accentColor: '#3B82F6',
      api: {
        baseUrl: 'http://localhost:3001',
        key: '',
      },
      voice: {
        enabled: false,
        autoPlay: false,
      },
      aiModel: 'gpt-4',
      models: [],
    };
    setLocalSettings(defaultSettings);
    setHasChanges(true);
    toast('تنظیمات به حالت پیش‌فرض بازنشانی شد. برای اعمال، ذخیره کنید.', { icon: '🔄' });
  };

  const accentColors = [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">تنظیمات</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">ظاهر</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Mode */}
              <div>
                <label className="block text-sm font-medium mb-2">حالت تم</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleGeneralChange('theme', 'light')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      localSettings.theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Sun size={20} className="mx-auto mb-1" />
                    <span className="text-xs">روشن</span>
                  </button>
                  <button
                    onClick={() => handleGeneralChange('theme', 'dark')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      localSettings.theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Moon size={20} className="mx-auto mb-1" />
                    <span className="text-xs">تاریک</span>
                  </button>
                  <button
                    onClick={() => handleGeneralChange('theme', 'auto')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      localSettings.theme === 'auto'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Monitor size={20} className="mx-auto mb-1" />
                    <span className="text-xs">خودکار</span>
                  </button>
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium mb-2">جهت متن</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleGeneralChange('direction', 'rtl')}
                    className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                      localSettings.direction === 'rtl'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    راست به چپ
                  </button>
                  <button
                    onClick={() => handleGeneralChange('direction', 'ltr')}
                    className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                      localSettings.direction === 'ltr'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    چپ به راست
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  اندازه فونت: {localSettings.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={localSettings.fontSize}
                  onChange={(e) => handleGeneralChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium mb-2">رنگ اصلی</label>
                <div className="grid grid-cols-6 gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleGeneralChange('accentColor', color)}
                      className={`w-10 h-10 rounded-lg border-2 transition-transform ${
                        localSettings.accentColor === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">تنظیمات API</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">آدرس پایه</label>
                <Input
                  type="url"
                  value={localSettings.api.baseUrl}
                  onChange={(e) => handleNestedChange('api', 'baseUrl', e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">کلید API</label>
                <Input
                  type="password"
                  value={localSettings.api.key}
                  onChange={(e) => handleNestedChange('api', 'key', e.target.value)}
                  placeholder="کلید API خود را وارد کنید"
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">تنظیمات صوتی</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">فعال‌سازی صدا</label>
                <input
                  type="checkbox"
                  checked={localSettings.voice.enabled}
                  onChange={(e) => handleNestedChange('voice', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">پخش خودکار</label>
                <input
                  type="checkbox"
                  checked={localSettings.voice.autoPlay}
                  onChange={(e) => handleNestedChange('voice', 'autoPlay', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            ذخیره تغییرات
          </Button>
          <Button
            variant="outline"
            icon={<RotateCcw size={16} />}
            onClick={handleReset}
          >
            بازنشانی
          </Button>
        </div>
      </div>
    </>
  );
}
