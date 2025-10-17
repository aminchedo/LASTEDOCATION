import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Brain, Settings, Play, Save, Code, Layers, Zap } from 'lucide-react';

interface ModelConfig {
  name: string;
  type: string;
  architecture: string;
  layers: number;
  parameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    optimizer: string;
  };
}

export function ModelBuilderPage() {
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    name: '',
    type: 'tts',
    architecture: 'transformer',
    layers: 12,
    parameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      optimizer: 'adam'
    }
  });

  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuildModel = async () => {
    setIsBuilding(true);
    // Simulate model building
    setTimeout(() => {
      setIsBuilding(false);
      // Show success notification
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-[color:var(--c-primary)]" />
          سازنده مدل
        </h1>
        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleBuildModel}
          loading={isBuilding}
        >
          ذخیره و ساخت مدل
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تنظیمات پایه
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام مدل</label>
              <Input
                value={modelConfig.name}
                onChange={(e) => setModelConfig({ ...modelConfig, name: e.target.value })}
                placeholder="مثال: persian-tts-v2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نوع مدل</label>
              <Select
                value={modelConfig.type}
                onChange={(e) => setModelConfig({ ...modelConfig, type: e.target.value })}
              >
                <option value="tts">تبدیل متن به گفتار (TTS)</option>
                <option value="stt">تبدیل گفتار به متن (STT)</option>
                <option value="nlp">پردازش زبان طبیعی (NLP)</option>
                <option value="cv">بینایی ماشین (CV)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">معماری</label>
              <Select
                value={modelConfig.architecture}
                onChange={(e) => setModelConfig({ ...modelConfig, architecture: e.target.value })}
              >
                <option value="transformer">Transformer</option>
                <option value="lstm">LSTM</option>
                <option value="cnn">CNN</option>
                <option value="gru">GRU</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Architecture Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            پیکربندی معماری
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">تعداد لایه‌ها</label>
              <Input
                type="number"
                value={modelConfig.layers}
                onChange={(e) => setModelConfig({ ...modelConfig, layers: parseInt(e.target.value) })}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نرخ یادگیری</label>
              <Input
                type="number"
                value={modelConfig.parameters.learningRate}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  parameters: { ...modelConfig.parameters, learningRate: parseFloat(e.target.value) }
                })}
                step={0.0001}
                min={0.0001}
                max={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">اندازه دسته</label>
              <Input
                type="number"
                value={modelConfig.parameters.batchSize}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  parameters: { ...modelConfig.parameters, batchSize: parseInt(e.target.value) }
                })}
                min={1}
                max={512}
              />
            </div>
          </div>
        </Card>

        {/* Training Parameters */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            پارامترهای آموزش
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">تعداد epoch</label>
              <Input
                type="number"
                value={modelConfig.parameters.epochs}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  parameters: { ...modelConfig.parameters, epochs: parseInt(e.target.value) }
                })}
                min={1}
                max={1000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">بهینه‌ساز</label>
              <Select
                value={modelConfig.parameters.optimizer}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  parameters: { ...modelConfig.parameters, optimizer: e.target.value }
                })}
              >
                <option value="adam">Adam</option>
                <option value="sgd">SGD</option>
                <option value="rmsprop">RMSprop</option>
                <option value="adagrad">Adagrad</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Model Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            پیش‌نمایش پیکربندی
          </h2>
          <pre className="bg-[color:var(--c-bg-elevated)] p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(modelConfig, null, 2)}
          </pre>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              icon={<Play className="w-4 h-4" />}
              size="sm"
            >
              اجرای آزمایشی
            </Button>
            <Button
              variant="ghost"
              icon={<Code className="w-4 h-4" />}
              size="sm"
            >
              صدور کد
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}