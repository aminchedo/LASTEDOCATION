// File: client/src/components/dashboard/MemoryChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatBytes } from '@/utils/formatters';

interface MemoryChartProps {
  used: number;
  total: number;
}

export function MemoryChart({ used, total }: MemoryChartProps) {
  const free = total - used;
  const usagePercent = (used / total) * 100;

  const data = [
    { name: 'Used', value: used },
    { name: 'Free', value: free },
  ];

  const COLORS = ['#8b5cf6', '#334155'];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">
        Memory Usage
      </h3>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBytes(value)}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, entry: any) => (
                <span className="text-slate-300">
                  {value}: {formatBytes(entry.payload.value)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/50">
        <div>
          <div className="text-sm text-slate-400">Used</div>
          <div className="text-lg font-semibold text-purple-400">
            {formatBytes(used)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Total</div>
          <div className="text-lg font-semibold text-slate-50">
            {formatBytes(total)}
          </div>
        </div>
      </div>

      {/* Usage Percent */}
      <div className="mt-4">
        <div className="text-sm text-slate-400 mb-2">Usage Percentage</div>
        <div className="text-2xl font-bold text-purple-400">
          {usagePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
