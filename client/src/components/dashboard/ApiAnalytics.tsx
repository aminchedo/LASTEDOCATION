// File: client/src/components/dashboard/ApiAnalytics.tsx

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ApiAnalytics as ApiAnalyticsType } from '@/types/monitoring.types';
import { formatDuration, formatNumber } from '@/utils/formatters';

interface ApiAnalyticsProps {
  analytics: ApiAnalyticsType;
}

export function ApiAnalytics({ analytics }: ApiAnalyticsProps) {
  // Prepare chart data - limit to top 10 endpoints
  const chartData = analytics.endpoints
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(endpoint => ({
      name: endpoint.endpoint.split('/').pop() || endpoint.endpoint,
      count: endpoint.count,
    }));

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-50">API Analytics</h2>
          <div className="text-sm text-slate-400">
            Total: {formatNumber(analytics.total)} requests
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Successful</div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatNumber(analytics.successful)}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-400">
              {formatNumber(analytics.failed)}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-blue-400">
              {analytics.successRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Avg Duration</div>
            <div className="text-2xl font-bold text-purple-400">
              {formatDuration(analytics.avgDuration)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">
            Top Endpoints by Request Count
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Endpoint Table */}
        <div>
          <h3 className="text-lg font-semibold text-slate-50 mb-4">
            All Endpoints
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {analytics.endpoints.map((endpoint, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-300 font-mono">
                      {endpoint.endpoint}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300 text-right font-semibold">
                      {formatNumber(endpoint.count)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400 text-right">
                      {((endpoint.count / analytics.total) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
