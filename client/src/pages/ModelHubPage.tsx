import React, { useState } from 'react';
import {
  Download,
  CheckCircle,
  Loader,
  AlertCircle,
  Search,
  Filter,
  Database,
  Cpu,
  Mic,
  ExternalLink,
  FolderOpen,
  XCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { useDownloads, useAvailableModels } from '@/hooks/useDownloads';
import { Model } from '@/shared/types';
import { useDetectedModels } from '@/hooks/useDetectedModels';
import toast from 'react-hot-toast';

const typeIcons = {
  model: Cpu,
  tts: Mic,
  dataset: Database,
};

const typeLabels = {
  model: 'مدل',
  tts: 'صدا (TTS)',
  dataset: 'داده',
};

export function ModelHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'model' | 'tts' | 'dataset' | ''>('');
  const [activeTab, setActiveTab]  const { models, loading: modelsLoading } = useAvailableModels();efined,
    searchQuery || undefined
  );
  const { models: detectedModels, loading: detectedLoading } = useDetectedModels();
  const { jobs, startDown  const handleDownload = async (model: Model) => {
    try {
      await startDownload(model.url || '', `models/${model.id}`, model.type);
      toast.success(`دانلود ${model.name} شروع شد`);
    } catch (error: any) {
      toast.error(`خطا در شروع دانلود: ${error.message}`);
    }
  };طا در شروع دانلود: ${error.message}`);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await cancelDownload(jobId);
      toast.success('دانلود لغو شد');
    } catch (error) {
      toast.error('خطا در لغو دانلود');
    }
  };

  const getModelJob = (modelId: string) => {
    return jobs.find(j => j.repoId === modelId && j.status === 'downloading');
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec) return '-';
    const mbps = bytesPerSec / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  const formatETA = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">مرکز مدل‌ها</h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          دانلود مدل‌ها، دیتاست‌ها و صداهای فارسی از Hugging Face
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--c-border)]">
        <Button
          variant={activeTab === 'hub' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('hub')}
        >
          Hugging Face Hub
        </Button>
        <Button
          variant={activeTab === 'local' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('local')}
        >
          مدل‌های محلی ({detectedModels.filter(m => m.type !== 'dataset').length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={activeTab === 'hub' ? "جستجو در Hub..." : "جستجو در مدل‌های محلی..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === '' ? 'primary' : 'ghost'}
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setSelectedType('')}
          >
            همه
          </Button>
          <Button
            variant={selectedType === 'model' ? 'primary' : 'ghost'}
            icon={<Cpu className="w-4 h-4" />}
            onClick={() => setSelectedType('model')}
          >
            مدل‌ها
          </Button>
          <Button
            variant={selectedType === 'tts' ? 'primary' : 'ghost'}
            icon={<Mic className="w-4 h-4" />}
            onClick={() => setSelectedType('tts')}
          >
            صداها
          </Button>
          {activeTab === 'hub' && (
            <Button
              variant={selectedType === 'dataset' ? 'primary' : 'ghost'}
              icon={<Database className="w-4 h-4" />}
              onClick={() => setSelectedType('dataset')}
            >
              داده‌ها
            </Button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'hub' ? (
        /* Hub Models Grid */
        modelsLoading ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Loader className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                در حال بارگذاری...
              </h3>
            </CardContent>
          </Card>
        ) : models.length === 0 ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Database className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                هیچ مدلی یافت نشد
              </h3>
              <p className="text-[color:var(--c-text-muted)]">
                جستجوی شما نتیجه‌ای نداشت
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => {
              const job = getModelJob(model.id);
              const Icon = typeIcons[model.type];

              return (
                <Card key={model.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[color:var(--c-text)] mb-1 truncate">{model.name}</h3>
                          <p className="text-xs text-[color:var(--c-text-muted)]">{model.provider}</p>
                        </div>
                      </div>
                      {model.installed ? (
                        <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>
                          نصب شده
                        </Badge>
                      ) : job ? (
                        <Badge variant="default" icon={<Loader className="w-3 h-3 animate-spin" />}>
                          در حال دانلود
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{typeLabels[model.type]}</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-[color:var(--c-text-muted)] line-clamp-2">
                      {model.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {model.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[color:var(--c-text-muted)]">حجم:</span>
                        <span className="mr-2 text-[color:var(--c-text)]">{model.size}</span>
                      </div>
                      <div>
                        <span className="text-[color:var(--c-text-muted)]">مجوز:</span>
                        <span className="mr-2 text-[color:var(--c-text)]">{model.license}</span>
                      </div>
                    </div>

                    {/* Download Progress */}
                    {job && (
                      <div className="space-y-2 p-3 rounded-lg bg-[color:var(--c-bg-secondary)]">
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
                        <div className="grid grid-cols-3 gap-2 text-xs text-[color:var(--c-text-muted)]">
                          <div>
                            <span>سرعت:</span>
                            <span className="mr-1">{formatSpeed(job.speed)}</span>
                          </div>
                          <div>
                            <span>باقی‌مانده:</span>
                            <span className="mr-1">{formatETA(job.eta)}</span>
                          </div>
                          <div>
                            <span>حجم:</span>
                            <span className="mr-1">{formatBytes(job.bytesDownloaded)} / {formatBytes(job.bytesTotal)}</span>
                          </div>
                        </div>
                        {job.currentFile && (
                          <p className="text-xs text-[color:var(--c-text-muted)] truncate">
                            فایل فعلی: {job.currentFile}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {model.installed ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FolderOpen className="w-4 h-4" />}
                          className="flex-1"
                        >
                          باز کردن پوشه
                        </Button>
                      ) : job ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<XCircle className="w-4 h-4" />}
                          onClick={() => handleCancel(job.id)}
                          className="flex-1"
                        >
                          لغو دانلود
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          onClick={() => handleDownload(model)}
                          className="flex-1"
                        >
                          دانلود
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ExternalLink className="w-4 h-4" />}
                        onClick={() => window.open(model.url, '_blank')}
                      >
                        Hugging Face
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Local Models Grid */
        detectedLoading ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Loader className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                در حال اسکن مدل‌های محلی...
              </h3>
            </CardContent>
          </Card>
        ) : (() => {
          const filteredLocalModels = detectedModels
            .filter(model => model.type !== 'dataset')
            .filter(model => {
              const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.description?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesType = !selectedType || model.type === selectedType;
              return matchesSearch && matchesType;
            });

          return filteredLocalModels.length === 0 ? (
            <Card variant="outline" className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
                <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                  هیچ مدل محلی یافت نشد
                </h3>
                <p className="text-[color:var(--c-text-muted)]">
                  مدل‌هایی که روی سیستم شما نصب شده‌اند اینجا نمایش داده می‌شوند
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLocalModels.map((model) => {
                const Icon = typeIcons[model.type];

                return (
                  <Card key={model.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg ${model.isTrainedModel ? 'bg-gradient-to-br from-green-500 to-green-600' :
                              model.type === 'tts' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                'bg-gradient-to-br from-blue-500 to-blue-600'
                            } flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[color:var(--c-text)] mb-1 line-clamp-2">
                              {model.name}
                            </h3>
                            {model.description && (
                              <p className="text-xs text-[color:var(--c-text-muted)] line-clamp-2">
                                {model.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={model.isTrainedModel ? 'success' : 'default'} className="text-xs">
                            {model.isTrainedModel ? 'آموزش‌دیده' : typeLabels[model.type]}
                          </Badge>
                          {model.domain && (
                            <Badge variant="outline" className="text-xs">
                              {model.domain}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Model Info */}
                        <div className="flex items-center justify-between text-xs text-[color:var(--c-text-muted)]">
                          <span>{formatBytes(model.size)}</span>
                          <span>{model.files.length} فایل</span>
                          <span>{model.modelFormat.toUpperCase()}</span>
                        </div>

                        {/* Training Info */}
                        {model.isTrainedModel && model.trainingInfo && (
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                              اطلاعات آموزش:
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                              {model.trainingInfo.epochs && (
                                <div>Epochs: {model.trainingInfo.epochs}</div>
                              )}
                              {model.trainingInfo.metrics?.finalLoss && (
                                <div>Loss: {model.trainingInfo.metrics.finalLoss.toFixed(4)}</div>
                              )}
                              {model.trainingInfo.metrics?.finalAccuracy && (
                                <div>Accuracy: {(model.trainingInfo.metrics.finalAccuracy * 100).toFixed(1)}%</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {model.tags && model.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {model.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0.5">
                                #{tag}
                              </Badge>
                            ))}
                            {model.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0.5">
                                +{model.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FolderOpen className="w-4 h-4" />}
                          onClick={() => {
                            // Open folder in file explorer
                            const pathToOpen = model.path;
                            window.open(`file://${pathToOpen}`, '_blank');
                          }}
                          className="flex-1"
                        >
                          باز کردن پوشه
                        </Button>
                        {model.isTrainedModel && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4" />}
                            className="flex-1"
                          >
                            استفاده در آموزش
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()
      )}
    </div>
  );
}

export default ModelHubPage;

