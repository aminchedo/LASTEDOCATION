import React, { useState, useRef } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { Database, Upload, FileText, Trash2, Download, BarChart, Search } from 'lucide-react';
import { useAILab } from '@/hooks/api/useAILab';
import { toast } from 'react-hot-toast';

export function DatasetManagerPage() {
  const { datasets, uploadDataset, refreshDatasets } = useAILab();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [datasetForm, setDatasetForm] = useState({
    name: '',
    type: 'text' as 'text' | 'audio' | 'structured',
    description: ''
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['.csv', '.json', '.txt', '.jsonl'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      toast.error('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل CSV، JSON، JSONL یا TXT آپلود کنید.');
      return;
    }

    // Auto-detect type based on extension
    if (fileExt === '.csv') {
      setDatasetForm(prev => ({ ...prev, type: 'structured' }));
    } else if (fileExt === '.json' || fileExt === '.jsonl') {
      setDatasetForm(prev => ({ ...prev, type: 'structured' }));
    } else {
      setDatasetForm(prev => ({ ...prev, type: 'text' }));
    }

    // Set name from filename if empty
    if (!datasetForm.name) {
      setDatasetForm(prev => ({ 
        ...prev, 
        name: file.name.substring(0, file.name.lastIndexOf('.'))
      }));
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('لطفاً یک فایل انتخاب کنید');
      return;
    }

    if (!datasetForm.name) {
      toast.error('لطفاً نام دیتاست را وارد کنید');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (real progress would come from upload handler)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadDataset(file, datasetForm);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setDatasetForm({
        name: '',
        type: 'text',
        description: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('دیتاست با موفقیت آپلود شد');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8 text-[color:var(--c-primary)]" />
          مدیریت دیتاست‌ها
        </h1>
        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          آپلود دیتاست جدید
        </Button>
      </div>

      {/* Upload Form */}
      {fileInputRef.current?.files?.length ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">آپلود دیتاست</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">فایل انتخاب شده</label>
              <div className="flex items-center gap-3 p-3 bg-[color:var(--c-bg-elevated)] rounded-lg">
                <FileText className="w-5 h-5 text-[color:var(--c-text-secondary)]" />
                <span>{fileInputRef.current.files[0].name}</span>
                <span className="text-sm text-[color:var(--c-text-secondary)]">
                  ({formatFileSize(fileInputRef.current.files[0].size)})
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نام دیتاست</label>
                <Input
                  value={datasetForm.name}
                  onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })}
                  placeholder="مثال: persian-news-corpus"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نوع دیتاست</label>
                <Select
                  value={datasetForm.type}
                  onChange={(e) => setDatasetForm({ ...datasetForm, type: e.target.value as any })}
                >
                  <option value="text">متنی</option>
                  <option value="audio">صوتی</option>
                  <option value="structured">ساختار یافته</option>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">توضیحات (اختیاری)</label>
              <Input
                value={datasetForm.description}
                onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                placeholder="توضیحات دیتاست..."
              />
            </div>
            
            {isUploading && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>در حال آپلود...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleUpload}
                loading={isUploading}
                disabled={!datasetForm.name}
              >
                آپلود و پردازش
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  fileInputRef.current!.value = '';
                  setDatasetForm({ name: '', type: 'text', description: '' });
                }}
              >
                انصراف
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--c-text-secondary)]" />
        <Input
          className="pr-10"
          placeholder="جستجو در دیتاست‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Datasets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDatasets.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Database className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-secondary)]" />
            <p className="text-lg text-[color:var(--c-text-secondary)]">
              هیچ دیتاستی یافت نشد
            </p>
            <p className="text-sm text-[color:var(--c-text-secondary)] mt-2">
              با کلیک روی دکمه "آپلود دیتاست جدید" شروع کنید
            </p>
          </Card>
        ) : (
          filteredDatasets.map(dataset => (
            <Card key={dataset.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{dataset.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  dataset.status === 'ready' ? 'bg-green-100 text-green-800' :
                  dataset.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dataset.status === 'ready' ? 'آماده' :
                   dataset.status === 'processing' ? 'در حال پردازش' : 'خطا'}
                </span>
              </div>
              
              {dataset.description && (
                <p className="text-sm text-[color:var(--c-text-secondary)] mb-3">
                  {dataset.description}
                </p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-secondary)]">نوع:</span>
                  <span>{
                    dataset.type === 'text' ? 'متنی' :
                    dataset.type === 'audio' ? 'صوتی' : 'ساختار یافته'
                  }</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-secondary)]">تعداد ردیف:</span>
                  <span>{dataset.stats.rows.toLocaleString('fa-IR')}</span>
                </div>
                {dataset.stats.tokens && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--c-text-secondary)]">تعداد توکن:</span>
                    <span>{dataset.stats.tokens.toLocaleString('fa-IR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-secondary)]">حجم:</span>
                  <span>{formatFileSize(dataset.stats.size)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<BarChart className="w-4 h-4" />}
                  className="flex-1"
                >
                  آمار
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  className="flex-1"
                >
                  دانلود
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  className="text-red-600"
                >
                  حذف
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.txt,.jsonl"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}