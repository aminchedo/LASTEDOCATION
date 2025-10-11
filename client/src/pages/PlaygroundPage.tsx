import { useState, useRef } from 'react';
import { 
  Play, 
  Square, 
  Copy, 
  Trash2, 
  Settings, 
  Clock, 
  Hash,
  Zap,
  Save,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface PlaygroundSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface PlaygroundResult {
  id: string;
  prompt: string;
  response: string;
  settings: PlaygroundSettings;
  metrics: {
    tokens: number;
    latency: number;
    timestamp: number;
  };
}

const defaultSettings: PlaygroundSettings = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
};

const availableModels = [
  { value: 'gpt-4', label: 'GPT-4', description: 'قدرتمندترین مدل' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'سریع و کارآمد' },
  { value: 'claude-3', label: 'Claude 3', description: 'متعادل و دقیق' }
];

function PlaygroundPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<PlaygroundSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [results, setResults] = useState<PlaygroundResult[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PlaygroundResult['metrics'] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = async () => {
    if (!prompt.trim()) {
      toast.error('لطفا یک پیام وارد کنید');
      return;
    }

    setIsRunning(true);
    setResponse('');
    setCurrentMetrics(null);

    // Simulate API call
    const startTime = Date.now();
    
    try {
      // Mock response generation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const mockResponse = `این یک پاسخ نمونه برای پیام شما است: "${prompt}". این پاسخ توسط مدل ${settings.model} تولید شده است.`;
      const latency = Date.now() - startTime;
      const tokens = Math.floor(Math.random() * 500) + 100;

      setResponse(mockResponse);
      setCurrentMetrics({
        tokens,
        latency,
        timestamp: Date.now()
      });

      // Save to results
      const newResult: PlaygroundResult = {
        id: Math.random().toString(36).substr(2, 9),
        prompt,
        response: mockResponse,
        settings: { ...settings },
        metrics: {
          tokens,
          latency,
          timestamp: Date.now()
        }
      };
      setResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results

      toast.success('پاسخ تولید شد');
    } catch (error) {
      toast.error('خطا در تولید پاسخ');
      console.error('Playground error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    toast('تولید پاسخ متوقف شد', { icon: '⏹️' });
  };

  const handleClear = () => {
    setPrompt('');
    setResponse('');
    setCurrentMetrics(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('متن کپی شد');
  };

  const handleSavePrompt = () => {
    if (!prompt.trim()) {
      toast.error('لطفا یک پیام وارد کنید');
      return;
    }
    toast.success('پیام ذخیره شد');
  };

  const handleExportResults = () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('نتایج صادر شد');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">پلی‌گراند</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            آزمایش و تست مدل‌های هوش مصنوعی
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings className="w-5 h-5" />}
            onClick={() => setShowSettings(!showSettings)}
          >
            تنظیمات
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExportResults}
            disabled={results.length === 0}
          >
            صادرات
          </Button>
                  </div>
                </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Playground */}
        <div className="lg:col-span-2 space-y-6">
          {/* Settings Panel */}
          {showSettings && (
            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">تنظیمات مدل</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">مدل</label>
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  >
                    {availableModels.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                    </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                      دما: {settings.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--c-text)] mb-2">
                      حداکثر توکن: {settings.maxTokens}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Input */}
          <Card variant="elevated">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[color:var(--c-text)]">پیام</h3>
            </CardHeader>
            <CardContent>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="پیام خود را اینجا بنویسید..."
                className="w-full h-32 p-4 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] resize-none"
                disabled={isRunning}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-[color:var(--c-text-muted)]">
                  {prompt.length} کاراکتر
                    </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSavePrompt}
                    disabled={!prompt.trim()}
                  >
                    ذخیره
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={handleClear}
                    disabled={isRunning}
                  >
                    پاک کردن
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Output */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">پاسخ</h3>
                {response && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                    onClick={() => handleCopy(response)}
                  >
                    کپی
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-32 p-4 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)]">
                {isRunning ? (
                  <div className="flex items-center gap-3 text-[color:var(--c-text-muted)]">
                    <div className="w-4 h-4 border-2 border-[color:var(--c-primary)] border-t-transparent rounded-full animate-spin" />
                    <span>در حال تولید پاسخ...</span>
          </div>
                ) : response ? (
                  <div className="text-[color:var(--c-text)] whitespace-pre-wrap">{response}</div>
                ) : (
                  <div className="text-[color:var(--c-text-muted)]">پاسخی وجود ندارد</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {isRunning ? (
              <Button
                variant="danger"
                icon={<Square className="w-5 h-5" />}
                onClick={handleStop}
              >
                توقف
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Play className="w-5 h-5" />}
                onClick={handleRun}
                disabled={!prompt.trim()}
              >
                اجرا
              </Button>
            )}
            <div className="flex items-center gap-4 text-sm text-[color:var(--c-text-muted)]">
              {currentMetrics && (
                <>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>{currentMetrics.tokens} توکن</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentMetrics.latency}ms</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="space-y-6">
          {/* Current Metrics */}
          {currentMetrics && (
            <Card variant="elevated">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">آمار فعلی</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-muted)]">توکن‌ها:</span>
                  <span className="font-medium text-[color:var(--c-text)]">{currentMetrics.tokens}</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-muted)]">زمان پاسخ:</span>
                  <span className="font-medium text-[color:var(--c-text)]">{currentMetrics.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--c-text-muted)]">مدل:</span>
                  <Badge variant="secondary">{settings.model}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Results */}
          <Card variant="elevated">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[color:var(--c-text)]">نتایج اخیر</h3>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-[color:var(--c-text-muted)]">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>هیچ نتیجه‌ای وجود ندارد</p>
                </div>
              ) : (
                  <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className="p-3 border border-[color:var(--c-border)] rounded-lg hover:bg-[color:var(--c-border)]/20 transition-colors cursor-pointer"
                      onClick={() => {
                        setPrompt(result.prompt);
                        setResponse(result.response);
                        setCurrentMetrics(result.metrics);
                      }}
                    >
                      <div className="text-sm font-medium text-[color:var(--c-text)] mb-1 line-clamp-2">
                        {result.prompt}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[color:var(--c-text-muted)]">
                        <span>{formatTime(result.metrics.timestamp)}</span>
                        <div className="flex items-center gap-2">
                          <span>{result.metrics.tokens} توکن</span>
                          <span>{result.metrics.latency}ms</span>
                        </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Default export for React.lazy compatibility
export default PlaygroundPage;