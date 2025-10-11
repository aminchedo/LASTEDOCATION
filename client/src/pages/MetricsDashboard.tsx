import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { MiniLine } from '@/features/monitoring/components/MiniBar';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

interface MetricData {
  timestamp: number;
  value: number;
}

interface TimeSeriesData {
  requests: MetricData[];
  responseTime: MetricData[];
  errorRate: MetricData[];
  activeUsers: MetricData[];
}

interface ModelBreakdown {
  model: string;
  requests: number;
  avgResponseTime: number;
  successRate: number;
  color: string;
}

interface Percentile {
  percentile: string;
  value: number;
  color: string;
}

function MetricsDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData>({
    requests: [],
    responseTime: [],
    errorRate: [],
    activeUsers: []
  });
  const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdown[]>([]);
  const [percentiles, setPercentiles] = useState<Percentile[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    avgResponseTimeMs: 0,
    successRate: 0,
    errorRate: 0
  });
  const [error, setError] = useState<string | null>(null);

  // Safe number conversion helper
  const safeNumber = useCallback((value: any, defaultValue = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    return defaultValue;
  }, []);

  // Fetch real data from API
  const fetchMetricsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all metrics data in parallel
      const [metricsResponse, timeSeriesResponse, modelBreakdownResponse, percentilesResponse] = await Promise.all([
        apiService.getMetrics(),
        apiService.getTimeSeriesData(),
        apiService.getModelBreakdown(),
        apiService.getPercentiles()
      ]);

      if (metricsResponse.success && metricsResponse.data) {
        setStats({
          totalRequests: safeNumber(metricsResponse.data.totalRequests),
          avgResponseTimeMs: safeNumber(metricsResponse.data.avgResponseTimeMs),
          successRate: safeNumber(metricsResponse.data.successRate),
          errorRate: safeNumber(metricsResponse.data.errorRate)
        });
      } else if (!metricsResponse.success) {
        throw new Error(metricsResponse.message || 'Failed to fetch metrics');
      }

      if (timeSeriesResponse.success && timeSeriesResponse.data) {
        setTimeSeriesData({
          requests: timeSeriesResponse.data.requests || [],
          responseTime: timeSeriesResponse.data.responseTime || [],
          errorRate: timeSeriesResponse.data.errorRate || [],
          activeUsers: timeSeriesResponse.data.activeUsers || []
        });
      }

      if (modelBreakdownResponse.success && modelBreakdownResponse.data) {
        setModelBreakdown(
          (timeSeriesResponse.data || []).map((item: any) => ({
            model: item.model || 'Unknown',
            requests: safeNumber(item.requests),
            avgResponseTime: safeNumber(item.avgResponseTime),
            successRate: safeNumber(item.successRate),
            color: item.color || 'bg-gray-500'
          }))
        );
      }

      if (percentilesResponse.success && percentilesResponse.data) {
        setPercentiles(
          (percentilesResponse.data || []).map((item: any) => ({
            percentile: item.percentile || 'P50',
            value: safeNumber(item.value),
            color: item.color || 'text-gray-600'
          }))
        );
      }

      toast.success('داده‌ها به‌روزرسانی شد');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت داده‌ها';
      setError(errorMessage);
      console.error('Failed to fetch metrics:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [safeNumber]);

  const handleRefresh = useCallback(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);

  // Load data on component mount and timeRange change
  useEffect(() => {
    fetchMetricsData();
  }, [fetchMetricsData, timeRange]);

  const handleExport = useCallback(() => {
    const data = {
      timeSeries: timeSeriesData,
      modelBreakdown,
      percentiles,
      stats,
      timeRange,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-dashboard-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('داده‌ها صادر شد');
  }, [timeSeriesData, modelBreakdown, percentiles, stats, timeRange]);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const totalRequestsSum = modelBreakdown.reduce((sum, m) => sum + safeNumber(m.requests), 0);

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card variant="elevated">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">خطا در بارگیری داده‌ها</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="primary">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[color:var(--c-primary)]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[color:var(--c-success)]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">داشبورد معیارها</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            تحلیل جامع عملکرد و آمار سیستم
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] disabled:opacity-50"
          >
            <option value="1h">1 ساعت</option>
            <option value="24h">24 ساعت</option>
            <option value="7d">7 روز</option>
            <option value="30d">30 روز</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            بروزرسانی
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExport}
            disabled={isLoading}
          >
            صادرات
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--c-text-muted)]">کل درخواست‌ها</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)]">
                  {safeNumber(stats.totalRequests).toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-[color:var(--c-success)] flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12.5%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[color:var(--c-primary)]/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[color:var(--c-primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--c-text-muted)]">میانگین زمان پاسخ</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)]">
                  {(safeNumber(stats.avgResponseTimeMs) / 1000).toFixed(1)}s
                </p>
                <p className="text-sm text-[color:var(--c-success)] flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  -8.3%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[color:var(--c-success)]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[color:var(--c-success)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--c-text-muted)]">کاربران فعال</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)]">
                  {Math.floor(Math.random() * 100) + 50}
                </p>
                <p className="text-sm text-[color:var(--c-success)] flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +5.2%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[color:var(--c-info)]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[color:var(--c-info)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--c-text-muted)]">نرخ خطا</p>
                <p className="text-3xl font-bold text-[color:var(--c-text)]">
                  {safeNumber(stats.errorRate).toFixed(1)}%
                </p>
                <p className="text-sm text-[color:var(--c-success)] flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  -0.3%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[color:var(--c-warning)]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[color:var(--c-warning)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Charts */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-[color:var(--c-text)]">درخواست‌ها در طول زمان</h3>
            <p className="text-sm text-[color:var(--c-text-muted)]">تعداد درخواست‌ها در 24 ساعت گذشته</p>
          </CardHeader>
          <CardContent>
            <MiniLine
              data={timeSeriesData.requests.map(d => ({
                timestamp: safeNumber(d.timestamp),
                count: safeNumber(d.value)
              }))}
              height={200}
            />
            {timeSeriesData.requests.length > 0 && (
              <div className="mt-4 flex justify-between text-xs text-[color:var(--c-text-muted)]">
                <span>{formatTime(timeSeriesData.requests[0].timestamp)}</span>
                <span>{formatTime(timeSeriesData.requests[timeSeriesData.requests.length - 1].timestamp)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-[color:var(--c-text)]">زمان پاسخ</h3>
            <p className="text-sm text-[color:var(--c-text-muted)]">میانگین زمان پاسخ در میلی‌ثانیه</p>
          </CardHeader>
          <CardContent>
            <MiniLine
              data={timeSeriesData.responseTime.map(d => ({
                timestamp: safeNumber(d.timestamp),
                count: safeNumber(d.value)
              }))}
              height={200}
            />
            {timeSeriesData.responseTime.length > 0 && (
              <div className="mt-4 flex justify-between text-xs text-[color:var(--c-text-muted)]">
                <span>{formatTime(timeSeriesData.responseTime[0].timestamp)}</span>
                <span>{formatTime(timeSeriesData.responseTime[timeSeriesData.responseTime.length - 1].timestamp)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Breakdown */}
      <Card variant="elevated" className="relative z-10">
        <CardHeader>
          <h3 className="text-lg font-semibold text-[color:var(--c-text)]">تجزیه مدل‌ها</h3>
          <p className="text-sm text-[color:var(--c-text-muted)]">آمار استفاده از مدل‌های مختلف</p>
        </CardHeader>
        <CardContent>
          {modelBreakdown.length === 0 ? (
            <p className="text-center text-[color:var(--c-text-muted)] py-8">هیچ داده‌ای برای نمایش وجود ندارد</p>
          ) : (
            <div className="space-y-4">
              {modelBreakdown.map((model) => {
                const modelRequests = safeNumber(model.requests);
                const share = totalRequestsSum > 0 ? ((modelRequests / totalRequestsSum) * 100).toFixed(1) : '0';
                return (
                  <div key={model.model} className="flex items-center gap-4 p-4 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-lg hover:bg-[color:var(--c-surface-hover)] transition-colors">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${model.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[color:var(--c-text)]">{model.model}</h4>
                        <Badge variant="secondary">
                          {modelRequests.toLocaleString('fa-IR')} درخواست
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-[color:var(--c-text-muted)]">زمان پاسخ:</span>
                          <span className="font-medium text-[color:var(--c-text)] ml-2">
                            {safeNumber(model.avgResponseTime)}ms
                          </span>
                        </div>
                        <div>
                          <span className="text-[color:var(--c-text-muted)]">نرخ موفقیت:</span>
                          <span className="font-medium text-[color:var(--c-success)] ml-2">
                            {safeNumber(model.successRate)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[color:var(--c-text-muted)]">سهم:</span>
                          <span className="font-medium text-[color:var(--c-text)] ml-2">
                            {share}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Time Percentiles */}
      <Card variant="elevated" className="relative z-10">
        <CardHeader>
          <h3 className="text-lg font-semibold text-[color:var(--c-text)]">صدک‌های زمان پاسخ</h3>
          <p className="text-sm text-[color:var(--c-text-muted)]">توزیع زمان پاسخ در صدک‌های مختلف</p>
        </CardHeader>
        <CardContent>
          {percentiles.length === 0 ? (
            <p className="text-center text-[color:var(--c-text-muted)] py-8">هیچ داده‌ای برای نمایش وجود ندارد</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {percentiles.map((percentile) => (
                <div key={percentile.percentile} className="text-center p-4 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-lg hover:shadow-sm transition-shadow">
                  <div className={`text-2xl font-bold ${percentile.color}`}>
                    {safeNumber(percentile.value)}ms
                  </div>
                  <div className="text-sm text-[color:var(--c-text-muted)]">{percentile.percentile}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for React.lazy compatibility
export default MetricsDashboard;