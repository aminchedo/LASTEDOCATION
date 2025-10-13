import { useState } from 'react';
import { Save, RotateCcw, Settings, Palette, Cpu, Mic, Code, Sparkles } from 'lucide-react';
import { useTheme } from '@/core/contexts/ThemeContext';
import { APP_CONFIG } from '@/core/config/app.config';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card';
import toast from 'react-hot-toast';
import { resetApiInstance } from '@/shared/utils/api';

export function SettingsPage() {
  const { settings, updateSettings } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof typeof localSettings>(
    key: K,
    value: (typeof localSettings)[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (key: string, nestedKey: string, value: any) => {
    setLocalSettings((prev) => {
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
    
    // Reset API instance if API settings changed
    if (
      localSettings.api.baseUrl !== settings.api.baseUrl ||
      localSettings.api.key !== settings.api.key
    ) {
      resetApiInstance();
    }
    
    toast.success('تنظیمات با موفقیت ذخیره شد');
  };

  const handleReset = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تغییرات را لغو کنید؟')) {
      setLocalSettings(settings);
      setHasChanges(false);
      toast.success('تغییرات لغو شد');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl space-y-6 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[color:var(--c-primary)]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[color:var(--c-primary)]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)] to-[color:var(--c-primary)]/60 rounded-2xl blur-lg opacity-40" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--c-primary)] to-[color:var(--c-primary)]/80 flex items-center justify-center shadow-xl">
              <Settings className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-2">
              تنظیمات
              {hasChanges && <Sparkles className="w-5 h-5 text-[color:var(--c-primary)] animate-pulse" />}
            </h1>
            <p className="text-sm text-[color:var(--c-muted)] mt-1.5">
              برنامه را طبق نیاز خود سفارشی کنید
            </p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 animate-[fadeSlideUp_.3s_ease-out_both]">
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<RotateCcw className="w-5 h-5" />} 
              onClick={handleReset}
              className="hover:bg-[color:var(--c-error)]/10 hover:text-[color:var(--c-error)] transition-all duration-200"
            >
              <span className="hidden sm:inline">لغو</span>
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Save className="w-5 h-5" />} 
              onClick={handleSave}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              ذخیره تغییرات
            </Button>
          </div>
        )}
      </div>

      {/* General Settings */}
      <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[color:var(--c-primary)]/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[color:var(--c-primary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">عمومی</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div>
            <label 
              htmlFor="font-size-slider" 
              className="block text-sm font-medium text-[color:var(--c-text)] mb-3"
            >
              اندازه فونت پایه
            </label>
            <div className="relative">
              <input
                id="font-size-slider"
                type="range"
                min="12"
                max="20"
                value={localSettings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-[color:var(--c-border)] to-[color:var(--c-primary)]/20 rounded-lg appearance-none cursor-pointer accent-[color:var(--c-primary)] shadow-inner"
                style={{
                  background: `linear-gradient(to right, var(--c-primary) 0%, var(--c-primary) ${((localSettings.fontSize - 12) / 8) * 100}%, var(--c-border) ${((localSettings.fontSize - 12) / 8) * 100}%, var(--c-border) 100%)`
                }}
                aria-valuemin={12}
                aria-valuemax={20}
                aria-valuenow={localSettings.fontSize}
                aria-label="اندازه فونت"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-[color:var(--c-muted)] mt-3">
              <span className="px-2 py-1 rounded-md bg-[color:var(--c-border)]/30">12px</span>
              <span className="px-3 py-1.5 rounded-lg bg-[color:var(--c-primary)]/10 text-[color:var(--c-primary)] font-bold">{localSettings.fontSize}px</span>
              <span className="px-2 py-1 rounded-md bg-[color:var(--c-border)]/30">20px</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">ظاهر</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--c-text)] mb-3">
              تم
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <Button
                  key={theme}
                  variant={localSettings.theme === theme ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('theme', theme)}
                  className={`min-h-[3rem] transition-all duration-200 ${
                    localSettings.theme === theme 
                      ? 'shadow-lg scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {theme === 'light' ? '☀️ روشن' : theme === 'dark' ? '🌙 تاریک' : '🔄 خودکار'}
                </Button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--c-text)] mb-3">
              جهت
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['rtl', 'ltr'] as const).map((dir) => (
                <Button
                  key={dir}
                  variant={localSettings.direction === dir ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('direction', dir)}
                  className={`min-h-[3rem] transition-all duration-200 ${
                    localSettings.direction === dir 
                      ? 'shadow-lg scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {dir === 'rtl' ? '← راست به چپ' : 'چپ به راست →'}
                </Button>
              ))}
        </div>
      </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--c-text)] mb-3">
              رنگ اصلی
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {APP_CONFIG.theme.availableAccents.map((accent) => (
                <button
                  key={accent.value}
                  className={`relative h-16 rounded-2xl border-2 transition-all duration-300 group/color ${
                    localSettings.accentColor === accent.value
                      ? 'border-[color:var(--c-text)] scale-110 shadow-[0_8px_16px_rgba(0,0,0,0.1)]'
                      : 'border-transparent hover:scale-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  }`}
                  style={{ backgroundColor: accent.value }}
                  onClick={() => handleChange('accentColor', accent.value)}
                  title={accent.name}
                  aria-label={accent.name}
                  aria-pressed={localSettings.accentColor === accent.value}
                >
                  {localSettings.accentColor === accent.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <span className="text-xs">✓</span>
            </div>
          </div>
        )}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/color:opacity-100 transition-opacity duration-200 whitespace-nowrap text-xs font-medium text-[color:var(--c-text)] bg-[color:var(--c-surface)] px-2 py-1 rounded-md shadow-lg">
                    {accent.name}
              </div>
                </button>
              ))}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* AI Model Settings */}
      <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">مدل هوش مصنوعی</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div>
            <label className="block text-sm font-medium text-[color:var(--c-text)] mb-3">
              مدل
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['gpt-4', 'gpt-3.5-turbo', 'claude-3'].map((model) => (
                <Button
                  key={model}
                  variant={localSettings.aiModel === model ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('aiModel', model)}
                  className={`min-h-[3.5rem] transition-all duration-200 ${
                    localSettings.aiModel === model 
                      ? 'shadow-lg scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">{model}</span>
                    <span className="text-xs opacity-70">
                      {model === 'gpt-4' ? 'قدرتمند' : model === 'gpt-3.5-turbo' ? 'سریع' : 'متعادل'}
                    </span>
          </div>
                </Button>
        ))}
          </div>
      </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">صدا</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <label className="flex items-start gap-3 cursor-pointer group/item hover:bg-[color:var(--c-border)]/20 p-4 rounded-xl transition-all duration-200">
            <input
              type="checkbox"
              checked={localSettings.voice.enabled}
              onChange={(e) => handleNestedChange('voice', 'enabled', e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-[color:var(--c-border)] text-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-primary)] focus:ring-offset-2 transition-all cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-[color:var(--c-text)] group-hover/item:text-[color:var(--c-primary)] transition-colors">
                فعال‌سازی ورودی صوتی
              </div>
              <div className="text-xs text-[color:var(--c-muted)] mt-1">
                امکان ارسال پیام با صدا
        </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group/item hover:bg-[color:var(--c-border)]/20 p-4 rounded-xl transition-all duration-200">
            <input
              type="checkbox"
              checked={localSettings.voice.autoPlay}
              onChange={(e) => handleNestedChange('voice', 'autoPlay', e.target.checked)}
              disabled={!localSettings.voice.enabled}
              className="mt-0.5 w-5 h-5 rounded border-2 border-[color:var(--c-border)] text-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-primary)] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            />
            <div className="flex-1">
              <div className={`text-sm font-semibold transition-colors ${localSettings.voice.enabled ? 'text-[color:var(--c-text)] group-hover/item:text-[color:var(--c-primary)]' : 'text-[color:var(--c-muted)]'}`}>
                پخش خودکار پاسخ
              </div>
              <div className="text-xs text-[color:var(--c-muted)] mt-1">
                پاسخ‌ها به صورت خودکار پخش شوند
      </div>
    </div>
          </label>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">API</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div>
            <label className="block text-sm font-medium mb-2">آدرس API</label>
            <Input
              type="url"
              value={localSettings.api.baseUrl}
              onChange={(e) => handleNestedChange('api', 'baseUrl', e.target.value)}
              placeholder="http://localhost:3001"
            />
            <p className="text-xs text-muted-foreground mt-1">آدرس سرور API</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">کلید API</label>
            <Input
              type="password"
              value={localSettings.api.key}
              onChange={(e) => handleNestedChange('api', 'key', e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground mt-1">کلید احراز هویت (اختیاری)</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Mobile Sticky) */}
      {hasChanges && (
        <div className="sticky bottom-0 left-0 right-0 bg-[color:var(--c-surface)]/95 backdrop-blur-xl border-t border-[color:var(--c-border)]/60 py-4 -mx-4 px-4 sm:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.1)] animate-[fadeSlideUp_.3s_ease-out_both] z-10">
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              className="flex-1 min-h-[3rem]" 
              onClick={handleReset}
            >
              لغو
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 min-h-[3rem] shadow-lg" 
              onClick={handleSave}
            >
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}