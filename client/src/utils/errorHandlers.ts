export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default browser behavior
    event.preventDefault();
    
    // You can add custom error reporting here
    // Example: reportErrorToService(event.reason);
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // You can add custom error reporting here
  });

  // Add console.error override for better error tracking
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call the original console.error
    originalConsoleError.apply(console, args);
    
    // You can add custom error reporting here
    // Example: reportErrorToService(args);
  };
}
