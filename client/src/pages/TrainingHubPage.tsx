import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/shared/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';
import { QuickActions } from '@/shared/components/ui/QuickActions';
import { fadeIn } from '@/shared/animations';

// Import existing page components
import { TrainingPage } from '@/pages/TrainingPage';
import MetricsDashboard from '@/pages/MetricsDashboard';

export default function TrainingHubPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const quickActions = [
    {
      id: 'refresh',
      icon: 'refresh' as const,
      label: 'به‌روزرسانی',
      onClick: handleRefresh,
      disabled: isRefreshing,
    },
    {
      id: 'new-training',
      icon: 'plus' as const,
      label: 'آموزش جدید',
      onClick: () => console.log('New training'),
      variant: 'primary' as const,
    },
    {
      id: 'checkpoints',
      icon: 'save' as const,
      label: 'چک‌پوینت‌ها',
      onClick: () => console.log('Checkpoints'),
    },
  ];

  return (
    <motion.div {...fadeIn} className="container-padding">
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="text-h1 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex-center">
              <Icons.cpu className="w-6 h-6 text-primary" />
            </div>
            استودیو آموزش
          </h1>
          <p className="text-body text-muted-foreground">
            آموزش مدل‌ها و بررسی معیارهای عملکرد
          </p>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="train">
        <TabsList className="mb-6">
          <TabsTrigger value="train">
            <Icons.cpu className="w-4 h-4 mr-2" />
            آموزش مدل
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Icons.chart className="w-4 h-4 mr-2" />
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
    </motion.div>
  );
}
