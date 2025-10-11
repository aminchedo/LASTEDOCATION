import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  TrendingDown, 
  TrendingUp, 
  Activity,
  BarChart3,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useTraining } from '@/hooks/useTraining';

interface MetricData {
  id: string;
  timestamp: string;
  runId: string;
  epoch: number;
  step: number;
  loss: number;
  valLoss?: number;
  accuracy?: number;
  valAccuracy?: number;
  throughput?: number;
  stepTimeMs?: number;
  lr?: number;
}

export function MetricsChart() {
  const { status } = useTraining();
  const [activeTab, setActiveTab] = useState<'loss' | 'accuracy' | 'throughput'>('loss');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const tabs = [
    { id: 'loss', label: 'Loss', icon: TrendingDown },
    { id: 'accuracy', label: 'دقت', icon: TrendingUp },
    { id: 'throughput', label: 'عملکرد', icon: Activity },
  ];

  const fetchMetrics = async () => {
    if (!status?.currentRun) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/train/metrics');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 2 seconds when training is active
    const interval = setInterval(() => {
      if (status?.status === 'running') {
        fetchMetrics();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status?.status]);

  const getChartData = () => {
    if (!metrics.length) return [];

    switch (activeTab) {
      case 'loss':
        return metrics.map(m => ({
          x: m.step,
          y: m.loss,
          valY: m.valLoss,
          epoch: m.epoch
        }));
      case 'accuracy':
        return metrics.map(m => ({
          x: m.step,
          y: m.accuracy ? m.accuracy * 100 : 0,
          valY: m.valAccuracy ? m.valAccuracy * 100 : 0,
          epoch: m.epoch
        }));
      case 'throughput':
        return metrics.map(m => ({
          x: m.step,
          y: m.throughput || 0,
          valY: 0,
          epoch: m.epoch
        }));
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const latestMetric = metrics[metrics.length - 1];

  const getYAxisLabel = () => {
    switch (activeTab) {
      case 'loss':
        return 'Loss';
      case 'accuracy':
        return 'دقت (%)';
      case 'throughput':
        return 'نمونه/ثانیه';
      default:
        return '';
    }
  };

  const getLatestValue = () => {
    if (!latestMetric) return '—';
    
    switch (activeTab) {
      case 'loss':
        return latestMetric.loss.toFixed(4);
      case 'accuracy':
        return latestMetric.accuracy ? `${(latestMetric.accuracy * 100).toFixed(1)}%` : '—';
      case 'throughput':
        return latestMetric.throughput ? latestMetric.throughput.toFixed(1) : '—';
      default:
        return '—';
    }
  };

  const getMinMaxValues = () => {
    if (!chartData.length) return { min: 0, max: 1 };
    
    const values = chartData.map(d => d.y).filter(v => v !== undefined);
    if (values.length === 0) return { min: 0, max: 1 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  const { min, max } = getMinMaxValues();
  const range = max - min;
  const padding = range * 0.1;

  // Simple SVG chart implementation
  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-[color:var(--c-text-muted)]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>هیچ داده‌ای برای نمایش وجود ندارد</p>
          </div>
        </div>
      );
    }

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = (step: number) => {
      const maxStep = Math.max(...chartData.map(d => d.x));
      return (step / maxStep) * chartWidth;
    };

    const yScale = (value: number) => {
      const adjustedMin = min - padding;
      const adjustedMax = max + padding;
      return chartHeight - ((value - adjustedMin) / (adjustedMax - adjustedMin)) * chartHeight;
    };

    const points = chartData.map(d => `${xScale(d.x)},${yScale(d.y)}`).join(' ');
    const valPoints = chartData.filter(d => d.valY !== undefined).map(d => `${xScale(d.x)},${yScale(d.valY!)}`).join(' ');

    return (
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="w-full">
          <defs>
            <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--c-primary)" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="var(--c-primary)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight * ratio;
              const value = min - padding + (max + padding - (min - padding)) * (1 - ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="var(--c-border)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  <text
                    x={-10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="var(--c-text-muted)"
                  >
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = chartWidth * ratio;
              const step = Math.max(...chartData.map(d => d.x)) * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartHeight}
                    stroke="var(--c-border)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  <text
                    x={x}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--c-text-muted)"
                  >
                    {Math.round(step)}
                  </text>
                </g>
              );
            })}
            
            {/* Training line */}
            <polyline
              points={points}
              fill="none"
              stroke="var(--c-primary)"
              strokeWidth="2"
            />
            
            {/* Validation line (if available) */}
            {valPoints && (
              <polyline
                points={valPoints}
                fill="none"
                stroke="var(--c-secondary)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            
            {/* Area under curve */}
            <polygon
              points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
              fill="url(#lossGradient)"
            />
          </g>
          
          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="14"
            fill="var(--c-text-muted)"
          >
            مرحله
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="14"
            fill="var(--c-text-muted)"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {getYAxisLabel()}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--c-text)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            نمودار معیارها
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<ZoomOut className="w-4 h-4" />}
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            />
            <span className="text-sm text-[color:var(--c-text-muted)]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={<ZoomIn className="w-4 h-4" />}
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={fetchMetrics}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[color:var(--c-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Current Value Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
          <div>
            <span className="text-sm text-[color:var(--c-text-muted)]">آخرین مقدار:</span>
            <span className="mr-2 text-lg font-semibold text-[color:var(--c-text)]">
              {getLatestValue()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[color:var(--c-text-muted)]">
            <div>
              <span>حداقل:</span>
              <span className="mr-1 text-[color:var(--c-text)]">{min.toFixed(4)}</span>
            </div>
            <div>
              <span>حداکثر:</span>
              <span className="mr-1 text-[color:var(--c-text)]">{max.toFixed(4)}</span>
            </div>
            <div>
              <span>تعداد نقاط:</span>
              <span className="mr-1 text-[color:var(--c-text)]">{chartData.length}</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
              <div className="flex items-center gap-2 text-[color:var(--c-text-muted)]">
                <div className="w-4 h-4 border-2 border-[color:var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
                <span>در حال بارگذاری...</span>
              </div>
            </div>
          )}
          {renderChart()}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[color:var(--c-primary)]"></div>
            <span className="text-[color:var(--c-text-muted)]">آموزش</span>
          </div>
          {chartData.some(d => d.valY !== undefined) && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[color:var(--c-secondary)] border-dashed border-t-2 border-[color:var(--c-secondary)]"></div>
              <span className="text-[color:var(--c-text-muted)]">اعتبارسنجی</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[color:var(--c-bg-secondary)]">
            <div>
              <div className="text-xs text-[color:var(--c-text-muted)]">میانگین Loss</div>
              <div className="text-sm font-medium text-[color:var(--c-text)]">
                {(metrics.reduce((sum, m) => sum + m.loss, 0) / metrics.length).toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--c-text-muted)]">میانگین دقت</div>
              <div className="text-sm font-medium text-[color:var(--c-text)]">
                {metrics.filter(m => m.accuracy).length > 0 
                  ? `${(metrics.filter(m => m.accuracy).reduce((sum, m) => sum + (m.accuracy || 0), 0) / metrics.filter(m => m.accuracy).length * 100).toFixed(1)}%`
                  : '—'
                }
              </div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--c-text-muted)]">میانگین عملکرد</div>
              <div className="text-sm font-medium text-[color:var(--c-text)]">
                {metrics.filter(m => m.throughput).length > 0
                  ? `${(metrics.filter(m => m.throughput).reduce((sum, m) => sum + (m.throughput || 0), 0) / metrics.filter(m => m.throughput).length).toFixed(1)}`
                  : '—'
                }
              </div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--c-text-muted)]">زمان میانگین مرحله</div>
              <div className="text-sm font-medium text-[color:var(--c-text)]">
                {metrics.filter(m => m.stepTimeMs).length > 0
                  ? `${(metrics.filter(m => m.stepTimeMs).reduce((sum, m) => sum + (m.stepTimeMs || 0), 0) / metrics.filter(m => m.stepTimeMs).length).toFixed(0)}ms`
                  : '—'
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
