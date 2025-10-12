// File: client/src/pages/Dashboard/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { monitoringService } from '../../services/monitoring.service';

interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="text-gray-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? '...' : value}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadMetrics = async () => {
    try {
      const data = await monitoringService.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">داشبورد سیستم</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CPU"
          value={`${metrics?.cpu.toFixed(1) || 0}%`}
          icon={<Cpu />}
          loading={loading}
        />
        <StatCard
          title="حافظه"
          value={`${metrics?.memory.toFixed(1) || 0}%`}
          icon={<Activity />}
          loading={loading}
        />
        <StatCard
          title="دیسک"
          value={`${metrics?.disk.toFixed(1) || 0}%`}
          icon={<HardDrive />}
          loading={loading}
        />
        <StatCard
          title="زمان فعالیت"
          value={`${Math.floor((metrics?.uptime || 0) / 3600)}h`}
          icon={<Zap />}
          loading={loading}
        />
      </div>
    </div>
  );
};
