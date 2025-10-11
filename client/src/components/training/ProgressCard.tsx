import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  TrendingDown, 
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTraining } from '@/hooks/useTraining';

export function ProgressCard() {
  const { status, isLoading } = useTraining();

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.currentRun) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <h2 className="text-xl font-semibold text-[color:var(--c-text)]">وضعیت آموزش</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Play className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              هیچ آموزش فعالی وجود ندارد
            </h3>
            <p className="text-[color:var(--c-text-muted)]">
              برای شروع آموزش، از بخش کنترل‌ها استفاده کنید
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const run = status.currentRun;
  const metrics = status.metrics;
  const summary = status.summary;

  const getStatusIcon = () => {
    switch (run.status) {
      case 'running':
        return <Play className="w-5 h-5 text-green-600" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Square className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (run.status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}ثانیه`;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}دقیقه ${secs}ثانیه`;
  };

  const formatETA = (eta?: number) => {
    if (!eta) return '—';
    if (eta < 60) return `${eta}ثانیه`;
    const mins = Math.floor(eta / 60);
    const secs = eta % 60;
    return `${mins}دقیقه ${secs}ثانیه`;
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--c-text)]">وضعیت آموزش</h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>
              {run.status === 'running' ? 'در حال اجرا' :
               run.status === 'paused' ? 'متوقف شده' :
               run.status === 'completed' ? 'تکمیل شده' :
               run.status === 'error' ? 'خطا' : 'آماده'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[color:var(--c-text)]">پیشرفت کلی:</span>
            <span className="text-[color:var(--c-text)] font-medium">{run.progress}%</span>
          </div>
          <Progress value={run.progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-[color:var(--c-text-muted)]">
            <span>مرحله {run.currentStep} از {run.totalSteps}</span>
            <span>دوره {run.currentEpoch} از {run.totalEpochs}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Loss */}
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-[color:var(--c-text-muted)]">Loss فعلی</span>
            </div>
            <div className="text-lg font-semibold text-[color:var(--c-text)]">
              {metrics?.loss ? metrics.loss.toFixed(4) : '—'}
            </div>
          </div>

          {/* Best Loss */}
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-[color:var(--c-text-muted)]">بهترین Loss</span>
            </div>
            <div className="text-lg font-semibold text-[color:var(--c-text)]">
              {run.bestMetric ? run.bestMetric.toFixed(4) : '—'}
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-[color:var(--c-text-muted)]">دقت</span>
            </div>
            <div className="text-lg font-semibold text-[color:var(--c-text)]">
              {metrics?.accuracy ? `${(metrics.accuracy * 100).toFixed(1)}%` : '—'}
            </div>
          </div>

          {/* ETA */}
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-[color:var(--c-text-muted)]">زمان باقی‌مانده</span>
            </div>
            <div className="text-lg font-semibold text-[color:var(--c-text)]">
              {formatETA(run.eta)}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[color:var(--c-border)]">
          <div className="text-sm">
            <span className="text-[color:var(--c-text-muted)]">شروع:</span>
            <span className="mr-2 text-[color:var(--c-text)]">
              {new Date(run.startedAt).toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-[color:var(--c-text-muted)]">مدت زمان:</span>
            <span className="mr-2 text-[color:var(--c-text)]">
              {formatDuration(run.startedAt, run.finishedAt)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-[color:var(--c-text-muted)]">شناسه:</span>
            <span className="mr-2 text-[color:var(--c-text)] font-mono text-xs">
              {run.id.slice(-8)}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <h4 className="text-sm font-medium text-[color:var(--c-text)] mb-3">آمار کلی</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[color:var(--c-text-muted)]">کل مراحل:</span>
                <span className="mr-2 text-[color:var(--c-text)]">{summary.totalSteps}</span>
              </div>
              <div>
                <span className="text-[color:var(--c-text-muted)]">دوره فعلی:</span>
                <span className="mr-2 text-[color:var(--c-text)]">{summary.currentEpoch}</span>
              </div>
              <div>
                <span className="text-[color:var(--c-text-muted)]">مرحله فعلی:</span>
                <span className="mr-2 text-[color:var(--c-text)]">{summary.currentStep}</span>
              </div>
              <div>
                <span className="text-[color:var(--c-text-muted)]">دقت:</span>
                <span className="mr-2 text-[color:var(--c-text)]">
                  {summary.bestAccuracy ? `${(summary.bestAccuracy * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
