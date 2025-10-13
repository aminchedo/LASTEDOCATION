import { useState } from 'react';
import { Beaker, Activity } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';

// Import existing page components
import PlaygroundPageContent from '@/pages/PlaygroundPage';
import { MonitoringPage } from '@/pages/MonitoringPage';

export default function PlaygroundHubPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-3">
          <Beaker className="w-8 h-8 text-[color:var(--c-primary)]" />
          پلتفرم تست و آزمایش
        </h1>
        <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
          آزمایش مدل‌ها و نظارت بر عملکرد
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="playground">
        <TabsList className="mb-6">
          <TabsTrigger value="playground" icon={<Beaker className="w-4 h-4" />}>
            پلی‌گراند TTS
          </TabsTrigger>
          <TabsTrigger value="monitoring" icon={<Activity className="w-4 h-4" />}>
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
    </div>
  );
}
