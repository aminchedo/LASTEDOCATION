// File: client/src/pages/Models/ModelsPage.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/shared/components/ui/Button';
import { modelsService } from '../../services/models.service';

interface Model {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
}

const Badge: React.FC<{ variant?: string; children: React.ReactNode }> = ({ variant, children }) => {
  const variantClasses = variant === 'success' 
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses}`}>
      {children}
    </span>
  );
};

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadModels();
  }, []);
  
  const loadModels = async () => {
    try {
      const data = await modelsService.getDetectedModels();
      setModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleActivate = async (modelId: string) => {
    try {
      await modelsService.activateModel(modelId);
      await loadModels();
    } catch (error) {
      console.error('Failed to activate model:', error);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">مدیریت مدل‌ها</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(model => (
          <Card 
            key={model.id} 
            className={`${model.isActive ? 'border-2 border-green-500' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{model.name}</h3>
                {model.isActive && (
                  <Badge variant="success">
                    فعال
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                نسخه: {model.version}
              </p>
              {!model.isActive && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle size={16} />}
                  onClick={() => handleActivate(model.id)}
                  className="w-full"
                >
                  فعال‌سازی
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
