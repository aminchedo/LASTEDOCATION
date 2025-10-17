// File: client/src/components/dashboard/PerformanceTable.tsx

import { motion } from 'framer-motion';
import type { PerformanceMetrics } from '@/types/monitoring.types';
import { formatDuration, getPerformanceStatus, formatNumber } from '@/utils/formatters';

interface PerformanceTableProps {
  performance: PerformanceMetrics;
}

export function PerformanceTable({ performance }: PerformanceTableProps) {
  // Sort by count descending
  const sortedPerformance = [...performance].sort((a, b) => b.count - a.count);

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-50">Performance Metrics</h2>
          <div className="text-sm text-slate-400">
            {sortedPerformance.length} operations tracked
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Operation
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Count
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Min Duration
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Max Duration
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {sortedPerformance.map((metric, index) => {
                const perfStatus = getPerformanceStatus(metric.avgDuration);
                
                return (
                  <tr 
                    key={index}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-slate-300 font-medium">
                      {metric.operation}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-300 text-right font-semibold">
                      {formatNumber(metric.count)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-300 text-right">
                      {formatDuration(metric.avgDuration)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400 text-right">
                      {formatDuration(metric.minDuration)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400 text-right">
                      {formatDuration(metric.maxDuration)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${perfStatus.color}`}>
                        {perfStatus.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Total Operations</div>
            <div className="text-2xl font-bold text-slate-50">
              {formatNumber(sortedPerformance.reduce((sum, m) => sum + m.count, 0))}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold text-blue-400">
              {sortedPerformance.length > 0
                ? formatDuration(
                    sortedPerformance.reduce((sum, m) => sum + m.avgDuration, 0) / 
                    sortedPerformance.length
                  )
                : '0ms'}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Fastest Operation</div>
            <div className="text-2xl font-bold text-emerald-400">
              {sortedPerformance.length > 0
                ? formatDuration(Math.min(...sortedPerformance.map(m => m.minDuration)))
                : '0ms'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
