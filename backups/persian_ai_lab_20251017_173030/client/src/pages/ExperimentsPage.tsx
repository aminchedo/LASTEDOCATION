import { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  Calendar,
  Hash,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Experiment, JobStatus } from '@/shared/types';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showNewExperimentModal, setShowNewExperimentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    dataset: '',
    model: '',
    notes: ''
  });

  // Fetch experiments from API
  const fetchExperiments = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setIsLoading(true);
      else setIsRefreshing(true);

      const response = await fetch(`${API_BASE_URL}/api/experiments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت آزمایش‌ها');
      }

      const data = await response.json();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast.error('خطا در دریافت اطلاعات آزمایش‌ها');
      setExperiments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
    
    // Auto-refresh every 30 seconds for running experiments
    const interval = setInterval(() => {
      const hasRunning = experiments.some(exp => exp.status === 'running');
      if (hasRunning) {
        fetchExperiments(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredExperiments = experiments.filter(experiment => {
    const matchesSearch = experiment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         experiment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         experiment.dataset.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || experiment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: JobStatus) => {
    const statusConfig = {
      running: { 
        variant: 'default' as const, 
        icon: Play, 
        label: 'در حال اجرا',
        className: 'animate-pulse'
      },
      succeeded: { 
        variant: 'success' as const, 
        icon: CheckCircle, 
        label: 'موفق',
        className: ''
      },
      failed: { 
        variant: 'danger' as const, 
        icon: AlertCircle, 
        label: 'ناموفق',
        className: ''
      },
      queued: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        label: 'در صف',
        className: ''
      },
      canceled: { 
        variant: 'secondary' as const, 
        icon: Pause, 
        label: 'لغو شده',
        className: ''
      }
    };

    const config = statusConfig[status] || { 
      variant: 'secondary' as const, 
      icon: AlertCircle, 
      label: 'نامشخص',
      className: ''
    };

    const Icon = config.icon;

    return (
      <Badge 
        variant={config.variant} 
        icon={<Icon className="w-3 h-3" />}
        className={config.className}
      >
        {config.label}
      </Badge>
    );
  };

  const handleCreateExperiment = async () => {
    if (!newExperiment.name || !newExperiment.dataset || !newExperiment.model) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/experiments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(newExperiment),
      });

      if (!response.ok) {
        throw new Error('خطا در ایجاد آزمایش');
      }

      toast.success('آزمایش جدید با موفقیت ایجاد شد');
      setShowNewExperimentModal(false);
      setNewExperiment({ name: '', description: '', dataset: '', model: '', notes: '' });
      fetchExperiments();
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast.error('خطا در ایجاد آزمایش جدید');
    }
  };

  const handleStart = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiments/${id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('خطا در شروع آزمایش');
      }

      toast.success('آزمایش شروع شد');
      fetchExperiments(false);
    } catch (error) {
      console.error('Error starting experiment:', error);
      toast.error('خطا در شروع آزمایش');
    }
  };

  const handleStop = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiments/${id}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('خطا در توقف آزمایش');
      }

      toast.success('آزمایش متوقف شد');
      fetchExperiments(false);
    } catch (error) {
      console.error('Error stopping experiment:', error);
      toast.error('خطا در توقف آزمایش');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این آزمایش را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/experiments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('خطا در حذف آزمایش');
      }

      toast.success('آزمایش حذف شد');
      fetchExperiments(false);
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast.error('خطا در حذف آزمایش');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/experiments/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('خطا در دانلود نتایج');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experiment_${id}_results.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('نتایج دانلود شد');
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error('خطا در دانلود نتایج');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const runningExperiments = experiments.filter(exp => exp.status === 'running');
  const completedExperiments = experiments.filter(exp => exp.status === 'succeeded');
  const failedExperiments = experiments.filter(exp => exp.status === 'failed');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-[color:var(--c-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[color:var(--c-text-muted)]">در حال بارگذاری آزمایش‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">آزمایش‌ها</h1>
            <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
              مدیریت و نظارت بر آزمایش‌های مدل
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchExperiments(false)}
            disabled={isRefreshing}
            aria-label="بروزرسانی"
            title="بروزرسانی لیست"
          />
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowNewExperimentModal(true)}
          className="shadow-[0_4px_20px_-4px_var(--c-primary)] hover:shadow-[0_6px_24px_-4px_var(--c-primary)] transition-shadow duration-300"
        >
          آزمایش جدید
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:scale-105 border-l-4 border-l-[color:var(--c-primary)]">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-[color:var(--c-primary)] mb-1 group-hover:scale-110 transition-transform duration-300">
              {runningExperiments.length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)] font-medium">در حال اجرا</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:scale-105 border-l-4 border-l-[color:var(--c-success)]">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-[color:var(--c-success)] mb-1 group-hover:scale-110 transition-transform duration-300">
              {completedExperiments.length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)] font-medium">تکمیل شده</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:scale-105 border-l-4 border-l-[color:var(--c-danger)]">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-[color:var(--c-danger)] mb-1 group-hover:scale-110 transition-transform duration-300">
              {failedExperiments.length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)] font-medium">ناموفق</div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:scale-105 border-l-4 border-l-[color:var(--c-text)]">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-[color:var(--c-text)] mb-1 group-hover:scale-110 transition-transform duration-300">
              {experiments.length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)] font-medium">کل آزمایش‌ها</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="جستجو در آزمایش‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="transition-all duration-300 focus:shadow-[0_0_0_3px_var(--c-primary)]/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-[color:var(--c-border)] rounded-xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] focus:border-transparent transition-all duration-300 cursor-pointer hover:border-[color:var(--c-primary)]"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="running">در حال اجرا</option>
            <option value="succeeded">موفق</option>
            <option value="failed">ناموفق</option>
            <option value="queued">در صف</option>
            <option value="canceled">لغو شده</option>
          </select>
          <Button 
            variant="outline" 
            icon={<Filter className="w-5 h-5" />}
            className="hover:bg-[color:var(--c-primary)]/10 hover:border-[color:var(--c-primary)] hover:text-[color:var(--c-primary)] transition-all duration-300"
          >
            فیلتر
          </Button>
        </div>
      </div>

      {/* New Experiment Modal */}
      {showNewExperimentModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
          onClick={(e) => e.target === e.currentTarget && setShowNewExperimentModal(false)}
        >
          <Card className="w-full max-w-2xl mx-4 animate-[scaleIn_0.3s_ease-out] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]">
            <CardHeader className="border-b border-[color:var(--c-border)] bg-gradient-to-l from-[color:var(--c-surface)] to-transparent">
              <h2 className="text-xl font-bold text-[color:var(--c-text)]">آزمایش جدید</h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--c-text)] mb-2">
                    نام آزمایش <span className="text-[color:var(--c-danger)]">*</span>
                  </label>
                  <Input 
                    placeholder="نام آزمایش را وارد کنید" 
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--c-text)] mb-2">توضیحات</label>
                  <textarea
                    placeholder="توضیحات آزمایش..."
                    value={newExperiment.description}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-24 p-3 border border-[color:var(--c-border)] rounded-xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] focus:border-transparent resize-none transition-all duration-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[color:var(--c-text)] mb-2">
                      دیتاست <span className="text-[color:var(--c-danger)]">*</span>
                    </label>
                    <Input
                      placeholder="نام دیتاست"
                      value={newExperiment.dataset}
                      onChange={(e) => setNewExperiment(prev => ({ ...prev, dataset: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[color:var(--c-text)] mb-2">
                      مدل <span className="text-[color:var(--c-danger)]">*</span>
                    </label>
                    <Input
                      placeholder="نام مدل"
                      value={newExperiment.model}
                      onChange={(e) => setNewExperiment(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--c-text)] mb-2">یادداشت‌ها</label>
                  <textarea
                    placeholder="یادداشت‌های اضافی..."
                    value={newExperiment.notes}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-20 p-3 border border-[color:var(--c-border)] rounded-xl bg-[color:var(--c-surface)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] focus:border-transparent resize-none transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[color:var(--c-border)]">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowNewExperimentModal(false)}
                  className="hover:bg-[color:var(--c-danger)]/10 hover:text-[color:var(--c-danger)]"
                >
                  لغو
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleCreateExperiment}
                  className="shadow-[0_4px_20px_-4px_var(--c-primary)] hover:shadow-[0_6px_24px_-4px_var(--c-primary)]"
                >
                  ایجاد
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Experiments List */}
      {filteredExperiments.length === 0 ? (
        <Card variant="outline" className="text-center py-16 bg-gradient-to-br from-[color:var(--c-surface)] to-transparent">
          <CardContent>
            <div className="relative inline-block">
              <FlaskConical className="w-20 h-20 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-bounce" />
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-[color:var(--c-primary)]/20 rounded-full blur-xl animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-[color:var(--c-text)] mb-2">
              هیچ آزمایشی یافت نشد
            </h3>
            <p className="text-[color:var(--c-text-muted)] mb-6 max-w-md mx-auto">
              برای شروع، یک آزمایش جدید ایجاد کنید و نتایج را پیگیری نمایید
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowNewExperimentModal(true)}
              className="shadow-[0_4px_20px_-4px_var(--c-primary)] hover:shadow-[0_6px_24px_-4px_var(--c-primary)]"
            >
              آزمایش جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExperiments.map((experiment) => (
            <Card 
              key={experiment.id} 
              variant="elevated" 
              className="group hover:shadow-[var(--shadow-3)] transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-transparent hover:border-r-[color:var(--c-primary)]"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[color:var(--c-text)] group-hover:text-[color:var(--c-primary)] transition-colors duration-300">
                        {experiment.name}
                      </h3>
                      {getStatusBadge(experiment.status)}
                    </div>
                    <p className="text-[color:var(--c-text-muted)] mb-3 leading-relaxed">{experiment.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-[color:var(--c-text-muted)]">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-[color:var(--c-primary)]" />
                        <span>{experiment.dataset}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[color:var(--c-primary)]" />
                        <span>{experiment.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[color:var(--c-primary)]" />
                        <span>{formatDate(experiment.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">ID: {experiment.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                {Object.keys(experiment.metrics).length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-5 bg-gradient-to-br from-[color:var(--c-border)]/30 to-transparent rounded-xl border border-[color:var(--c-border)]/50 backdrop-blur-sm">
                    {experiment.metrics.loss !== undefined && (
                      <div className="text-center group/metric hover:scale-105 transition-transform duration-300">
                        <div className="text-xl font-bold text-[color:var(--c-text)] mb-1">{experiment.metrics.loss.toFixed(3)}</div>
                        <div className="text-xs text-[color:var(--c-text-muted)] font-semibold uppercase tracking-wide">Loss</div>
                      </div>
                    )}
                    {experiment.metrics.accuracy !== undefined && (
                      <div className="text-center group/metric hover:scale-105 transition-transform duration-300">
                        <div className="text-xl font-bold text-[color:var(--c-success)] mb-1">{(experiment.metrics.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-xs text-[color:var(--c-text-muted)] font-semibold uppercase tracking-wide">Accuracy</div>
                      </div>
                    )}
                    {experiment.metrics.perplexity !== undefined && (
                      <div className="text-center group/metric hover:scale-105 transition-transform duration-300">
                        <div className="text-xl font-bold text-[color:var(--c-primary)] mb-1">{experiment.metrics.perplexity.toFixed(1)}</div>
                        <div className="text-xs text-[color:var(--c-text-muted)] font-semibold uppercase tracking-wide">Perplexity</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {experiment.notes && (
                  <div className="mb-4 p-4 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-xl">
                    <div className="text-xs font-bold text-[color:var(--c-text-muted)] mb-2 uppercase tracking-wide">یادداشت‌ها:</div>
                    <div className="text-sm text-[color:var(--c-text)] leading-relaxed">{experiment.notes}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {experiment.status === 'queued' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Play className="w-4 h-4" />}
                      onClick={() => handleStart(experiment.id)}
                      className="shadow-[0_2px_10px_-2px_var(--c-primary)]"
                    >
                      شروع
                    </Button>
                  )}
                  {experiment.status === 'running' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pause className="w-4 h-4" />}
                      onClick={() => handleStop(experiment.id)}
                      className="hover:bg-[color:var(--c-warning)]/10 hover:text-[color:var(--c-warning)]"
                    >
                      توقف
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => toast.success('مشاهده جزئیات آزمایش')}
                    className="hover:bg-[color:var(--c-primary)]/10 hover:text-[color:var(--c-primary)]"
                  >
                    جزئیات
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<BarChart3 className="w-4 h-4" />}
                    onClick={() => toast.success('مشاهده معیارها و نمودارها')}
                    className="hover:bg-[color:var(--c-primary)]/10 hover:text-[color:var(--c-primary)]"
                  >
                    معیارها
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload(experiment.id)}
                    className="hover:bg-[color:var(--c-success)]/10 hover:text-[color:var(--c-success)]"
                  >
                    دانلود
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(experiment.id)}
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

// Default export for React.lazy compatibility
export default ExperimentsPage;