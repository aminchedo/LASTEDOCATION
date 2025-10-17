// File: client/src/components/dashboard/ProgressBar.tsx

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  color = 'blue',
  height = 'md',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-purple-500',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500',
    red: 'bg-gradient-to-r from-red-500 to-pink-500',
  };

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-700/30 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <motion.div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
        />
      </div>

      {showLabel && (
        <div className="text-xs text-slate-400 mt-1 text-right">
          {percentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
