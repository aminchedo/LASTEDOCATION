import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorHandlers';
import { worker } from './mocks/browser';
import './index.css';

// Start MSW
if (import.meta.env.DEV) {
  worker.start({ onUnhandledRequest: 'bypass' });
}

// Setup global error handlers before app initialization
setupGlobalErrorHandlers();

// Splash screen handler
const hideSplashScreen = () => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 300);
  }
};


// Initialize the app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors for debugging
        console.error('Application Error:', error, errorInfo);

        // Optional: Send errors to logging service
        // Example: Sentry.captureException(error, { contexts: { errorInfo } });

        // You can also integrate with your error tracking service here
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Hide splash screen after app loads
setTimeout(hideSplashScreen, 100);