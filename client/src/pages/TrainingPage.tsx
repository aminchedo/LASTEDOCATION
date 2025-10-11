import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressCard } from '@/components/training/ProgressCard';
import { Controls } from '@/components/training/Controls';
import { MetricsChart } from '@/components/training/MetricsChart';
import { CheckpointsTable } from '@/components/training/CheckpointsTable';
import { HealthNotice } from '@/components/training/HealthNotice';
import { DownloadCenter } from '@/components/training/DownloadCenter';
import { useTraining } from '@/hooks/useTraining';
import { Rocket, Activity } from 'lucide-react';

export function TrainingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'checkpoints' | 'downloads'>('overview');
  const { status, isLoading, error } = useTraining();

  const tabs = [
    { id: 'overview', label: 'نمای کلی', icon: Activity },
    { id: 'metrics', label: 'معیارها', icon: Activity },
    { id: 'checkpoints', label: 'چک‌پوینت‌ها', icon: Activity },
    { id: 'downloads', label: 'دانلودها', icon: Activity },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-3">
            <Rocket className="w-8 h-8 text-[color:var(--c-primary)]" />
            آموزش مدل
          </h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            آموزش و مدیریت مدل‌های زبانی فارسی
          </p>
        </div>
        
        {/* Status Badge */}
        <Badge 
          variant={status?.status === 'running' ? 'success' : 
                   status?.status === 'paused' ? 'warning' : 
                   status?.status === 'error' ? 'error' : 'default'}
          className="text-sm px-3 py-1"
        >
          {status?.status === 'running' ? 'در حال اجرا' :
           status?.status === 'paused' ? 'متوقف شده' :
           status?.status === 'error' ? 'خطا' : 'آماده'}
        </Badge>
      </div>

      {/* Health Notice */}
      <HealthNotice />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--c-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Card */}
          <ProgressCard />
          
          {/* Controls */}
          <Controls />
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <MetricsChart />
        </div>
      )}

      {activeTab === 'checkpoints' && (
        <div className="space-y-6">
          <CheckpointsTable />
        </div>
      )}

      {activeTab === 'downloads' && (
        <div className="space-y-6">
          <DownloadCenter />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card variant="outline" className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium">خطا در بارگذاری</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[color:var(--c-text-muted)]">
            <div className="w-5 h-5 border-2 border-[color:var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
            <span>در حال بارگذاری...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingPage;
