import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  RotateCcw,
  Calendar,
  HardDrive,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useTraining } from '@/hooks/useTraining';
import toast from 'react-hot-toast';

interface Checkpoint {
  id: string;
  runId: string;
  createdAt: string;
  path: string;
  tag: 'latest' | 'best' | 'manual';
  metric?: number;
  resumeToken?: string;
}

export function CheckpointsTable() {
  const { status } = useTraining();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('');

  const fetchCheckpoints = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/train/checkpoints');
      const data = await response.json();
      if (data.success) {
        setCheckpoints(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch checkpoints:', error);
      toast.error('خطا در بارگذاری چک‌پوینت‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, []);

  const handleDownload = async (checkpoint: Checkpoint) => {
    try {
      // In a real implementation, this would trigger a download
      toast.success(`دانلود چک‌پوینت ${checkpoint.id.slice(-8)} شروع شد`);
    } catch (error: any) {
      toast.error(`خطا در دانلود: ${error.message}`);
    }
  };

  const handleDelete = async (checkpoint: Checkpoint) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید چک‌پوینت ${checkpoint.id.slice(-8)} را حذف کنید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/train/checkpoints/${checkpoint.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('چک‌پوینت حذف شد');
        fetchCheckpoints();
      } else {
        throw new Error('Failed to delete checkpoint');
      }
    } catch (error: any) {
      toast.error(`خطا در حذف: ${error.message}`);
    }
  };

  const handleResume = async (checkpoint: Checkpoint) => {
    try {
      const response = await fetch('/api/train/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeCheckpointId: checkpoint.id,
          totalEpochs: 10,
          totalSteps: 1000,
          learningRate: 0.001,
          batchSize: 32,
          saveEverySteps: 100
        })
      });

      if (response.ok) {
        toast.success(`آموزش از چک‌پوینت ${checkpoint.id.slice(-8)} شروع شد`);
      } else {
        throw new Error('Failed to resume training');
      }
    } catch (error: any) {
      toast.error(`خطا در ادامه آموزش: ${error.message}`);
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'best':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'latest':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'manual':
        return <AlertCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'best':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'latest':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'manual':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
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
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <HardDrive className="w-5 h-5" />
            چک‌پوینت‌ها
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={fetchCheckpoints}
              disabled={isLoading}
            >
              بروزرسانی
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {checkpoints.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
            <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
              هیچ چک‌پوینتی وجود ندارد
            </h3>
            <p className="text-[color:var(--c-text-muted)]">
              چک‌پوینت‌ها پس از شروع آموزش ایجاد می‌شوند
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-[color:var(--c-text-muted)] border-b border-[color:var(--c-border)]">
              <div className="col-span-3">شناسه</div>
              <div className="col-span-2">نوع</div>
              <div className="col-span-2">معیار</div>
              <div className="col-span-2">تاریخ</div>
              <div className="col-span-3">عملیات</div>
            </div>

            {/* Table Rows */}
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-[color:var(--c-bg-secondary)] transition-colors"
              >
                {/* ID */}
                <div className="col-span-3 flex items-center gap-2">
                  <code className="text-sm font-mono text-[color:var(--c-text)] bg-[color:var(--c-bg-secondary)] px-2 py-1 rounded">
                    {checkpoint.id.slice(-12)}
                  </code>
                </div>

                {/* Tag */}
                <div className="col-span-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getTagColor(checkpoint.tag)}`}
                  >
                    <div className="flex items-center gap-1">
                      {getTagIcon(checkpoint.tag)}
                      <span>
                        {checkpoint.tag === 'best' ? 'بهترین' :
                         checkpoint.tag === 'latest' ? 'آخرین' :
                         checkpoint.tag === 'manual' ? 'دستی' : checkpoint.tag}
                      </span>
                    </div>
                  </Badge>
                </div>

                {/* Metric */}
                <div className="col-span-2">
                  <span className="text-sm text-[color:var(--c-text)]">
                    {checkpoint.metric ? checkpoint.metric.toFixed(4) : '—'}
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[color:var(--c-text-muted)]" />
                  <span className="text-sm text-[color:var(--c-text)]">
                    {formatDate(checkpoint.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => handleResume(checkpoint)}
                    disabled={status?.status === 'running'}
                    title="ادامه از این چک‌پوینت"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload(checkpoint)}
                    title="دانلود چک‌پوینت"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(checkpoint)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="حذف چک‌پوینت"
                  />
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="pt-4 border-t border-[color:var(--c-border)]">
              <div className="flex items-center justify-between text-sm text-[color:var(--c-text-muted)]">
                <span>تعداد کل چک‌پوینت‌ها: {checkpoints.length}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>بهترین: {checkpoints.filter(c => c.tag === 'best').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>آخرین: {checkpoints.filter(c => c.tag === 'latest').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-green-500" />
                    <span>دستی: {checkpoints.filter(c => c.tag === 'manual').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
