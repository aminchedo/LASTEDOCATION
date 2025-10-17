// File: client/src/components/dashboard/HealthChecks.tsx

import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import type { HealthChecks as HealthChecksType } from '@/types/monitoring.types';

interface HealthChecksProps {
  checks: HealthChecksType;
}

export function HealthChecks({ checks }: HealthChecksProps) {
  const checkItems = [
    { key: 'database', label: 'Database', icon: '🗄️', ...checks.database },
    { key: 'filesystem', label: 'Filesystem', icon: '📁', ...checks.filesystem },
    { key: 'memory', label: 'Memory', icon: '💾', ...checks.memory },
    { key: 'disk', label: 'Disk', icon: '💿', ...checks.disk },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-50 mb-6">Health Checks</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {checkItems.map((check, index) => (
          <motion.div
            key={check.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6
                       hover:bg-slate-800/70 hover:border-slate-600/50 
                       transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{check.icon}</div>
              <StatusBadge status={check.status} size="sm" showIcon={false} />
            </div>

            <h3 className="text-lg font-semibold text-slate-50 mb-2">
              {check.label}
            </h3>

            {check.message && (
              <p className="text-sm text-slate-400 mb-3">
                {check.message}
              </p>
            )}

            {check.responseTime !== undefined && (
              <div className="text-xs text-slate-500">
                Response: {check.responseTime.toFixed(0)}ms
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
