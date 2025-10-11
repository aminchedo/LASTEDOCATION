export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error || event.message);
  });

  // Handle React errors (if not caught by error boundary)
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('React')
    ) {
      originalError.apply(console, args);
    } else {
      originalError.apply(console, args);
    }
  };
}
