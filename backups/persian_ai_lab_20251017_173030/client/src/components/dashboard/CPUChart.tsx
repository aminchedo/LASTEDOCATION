// File: client/src/components/dashboard/CPUChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

interface CPUDataPoint {
  timestamp: string;
  usage: number;
}

interface CPUChartProps {
  currentUsage: number;
}

export function CPUChart({ currentUsage }: CPUChartProps) {
  const [data, setData] = useState<CPUDataPoint[]>([]);

  useEffect(() => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    setData(prev => {
      const newData = [...prev, { timestamp, usage: currentUsage }];
      // Keep last 20 data points
      return newData.slice(-20);
    });
  }, [currentUsage]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-50">
          CPU Usage Over Time
        </h3>
        <div className="text-2xl font-bold text-blue-400">
          {currentUsage.toFixed(1)}%
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
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
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <div className="text-sm text-slate-400">Current</div>
          <div className="text-lg font-semibold text-slate-50">
            {currentUsage.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">Average</div>
          <div className="text-lg font-semibold text-slate-50">
            {data.length > 0
              ? (data.reduce((sum, d) => sum + d.usage, 0) / data.length).toFixed(1)
              : '0'}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">Peak</div>
          <div className="text-lg font-semibold text-slate-50">
            {data.length > 0 ? Math.max(...data.map(d => d.usage)).toFixed(1) : '0'}%
          </div>
        </div>
      </div>
    </div>
  );
}
