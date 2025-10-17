import React, { useState, useRef } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Package, Download, Upload, FileArchive, Cpu, Clock, CheckCircle, Search } from 'lucide-react';
import { useAILab } from '@/hooks/api/useAILab';
import { toast } from 'react-hot-toast';

export function ModelExporterPage() {
  const { models, exportModel, importModel, refreshModels } = useAILab();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importForm, setImportForm] = useState({
    name: '',
    type: 'tts' as 'tts' | 'stt' | 'nlp' | 'cv' | 'custom'
  });

  const handleExport = async (modelId: string) => {
    try {
      await exportModel(modelId);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('لطفاً یک فایل ZIP حاوی مدل را انتخاب کنید');
      return;
    }

    // Set name from filename if empty
    if (!importForm.name) {
      setImportForm(prev => ({ 
        ...prev, 
        name: file.name.replace('.zip', '')
      }));
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('لطفاً یک فایل انتخاب کنید');
      return;
    }

    if (!importForm.name) {
      toast.error('لطفاً نام مدل را وارد کنید');
      return;
    }

    setIsImporting(true);

    try {
      await importModel(file, importForm);
      
      // Reset form
      setImportForm({
        name: '',
        type: 'tts'
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('مدل با موفقیت وارد شد');
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case 'tts': return 'تبدیل متن به گفتار';
      case 'stt': return 'تبدیل گفتار به متن';
      case 'nlp': return 'پردازش زبان طبیعی';
      case 'cv': return 'بینایی ماشین';
      case 'custom': return 'سفارشی';
      case 'pretrained': return 'آموزش‌دیده';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="w-8 h-8 text-[color:var(--c-primary)]" />
          صادرات و واردات مدل
        </h1>
        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          وارد کردن مدل
        </Button>
      </div>

      {/* Import Form */}
      {fileInputRef.current?.files?.length ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">وارد کردن مدل</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">فایل انتخاب شده</label>
              <div className="flex items-center gap-3 p-3 bg-[color:var(--c-bg-elevated)] rounded-lg">
                <FileArchive className="w-5 h-5 text-[color:var(--c-text-secondary)]" />
                <span>{fileInputRef.current.files[0].name}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نام مدل</label>
                <Input
                  value={importForm.name}
                  onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                  placeholder="مثال: persian-bert-v2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نوع مدل</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={importForm.type}
                  onChange={(e) => setImportForm({ ...importForm, type: e.target.value as any })}
                >
                  <option value="tts">تبدیل متن به گفتار (TTS)</option>
                  <option value="stt">تبدیل گفتار به متن (STT)</option>
                  <option value="nlp">پردازش زبان طبیعی (NLP)</option>
                  <option value="cv">بینایی ماشین (CV)</option>
                  <option value="custom">سفارشی</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleImport}
                loading={isImporting}
                disabled={!importForm.name}
              >
                وارد کردن
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  fileInputRef.current!.value = '';
                  setImportForm({ name: '', type: 'tts' });
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
          placeholder="جستجو در مدل‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-secondary)]" />
            <p className="text-lg text-[color:var(--c-text-secondary)]">
              هیچ مدلی یافت نشد
            </p>
            <p className="text-sm text-[color:var(--c-text-secondary)] mt-2">
              ابتدا یک مدل آموزش دهید یا وارد کنید
            </p>
          </Card>
        ) : (
          filteredModels.map(model => (
            <Card key={model.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{model.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  model.status === 'ready' ? 'bg-green-100 text-green-800' :
                  model.status === 'training' ? 'bg-blue-100 text-blue-800' :
                  model.status === 'available' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {model.status === 'ready' ? 'آماده' :
                   model.status === 'training' ? 'در حال آموزش' :
                   model.status === 'available' ? 'موجود' : 'خطا'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[color:var(--c-text-secondary)]" />
                  <span>{getModelTypeLabel(model.type)}</span>
                </div>
                
                {model.architecture && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[color:var(--c-text-secondary)]" />
                    <span>{model.architecture}</span>
                  </div>
                )}
                
                {model.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[color:var(--c-text-secondary)]" />
                    <span>{formatDate(model.createdAt)}</span>
                  </div>
                )}
                
                {model.inputShape && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[color:var(--c-text-secondary)]" />
                    <span className="text-xs">
                      ورودی: [{model.inputShape.join(', ')}]
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  className="flex-1"
                  onClick={() => handleExport(model.id)}
                  disabled={model.status !== 'ready'}
                >
                  صادرات
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
        accept=".zip"
        onChange={handleImportFile}
        className="hidden"
      />
    </div>
  );
}