import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-64">
      <Card variant="elevated" className="p-8 text-center">
        <CardContent>
          <h1 className="text-4xl font-bold text-[color:var(--c-text)] mb-4">404</h1>
          <p className="text-[color:var(--c-text-muted)] mb-6">صفحه مورد نظر یافت نشد</p>
          <button
            className="px-4 py-2 bg-[color:var(--c-primary)] text-white rounded-lg hover:bg-[color:var(--c-primary-600)] transition-colors"
            onClick={() => navigate('/')}
          >
            بازگشت به خانه
          </button>
        </CardContent>
      </Card>
    </div>
  );
}