import { useState } from 'react';
import { Cpu, BarChart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';

// Import existing page components
import { TrainingPage } from '@/pages/TrainingPage';
import { MetricsDashboard } from '@/pages/MetricsDashboard';

export default function TrainingHubPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-3">
          <Cpu className="w-8 h-8 text-[color:var(--c-primary)]" />
          استودیو آموزش
        </h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          آموزش مدل‌ها و بررسی عملکرد
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="train">
        <TabsList className="mb-6">
          <TabsTrigger value="train" icon={<Cpu className="w-4 h-4" />}>
            آموزش مدل
          </TabsTrigger>
          <TabsTrigger value="performance" icon={<BarChart className="w-4 h-4" />}>
            عملکرد و معیارها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="train">
          <TrainingPage />
        </TabsContent>

        <TabsContent value="performance">
          <MetricsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
