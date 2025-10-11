import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Eye, 
  Download, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  BarChart3,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainingJob, JobStatus } from '@/shared/types';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

export function TrainingJobsPage() {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [activeTab, setActiveTab] = useState<'train' | 'evaluate'>('train');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingJobs();
  }, []);

  const loadTrainingJobs = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTrainingJobs();
      if (response.success && response.data) {
        setTrainingJobs(response.data);
      }
    } catch (error) {
      console.error('Failed to load training jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" icon={<Loader className="w-3 h-3 animate-spin" />}>در حال اجرا</Badge>;
      case 'succeeded':
        return <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>موفق</Badge>;
      case 'failed':
        return <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>ناموفق</Badge>;
      case 'queued':
        return <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>در صف</Badge>;
      case 'canceled':
        return <Badge variant="secondary" icon={<Square className="w-3 h-3" />}>لغو شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const handleStart = (id: string) => {
    setTrainingJobs(prev => prev.map(job => 
      job.id === id 
        ? { ...job, status: 'running', startedAt: new Date().toISOString() }
        : job
    ));
    toast.success('آموزش شروع شد');
  };

  const handlePause = (id: string) => {
    setTrainingJobs(prev => prev.map(job => 
      job.id === id 
        ? { ...job, status: 'queued' }
        : job
    ));
    toast.success('آموزش متوقف شد');
  };

  const handleCancel = (id: string) => {
    setTrainingJobs(prev => prev.map(job => 
      job.id === id 
        ? { ...job, status: 'canceled', finishedAt: new Date().toISOString() }
        : job
    ));
    toast.success('آموزش لغو شد');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این کار را حذف کنید؟')) {
      setTrainingJobs(prev => prev.filter(job => job.id !== id));
      toast.success('کار حذف شد');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startedAt?: string, finishedAt?: string) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const runningJobs = trainingJobs.filter(job => job.status === 'running');
  const completedJobs = trainingJobs.filter(job => job.status === 'succeeded');
  const failedJobs = trainingJobs.filter(job => job.status === 'failed');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">کارهای آموزش</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            مدیریت و نظارت بر فرآیند آموزش مدل‌ها
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
        >
          کار جدید
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-primary)]">{runningJobs.length}</div>
            <div className="text-sm text-[color:var(--c-text-muted)]">در حال اجرا</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-success)]">{completedJobs.length}</div>
            <div className="text-sm text-[color:var(--c-text-muted)]">تکمیل شده</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-danger)]">{failedJobs.length}</div>
            <div className="text-sm text-[color:var(--c-text-muted)]">ناموفق</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-text)]">{trainingJobs.length}</div>
            <div className="text-sm text-[color:var(--c-text-muted)]">کل کارها</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[color:var(--c-border)]/20 p-1 rounded-lg">
        <Button
          variant={activeTab === 'train' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('train')}
          className="flex-1"
        >
          آموزش
        </Button>
        <Button
          variant={activeTab === 'evaluate' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('evaluate')}
          className="flex-1"
        >
          ارزیابی
        </Button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <Card variant="outline" className="text-center py-12">
          <CardContent>
            <Loader className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              در حال بارگذاری...
            </h3>
          </CardContent>
        </Card>
      ) : trainingJobs.length === 0 ? (
        <Card variant="outline" className="text-center py-12">
          <CardContent>
            <Cpu className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              هیچ کار آموزشی وجود ندارد
            </h3>
            <p className="text-[color:var(--c-text-muted)] mb-6">
              برای شروع، از صفحه دانلودها داده‌ها و مدل‌های لازم را دانلود کنید
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
            >
              کار جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trainingJobs.map((job) => (
            <Card key={job.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[color:var(--c-text)]">{job.name}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-[color:var(--c-text-muted)]">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        <span>{job.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        <span>{job.epochs} epochs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.startedAt || '')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(job.startedAt, job.finishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[color:var(--c-text-muted)]">پیشرفت</span>
                      <span className="text-[color:var(--c-text)]">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-[color:var(--c-border)] rounded-full h-2">
                      <div 
                        className="bg-[color:var(--c-primary)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {job.metrics && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-[color:var(--c-border)]/20 rounded-lg">
                    {job.metrics.loss && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-[color:var(--c-text)]">{job.metrics.loss.toFixed(3)}</div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">Loss</div>
                      </div>
                    )}
                    {job.metrics.accuracy && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-[color:var(--c-success)]">{(job.metrics.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">Accuracy</div>
                      </div>
                    )}
                    {job.metrics.perplexity && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-[color:var(--c-primary)]">{job.metrics.perplexity.toFixed(1)}</div>
                        <div className="text-xs text-[color:var(--c-text-muted)]">Perplexity</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Last Log */}
                {job.lastLog && (
                  <div className="mb-4 p-3 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-lg">
                    <div className="text-sm font-medium text-[color:var(--c-text-muted)] mb-1">آخرین لاگ:</div>
                    <div className="text-sm text-[color:var(--c-text)] font-mono">{job.lastLog}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {job.status === 'queued' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Play className="w-4 h-4" />}
                      onClick={() => handleStart(job.id)}
                    >
                      شروع
                    </Button>
                  )}
                  {job.status === 'running' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pause className="w-4 h-4" />}
                        onClick={() => handlePause(job.id)}
                      >
                        توقف
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Square className="w-4 h-4" />}
                        onClick={() => handleCancel(job.id)}
                        className="text-[color:var(--c-danger)] hover:text-[color:var(--c-danger)] hover:bg-[color:var(--c-danger)]/10"
                      >
                        لغو
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => toast.success('مشاهده جزئیات')}
                  >
                    جزئیات
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<BarChart3 className="w-4 h-4" />}
                    onClick={() => toast.success('مشاهده نمودارها')}
                  >
                    نمودارها
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => toast.success('دانلود نتایج')}
                  >
                    دانلود
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(job.id)}
                    className="text-[color:var(--c-danger)] hover:text-[color:var(--c-danger)] hover:bg-[color:var(--c-danger)]/10"
                  >
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
