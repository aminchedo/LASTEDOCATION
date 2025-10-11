// App.tsx
import { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/core/contexts/ThemeContext';
import { RootLayout } from '@/layouts/RootLayout';
import { ToastProvider } from '@/components/Toast';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { AppSettingsProvider } from '@/core/contexts/AppSettingsContext';
import { AuthGuard } from '@/components/AuthGuard';

// Enhanced Error Boundary for Lazy Loading Issues
class LazyLoadErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Lazy Loading Error:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ errorInfo });

    // Log specific lazy loading errors
    if (error.message.includes('Cannot convert object to primitive value')) {
      console.error('🔍 This is likely a React.lazy export mismatch. Check component exports.');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--c-bg)] p-6">
          <Card variant="elevated" className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-[color:var(--c-text)] mb-2">
                خطا در بارگذاری صفحه
              </h1>

              <p className="text-[color:var(--c-text-muted)] mb-6">
                متأسفانه مشکلی در بارگذاری این صفحه رخ داده است. لطفاً دوباره تلاش کنید.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    🐛 Development Error Details
                  </summary>
                  <pre className="text-xs text-red-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[color:var(--c-primary)] text-white rounded-lg hover:bg-[color:var(--c-primary-600)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load pages - به صورت explicit default export تعریف کنیم
const HomePage = lazy(() => import('@/pages/HomePage'));
const ChatPage = lazy(() => import('@/pages/NewPersianChatPage'));
const MetricsDashboard = lazy(() => import('@/pages/MetricsDashboard'));
const LiveMonitorPage = lazy(() => import('@/pages/LiveMonitorPage'));
const PlaygroundPage = lazy(() => import('@/pages/PlaygroundPage'));
const ExperimentsPage = lazy(() => import('@/pages/ExperimentsPage'));
const DownloadCenterPage = lazy(() => import('@/pages/DownloadCenterPage'));
const ModelHubPage = lazy(() => import('@/pages/ModelHubPage'));
const TrainingStudioPage = lazy(() => import('@/pages/TrainingStudioPage'));
const TrainingPage = lazy(() => import('@/pages/TrainingPage'));
const OptimizationStudioPage = lazy(() => import('@/pages/OptimizationStudioPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ModelsDatasetsPage = lazy(() => import('@/pages/ModelsDatasetsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Card variant="elevated" className="p-8">
        <CardContent className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[color:var(--c-primary)]" />
          <p className="text-[color:var(--c-text-muted)]">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// 404 Page
function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Card variant="elevated" className="p-8 text-center">
        <CardContent>
          <h1 className="text-4xl font-bold text-[color:var(--c-text)] mb-4">404</h1>
          <p className="text-[color:var(--c-text-muted)] mb-6">صفحه مورد نظر یافت نشد</p>
          <button
            className="px-4 py-2 bg-[color:var(--c-primary)] text-white rounded-lg hover:bg-[color:var(--c-primary-600)] transition-colors"
            onClick={() => window.location.href = '/'}
          >
            بازگشت به خانه
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function AppContent() {
  useKeyboardShortcuts();

  return (
    <>
      <div className="min-h-screen bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={
            <AuthGuard>
              <RootLayout>
                <LazyLoadErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/metrics" element={<MetricsDashboard />} />
                      <Route path="/monitor" element={<LiveMonitorPage />} />
                      <Route path="/playground" element={<PlaygroundPage />} />
                      <Route path="/experiments" element={<ExperimentsPage />} />
                      <Route path="/downloads" element={<DownloadCenterPage />} />
                      <Route path="/hf-downloads" element={<HFDownloadsPage />} />
                      <Route path="/model-hub" element={<ModelHubPage />} />
                      <Route path="/training-studio" element={<TrainingStudioPage />} />
                      <Route path="/training" element={<TrainingPage />} />
                      <Route path="/optimization-studio" element={<OptimizationStudioPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/models-datasets" element={<ModelsDatasetsPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </LazyLoadErrorBoundary>
              </RootLayout>
            </AuthGuard>
          } />
        </Routes>
        <ToastProvider />
      </div>
      <KeyboardShortcutsHelp />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}