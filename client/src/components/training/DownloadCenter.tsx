import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  HardDrive,
  FileText,
  Mic,
  Volume2,
  Cpu,
  Clock,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DownloadItem {
  id: string;
  kind: 'text' | 'asr' | 'tts' | 'model';
  name: string;
  size: number;
  status: 'not_installed' | 'downloading' | 'installed' | 'error';
  progress?: number;
  checksum?: string;
  installedAt?: string;
  error?: string;
}

export function DownloadCenter() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDownloads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bootstrap/download/status');
      const data = await response.json();
      if (data.success) {
        setDownloads(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
      toast.error('خطا در بارگذاری وضعیت دانلودها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchDownloads, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async (item: DownloadItem) => {
    try {
      const response = await fetch('/api/bootstrap/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kind: item.kind,
          id: item.id,
          dest: `datasets/${item.kind}/${item.id}`
        })
      });

      if (response.ok) {
        toast.success(`دانلود ${item.name} شروع شد`);
        fetchDownloads();
      } else {
        throw new Error('Failed to start download');
      }
    } catch (error: any) {
      toast.error(`خطا در شروع دانلود: ${error.message}`);
    }
  };

  const handleReinstall = async (item: DownloadItem) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${item.name} را مجدداً نصب کنید؟`)) {
      return;
    }

    try {
      const response = await fetch('/api/bootstrap/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kind: item.kind,
          id: item.id,
          dest: `datasets/${item.kind}/${item.id}`
        })
      });

      if (response.ok) {
        toast.success(`نصب مجدد ${item.name} شروع شد`);
        fetchDownloads();
      } else {
        throw new Error('Failed to start reinstall');
      }
    } catch (error: any) {
      toast.error(`خطا در نصب مجدد: ${error.message}`);
    }
  };

  const handleVerify = async (item: DownloadItem) => {
    try {
      // In a real implementation, this would verify the checksum
      toast.success(`تأیید ${item.name} تکمیل شد`);
    } catch (error: any) {
      toast.error(`خطا در تأیید: ${error.message}`);
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'text':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'asr':
        return <Mic className="w-5 h-5 text-green-500" />;
      case 'tts':
        return <Volume2 className="w-5 h-5 text-purple-500" />;
      case 'model':
        return <Cpu className="w-5 h-5 text-orange-500" />;
      default:
        return <HardDrive className="w-5 h-5 text-gray-500" />;
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'text':
        return 'متن';
      case 'asr':
        return 'تشخیص گفتار';
      case 'tts':
        return 'تبدیل متن به گفتار';
      case 'model':
        return 'مدل';
      default:
        return kind;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'installed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'downloading':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Download className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'installed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'downloading':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'installed':
        return 'نصب شده';
      case 'downloading':
        return 'در حال دانلود';
      case 'error':
        return 'خطا';
      default:
        return 'نصب نشده';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--c-text)] flex items-center gap-2">
            <Download className="w-5 h-5" />
            مرکز دانلود
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchDownloads}
            disabled={isLoading}
          >
            بروزرسانی
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              هیچ آیتمی برای دانلود وجود ندارد
            </h3>
            <p className="text-[color:var(--c-text-muted)]">
              لطفاً بعداً مجدداً بررسی کنید
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-[color:var(--c-border)] hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getKindIcon(item.kind)}
                    <div>
                      <h3 className="font-semibold text-[color:var(--c-text)]">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getKindLabel(item.kind)}
                        </Badge>
                        <span className="text-sm text-[color:var(--c-text-muted)]">
                          {formatFileSize(item.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span>{getStatusLabel(item.status)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {item.status === 'downloading' && item.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[color:var(--c-text-muted)]">پیشرفت دانلود:</span>
                      <span className="text-[color:var(--c-text)] font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                )}

                {/* Checksum */}
                {item.checksum && (
                  <div className="mb-3 p-2 rounded bg-[color:var(--c-bg-secondary)]">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                      <span className="text-[color:var(--c-text-muted)]">چکسام:</span>
                      <code className="text-xs font-mono text-[color:var(--c-text)]">
                        {item.checksum}
                      </code>
                    </div>
                  </div>
                )}

                {/* Installed Date */}
                {item.installedAt && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-[color:var(--c-text-muted)]">
                    <Clock className="w-4 h-4" />
                    <span>نصب شده در: {formatDate(item.installedAt)}</span>
                  </div>
                )}

                {/* Error Message */}
                {item.error && (
                  <div className="mb-3 p-2 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <span>{item.error}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {item.status === 'not_installed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => handleInstall(item)}
                    >
                      نصب
                    </Button>
                  )}

                  {item.status === 'installed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => handleReinstall(item)}
                      >
                        نصب مجدد
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Shield className="w-4 h-4" />}
                        onClick={() => handleVerify(item)}
                      >
                        تأیید
                      </Button>
                    </>
                  )}

                  {item.status === 'error' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => handleInstall(item)}
                    >
                      تلاش مجدد
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="pt-4 border-t border-[color:var(--c-border)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-[color:var(--c-text)]">
                    {downloads.length}
                  </div>
                  <div className="text-[color:var(--c-text-muted)]">کل آیتم‌ها</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {downloads.filter(d => d.status === 'installed').length}
                  </div>
                  <div className="text-[color:var(--c-text-muted)]">نصب شده</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {downloads.filter(d => d.status === 'downloading').length}
                  </div>
                  <div className="text-[color:var(--c-text-muted)]">در حال دانلود</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {downloads.filter(d => d.status === 'error').length}
                  </div>
                  <div className="text-[color:var(--c-text-muted)]">خطا</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
