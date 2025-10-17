import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { FolderOpen, Upload, Filter, Download, Trash2, Eye, Tag, Search } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  type: string;
  size: string;
  samples: number;
  created: string;
  tags: string[];
  status: 'ready' | 'processing' | 'error';
}

export function DatasetManagerPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: '1',
      name: 'Persian Speech Corpus v1',
      type: 'audio',
      size: '2.5 GB',
      samples: 10000,
      created: '2024-01-15',
      tags: ['persian', 'speech', 'tts'],
      status: 'ready'
    },
    {
      id: '2',
      name: 'Persian Text Dataset',
      type: 'text',
      size: '500 MB',
      samples: 50000,
      created: '2024-01-10',
      tags: ['persian', 'text', 'nlp'],
      status: 'ready'
    },
    {
      id: '3',
      name: 'Mixed Audio Samples',
      type: 'audio',
      size: '1.2 GB',
      samples: 5000,
      created: '2024-01-20',
      tags: ['audio', 'mixed'],
      status: 'processing'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dataset.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || dataset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'ready': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-[color:var(--c-primary)]" />
          مدیریت دیتاست
        </h1>
        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => setShowUploadModal(true)}
        >
          آپلود دیتاست جدید
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--c-text-secondary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در دیتاست‌ها..."
              className="ps-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedType === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              همه
            </Button>
            <Button
              variant={selectedType === 'audio' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType('audio')}
            >
              صوتی
            </Button>
            <Button
              variant={selectedType === 'text' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType('text')}
            >
              متنی
            </Button>
          </div>
        </div>
      </Card>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDatasets.map((dataset) => (
          <Card key={dataset.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{dataset.name}</h3>
                <p className="text-sm text-[color:var(--c-text-secondary)]">
                  {dataset.samples.toLocaleString('fa-IR')} نمونه
                </p>
              </div>
              <Badge variant={getStatusColor(dataset.status)}>
                {dataset.status === 'ready' ? 'آماده' : 
                 dataset.status === 'processing' ? 'در حال پردازش' : 'خطا'}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-[color:var(--c-text-secondary)]">
                <FolderOpen className="w-4 h-4" />
                <span>نوع: {dataset.type === 'audio' ? 'صوتی' : 'متنی'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--c-text-secondary)]">
                <Download className="w-4 h-4" />
                <span>حجم: {dataset.size}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--c-text-secondary)]">
                <Tag className="w-4 h-4" />
                <div className="flex flex-wrap gap-1">
                  {dataset.tags.map((tag) => (
                    <span key={tag} className="bg-[color:var(--c-bg-elevated)] px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                icon={<Eye className="w-4 h-4" />}
                size="sm"
                className="flex-1"
              >
                پیش‌نمایش
              </Button>
              <Button
                variant="ghost"
                icon={<Download className="w-4 h-4" />}
                size="sm"
                className="flex-1"
              >
                دانلود
              </Button>
              <Button
                variant="ghost"
                icon={<Trash2 className="w-4 h-4" />}
                size="sm"
                className="text-[color:var(--c-danger)]"
              >
                حذف
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload Modal (placeholder) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">آپلود دیتاست جدید</h2>
            <div className="space-y-4">
              <Input placeholder="نام دیتاست" />
              <div className="border-2 border-dashed border-[color:var(--c-border)] rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-[color:var(--c-text-secondary)]" />
                <p className="text-sm text-[color:var(--c-text-secondary)]">
                  فایل‌ها را اینجا بکشید یا کلیک کنید
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
                  انصراف
                </Button>
                <Button variant="primary">
                  آپلود
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}