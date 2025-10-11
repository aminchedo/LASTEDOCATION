import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Monitor, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="w-full max-w-md bg-[color:var(--c-surface)] border-l border-[color:var(--c-border)] shadow-[var(--shadow-3)]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[color:var(--c-border)]">
            <h2 className="text-xl font-semibold text-[color:var(--c-text)]">تنظیمات</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleReset}
                aria-label="بازنشانی تنظیمات"
              />
              <Button
                variant="primary"
                size="sm"
                icon={<Save className="w-4 h-4" />}
                onClick={handleSave}
                disabled={!hasChanges}
                aria-label="ذخیره تنظیمات"
              >
                ذخیره
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={onClose}
                aria-label="بستن تنظیمات"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Settings */}
            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">عمومی</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    پوسته
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', label: 'روشن', icon: Sun },
                      { value: 'dark', label: 'تیره', icon: Moon },
                      { value: 'auto', label: 'خودکار', icon: Monitor }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={localSettings.theme === value ? 'primary' : 'outline'}
                        size="sm"
                        icon={<Icon className="w-4 h-4" />}
                        onClick={() => handleGeneralChange('theme', value)}
                        className="flex-1"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="direction" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    جهت متن
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'rtl', label: 'راست به چپ' },
                      { value: 'ltr', label: 'چپ به راست' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={localSettings.direction === value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleGeneralChange('direction', value)}
                        className="flex-1"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="fontSize" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    اندازه فونت
                  </label>
                  <select
                    id="fontSize"
                    value={localSettings.fontSize}
                    onChange={(e) => handleGeneralChange('fontSize', e.target.value)}
                    className="w-full px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  >
                    <option value="sm">کوچک</option>
                    <option value="md">متوسط</option>
                    <option value="lg">بزرگ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    رنگ برجسته
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {accentColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          localSettings.accentColor === color 
                            ? 'border-[color:var(--c-primary)] ring-2 ring-[color:var(--c-primary)] ring-offset-2' 
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleGeneralChange('accentColor', color)}
                        aria-label={`تنظیم رنگ برجسته به ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Models Settings */}
            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">مدل هوش مصنوعی</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="aiModel" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    مدل
                  </label>
                  <Input
                    id="aiModel"
                    value={localSettings.aiModel}
                    onChange={(e) => handleGeneralChange('aiModel', e.target.value)}
                    placeholder="مثال: gpt-4o"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    منبع API
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'local', label: 'محلی' },
                      { value: 'external', label: 'خارجی' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={localSettings.api?.baseUrl?.includes('localhost') === (value === 'local') ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const baseUrl = value === 'local' ? 'http://localhost:3001' : 'https://api.openai.com';
                          handleNestedChange('api', 'baseUrl', baseUrl);
                        }}
                        className="flex-1"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    آدرس پایه API
                  </label>
                  <Input
                    id="apiBaseUrl"
                    value={localSettings.api.baseUrl}
                    onChange={(e) => handleNestedChange('api', 'baseUrl', e.target.value)}
                    placeholder="مثال: http://localhost:3001"
                  />
                </div>

                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    کلید API
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={localSettings.api.key}
                    onChange={(e) => handleNestedChange('api', 'key', e.target.value)}
                    placeholder="کلید API شما"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">صدا</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="voiceEnabled" className="text-sm font-medium text-[color:var(--c-text)]">
                    فعال کردن ورودی صوتی
                  </label>
                  <input
                    type="checkbox"
                    id="voiceEnabled"
                    checked={localSettings.voice.enabled}
                    onChange={(e) => handleNestedChange('voice', 'enabled', e.target.checked)}
                    className="h-5 w-5 rounded border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-primary)] focus:ring-[color:var(--c-primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="voiceLanguage" className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                    زبان صوتی
                  </label>
                  <Input
                    id="voiceLanguage"
                    value="fa-IR"
                    onChange={(e) => handleNestedChange('voice', 'language', e.target.value)}
                    placeholder="مثال: fa-IR"
                    disabled={!localSettings.voice.enabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
