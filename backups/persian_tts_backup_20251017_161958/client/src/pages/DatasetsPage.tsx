import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Tag,
  Calendar,
  Hash,
  Database,
  FolderOpen,
  Globe,
  Shield,
  Loader
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Dataset } from '@/shared/types';
import { apiService } from '@/shared/services/api.service';
import { useDetectedModels } from '@/hooks/useDetectedModels';
import toast from 'react-hot-toast';

export function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'local'>('local');
  const [loading, setLoading] = useState(true);

  const { models: detectedModels, loading: detectedLoading } = useDetectedModels();

  useEffect(() => {
    if (activeTab === 'catalog') {
      loadDatasets();
    }
  }, [activeTab]);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      // Try to get from API first
      const response = await apiService.getDatasets();
      if (response.success && response.data && response.data.length > 0) {
        setDatasets(response.data);
      } else {
        // Fallback to installed items from sources
        const sourcesResponse = await apiService.getInstalledSources();
        if (sourcesResponse.success && sourcesResponse.data) {
          // Convert installed items to Dataset format
          const installedDatasets = sourcesResponse.data
            .filter(item => item.type === 'dataset')
            .map((item, idx) => ({
              id: item.id,
              name: item.name,
              description: item.provenance?.source || 'Dataset installed locally',
              records: 0, // We don't have record count from filesystem
              tags: ['local', 'installed'],
              validated: true,
              checksum: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sources: [],
              domain: 'unknown',
              language: 'fa',
            }));
          setDatasets(installedDatasets);
        }
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get local datasets from detected models
  const localDatasets = detectedModels.filter(model => model.type === 'dataset');

  const allTags = [...new Set([
    ...datasets.flatMap(d => d.tags),
    ...localDatasets.flatMap(d => d.tags || [])
  ])];

  const allDomains = [...new Set([
    ...datasets.map(d => d.domain).filter(Boolean),
    ...localDatasets.map(d => d.domain).filter(Boolean)
  ])];

  const filteredCatalogDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || dataset.tags.includes(selectedTag);
    const matchesDomain = !selectedDomain || dataset.domain === selectedDomain;
    return matchesSearch && matchesTag && matchesDomain;
  });

  const filteredLocalDatasets = localDatasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (dataset.tags && dataset.tags.includes(selectedTag));
    const matchesDomain = !selectedDomain || dataset.domain === selectedDomain;
    return matchesSearch && matchesTag && matchesDomain;
  });

  const handleValidate = (id: string) => {
    setDatasets(prev => prev.map(dataset =>
      dataset.id === id
        ? { ...dataset, validated: true, updatedAt: new Date().toISOString() }
        : dataset
    ));
    toast.success('دیتاست اعتبارسنجی شد');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این دیتاست را حذف کنید؟')) {
      setDatasets(prev => prev.filter(dataset => dataset.id !== id));
      toast.success('دیتاست حذف شد');
    }
  };

  const handleExport = (id: string) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      toast.success(`دیتاست ${dataset.name} در حال صادرات...`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
      return dateString;
    }
  };

  const formatRecords = (count: number) => {
    return count.toLocaleString('fa-IR');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDomainColor = (domain?: string): string => {
    if (!domain) return 'bg-gray-500/10 text-gray-600';

    const colors = {
      'text-classification': 'bg-blue-500/10 text-blue-600',
      'question-answering': 'bg-green-500/10 text-green-600',
      'translation': 'bg-purple-500/10 text-purple-600',
      'summarization': 'bg-orange-500/10 text-orange-600',
      'conversational': 'bg-pink-500/10 text-pink-600',
      'general': 'bg-gray-500/10 text-gray-600'
    };

    return colors[domain as keyof typeof colors] || 'bg-gray-500/10 text-gray-600';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">دیتاست‌ها</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            مدیریت و اعتبارسنجی مجموعه داده‌ها
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
        >
          ایجاد دیتاست
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--c-border)]">
        <Button
          variant={activeTab === 'local' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('local')}
        >
          دیتاست‌های محلی ({localDatasets.length})
        </Button>
        <Button
          variant={activeTab === 'catalog' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('catalog')}
        >
          کاتالوگ دیتاست‌ها ({datasets.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={activeTab === 'local' ? "جستجو در دیتاست‌های محلی..." : "جستجو در کاتالوگ..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-2">
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
            >
              <option value="">همه تگ‌ها</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
          {allDomains.length > 0 && (
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
            >
              <option value="">همه دامنه‌ها</option>
              {allDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          )}
          <Button variant="outline" icon={<Filter className="w-5 h-5" />}>
            فیلتر
          </Button>
        </div>
      </div>

      {/* Stats */}
      {activeTab === 'local' ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-text)]">{localDatasets.length}</div>
              <div className="text-sm text-[color:var(--c-text-muted)]">دیتاست‌های محلی</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-primary)]">
                {formatFileSize(localDatasets.reduce((sum, d) => sum + d.size, 0))}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">حجم کل</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-success)]">
                {localDatasets.reduce((sum, d) => sum + d.files.length, 0)}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">کل فایل‌ها</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-warning)]">
                {allTags.length}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">تگ‌های مختلف</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-text)]">{datasets.length}</div>
              <div className="text-sm text-[color:var(--c-text-muted)]">کل دیتاست‌ها</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-success)]">
                {datasets.filter(d => d.validated).length}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">اعتبارسنجی شده</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-primary)]">
                {formatRecords(datasets.reduce((sum, d) => sum + d.records, 0))}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">کل رکوردها</div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--c-warning)]">
                {datasets.filter(d => !d.validated).length}
              </div>
              <div className="text-sm text-[color:var(--c-text-muted)]">در انتظار</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'local' ? (
        /* Local Datasets */
        detectedLoading ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Loader className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                در حال اسکن دیتاست‌های محلی...
              </h3>
            </CardContent>
          </Card>
        ) : filteredLocalDatasets.length === 0 ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Database className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                {localDatasets.length === 0 ? 'هیچ دیتاست محلی یافت نشد' : 'هیچ دیتاستی یافت نشد'}
              </h3>
              <p className="text-[color:var(--c-text-muted)] mb-6">
                {localDatasets.length === 0
                  ? 'دیتاست‌هایی که در سیستم شما نصب شده‌اند اینجا نمایش داده می‌شوند'
                  : 'جستجوی شما نتیجه‌ای نداشت'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLocalDatasets.map((dataset) => (
              <Card key={dataset.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Database className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[color:var(--c-text)]">{dataset.name}</h3>
                          {dataset.domain && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getDomainColor(dataset.domain)}`}
                            >
                              {dataset.domain}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {dataset.description && (
                        <p className="text-[color:var(--c-text-muted)] mb-3">{dataset.description}</p>
                      )}
                      {dataset.tags && dataset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {dataset.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">فایل‌ها:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{dataset.files.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">حجم:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{formatFileSize(dataset.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">آخرین تغییر:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{formatDate(dataset.lastModified)}</span>
                    </div>
                    {dataset.language && dataset.language.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                        <span className="text-[color:var(--c-text-muted)]">زبان:</span>
                        <span className="font-medium text-[color:var(--c-text)]">
                          {dataset.language.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => toast.success('پیش‌نمایش دیتاست')}
                    >
                      پیش‌نمایش
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<FolderOpen className="w-4 h-4" />}
                      onClick={() => {
                        window.open(`file://${dataset.path}`, '_blank');
                      }}
                    >
                      باز کردن پوشه
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      استفاده در آموزش
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Catalog Datasets */
        loading ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <Loader className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                در حال بارگذاری...
              </h3>
            </CardContent>
          </Card>
        ) : filteredCatalogDatasets.length === 0 ? (
          <Card variant="outline" className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                {datasets.length === 0 ? 'هیچ دیتاستی پیکربندی نشده' : 'هیچ دیتاستی یافت نشد'}
              </h3>
              <p className="text-[color:var(--c-text-muted)] mb-6">
                {datasets.length === 0
                  ? 'برای شروع، از صفحه دانلودها داده‌های واقعی دانلود کنید یا دیتاست جدید ایجاد کنید'
                  : 'جستجوی شما نتیجه‌ای نداشت'}
              </p>
              {datasets.length === 0 && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-5 h-5" />}
                >
                  ایجاد دیتاست
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCatalogDatasets.map((dataset) => (
              <Card key={dataset.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[color:var(--c-text)]">{dataset.name}</h3>
                        {dataset.validated ? (
                          <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>
                            اعتبارسنجی شده
                          </Badge>
                        ) : (
                          <Badge variant="warning" icon={<AlertCircle className="w-3 h-3" />}>
                            در انتظار
                          </Badge>
                        )}
                      </div>
                      <p className="text-[color:var(--c-text-muted)] mb-3">{dataset.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {dataset.tags.map(tag => (
                          <Badge key={tag} variant="secondary" icon={<Tag className="w-3 h-3" />}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">رکوردها:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{formatRecords(dataset.records)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">منابع:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{dataset.sources.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">ایجاد:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{formatDate(dataset.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[color:var(--c-text-muted)]">زبان:</span>
                      <span className="font-medium text-[color:var(--c-text)]">{dataset.language?.toUpperCase() || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => toast.success('پیش‌نمایش دیتاست')}
                    >
                      پیش‌نمایش
                    </Button>
                    {!dataset.validated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => handleValidate(dataset.id)}
                      >
                        اعتبارسنجی
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => handleExport(dataset.id)}
                    >
                      صادرات
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDelete(dataset.id)}
                      className="text-[color:var(--c-danger)] hover:text-[color:var(--c-danger)] hover:bg-[color:var(--c-danger)]/10"
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}