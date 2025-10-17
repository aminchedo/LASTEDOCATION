import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/shared/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';
import { QuickActions } from '@/shared/components/ui/QuickActions';
import { fadeIn } from '@/shared/animations';

// Import existing page components
import ModelsDatasetsPageContent from '@/pages/ModelsDatasetsPage';
import DownloadCenterPageContent from '@/pages/DownloadCenterPage';
import DataSourcesPageContent from '@/pages/DataSourcesPage';

export default function ModelsHubPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
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
      id: 'import',
      icon: 'upload' as const,
      label: 'وارد کردن مدل',
      onClick: () => console.log('Import model'),
      variant: 'primary' as const,
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
              <Icons.package className="w-6 h-6 text-primary" />
            </div>
            مرکز مدل‌ها
          </h1>
          <p className="text-body text-muted-foreground">
            مدیریت، دانلود و استقرار مدل‌های هوش مصنوعی
          </p>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="installed">
        <TabsList className="mb-6">
          <TabsTrigger value="installed">
            <Icons.hardDrive className="w-4 h-4 mr-2" />
            مدل‌های نصب شده
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <Icons.cloud className="w-4 h-4 mr-2" />
            کاتالوگ دانلود
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Icons.database className="w-4 h-4 mr-2" />
            منابع خارجی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed">
          <ModelsDatasetsPageContent />
        </TabsContent>

        <TabsContent value="catalog">
          <DownloadCenterPageContent />
        </TabsContent>

        <TabsContent value="sources">
          <DataSourcesPageContent />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
