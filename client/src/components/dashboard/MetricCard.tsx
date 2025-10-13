// File: client/src/components/dashboard/MetricCard.tsx

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  delay?: number;
}

export function MetricCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'blue',
  delay = 0,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 
                 p-6 hover:bg-slate-800/70 hover:border-slate-600/50 
                 transition-all duration-300 hover:shadow-2xl hover:shadow-black/30
                 hover:-translate-y-1"
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} 
                      flex items-center justify-center mb-4`}>
        {icon}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-slate-50 mb-1">
        {value}
      </div>

      {/* Title */}
      <div className="text-sm text-slate-400 mb-2">
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-slate-500">
          {subtitle}
        </div>
      )}

      {/* Trend */}
      {trend && trendValue && (
        <div className={`flex items-center gap-1 text-xs mt-2 
                        ${trend === 'up' ? 'text-emerald-400' : 
                          trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
          <span>{trendIcons[trend]}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}
