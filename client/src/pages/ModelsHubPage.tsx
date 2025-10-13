import { useState } from 'react';
import { Package, Database, Globe } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';

// Import existing page components
import ModelsDatasetsPageContent from '@/pages/ModelsDatasetsPage';
import DownloadCenterPageContent from '@/pages/DownloadCenterPage';
import DataSourcesPageContent from '@/pages/DataSourcesPage';

export default function ModelsHubPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-3">
          <Package className="w-8 h-8 text-[color:var(--c-primary)]" />
          مدیریت مدل‌ها
        </h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          مشاهده، دانلود و مدیریت مدل‌ها و منابع داده
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="installed">
        <TabsList className="mb-6">
          <TabsTrigger value="installed" icon={<Package className="w-4 h-4" />}>
            مدل‌های نصب شده
          </TabsTrigger>
          <TabsTrigger value="catalog" icon={<Database className="w-4 h-4" />}>
            کاتالوگ و دانلود
          </TabsTrigger>
          <TabsTrigger value="sources" icon={<Globe className="w-4 h-4" />}>
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
    </div>
  );
}
