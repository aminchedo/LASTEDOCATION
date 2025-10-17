import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Link, 
  TestTube, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { useAppSettings } from '@/core/contexts/AppSettingsContext';
import { CustomApiSettings, ModelType } from '@/types/settings';
import { 
  validateApiUrl, 
  maskApiKey, 
  copyToClipboard, 
  clearClipboardAfterDelay, 
  testApiConnection, 
  getModelTypeLabel, 
  getModelTypeOptions,
  sanitizeApiKey,
  isCustomApiEnabled
} from '@/shared/utils/customApi';
import { setApiOverrides } from '@/shared/utils/api';
import toast from 'react-hot-toast';

export function CustomApiPanel() {
  const { settings, updateCustomApi, resetCustomApi } = useAppSettings();
  
  const [formData, setFormData] = useState<CustomApiSettings>({
    enabled: false,
    baseUrl: '',
    apiKey: '',
    modelName: '',
    modelType: undefined,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form with existing settings
  useEffect(() => {
    if (settings.customApi) {
      setFormData(settings.customApi);
    }
  }, [settings.customApi]);

  // Apply API overrides when form data changes
  useEffect(() => {
    if (formData.baseUrl.trim()) {
      setApiOverrides(formData);
    } else {
      setApiOverrides(undefined);
    }
  }, [formData]);

  const handleInputChange = (field: keyof CustomApiSettings, value: string | ModelType | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear URL error when user starts typing
    if (field === 'baseUrl') {
      setUrlError(null);
    }
  };

  const handleUrlBlur = () => {
    if (formData.baseUrl.trim()) {
      const validation = validateApiUrl(formData.baseUrl);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
      } else {
        setUrlError(null);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!formData.baseUrl.trim()) {
      toast.error('لطفا ابتدا API Base URL را وارد کنید');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testApiConnection(formData);
      if (result.success) {
        toast.success('اتصال با موفقیت برقرار شد');
      } else {
        toast.error(`خطا در اتصال: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`خطا در تست اتصال: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.baseUrl.trim()) {
      toast.error('لطفا API Base URL را وارد کنید');
      return;
    }

    const validation = validateApiUrl(formData.baseUrl);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Invalid URL');
      toast.error('لطفا یک URL معتبر وارد کنید');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedData: CustomApiSettings = {
        enabled: true,
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey ? sanitizeApiKey(formData.apiKey) : undefined,
        modelName: formData.modelName?.trim() || undefined,
        modelType: formData.modelType,
      };

      updateCustomApi(sanitizedData);
      toast.success('تنظیمات API سفارشی ذخیره شد');
    } catch (error: any) {
      toast.error(`خطا در ذخیره تنظیمات: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      enabled: false,
      baseUrl: '',
      apiKey: '',
      modelName: '',
      modelType: undefined,
    });
    resetCustomApi();
    setUrlError(null);
    toast.success('تنظیمات به حالت پیش‌فرض بازگردانده شد');
  };

  const handleCopyApiKey = async () => {
    if (!formData.apiKey) return;

    const success = await copyToClipboard(formData.apiKey);
    if (success) {
      setCopied(true);
      clearClipboardAfterDelay(3000);
      toast.success('کلید API کپی شد (خودکار پاک می‌شود)');
      setTimeout(() => setCopied(false), 1000);
    } else {
      toast.error('خطا در کپی کردن کلید');
    }
  };

  const isEnabled = isCustomApiEnabled(formData);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings.customApi);

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[color:var(--c-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--c-text)]">API سفارشی</h3>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              پیکربندی API خارجی برای چت، تبدیل گفتار به متن و تبدیل متن به گفتار
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Base URL */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[color:var(--c-text)]">
            <Link className="w-4 h-4 inline ml-1" />
            API Base URL *
          </label>
          <input
            type="url"
            value={formData.baseUrl}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://api.example.com"
            className={`w-full px-4 py-2 rounded-lg border ${
              urlError ? 'border-red-500' : 'border-[color:var(--c-border)]'
            } bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]`}
            dir="ltr"
          />
          {urlError && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {urlError}
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[color:var(--c-text)]">
            <Key className="w-4 h-4 inline ml-1" />
            کلید API (اختیاری)
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={formData.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="کلید API خود را وارد کنید"
              className="w-full px-4 py-2 pr-20 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
              />
              {formData.apiKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  onClick={handleCopyApiKey}
                  aria-label="کپی کردن کلید"
                />
              )}
            </div>
          </div>
          {formData.apiKey && (
            <p className="text-xs text-[color:var(--c-text-muted)]">
              نمایش: {maskApiKey(formData.apiKey)}
            </p>
          )}
        </div>

        {/* Model Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[color:var(--c-text)]">
            نام مدل (اختیاری)
          </label>
          <input
            type="text"
            value={formData.modelName || ''}
            onChange={(e) => handleInputChange('modelName', e.target.value)}
            placeholder="نام مدل مورد نظر"
            className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
          />
        </div>

        {/* Model Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[color:var(--c-text)]">
            نوع مدل (اختیاری)
          </label>
          <select
            value={formData.modelType || ''}
            onChange={(e) => handleInputChange('modelType', e.target.value as ModelType || undefined)}
            className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
          >
            {getModelTypeOptions().map(option => (
              <option key={option.value || 'auto'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Indicator */}
        {isEnabled && (
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            API سفارشی فعال است - درخواست‌ها به {formData.baseUrl} ارسال می‌شوند
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[color:var(--c-border)]">
          <Button
            variant="secondary"
            icon={<TestTube className="w-4 h-4" />}
            onClick={handleTestConnection}
            disabled={isTesting || !formData.baseUrl.trim()}
            loading={isTesting}
          >
            تست اتصال
          </Button>

          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !formData.baseUrl.trim()}
            loading={isSaving}
          >
            ذخیره
          </Button>

          <Button
            variant="ghost"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
            disabled={!settings.customApi}
          >
            بازگردانی به پیش‌فرض
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-[color:var(--c-text-muted)] space-y-1">
          <p>• API Base URL باید با http:// یا https:// شروع شود</p>
          <p>• کلید API اختیاری است اما برای احراز هویت توصیه می‌شود</p>
          <p>• نام مدل و نوع مدل برای پیکربندی دقیق‌تر اختیاری هستند</p>
          <p>• تست اتصال سلامت سرور را بررسی می‌کند</p>
        </div>
      </CardContent>
    </Card>
  );
}
