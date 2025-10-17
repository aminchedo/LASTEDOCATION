import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Rocket, Package, Download, Code, FileCode, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportConfig {
  format: string;
  optimization: string;
  quantization: boolean;
  includeWeights: boolean;
  includeMetadata: boolean;
  targetPlatform: string;
}

interface Model {
  id: string;
  name: string;
  version: string;
  size: string;
  accuracy: number;
  status: 'trained' | 'training' | 'failed';
}

export function ModelExporterPage() {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'onnx',
    optimization: 'balanced',
    quantization: false,
    includeWeights: true,
    includeMetadata: true,
    targetPlatform: 'generic'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([
    { id: '1', model: 'Persian TTS v2', format: 'ONNX', date: '2024-01-20', size: '245 MB' },
    { id: '2', model: 'Persian STT v1', format: 'TensorFlow', date: '2024-01-18', size: '180 MB' },
    { id: '3', model: 'Persian NLP Base', format: 'PyTorch', date: '2024-01-15', size: '320 MB' }
  ]);

  const models: Model[] = [
    { id: '1', name: 'Persian TTS v2', version: '2.0.0', size: '500 MB', accuracy: 95.8, status: 'trained' },
    { id: '2', name: 'Persian STT v1', version: '1.5.0', size: '350 MB', accuracy: 92.3, status: 'trained' },
    { id: '3', name: 'Persian NLP Base', version: '1.0.0', size: '600 MB', accuracy: 88.5, status: 'trained' },
    { id: '4', name: 'Persian TTS v3 Beta', version: '3.0.0-beta', size: '550 MB', accuracy: 97.2, status: 'training' }
  ];

  const handleExport = async () => {
    if (!selectedModel) return;
    
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      // Add to export history
      const model = models.find(m => m.id === selectedModel);
      if (model) {
        setExportHistory([
          {
            id: Date.now().toString(),
            model: model.name,
            format: exportConfig.format.toUpperCase(),
            date: new Date().toISOString().split('T')[0],
            size: '200 MB'
          },
          ...exportHistory
        ]);
      }
    }, 3000);
  };

  const getOptimizationSize = () => {
    switch (exportConfig.optimization) {
      case 'speed': return '~150% اندازه اصلی';
      case 'size': return '~50% اندازه اصلی';
      case 'balanced': return '~100% اندازه اصلی';
      default: return 'نامشخص';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Rocket className="w-8 h-8 text-[color:var(--c-primary)]" />
          صادرکننده مدل
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              انتخاب مدل
            </h2>
            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? 'border-[color:var(--c-primary)] bg-[color:var(--c-primary-50)]'
                      : 'border-[color:var(--c-border)] hover:border-[color:var(--c-primary-300)]'
                  } ${model.status !== 'trained' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => model.status === 'trained' && setSelectedModel(model.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{model.name}</h3>
                      <p className="text-sm text-[color:var(--c-text-secondary)]">
                        نسخه {model.version} • {model.size} • دقت {model.accuracy}%
                      </p>
                    </div>
                    <Badge
                      variant={model.status === 'trained' ? 'success' : model.status === 'training' ? 'warning' : 'danger'}
                    >
                      {model.status === 'trained' ? 'آماده' : model.status === 'training' ? 'در حال آموزش' : 'ناموفق'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              تنظیمات صادرات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">فرمت صادرات</label>
                <Select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                >
                  <option value="onnx">ONNX</option>
                  <option value="tensorflow">TensorFlow</option>
                  <option value="pytorch">PyTorch</option>
                  <option value="tflite">TensorFlow Lite</option>
                  <option value="coreml">Core ML</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">بهینه‌سازی</label>
                <Select
                  value={exportConfig.optimization}
                  onChange={(e) => setExportConfig({ ...exportConfig, optimization: e.target.value })}
                >
                  <option value="speed">سرعت</option>
                  <option value="size">اندازه</option>
                  <option value="balanced">متعادل</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">پلتفرم هدف</label>
                <Select
                  value={exportConfig.targetPlatform}
                  onChange={(e) => setExportConfig({ ...exportConfig, targetPlatform: e.target.value })}
                >
                  <option value="generic">عمومی</option>
                  <option value="mobile">موبایل</option>
                  <option value="edge">Edge Device</option>
                  <option value="server">سرور</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportConfig.quantization}
                    onChange={(e) => setExportConfig({ ...exportConfig, quantization: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">کوانتیزیشن (کاهش حجم)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeWeights}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeWeights: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">شامل وزن‌ها</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeMetadata}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeMetadata: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">شامل متادیتا</span>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Export Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">خلاصه صادرات</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--c-text-secondary)]">فرمت:</span>
                <span className="font-medium">{exportConfig.format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--c-text-secondary)]">اندازه تقریبی:</span>
                <span className="font-medium">{getOptimizationSize()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--c-text-secondary)]">کوانتیزیشن:</span>
                <span className="font-medium">{exportConfig.quantization ? 'فعال' : 'غیرفعال'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--c-text-secondary)]">پلتفرم:</span>
                <span className="font-medium">{exportConfig.targetPlatform}</span>
              </div>
            </div>
            <Button
              variant="primary"
              icon={<Download className="w-4 h-4" />}
              className="w-full mt-6"
              onClick={handleExport}
              disabled={!selectedModel || isExporting}
              loading={isExporting}
            >
              صادر کردن مدل
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              نمونه کد استفاده
            </h3>
            <pre className="bg-[color:var(--c-bg-elevated)] p-4 rounded-lg text-xs overflow-auto">
{`import onnxruntime as ort

# Load model
session = ort.InferenceSession("model.onnx")

# Run inference
inputs = {session.get_inputs()[0].name: data}
outputs = session.run(None, inputs)`}
            </pre>
          </Card>
        </div>
      </div>

      {/* Export History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">تاریخچه صادرات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[color:var(--c-border)]">
                <th className="text-start py-3 px-4">مدل</th>
                <th className="text-start py-3 px-4">فرمت</th>
                <th className="text-start py-3 px-4">تاریخ</th>
                <th className="text-start py-3 px-4">حجم</th>
                <th className="text-start py-3 px-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {exportHistory.map((item) => (
                <tr key={item.id} className="border-b border-[color:var(--c-border)]">
                  <td className="py-3 px-4">{item.model}</td>
                  <td className="py-3 px-4">{item.format}</td>
                  <td className="py-3 px-4">{item.date}</td>
                  <td className="py-3 px-4">{item.size}</td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                    >
                      دانلود
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}