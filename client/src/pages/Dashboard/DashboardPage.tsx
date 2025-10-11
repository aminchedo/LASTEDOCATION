// File: client/src/pages/Dashboard/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';
import { StatCard } from '../../components/molecules/StatCard';
import { monitoringService } from '../../services/monitoring.service';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

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
    <PageContainer>
      <h1>داشبورد سیستم</h1>
      <Grid>
        <StatCard
          title="CPU"
          value={`${metrics?.cpu.toFixed(1) || 0}%`}
          icon={<Cpu />}
          color="primary"
          loading={loading}
        />
        <StatCard
          title="حافظه"
          value={`${metrics?.memory.toFixed(1) || 0}%`}
          icon={<Activity />}
          color="success"
          loading={loading}
        />
        <StatCard
          title="دیسک"
          value={`${metrics?.disk.toFixed(1) || 0}%`}
          icon={<HardDrive />}
          color="warning"
          loading={loading}
        />
        <StatCard
          title="زمان فعالیت"
          value={`${Math.floor((metrics?.uptime || 0) / 3600)}h`}
          icon={<Zap />}
          color="info"
          loading={loading}
        />
      </Grid>
    </PageContainer>
  );
};
