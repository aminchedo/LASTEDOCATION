import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Activity,
  Cpu,
  Database,
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Play,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { apiService } from '@/shared/services/api.service';
import { useTraining } from '@/hooks/useTraining';
import { useDownloads } from '@/hooks/useDownloads';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  isPositive?: boolean;
  trend?: number[];
}

export function HomePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { jobs: trainingJobs } = useTraining();
  const { jobs: downloadJobs } = useDownloads();

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await apiService.getMetrics();
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeTraining = trainingJobs?.find(j => 
    j.status === 'training' || j.status === 'preparing' || j.status === 'evaluating'
  );
  const activeDownloads = downloadJobs?.filter(j => j.status === 'downloading') || [];
  const completedToday = trainingJobs?.filter(j => 
    j.status === 'completed' && 
    j.finishedAt && 
    new Date(j.finishedAt).toDateString() === new Date().toDateString()
  ).length || 0;

  const quickStats: QuickStat[] = [
    {
      label: 'درخواست‌های کل',
      value: loading ? '...' : metrics?.totalRequests || 0,
      icon: Zap,
      change: metrics?.totalRequests > 0 ? '+12%' : '—',
      isPositive: true,
      trend: [20, 35, 30, 45, 40, 55, 50]
    },
    {
      label: 'زمان پاسخ میانگین',
      value: loading ? '...' : `${Math.round(metrics?.avgResponseTimeMs || 0)}ms`,
      icon: Clock,
      change: '-8%',
      isPositive: true,
      trend: [80, 75, 70, 72, 68, 65, 60]
    },
    {
      label: 'نرخ موفقیت',
      value: loading ? '...' : `${Math.round(metrics?.successRate || 100)}%`,
      icon: CheckCircle,
      change: '+2%',
      isPositive: true,
      trend: [95, 96, 97, 96, 98, 97, 99]
    },
    {
      label: 'نرخ خطا',
      value: loading ? '...' : `${metrics?.errorRate?.toFixed(1) || 0}%`,
      icon: AlertCircle,
      change: '-15%',
      isPositive: true,
      trend: [5, 4, 3, 4, 2, 2, 1]
    },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: 'چت هوش مصنوعی',
      description: 'گفتگو با مدل‌های پیشرفته زبانی فارسی',
      href: '/chat',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500',
      count: metrics?.recentActivity?.length || 0,
      countLabel: 'فعالیت اخیر'
    },
    {
      icon: Database,
      title: 'مرکز مدل‌ها',
      description: 'دانلود و مدیریت مدل‌ها و دیتاست‌ها',
      href: '/model-hub',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500',
      count: downloadJobs?.length || 0,
      countLabel: 'دانلود'
    },
    {
      icon: Cpu,
      title: 'استودیو آموزش',
      description: 'آموزش و بهینه‌سازی مدل‌های زبانی',
      href: '/training-studio',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500',
      count: trainingJobs?.length || 0,
      countLabel: 'وظیفه آموزش'
    },
    {
      icon: Zap,
      title: 'استودیو بهینه‌سازی',
      description: 'تنظیم پارامترها، هرس و کوانتیزاسیون',
      href: '/optimization-studio',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500',
      count: 0,
      countLabel: 'بهینه‌سازی'
    },
    {
      icon: Activity,
      title: 'مانیتورینگ',
      description: 'نظارت زنده بر عملکرد سیستم',
      href: '/metrics',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-500',
      count: metrics?.totalRequests || 0,
      countLabel: 'درخواست'
    },
  ];

  const MiniSparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <svg className="w-16 h-8" viewBox="0 0 64 32" preserveAspectRatio="none">
        <polyline
          points={data.map((v, i) => `${(i / (data.length - 1)) * 64},${32 - ((v - min) / range) * 28}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[color:var(--c-primary)]"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--c-text)]">
                  پلتفرم آموزش هوش مصنوعی
                </h1>
                <p className="text-sm text-[color:var(--c-text-muted)] mt-1">
                  سیستم یکپارچه مدیریت، آموزش و نظارت بر مدل‌های زبانی فارسی
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/chat">
              <Button variant="primary" icon={<Play className="w-4 h-4" />}>
                شروع چت
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.isPositive;
            
            return (
              <Card key={stat.label} variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[color:var(--c-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm text-[color:var(--c-text-muted)]">{stat.label}</p>
                        <p className="text-2xl font-bold text-[color:var(--c-text)] mt-1">{stat.value}</p>
                      </div>
                    </div>
                    {stat.trend && <MiniSparkline data={stat.trend} />}
                  </div>
                  {stat.change && stat.change !== '—' && (
                    <div className="flex items-center gap-1 text-sm">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {stat.change}
                      </span>
                      <span className="text-[color:var(--c-text-muted)]">نسبت به دیروز</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Status */}
        {(activeTraining || activeDownloads.length > 0) && (
          <Card variant="elevated" className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">فعالیت‌های جاری</h3>
              </div>
              <div className="space-y-3">
                {activeTraining && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--c-bg)]">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-[color:var(--c-text)]">{activeTraining.name}</p>
                        <p className="text-sm text-[color:var(--c-text-muted)]">
                          آموزش در حال اجرا • {activeTraining.progress}%
                        </p>
                      </div>
                    </div>
                    <Link to="/training-studio">
                      <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-4 h-4" />}>
                        مشاهده
                      </Button>
                    </Link>
                  </div>
                )}
                {activeDownloads.map(download => (
                  <div key={download.id} className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--c-bg)]">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-blue-600 animate-bounce" />
                      <div>
                        <p className="font-medium text-[color:var(--c-text)]">{download.repoId.split('/').pop()}</p>
                        <p className="text-sm text-[color:var(--c-text-muted)]">
                          در حال دانلود • {download.progress}%
                        </p>
                      </div>
                    </div>
                    <Link to="/model-hub">
                      <Button variant="ghost" size="sm" icon={<ArrowUpRight className="w-4 h-4" />}>
                        مشاهده
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--c-text)] mb-4">امکانات سیستم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              
              return (
                <Link key={feature.title} to={feature.href}>
                  <Card 
                    variant="elevated" 
                    className="group hover:shadow-[var(--shadow-3)] hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        {feature.count > 0 && (
                          <Badge variant="secondary">{feature.count}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2 group-hover:text-[color:var(--c-primary)] transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-[color:var(--c-text-muted)] leading-relaxed">
                        {feature.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-[color:var(--c-primary)] font-medium group-hover:gap-3 transition-all">
                        <span>مشاهده</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-[color:var(--c-text)]">دسترسی سریع</h3>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/model-hub">
              <div className="p-4 rounded-lg border border-[color:var(--c-border)] hover:border-[color:var(--c-primary)] hover:bg-[color:var(--c-bg-secondary)] transition-all group cursor-pointer">
                <Database className="w-6 h-6 text-[color:var(--c-primary)] mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[color:var(--c-text)] mb-1">دانلود مدل جدید</p>
                <p className="text-xs text-[color:var(--c-text-muted)]">از Hugging Face</p>
              </div>
            </Link>
            <Link to="/training-studio">
              <div className="p-4 rounded-lg border border-[color:var(--c-border)] hover:border-[color:var(--c-primary)] hover:bg-[color:var(--c-bg-secondary)] transition-all group cursor-pointer">
                <Play className="w-6 h-6 text-[color:var(--c-primary)] mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[color:var(--c-text)] mb-1">شروع آموزش</p>
                <p className="text-xs text-[color:var(--c-text-muted)]">با مدل‌های دانلود شده</p>
              </div>
            </Link>
            <Link to="/metrics">
              <div className="p-4 rounded-lg border border-[color:var(--c-border)] hover:border-[color:var(--c-primary)] hover:bg-[color:var(--c-bg-secondary)] transition-all group cursor-pointer">
                <BarChart3 className="w-6 h-6 text-[color:var(--c-primary)] mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[color:var(--c-text)] mb-1">مشاهده آمار</p>
                <p className="text-xs text-[color:var(--c-text-muted)]">عملکرد سیستم</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        {completedToday > 0 && (
          <Card variant="elevated" className="bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[color:var(--c-text)]">
                    عالی! {completedToday} آموزش امروز تکمیل شد
                  </p>
                  <p className="text-sm text-[color:var(--c-text-muted)]">
                    سیستم شما به خوبی در حال کار است
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default HomePage;
