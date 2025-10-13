import { RefreshCw, Download, Activity, Clock, CheckCircle, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card';
import { useMetrics } from '@/features/monitoring/hooks/useMetrics';
import { MiniBar, MiniLine } from '@/features/monitoring/components/MiniBar';
import toast from 'react-hot-toast';

export function MonitoringPage() {
  const { metrics, isLoading, autoRefresh, toggleAutoRefresh, refresh } = useMetrics();

  const handleExport = () => {
    try {
      const data = JSON.stringify(metrics, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('داده‌ها با موفقیت دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود داده‌ها');
      console.error('Export error:', error);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[color:var(--c-primary)]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[color:var(--c-success)]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)] to-[color:var(--c-success)] rounded-2xl blur-lg opacity-30" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--c-primary)] to-[color:var(--c-success)] flex items-center justify-center shadow-xl">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
      <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-2">
              نظارت سیستم
              {autoRefresh && <Zap className="w-5 h-5 text-[color:var(--c-primary)] animate-pulse" />}
            </h1>
            <p className="text-sm text-[color:var(--c-muted)] mt-1.5">
              وضعیت و عملکرد سیستم را مشاهده کنید
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'soft' : 'ghost'}
            size="sm"
            icon={<RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={toggleAutoRefresh}
            title={autoRefresh ? 'غیرفعال کردن بروزرسانی خودکار' : 'فعال کردن بروزرسانی خودکار'}
            className="transition-all duration-200"
          >
            <span className="hidden sm:inline">بروزرسانی خودکار</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={refresh}
            disabled={isLoading}
            aria-label="بروزرسانی"
            title="بروزرسانی"
            className="hover:bg-[color:var(--c-primary)]/10 hover:text-[color:var(--c-primary)] transition-all duration-200"
          >
            <span className="hidden sm:inline">بروزرسانی</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExport}
            aria-label="دانلود داده‌ها"
            title="دانلود داده‌ها"
            className="hover:bg-[color:var(--c-primary)]/10 hover:text-[color:var(--c-primary)] transition-all duration-200"
          >
            <span className="hidden sm:inline">دانلود</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[color:var(--c-muted)]">کل درخواست‌ها</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)] tabular-nums">
                  {metrics.totalRequests.toLocaleString('fa-IR')}
                </p>
                <div className="flex items-center gap-1 text-xs text-[color:var(--c-success)]">
                  <TrendingUp className="w-3 h-3" />
                  <span>فعال</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--c-primary)] to-[color:var(--c-primary)]/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[color:var(--c-muted)]">میانگین زمان پاسخ</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)] tabular-nums">
                  {metrics.avgResponseTime}ms
                </p>
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Clock className="w-3 h-3" />
                  <span>سریع</span>
                </div>
      </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" aria-hidden="true" />
      </div>
    </div>
          </CardContent>
  </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-success)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[color:var(--c-muted)]">نرخ موفقیت</p>
                <p className="text-3xl font-bold text-[color:var(--c-success)] tabular-nums">
                  {metrics.successRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 text-xs text-[color:var(--c-success)]">
                  <CheckCircle className="w-3 h-3" />
                  <span>عالی</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--c-success)] to-[color:var(--c-success)]/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-error)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
      <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[color:var(--c-muted)]">نرخ خطا</p>
                <p className="text-3xl font-bold text-[color:var(--c-error)] tabular-nums">
                  {metrics.errorRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 text-xs text-[color:var(--c-muted)]">
                  <AlertCircle className="w-3 h-3" />
                  <span>زیر نظر</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--c-error)] to-[color:var(--c-error)]/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)]/5 to-transparent" />
          <CardHeader className="pb-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[color:var(--c-primary)]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[color:var(--c-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                  درخواست‌ها در طول زمان
                </h3>
                <p className="text-sm text-[color:var(--c-muted)] mt-0.5">24 ساعت گذشته</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <MiniLine data={metrics.requestsOverTime} height={200} />
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="pb-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                  توزیع زمان پاسخ
                </h3>
                <p className="text-sm text-[color:var(--c-muted)] mt-0.5">بازه‌های زمانی</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative">
            <MiniBar
              data={metrics.responseTimeDistribution.map((item, idx) => ({
                timestamp: idx,
                count: item.count,
              }))}
              height={200}
            />
            <div className="flex items-center justify-between mt-4 text-xs text-[color:var(--c-muted)] gap-2">
              {metrics.responseTimeDistribution.map((item) => (
                <div key={item.range} className="text-center">
                  <div className="font-medium mb-1">{item.range}</div>
                  <div className="text-[color:var(--c-text)] font-semibold tabular-nums">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="elevated" className="relative hover:shadow-[var(--shadow-3)] transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--c-primary)]/5 to-transparent" />
        <CardHeader className="pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[color:var(--c-primary)]/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[color:var(--c-primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--c-text)]">فعالیت‌های اخیر</h3>
              <p className="text-sm text-[color:var(--c-muted)] mt-0.5">آخرین درخواست‌ها</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 relative">
          <div className="overflow-x-auto -mx-6 rounded-xl">
            <table className="w-full text-sm">
              <thead className="border-y border-[color:var(--c-border)]/50 bg-[color:var(--c-border)]/20">
                <tr className="text-[color:var(--c-muted)]">
                  <th className="text-start py-3.5 px-6 font-semibold">زمان</th>
                  <th className="text-start py-3.5 px-6 font-semibold">متد</th>
                  <th className="text-start py-3.5 px-6 font-semibold">مسیر</th>
                  <th className="text-start py-3.5 px-6 font-semibold">وضعیت</th>
                  <th className="text-start py-3.5 px-6 font-semibold">مدت زمان</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentActivity.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-[color:var(--c-border)]/30 last:border-0 hover:bg-[color:var(--c-primary)]/5 transition-all duration-150"
                  >
                    <td className="py-4 px-6 text-[color:var(--c-text)] font-medium">
                      {formatDate(activity.timestamp)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-[color:var(--c-primary)]/10 to-[color:var(--c-primary)]/5 text-[color:var(--c-primary)] font-semibold text-xs shadow-sm">
                        {activity.method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[color:var(--c-text)] font-mono text-xs">
                      {activity.path}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                          activity.status === 200
                            ? 'bg-gradient-to-r from-[color:var(--c-success)]/10 to-[color:var(--c-success)]/5 text-[color:var(--c-success)]'
                            : 'bg-gradient-to-r from-[color:var(--c-error)]/10 to-[color:var(--c-error)]/5 text-[color:var(--c-error)]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            activity.status === 200
                              ? 'bg-[color:var(--c-success)] shadow-[0_0_8px_var(--c-success)]'
                              : 'bg-[color:var(--c-error)] shadow-[0_0_8px_var(--c-error)]'
                          }`}
                          aria-hidden="true"
                        />
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[color:var(--c-muted)] tabular-nums font-medium">
                      {formatTime(activity.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
// Default export for compatibility
export default MonitoringPage;
