import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { Brain, Settings, Play, Save, Code, Layers, Zap, Database, Activity } from 'lucide-react';
import { useAILab } from '@/hooks/api/useAILab';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

interface ModelConfig {
  name: string;
  type: 'tts' | 'stt' | 'nlp' | 'cv' | 'custom';
  architecture: string;
  datasetId: string;
  layers: number;
  modelName: string;
  modelType: string;
  parameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    optimizer: string;
  };
}

export function ModelBuilderPage() {
  const { datasets, activeJobs, startTraining, isConnected } = useAILab();
  
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    name: '',
    type: 'tts',
    architecture: 'transformer',
    datasetId: '',
    layers: 12,
    modelName: '',
    modelType: 'tts',
    parameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      optimizer: 'adam'
    }
  });

  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Get active job for display
  const activeJob = activeJobs.find(job => job.jobId === selectedJob);

  // Prepare chart data
  const chartData = activeJob?.metrics.loss.map((loss, index) => ({
    epoch: index + 1,
    loss: loss,
    accuracy: activeJob.metrics.accuracy[index],
    valLoss: activeJob.metrics.validationLoss[index],
    valAccuracy: activeJob.metrics.validationAccuracy[index]
  })) || [];

  const handleBuildModel = async () => {
    // Validate inputs
    if (!modelConfig.name) {
      toast.error('لطفاً نام مدل را وارد کنید');
      return;
    }
    
    if (!modelConfig.datasetId) {
      toast.error('لطفاً یک دیتاست انتخاب کنید');
      return;
    }

    setIsBuilding(true);
    
    try {
      // Convert ModelConfig to TrainingConfig for useAILab
      const trainingConfig = {
        modelName: modelConfig.name,
        modelType: modelConfig.type as 'tts' | 'stt' | 'nlp' | 'cv' | 'custom',
        architecture: modelConfig.architecture,
        datasetId: modelConfig.datasetId,
        parameters: {
          epochs: modelConfig.parameters.epochs,
          batchSize: modelConfig.parameters.batchSize,
          learningRate: modelConfig.parameters.learningRate,
          optimizer: modelConfig.parameters.optimizer
        },
        layers: modelConfig.layers
      };
      
      const jobId = await startTraining(trainingConfig);
      setSelectedJob(jobId);
      toast.success('آموزش مدل شروع شد');
    } catch (error) {
      console.error('Failed to start training:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-[color:var(--c-primary)]" />
          سازنده مدل
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'متصل' : 'قطع شده'}</span>
          </div>
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleBuildModel}
            loading={isBuilding}
            disabled={!isConnected}
          >
            شروع آموزش مدل
          </Button>
        </div>
      </div>

      {/* Active Training Jobs */}
      {activeJobs.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            کارهای آموزش فعال
          </h2>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <div 
                key={job.jobId}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJob === job.jobId ? 'border-[color:var(--c-primary)] bg-[color:var(--c-bg-elevated)]' : 'border-[color:var(--c-border)]'
                }`}
                onClick={() => setSelectedJob(job.jobId)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Job ID: {job.jobId.substring(0, 8)}...</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <Progress value={job.progress} className="mb-2" />
                {job.currentEpoch && job.totalEpochs && (
                  <p className="text-sm text-[color:var(--c-text-secondary)]">
                    Epoch {job.currentEpoch} از {job.totalEpochs}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Training Metrics Chart */}
      {selectedJob && activeJob && chartData.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">معیارهای آموزش</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
                <Line type="monotone" dataKey="accuracy" stroke="#82ca9d" name="Accuracy" />
                <Line type="monotone" dataKey="valLoss" stroke="#ffc658" name="Val Loss" />
                <Line type="monotone" dataKey="valAccuracy" stroke="#ff7c7c" name="Val Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

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
                onChange={(e) => setModelConfig({ ...modelConfig, type: e.target.value as any })}
              >
                <option value="tts">تبدیل متن به گفتار (TTS)</option>
                <option value="stt">تبدیل گفتار به متن (STT)</option>
                <option value="nlp">پردازش زبان طبیعی (NLP)</option>
                <option value="cv">بینایی ماشین (CV)</option>
                <option value="custom">سفارشی</option>
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
                <option value="bert">BERT</option>
                <option value="custom">سفارشی</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                دیتاست
              </label>
              <Select
                value={modelConfig.datasetId}
                onChange={(e) => setModelConfig({ ...modelConfig, datasetId: e.target.value })}
              >
                <option value="">انتخاب دیتاست...</option>
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.stats.rows} ردیف)
                  </option>
                ))}
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
              disabled={!modelConfig.name || !modelConfig.datasetId}
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