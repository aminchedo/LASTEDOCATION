// File: client/src/pages/Models/ModelsPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CheckCircle } from 'lucide-react';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { modelsService } from '../../services/models.service';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
`;

const ModelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const ModelCard = styled(Card)<{ $isActive: boolean }>`
  border: 2px solid ${({ $isActive, theme }) => 
    $isActive ? theme.colors.success.main : 'transparent'};
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

interface Model {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
}

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
    <PageContainer>
      <h1>مدیریت مدل‌ها</h1>
      <ModelsGrid>
        {models.map(model => (
          <ModelCard key={model.id} $isActive={model.isActive} padding="lg">
            <ModelHeader>
              <h3>{model.name}</h3>
              {model.isActive && (
                <Badge variant="success" dot>
                  فعال
                </Badge>
              )}
            </ModelHeader>
            <p>نسخه: {model.version}</p>
            {!model.isActive && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle size={16} />}
                onClick={() => handleActivate(model.id)}
                fullWidth
              >
                فعال‌سازی
              </Button>
            )}
          </ModelCard>
        ))}
      </ModelsGrid>
    </PageContainer>
  );
};
