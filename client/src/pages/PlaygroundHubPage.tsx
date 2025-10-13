import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/shared/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';
import { QuickActions } from '@/shared/components/ui/QuickActions';
import { fadeIn } from '@/shared/animations';

// Import existing page components
import PlaygroundPageContent from '@/pages/PlaygroundPage';
import { MonitoringPage } from '@/pages/MonitoringPage';

export default function PlaygroundHubPage() {
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
      id: 'history',
      icon: 'activity' as const,
      label: 'تاریخچه تست‌ها',
      onClick: () => console.log('History'),
    },
    {
      id: 'settings',
      icon: 'settings' as const,
      label: 'تنظیمات',
      onClick: () => console.log('Settings'),
    },
  ];

  return (
    <motion.div {...fadeIn} className="container-padding">
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="text-h1 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex-center">
              <Icons.zap className="w-6 h-6 text-primary" />
            </div>
            پلتفرم تست و آزمایش
          </h1>
          <p className="text-body text-muted-foreground">
            آزمایش مدل‌ها و نظارت بر عملکرد سیستم
          </p>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="playground">
        <TabsList className="mb-6">
          <TabsTrigger value="playground">
            <Icons.play className="w-4 h-4 mr-2" />
            پلی‌گراند TTS
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Icons.activity className="w-4 h-4 mr-2" />
            نظارت مدل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playground">
          <PlaygroundPageContent />
        </TabsContent>

        <TabsContent value="monitoring">
          <MonitoringPage />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
