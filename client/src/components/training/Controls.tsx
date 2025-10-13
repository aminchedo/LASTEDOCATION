import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Play, 
  Pause, 
  Square, 
  Save,
  RotateCcw,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useTraining } from '@/hooks/useTraining';
import toast from 'reacexport function Controls() {
  const { 
    jobs,
    startTraining, 
    resumeTraining, 
    stopTraining,
    loading
  } = useTraining();
  
  const currentJob = jobs.find(j => j.status === 'running' || j.status === 'queued');
  const status = currentJob?.status;ing 
  } = useTraining();

  const [config, setConfig] = useState({
    totalEpochs: 10,
    totalSteps: 1000,
    learningRate: 0.001,
    batchSize: 32,
    saveEverySteps: 100
  });

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('');

  const handleStart = async () => {
    try {
      await startTraining({
        ...config,
        resumeCheckpointId: selectedCheckpoint || undefined
      });
      toast.success('آموزش با موفقیت شروع شد');
    } catch (error: any) {
      toast.error(`خ  const handlePause = async () => {
    if (!currentJob) return;
    try {
      await stopTraining(currentJob.id);
      toast.success('آموزش متوقف شد');
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };st.error(`خ  const handleResume = async () => {
    if (!currentJob) return;
    try {
      await resumeTraining(currentJob.id);
      toast.success('آموزش از سر گرفته شد');
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };st.error(`خ  const handleStop = async () => {
    if (!currentJob) return;
    try {
      await stopTraining(currentJob.id);
      toast.success('آموزش متوقف شد');
    } catch (error: any) {
      toast.error(`خطا: ${error.message}`);
    }
  };st.error(`خ  const handleCheckpoint = async () => {
    // Checkpoint creation not implemented yet
    toast.info('قابلیت ذخیره چک‌پوینت در حال توسعه است');
  };st.error(`خ  const isRunning = status === 'running';
  const isPaused = false; // Paused state not supported yet
  const isIdle = !status || status === 'completed' || status === 'failed';?.currentRun || status?.status === 'idle';

  return (
    <Card variant="elevated">
      <CardHeader>
        <h2 className="text-xl font-semibold text-[color:var(--c-text)] flex items-center gap-2">
          <Settings className="w-5 h-5" />
          کنترل‌های آموزش
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Training Controls */}
        <div className="flex flex-wrap gap-3">
          {isIdle && (
            <Button
              variant="primary"
              size="lg"
              icon={<Play className="w-5 h-5" />}
              onClick={handleStart}
              disabled={loading}
            >
              شروع آموزش
            </Button>
          )}

          {isRunning && (
            <>
              <Button
                variant="secondary"
                size="lg"
                icon={<Pause className="w-5 h-5" />}
                onClick={handlePause}
                disabled={loading}
              >
                توقف
              </Button>
              <Button
                variant="destructive"
                size="lg"
                icon={<Square className="w-5 h-5" />}
                onClick={handleStop}
                disabled={loading}
              >
                متوقف کردن
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                variant="primary"
                size="lg"
                icon={<Play className="w-5 h-5" />}
                onClick={handleResume}
                disabled={loading}
              >
                ادامه
              </Button>
              <Button
                variant="destructive"
                size="lg"
                icon={<Square className="w-5 h-5" />}
                onClick={handleStop}
                disabled={loading}
              >
                متوقف کردن
              </Button>
            </>
          )}

          {(isRunning || isPaused) && (
            <Button
              variant="outline"
              size="lg"
              icon={<Save className="w-5 h-5" />}
              onClick={handleCheckpoint}
              disabled={loading}
            >
              ذخیره چک‌پوینت
            </Button>
          )}
        </div>

        {/* Configuration Form */}
        {isIdle && (
          <div className="space-y-4 p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <h3 className="text-lg font-medium text-[color:var(--c-text)]">پیکربندی آموزش</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  تعداد دوره‌ها
                </label>
                <Input
                  type="number"
                  value={config.totalEpochs}
                  onChange={(e) => setConfig(prev => ({ ...prev, totalEpochs: parseInt(e.target.value) }))}
                  min={1}
                  max={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  تعداد مراحل
                </label>
                <Input
                  type="number"
                  value={config.totalSteps}
                  onChange={(e) => setConfig(prev => ({ ...prev, totalSteps: parseInt(e.target.value) }))}
                  min={100}
                  max={10000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  نرخ یادگیری
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={config.learningRate}
                  onChange={(e) => setConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                  min={0.0001}
                  max={0.01}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  اندازه دسته
                </label>
                <Input
                  type="number"
                  value={config.batchSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  min={1}
                  max={128}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                  ذخیره هر N مرحله
                </label>
                <Input
                  type="number"
                  value={config.saveEverySteps}
                  onChange={(e) => setConfig(prev => ({ ...prev, saveEverySteps: parseInt(e.target.value) }))}
                  min={10}
                  max={1000}
                />
              </div>
            </div>

            {/* Resume from Checkpoint */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                ادامه از چک‌پوینت (اختیاری)
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                value={selectedCheckpoint}
                onChange={(e) => setSelectedCheckpoint(e.target.value)}
              >
                <option value="">شروع جدید</option>
                {/* TODO: Load available checkpoints */}
             {/* Status Information */}
        {currentJob && (             <option value="checkpoint_2">بهترین چک‌پوینت</option>
              </select>
            </div>
          </div>
        )}

        {/* Status Information */}
        {status?.currentRun && (
          <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <h3 className="text-lg font-medium text-[color:var(--c                <span className="mr-2 text-[color:var(--c-text)] font-mono">
                  {currentJob.id.slice(-12)}
                </span> className="text-[color:var(--c-text-muted)]">شناسه جلسه:</span>
                <span className="mr-2 text-[color:var(--c-text)] font-mono">
                  {status.currentRun.id.slice(-12)}
                </span>
              </div>
              <div>
                <span className="text-[color:var(--c-text-muted)]">وضعیت:</span>
                <Badge 
                  variant={isRunning ? 'success' : isPaused ? 'warning' : 'default'}
                  className="mr-2"
                >
                  <span className="mr-2 text-[color:var(--c-text)]">
                  {currentJob.startedAt ? new Date(currentJob.startedAt).toLocaleString('fa-IR') : '-'}
                </span>lassName="text-[color:var(--c-text-muted)]">شروع:</span>
                <span className="mr-2 text-[color:var(--c-text)]">
                  <span className="mr-2 text-[color:var(--c-text)]">
                  {currentJob.progress}%
                </span>    <div>
                <span className="text-[color:var(--c-text-muted)]">پیشرفت:</span>
                <span className="mr-2 text-[color:var(--c-text)]">
                  {status.currentRun.progress}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
          <h3 className="text-lg font-medium text-[color:var(--c-text)] mb-3">میانبرهای صفحه‌کلید</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[color:var(--c-text-muted)]">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[color:var(--c-bg)] border border-[color:var(--c-border)] rounded text-xs">Space</kbd>
              <span>توقف/ادامه آموزش</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[color:var(--c-bg)] border border-[color:var(--c-border)] rounded text-xs">Esc</kbd>
              <span>متوقف کردن آموزش</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-[color:var(--c-bg)] border border-[color:var(--c-border)] rounded text-xs">S</kbd>
              <span>ذخیره چک‌پوینت</span>
            </div>
            <div        {/* Error Display */}
        {currentJob?.status === 'failed' && ([color:var(--c-bg)] border border-[color:var(--c-border)] rounded text-xs">R</kbd>
              <span>شروع مجدد</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {status?.currentRun?.status === 'error' && (
          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">خطا در آموزش</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">
              آموزش با خطا مواجه شد. لطفاً لاگ‌ها را بررسی کنید و مجدداً تلاش کنید.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
