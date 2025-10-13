import React, { useState, useEffect } from 'react';
import {
  Zap,
  Settings,
  TrendingUp,
  BarChart3,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Brain,
  Layers,
  Gauge,
  Activity,
  ArrowUpRight,
  Download,
  Database as DatabaseIcon,
  Cpu,
  HardDrive
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useOptimization, HyperparameterConfig, OptimizationJob, TrialResult } from '@/hooks/useOptimization';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'text-gray-600 dark:text-gray-400',
  running: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  cancelled: 'text-gray-600 dark:text-gray-400',
};

const STATUS_ICONS = {
  pending: Clock,
  running: Activity,
  completed: CheckCircle,
  error: AlertCircle,
  cancelled: Square,
};

export function OptimizationStudioPage() {
  const [activeTab, setActiveTab] = useState<'hyperparameter' | 'pruning' | 'quantization' | 'comparison' | 'jobs'>('hyperparameter');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [optimizationName, setOptimizationName] = useState('');
  const [strategy, setStrategy] = useState<'grid' | 'random' | 'bayesian'>('random');
  const [maxTrials, setMaxTrials] = useState(10);
  const [installedSources, setInstalledSources] = useState<any[]>([]);

  const { jobs, metrics, loading, startOptimization, cancelOptimization, pruneModel, quantizeModel } = useOptimization();

  useEffect(() => {
    loadInstalledSources();
  }, []);

  const loadInstalledSources = async () => {
    const response = await apiService.getInstalledSources();
    if (response.success && response.data) {
      setInstalledSources(response.data);
    }
  };

  const handleStartOptimization = async () => {
    if (!optimizationName || !selectedModel || !selectedDataset || !outputDir) {
      toast.error('لطفا تمام فیلدهای الزامی را پر کنید');
      return;
    }

    const config: HyperparameterConfig = {
      learningRate: {
        min: 1e-5,
        max: 1e-3,
        distribution: 'log_uniform',
      },
      batchSize: [8, 16, 32],
      epochs: {
        min: 2,
        max: 10,
      },
      warmupSteps: {
        min: 100,
        max: 1000,
      },
      weightDecay: {
        min: 0.01,
        max: 0.1,
      },
    };

    try {
      await startOptimization(
        optimizationName,
        selectedModel,
        selectedDataset,
        outputDir,
        config,
        strategy,
        maxTrials
      );
      toast.success('بهینه‌سازی با موفقیت شروع شد');
      setActiveTab('jobs');
      // Reset form
      setOptimizationName('');
      setSelectedModel('');
      setSelectedDataset('');
      setOutputDir('');
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };

  const handlePruneModel = async () => {
    if (!selectedModel || !outputDir) {
      toast.error('لطفا مدل و مسیر خروجی را انتخاب کنید');
      return;
    }

    try {
      const result = await pruneModel(selectedModel, outputDir, {
        method: 'magnitude',
        sparsity: 0.5,
        structured: false,
        gradual: true,
      });
      
      if (result.success) {
        toast.success('مدل با موفقیت هرس شد');
      } else {
        toast.error(`خطا: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };

  const handleQuantizeModel = async () => {
    if (!selectedModel || !outputDir) {
      toast.error('لطفا مدل و مسیر خروجی را انتخاب کنید');
      return;
    }

    try {
      const result = await quantizeModel(selectedModel, outputDir, {
        method: 'dynamic',
        bits: 8,
        symmetric: true,
      });
      
      if (result.success) {
        toast.success('مدل با موفقیت کوانتیزه شد');
      } else {
        toast.error(`خطا: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };

  const installedModels = installedSources.filter(s => s.type === 'model');
  const installedDatasets = installedSources.filter(s => s.type === 'dataset');

  const formatDuration = (startedAt?: string, finishedAt?: string) => {
    if (!startedAt) return '-';
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">استودیو بهینه‌سازی</h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          بهینه‌سازی مدل‌ها با تنظیم پارامترها، هرس و کوانتیزاسیون
        </p>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[color:var(--c-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--c-text-muted)]">بهینه‌سازی‌ها</p>
                  <p className="text-xl font-bold text-[color:var(--c-text)]">{metrics.totalOptimizations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--c-text-muted)]">بهبود میانگین</p>
                  <p className="text-xl font-bold text-[color:var(--c-text)]">{metrics.averageImprovement.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-yellow-500/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--c-text-muted)]">بهترین دقت</p>
                  <p className="text-xl font-bold text-[color:var(--c-text)]">{(metrics.bestModelAccuracy * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--c-text-muted)]">زمان میانگین</p>
                  <p className="text-xl font-bold text-[color:var(--c-text)]">{metrics.averageTrialTime.toFixed(1)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--c-border)] overflow-x-auto">
        <Button
          variant={activeTab === 'hyperparameter' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('hyperparameter')}
          size="sm"
        >
          تنظیم پارامترها
        </Button>
        <Button
          variant={activeTab === 'pruning' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('pruning')}
          size="sm"
        >
          هرس مدل
        </Button>
        <Button
          variant={activeTab === 'quantization' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('quantization')}
          size="sm"
        >
          کوانتیزاسیون
        </Button>
        <Button
          variant={activeTab === 'comparison' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('comparison')}
          size="sm"
        >
          مقایسه مدل‌ها
        </Button>
        <Button
          variant={activeTab === 'jobs' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('jobs')}
          size="sm"
        >
          وظایف ({jobs.length})
        </Button>
      </div>

      {/* Hyperparameter Optimization */}
      {activeTab === 'hyperparameter' && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-[color:var(--c-text)]">بهینه‌سازی پارامترها</h2>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              جستجوی خودکار بهترین ترکیب پارامترها برای مدل شما
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  نام بهینه‌سازی *
                </label>
                <input
                  type="text"
                  value={optimizationName}
                  onChange={(e) => setOptimizationName(e.target.value)}
                  placeholder="مثال: Persian BERT Optimization"
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  استراتژی جستجو
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                >
                  <option value="random">جستجوی تصادفی</option>
                  <option value="grid">جستجوی شبکه‌ای</option>
                  <option value="bayesian">بهینه‌سازی بیزی</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مدل پایه *
                </label>
                {installedModels.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[color:var(--c-warning-50)] dark:bg-[color:var(--c-warning-900)] text-[color:var(--c-warning-600)] dark:text-[color:var(--c-warning-300)] text-sm">
                    هیچ مدلی نصب نشده. لطفا از صفحه مرکز مدل‌ها یک مدل دانلود کنید.
                  </div>
                ) : (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  >
                    <option value="">انتخاب مدل...</option>
                    {installedModels.map(model => (
                      <option key={model.id} value={model.path}>
                        {model.name} ({(model.size / (1024 * 1024)).toFixed(0)} MB)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  دیتاست *
                </label>
                {installedDatasets.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[color:var(--c-warning-50)] dark:bg-[color:var(--c-warning-900)] text-[color:var(--c-warning-600)] dark:text-[color:var(--c-warning-300)] text-sm">
                    هیچ دیتاستی نصب نشده. لطفا از صفحه مرکز مدل‌ها یک دیتاست دانلود کنید.
                  </div>
                ) : (
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  >
                    <option value="">انتخاب دیتاست...</option>
                    {installedDatasets.map(dataset => (
                      <option key={dataset.id} value={dataset.path}>
                        {dataset.name} ({dataset.fileCount} فایل)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مسیر خروجی *
                </label>
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="models/optimized/my-model"
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  تعداد آزمایش‌ها
                </label>
                <input
                  type="number"
                  value={maxTrials}
                  onChange={(e) => setMaxTrials(parseInt(e.target.value))}
                  min={3}
                  max={50}
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="lg"
                icon={<Play className="w-5 h-5" />}
                onClick={handleStartOptimization}
                disabled={loading || !optimizationName || !selectedModel || !selectedDataset || !outputDir}
              >
                شروع بهینه‌سازی
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Pruning */}
      {activeTab === 'pruning' && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-[color:var(--c-text)]">هرس مدل</h2>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              حذف وزن‌های غیرضروری برای کاهش اندازه مدل
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مدل ورودی *
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                >
                  <option value="">انتخاب مدل...</option>
                  {installedModels.map(model => (
                    <option key={model.id} value={model.path}>
                      {model.name} ({(model.size / (1024 * 1024)).toFixed(0)} MB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مسیر خروجی *
                </label>
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="models/pruned/my-model"
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="lg"
                icon={<Layers className="w-5 h-5" />}
                onClick={handlePruneModel}
                disabled={loading || !selectedModel || !outputDir}
              >
                شروع هرس
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Quantization */}
      {activeTab === 'quantization' && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-[color:var(--c-text)]">کوانتیزاسیون مدل</h2>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              کاهش دقت وزن‌ها برای بهبود سرعت و کاهش حافظه
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مدل ورودی *
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                >
                  <option value="">انتخاب مدل...</option>
                  {installedModels.map(model => (
                    <option key={model.id} value={model.path}>
                      {model.name} ({(model.size / (1024 * 1024)).toFixed(0)} MB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  مسیر خروجی *
                </label>
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="models/quantized/my-model"
                  className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="lg"
                icon={<HardDrive className="w-5 h-5" />}
                onClick={handleQuantizeModel}
                disabled={loading || !selectedModel || !outputDir}
              >
                شروع کوانتیزاسیون
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Comparison */}
      {activeTab === 'comparison' && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-[color:var(--c-text)]">مقایسه مدل‌ها</h2>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              مقایسه عملکرد مدل‌های مختلف روی دیتاست تست
            </p>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="مقایسه مدل‌ها"
              description="این ویژگی به زودی اضافه خواهد شد"
              illustration="default"
              size="md"
            />
          </CardContent>
        </Card>
      )}

      {/* Optimization Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="card" height={200} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card variant="outline" className="text-center py-12">
              <CardContent>
                <EmptyState
                  icon={Zap}
                  title="هیچ بهینه‌سازی‌ای وجود ندارد"
                  description="برای شروع، یک بهینه‌سازی جدید ایجاد کنید"
                  illustration="default"
                  size="lg"
                />
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => {
              const StatusIcon = STATUS_ICONS[job.status];
              const isActive = job.status === 'running';
              
              return (
                <Card key={job.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${isActive ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[color:var(--c-text)] mb-1">{job.name}</h3>
                          <p className="text-xs text-[color:var(--c-text-muted)]">{job.id}</p>
                        </div>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'success' : job.status === 'error' || job.status === 'cancelled' ? 'error' : 'default'}>
                        {job.status === 'running' ? 'در حال اجرا' : 
                         job.status === 'completed' ? 'تکمیل شده' :
                         job.status === 'error' ? 'خطا' :
                         job.status === 'cancelled' ? 'لغو شده' : 'در انتظار'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    {isActive && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[color:var(--c-text)]">پیشرفت:</span>
                          <span className="text-[color:var(--c-text)] font-medium">{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Trial Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-[color:var(--c-bg-secondary)]">
                      <div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">آزمایش فعلی</div>
                        <div className="text-sm font-medium text-[color:var(--c-text)]">
                          {job.currentTrial}/{job.totalTrials}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">استراتژی</div>
                        <div className="text-sm font-medium text-[color:var(--c-text)]">
                          {job.strategy === 'random' ? 'تصادفی' : 
                           job.strategy === 'grid' ? 'شبکه‌ای' : 'بیزی'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">بهترین دقت</div>
                        <div className="text-sm font-medium text-[color:var(--c-text)]">
                          {job.bestTrial ? `${(job.bestTrial.metrics.accuracy * 100).toFixed(1)}%` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">زمان</div>
                        <div className="text-sm font-medium text-[color:var(--c-text)]">
                          {formatDuration(job.startedAt, job.finishedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Error */}
                    {job.error && (
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                        {job.error}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Square className="w-4 h-4" />}
                          onClick={() => cancelOptimization(job.id)}
                        >
                          لغو
                        </Button>
                      ) : job.status === 'completed' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          onClick={() => window.open(job.outputDir, '_blank')}
                        >
                          دانلود نتایج
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default OptimizationStudioPage;
