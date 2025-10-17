// File: client/src/components/dashboard/StatusBadge.tsx

import { getStatusColor, getStatusIcon } from '@/utils/formatters';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'pass' | 'fail';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  pulse = false 
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full border font-semibold
        ${getStatusColor(status)}
        ${sizeClasses[size]}
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-300
      `}
    >
      {showIcon && <span>{getStatusIcon(status)}</span>}
      <span className="capitalize">{status}</span>
    </div>
  );
}
