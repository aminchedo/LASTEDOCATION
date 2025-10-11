import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import { apiService } from '@/shared/services/api.service';

interface HealthStatus {
  isHealthy: boolean;
  apiSource: string;
  modelId: string;
  lastChecked: string;
  error?: string;
}

export function HealthNotice() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      // Check training API health
      const response = await apiService.getTrainingStatus();
      
      if (response.success) {
        setHealth({
          isHealthy: true,
          apiSource: 'local',
          modelId: 'main_model',
          lastChecked: new Date().toISOString()
        });
      } else {
        setHealth({
          isHealthy: false,
          apiSource: 'unknown',
          modelId: 'unknown',
          lastChecked: new Date().toISOString(),
          error: response.error || 'Unknown error'
        });
      }
    } catch (error: any) {
      setHealth({
        isHealthy: false,
        apiSource: 'unknown',
        modelId: 'unknown',
        lastChecked: new Date().toISOString(),
        error: error.message || 'Failed to connect to training API'
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <Card variant="outline" className="border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-[color:var(--c-text-muted)]">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <span className="text-sm">در حال بررسی وضعیت سیستم...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (health.isHealthy) {
    return (
      <Card variant="outline" className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  سیستم آموزش آماده است
                </span>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  API: {health.apiSource} • مدل: {health.modelId}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-xs">
                آنلاین
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />}
                onClick={checkHealth}
                disabled={isChecking}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outline" className="border-red-200 dark:border-red-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                مشکل در اتصال به سیستم آموزش
              </span>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {health.error}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="error" className="text-xs">
              آفلاین
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />}
              onClick={checkHealth}
              disabled={isChecking}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                // TODO: Open settings modal
                console.log('Open settings');
              }}
            />
          </div>
        </div>
        
        {/* Troubleshooting Tips */}
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h4 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
            راه‌حل‌های پیشنهادی:
          </h4>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
            <li>• اطمینان حاصل کنید که سرور backend در حال اجرا است</li>
            <li>• بررسی کنید که پورت 3001 در دسترس باشد</li>
            <li>• در صورت نیاز، تنظیمات API را بررسی کنید</li>
            <li>• سرور را مجدداً راه‌اندازی کنید</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
