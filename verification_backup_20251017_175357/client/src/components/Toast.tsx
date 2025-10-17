import { Toaster } from 'react-hot-toast';
import { useTheme } from '@/core/contexts/ThemeContext';

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark 
            ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' 
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          color: isDark ? '#F8FAFC' : '#0F172A',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          borderRadius: '16px',
          padding: '14px 18px',
          fontSize: '14px',
          fontFamily: 'Vazirmatn, sans-serif',
          boxShadow: isDark
            ? '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontWeight: '500',
          lineHeight: '1.5',
        },
        success: {
          duration: 3500,
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
          style: {
            background: isDark
              ? 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)'
              : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            color: isDark ? '#D1FAE5' : '#064E3B',
            border: `1px solid ${isDark ? '#10B981' : '#6EE7B7'}`,
          },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
          style: {
            background: isDark
              ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)'
              : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            color: isDark ? '#FEE2E2' : '#7F1D1D',
            border: `1px solid ${isDark ? '#EF4444' : '#FCA5A5'}`,
          },
        },
        loading: {
          iconTheme: {
            primary: isDark ? '#3B82F6' : '#2563EB',
            secondary: '#FFFFFF',
          },
          style: {
            background: isDark
              ? 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)'
              : 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            color: isDark ? '#DBEAFE' : '#1E3A8A',
            border: `1px solid ${isDark ? '#3B82F6' : '#93C5FD'}`,
          },
        },
      }}
    />
  );
}