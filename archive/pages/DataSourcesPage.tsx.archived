import { useState, useEffect } from 'react';
import { 
  Github, 
  HardDrive, 
  Globe, 
  Upload, 
  Database, 
  Plus, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { DataSource, DataSourceKind } from '@/shared/types';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

const dataSourceTypes: Array<{
  kind: DataSourceKind;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    kind: 'github',
    name: 'GitHub',
    description: 'اتصال به مخازن GitHub برای استخراج کد و مستندات',
    icon: Github,
    color: 'from-gray-500 to-gray-600'
  },
  {
    kind: 'gdrive',
    name: 'Google Drive',
    description: 'دسترسی به فایل‌های Google Drive',
    icon: HardDrive,
    color: 'from-blue-500 to-blue-600'
  },
  {
    kind: 'web',
    name: 'وب‌سایت',
    description: 'کرال کردن محتوای وب‌سایت‌ها',
    icon: Globe,
    color: 'from-green-500 to-green-600'
  },
  {
    kind: 'huggingface',
    name: 'Hugging Face',
    description: 'دسترسی به دیتاست‌های Hugging Face',
    icon: Database,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    kind: 'upload',
    name: 'آپلود فایل',
    description: 'آپلود مستقیم فایل‌های محلی',
    icon: Upload,
    color: 'from-purple-500 to-purple-600'
  }
];

export function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDataSources();
      if (response.success && response.data) {
        setDataSources(response.data);
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = dataSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.kind.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnect = (kind: DataSourceKind) => {
    toast.success(`اتصال به ${kind} در حال راه‌اندازی...`);
    setShowAddModal(false);
  };

  const handleSync = (id: string) => {
    toast.success('همگام‌سازی شروع شد');
    // Update last sync time
    setDataSources(prev => prev.map(source => 
      source.id === id 
        ? { ...source, lastSync: new Date().toISOString() }
        : source
    ));
  };

  const handleDisconnect = (id: string) => {
    setDataSources(prev => prev.filter(source => source.id !== id));
    toast.success('منبع داده قطع شد');
  };

  const getStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">فعال</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غیرفعال</Badge>;
      case 'error':
        return <Badge variant="danger">خطا</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'هرگز';
    return new Date(lastSync).toLocaleDateString('fa-IR');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">منابع داده</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            مدیریت و اتصال منابع داده خارجی برای آموزش مدل
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddModal(true)}
        >
          افزودن منبع
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="جستجو در منابع داده..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Database className="w-5 h-5" />}
        />
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <h2 className="text-xl font-semibold text-[color:var(--c-text)]">افزودن منبع داده</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dataSourceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.kind}
                      variant="outline"
                      className="cursor-pointer hover:shadow-[var(--shadow-2)] transition-all duration-200 group"
                      onClick={() => handleConnect(type.kind)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-[color:var(--c-text)] mb-2">{type.name}</h3>
                        <p className="text-sm text-[color:var(--c-text-muted)]">{type.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  لغو
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Sources List */}
      {loading ? (
        <Card variant="outline" className="text-center py-12">
          <CardContent>
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-spin" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              در حال بارگذاری...
            </h3>
          </CardContent>
        </Card>
      ) : filteredSources.length === 0 ? (
        <Card variant="outline" className="text-center py-12">
          <CardContent>
            <Database className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              {dataSources.length === 0 ? 'هیچ منبع داده‌ای پیکربندی نشده' : 'هیچ منبع داده‌ای یافت نشد'}
            </h3>
            <p className="text-[color:var(--c-text-muted)] mb-6">
              {dataSources.length === 0 
                ? 'برای شروع، یک منبع داده جدید اضافه کنید یا از صفحه دانلودها داده‌های واقعی دانلود کنید'
                : 'جستجوی شما نتیجه‌ای نداشت'}
            </p>
            {dataSources.length === 0 && (
              <Button
                variant="primary"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setShowAddModal(true)}
              >
                افزودن منبع
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSources.map((source) => {
            const typeInfo = dataSourceTypes.find(t => t.kind === source.kind);
            const Icon = typeInfo?.icon || Database;
            
            return (
              <Card key={source.id} variant="elevated" className="group hover:shadow-[var(--shadow-2)] transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeInfo?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[color:var(--c-text)]">{source.name}</h3>
                        <p className="text-sm text-[color:var(--c-text-muted)]">{typeInfo?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(source.status)}
                      <Button variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[color:var(--c-text-muted)]">آخرین همگام‌سازی:</span>
                      <span className="text-[color:var(--c-text)]">{formatLastSync(source.lastSync)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[color:var(--c-text-muted)]">تعداد رکوردها:</span>
                      <span className="text-[color:var(--c-text)]">{source.recordsCount?.toLocaleString('fa-IR') || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {source.connected ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw className="w-4 h-4" />}
                          onClick={() => handleSync(source.id)}
                          className="flex-1"
                        >
                          همگام‌سازی
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Settings className="w-4 h-4" />}
                          className="flex-1"
                        >
                          تنظیمات
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => handleConnect(source.kind)}
                        className="flex-1"
                      >
                        اتصال
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<AlertCircle className="w-4 h-4" />}
                      onClick={() => handleDisconnect(source.id)}
                      className="text-[color:var(--c-danger)] hover:text-[color:var(--c-danger)] hover:bg-[color:var(--c-danger)]/10"
                    >
                      قطع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
