import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Loader,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Settings,
  TrendingDown,
  Clock,
  Cpu,
  Database as DatabaseIcon,
  FolderOpen,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTraining, TrainingConfig, TrainingJob } from '@/hooks/useTraining';
import { useAvailableModels } from '@/hooks/useDownloads';
import { TrainedModelSelector } from '@/components/training/TrainedModelSelector';
import { DatasetSelector } from '@/components/training/DatasetSelector';
import { TrainingTypeSelector, TrainingType } from '@/components/training/TrainingTypeSelector';
import { DetectedModel } from '@/hooks/useDetectedModels';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'text-gray-600 dark:text-gray-400',
  preparing: 'text-blue-600 dark:text-blue-400',
  training: 'text-green-600 dark:text-green-400',
  evaluating: 'text-purple-600 dark:text-purple-400',
  completed: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  cancelled: 'text-gray-600 dark:text-gray-400',
};

const STATUS_ICONS = {
  pending: Clock,
  preparing: Loader,
  training: Cpu,
  evaluating: BarChart3,
  completed: CheckCircle,
  error: AlertCircle,
  cancelled: XCircle,
};

export function TrainingStudioPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'jobs'>('new');
  const [jobName, setJobName] = useState('');
  const [selectedModel, setSelectedModel] = useState<DetectedModel | null>(null);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingType | null>(null);
  const [outputDir, setOutputDir] = useState('');
  const [epochs, setEpochs] = useState(3);
  const [learningRate, setLearningRate] = useState(5e-5);
  const [batchSize, setBatchSize] = useState(8);
  const [maxSteps, setMaxSteps] = useState(100);
  const [selectedJobLogs, setSelectedJobLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'model' | 'datasets' | 'type' | 'config'>('model');

  const { jobs, loading, startTraining, cancelTraining, getJobLogs } = useTraining();
  const { models: availableModels } = useAvailableModels('model');
  const [installedSources, setInstalledSources] = useState<any[]>([]);

  useEffect(() => {
    loadInstalledSources();
  }, []);

  const loadInstalledSources = async () => {
    const response = await apiService.getInstalledSources();
    if (response.success && response.data) {
      setInstalledSources(response.data);
    }
  };

  useEffect(() => {
    if (selectedJobLogs) {
      const fetchLogs = async () => {
        const jobLogs = await getJobLogs(selectedJobLogs);
        setLogs(jobLogs);
      };
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedJobLogs, getJobLogs]);

  const handleModelSelect = (model: DetectedModel) => {
    setSelectedModel(model);
    setCurrentStep('datasets');

    // Auto-generate job name if not set
    if (!jobName) {
      setJobName(`Training-${model.name}-${Date.now()}`);
    }

    // Auto-generate output directory if not set
    if (!outputDir) {
      setOutputDir(`models/finetuned/${model.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`);
    }
  };

  const handleDatasetToggle = (dataset: DetectedModel) => {
    const isSelected = selectedDatasets.includes(dataset.id);
    if (isSelected) {
      setSelectedDatasets(prev => prev.filter(id => id !== dataset.id));
    } else {
      setSelectedDatasets(prev => [...prev, dataset.id]);
    }
  };

  const handleTrainingTypeSelect = (type: TrainingType) => {
    setSelectedTrainingType(type);
    setCurrentStep('config');

    // Adjust default parameters based on training type
    switch (type) {
      case 'lora':
      case 'qlora':
        setEpochs(5);
        setLearningRate(1e-4);
        setBatchSize(4);
        break;
      case 'fine-tuning':
        setEpochs(3);
        setLearningRate(5e-5);
        setBatchSize(2);
        break;
      case 'instruction-tuning':
      case 'chat-tuning':
        setEpochs(3);
        setLearningRate(2e-5);
        setBatchSize(4);
        break;
      default:
        break;
    }
  };

  const handleStartTraining = async () => {
    if (!jobName || !selectedModel || selectedDatasets.length === 0 || !selectedTrainingType || !outputDir) {
      toast.error('لطفا تمام مراحل را تکمیل کنید');
      return;
    }

    const config: TrainingConfig = {
      baseModelPath: selectedModel.path,
      datasetPath: selectedDatasets[0], // For now, use the first dataset
      outputDir,
      epochs,
      learningRate,
      batchSize,
      maxSteps,
      useGpu: false, // CPU-only for safety
    };

    try {
      await startTraining(jobName, config);
      toast.success('آموزش با موفقیت شروع شد');
      setActiveTab('jobs');
      // Reset form
      resetForm();
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };

  const resetForm = () => {
    setJobName('');
    setSelectedModel(null);
    setSelectedDatasets([]);
    setSelectedTrainingType(null);
    setOutputDir('');
    setCurrentStep('model');
    setEpochs(3);
    setLearningRate(5e-5);
    setBatchSize(8);
    setMaxSteps(100);
  };

  const handleCancelTraining = async (jobId: string) => {
    try {
      await cancelTraining(jobId);
      toast.success('آموزش لغو شد');
    } catch (error) {
      toast.error('خطا در لغو آموزش');
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">استودیو آموزش</h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          آموزش مدل‌های زبانی با داده‌های دانلود شده
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--c-border)]">
        <Button
          variant={activeTab === 'new' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('new')}
        >
          آموزش جدید
        </Button>
        <Button
          variant={activeTab === 'jobs' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('jobs')}
        >
          وظایف ({jobs?.length || 0})
        </Button>
      </div>

      {/* New Training Form */}
      {activeTab === 'new' && (
        <div className="space-y-6">
          {/* Progress Steps */}
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {[
                  { key: 'model', icon: Cpu, label: 'انتخاب مدل' },
                  { key: 'datasets', icon: DatabaseIcon, label: 'انتخاب دیتاست' },
                  { key: 'type', icon: Settings, label: 'نوع آموزش' },
                  { key: 'config', icon: Rocket, label: 'پیکربندی' }
                ].map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted =
                    step.key === 'model' && selectedModel ||
                    step.key === 'datasets' && selectedDatasets.length > 0 ||
                    step.key === 'type' && selectedTrainingType ||
                    step.key === 'config' && jobName && outputDir;
                  const isActive = currentStep === step.key;

                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive
                          ? 'bg-[color:var(--c-primary)]/10 text-[color:var(--c-primary)]'
                          : isCompleted
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-[color:var(--c-border)]/20 text-[color:var(--c-muted)]'
                        }`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.label}</span>
                        {isCompleted && <CheckCircle className="w-4 h-4" />}
                      </div>
                      {index < 3 && (
                        <div className="w-8 h-0.5 bg-[color:var(--c-border)] mx-2"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Model Selection */}
          {currentStep === 'model' && (
            <TrainedModelSelector
              selectedModel={selectedModel?.id || ''}
              onModelSelect={handleModelSelect}
            />
          )}

          {/* Step 2: Dataset Selection */}
          {currentStep === 'datasets' && selectedModel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                  انتخاب دیتاست برای آموزش
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('model')}
                >
                  برگشت
                </Button>
              </div>

              <DatasetSelector
                selectedDatasets={selectedDatasets}
                onDatasetToggle={handleDatasetToggle}
                multiSelect={true}
              />

              {selectedDatasets.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('type')}
                  >
                    مرحله بعد: نوع آموزش
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Training Type Selection */}
          {currentStep === 'type' && selectedDatasets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                  انتخاب نوع آموزش
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('datasets')}
                >
                  برگشت
                </Button>
              </div>

              <TrainingTypeSelector
                selectedType={selectedTrainingType}
                onTypeSelect={handleTrainingTypeSelect}
              />
            </div>
          )}

          {/* Step 4: Configuration */}
          {currentStep === 'config' && selectedTrainingType && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                  پیکربندی نهایی
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('type')}
                >
                  برگشت
                </Button>
              </div>

              <Card variant="elevated">
                <CardHeader>
                  <h4 className="text-lg font-semibold text-[color:var(--c-text)]">تنظیمات عمومی</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Name */}
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                      نام وظیفه *
                    </label>
                    <Input
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="مثال: Persian Chat v1"
                    />
                  </div>

                  {/* Output Directory */}
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                      مسیر خروجی *
                    </label>
                    <Input
                      value={outputDir}
                      onChange={(e) => setOutputDir(e.target.value)}
                      placeholder="models/finetuned/my-model"
                    />
                  </div>

                  {/* Training Summary */}
                  <div className="p-4 bg-[color:var(--c-border)]/10 rounded-lg">
                    <h5 className="font-medium text-[color:var(--c-text)] mb-2">خلاصه آموزش:</h5>
                    <div className="text-sm text-[color:var(--c-muted)] space-y-1">
                      <div>مدل: {selectedModel?.name}</div>
                      <div>دیتاست‌ها: {selectedDatasets.length} مورد انتخاب شده</div>
                      <div>نوع آموزش: {selectedTrainingType}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <h4 className="text-lg font-semibold text-[color:var(--c-text)]">پارامترهای آموزش</h4>
                  <p className="text-sm text-[color:var(--c-muted)]">
                    پارامترها بر اساس نوع آموزش انتخابی تنظیم شده‌اند
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                        تعداد Epochs
                      </label>
                      <Input
                        type="number"
                        value={epochs}
                        onChange={(e) => setEpochs(parseInt(e.target.value))}
                        min={1}
                        max={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                        Learning Rate
                      </label>
                      <Input
                        type="number"
                        value={learningRate}
                        onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                        step={0.00001}
                        min={0.00001}
                        max={0.01}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                        Batch Size
                      </label>
                      <Input
                        type="number"
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        min={1}
                        max={64}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                        Max Steps
                      </label>
                      <Input
                        type="number"
                        value={maxSteps}
                        onChange={(e) => setMaxSteps(parseInt(e.target.value))}
                        min={10}
                        max={10000}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  <RotateCcw className="w-4 h-4 ml-1" />
                  شروع مجدد
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play className="w-5 h-5" />}
                  onClick={handleStartTraining}
                  disabled={loading || !jobName || !selectedModel || selectedDatasets.length === 0 || !selectedTrainingType || !outputDir}
                >
                  شروع آموزش
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Jobs List */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {!jobs || jobs.length === 0 ? (
            <Card variant="outline" className="text-center py-12">
              <CardContent>
                <Cpu className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
                <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                  هیچ وظیفه آموزشی وجود ندارد
                </h3>
                <p className="text-[color:var(--c-text-muted)] mb-6">
                  برای شروع، یک وظیفه آموزشی جدید ایجاد کنید
                </p>
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('new')}
                  icon={<Play className="w-5 h-5" />}
                >
                  آموزش جدید
                </Button>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => {
              const StatusIcon = STATUS_ICONS[job.status];
              const isActive = job.status === 'preparing' || job.status === 'training' || job.status === 'evaluating';

              return (
                <Card key={job.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${isActive ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[color:var(--c-text)] mb-1">{job.name}</h3>
                          <p className="text-xs text-[color:var(--c-text-muted)]">{job.id}</p>
                        </div>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'success' : job.status === 'error' || job.status === 'cancelled' ? 'error' : 'default'}>
                        {job.currentPhase}
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
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    {job.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-[color:var(--c-bg-secondary)]">
                        {job.metrics.epoch !== undefined && (
                          <div>
                            <div className="text-xs text-[color:var(--c-text-muted)]">Epoch</div>
                            <div className="text-sm font-medium text-[color:var(--c-text)]">
                              {job.metrics.epoch}/{job.config.epochs}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-[color:var(--c-text-muted)]">Step</div>
                          <div className="text-sm font-medium text-[color:var(--c-text)]">
                            {job.metrics.step}/{job.metrics.totalSteps}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[color:var(--c-text-muted)]">Loss</div>
                          <div className="text-sm font-medium text-[color:var(--c-text)] flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-green-600" />
                            {job.metrics.loss.toFixed(4)}
                          </div>
                        </div>
                        {job.metrics.accuracy !== undefined && (
                          <div>
                            <div className="text-xs text-[color:var(--c-text-muted)]">Accuracy</div>
                            <div className="text-sm font-medium text-[color:var(--c-text)]">
                              {(job.metrics.accuracy * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Config Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[color:var(--c-text-muted)]">
                      <div>
                        <span>Epochs:</span>
                        <span className="mr-1 text-[color:var(--c-text)]">{job.config.epochs}</span>
                      </div>
                      <div>
                        <span>LR:</span>
                        <span className="mr-1 text-[color:var(--c-text)]">{job.config.learningRate}</span>
                      </div>
                      <div>
                        <span>Batch:</span>
                        <span className="mr-1 text-[color:var(--c-text)]">{job.config.batchSize}</span>
                      </div>
                      <div>
                        <span>زمان:</span>
                        <span className="mr-1 text-[color:var(--c-text)]">{formatDuration(job.startedAt, job.finishedAt)}</span>
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
                          onClick={() => handleCancelTraining(job.id)}
                        >
                          لغو
                        </Button>
                      ) : job.status === 'completed' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FolderOpen className="w-4 h-4" />}
                          onClick={() => window.open(job.config.outputDir, '_blank')}
                        >
                          باز کردن خروجی
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<FileText className="w-4 h-4" />}
                        onClick={() => setSelectedJobLogs(selectedJobLogs === job.id ? null : job.id)}
                      >
                        لاگ‌ها ({job.logs.length})
                      </Button>
                    </div>

                    {/* Logs */}
                    {selectedJobLogs === job.id && (
                      <div className="mt-4 p-4 rounded-lg bg-black text-green-400 font-mono text-xs max-h-96 overflow-auto">
                        {logs.length === 0 ? (
                          <div className="text-gray-500">در حال بارگذاری لاگ‌ها...</div>
                        ) : (
                          logs.map((log, idx) => (
                            <div key={idx}>{log}</div>
                          ))
                        )}
                      </div>
                    )}
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

export default TrainingStudioPage;

