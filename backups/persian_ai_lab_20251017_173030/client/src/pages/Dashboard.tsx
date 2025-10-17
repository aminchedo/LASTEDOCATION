// File: client/src/pages/Dashboard.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMonitoring } from '@/hooks/useMonitoring';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CPUChart } from '@/components/dashboard/CPUChart';
import { MemoryChart } from '@/components/dashboard/MemoryChart';
import { HealthChecks } from '@/components/dashboard/HealthChecks';
import { ApiAnalytics } from '@/components/dashboard/ApiAnalytics';
import { PerformanceTable } from '@/components/dashboard/PerformanceTable';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { formatBytes, formatUptime, formatRelativeTime } from '@/utils/formatters';
import {
  CpuChipIcon,
  CircleStackIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { data, loading, error, refetch, lastUpdated } = useMonitoring({
    autoRefresh: true,
    refreshInterval: 10000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading monitoring data..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 
                     rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-50 mb-2">
                Monitoring Dashboard
              </h1>
              <p className="text-slate-400">
                Real-time system performance and health monitoring
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Badge */}
              <StatusBadge status={data.health.status} pulse />

              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-sm text-slate-400">
                  Updated {formatRelativeTime(lastUpdated)}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 
                         border border-slate-700/50 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon
                  className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<CpuChipIcon className="w-6 h-6" />}
            title="CPU Usage"
            value={`${data.system.cpu.usage.toFixed(1)}%`}
            subtitle={`${data.system.cpu.cores} cores`}
            color="blue"
            delay={0}
          />

          <MetricCard
            icon={<CircleStackIcon className="w-6 h-6" />}
            title="Memory"
            value={formatBytes(data.system.memory.used)}
            subtitle={`of ${formatBytes(data.system.memory.total)}`}
            color="purple"
            delay={0.1}
          />

          <MetricCard
            icon={<ClockIcon className="w-6 h-6" />}
            title="Uptime"
            value={formatUptime(data.system.uptime)}
            subtitle="System running"
            color="emerald"
            delay={0.2}
          />

          <MetricCard
            icon={<span className="text-2xl">📊</span>}
            title="Total Requests"
            value={data.analytics.total.toLocaleString()}
            subtitle={`${data.analytics.successRate.toFixed(1)}% success`}
            color="amber"
            delay={0.3}
          />
        </div>

        {/* Health Checks */}
        <HealthChecks checks={data.health.checks} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CPUChart currentUsage={data.system.cpu.usage} />
          <MemoryChart used={data.system.memory.used} total={data.system.memory.total} />
        </div>

        {/* API Analytics */}
        <ApiAnalytics analytics={data.analytics} />

        {/* Performance Table */}
        <PerformanceTable performance={data.performance} />
      </div>
    </div>
  );
}
