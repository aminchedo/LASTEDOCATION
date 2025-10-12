import { useState, useEffect, useCallback, useRef } from 'react';
import { TrainingJob as TrainingJobType } from '@/shared/types';

// Re-export for convenience
export type { TrainingJob } from '@/shared/types';

// Define the API URL for SSE connection
const SSE_URL = '/api/train/stream'; 

export interface TrainingStatus {
// ... (omitted for brevity, content unchanged)
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
  currentRun?: {
    id: string;
    status: string;
    currentEpoch: number;
    currentStep: number;
    totalEpochs: number;
    totalSteps: number;
    bestMetric?: number;
    startedAt: string;
    finishedAt?: string;
    progress: number;
    eta?: number;
  };
  metrics?: {
    id: string;
    timestamp: string;
    runId: string;
    epoch: number;
    step: number;
    loss: number;
    valLoss?: number;
    accuracy?: number;
    valAccuracy?: number;
    throughput?: number;
    stepTimeMs?: number;
    lr?: number;
  };
  summary?: {
    totalSteps: number;
    currentEpoch: number;
    currentStep: number;
    latestLoss: number;
    bestLoss: number;
    latestAccuracy?: number;
    bestAccuracy?: number;
    avgThroughput?: number;
    avgStepTime?: number;
  };
  trainer?: {
    isTraining: boolean;
    isPaused: boolean;
    currentEpoch?: number;
    currentStep?: number;
  };
}

export interface TrainingConfig {
// ... (omitted for brevity, content unchanged)
  totalEpochs: number;
  totalSteps: number;
  learningRate: number;
  batchSize: number;
  saveEverySteps: number;
  resumeCheckpointId?: string;
}

class TrainingAPI {
  private baseUrl = '/api/train';

  async getStatus(): Promise<TrainingStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error || !data.success) { 
        throw new Error(data.error || 'Failed to get training status');
      }
      
      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Training status request timed out');
          throw new Error('Request timed out - training service may be unavailable');
        } else {
          console.error('Training status error:', error.message);
          throw error;
        }
      }
      
      // Return safe fallback instead of throwing for unknown errors
      throw new Error('Unable to connect to training service');
    }
  }

// ... (other API methods are assumed to be correct)
  async startTraining(config: TrainingConfig): Promise<void> { /* ... */ }
  async pauseTraining(): Promise<void> { /* ... */ }
  async resumeTraining(): Promise<void> { /* ... */ }
  async stopTraining(): Promise<void> { /* ... */ }
  async createCheckpoint(): Promise<string> { /* ... */ }
  async getMetrics(sinceId?: string): Promise<any[]> { /* ... */ }
  async getCheckpoints(runId?: string): Promise<any[]> { /* ... */ }
  async getRuns(): Promise<any[]> { /* ... */ }
  async getLogs(limit: number = 100): Promise<any[]> { /* ... */ }
}

const trainingAPI = new TrainingAPI();

export function useTraining() {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // FIX: از useRef به جای useState برای EventSource استفاده می‌کنیم تا تغییرات آن باعث رندر مجدد نشود.
  const eventSourceRef = useRef<EventSource | null>(null); 
  
  // Enhanced SSE connection with retry logic and proper error handling
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000;
  const MAX_RETRY_DELAY = 30000;

  /**
   * Close EventSource and cleanup
   */
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * Calculate exponential backoff delay
   */
  const getRetryDelay = (retryCount: number): number => {
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, MAX_RETRY_DELAY);
  };

  /**
   * Schedule a retry attempt with exponential backoff
   */
  const scheduleRetry = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    const delay = getRetryDelay(retryCountRef.current);
    console.log(`Scheduling SSE retry in ${delay}ms (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      retryCountRef.current++;
      connectSSE();
    }, delay);
  }, []);

  // تعریف تابع اتصال SSE خارج از useEffect
  const connectSSE = useCallback(() => {
    if (isUnmountedRef.current) return;

    closeEventSource();

    try {
        const es = new EventSource(SSE_URL);
        
        es.onopen = () => {
          if (isUnmountedRef.current) return;
          console.log('✅ SSE connection established');
          setIsConnected(true);
          setError(null);
          retryCountRef.current = 0;
        };

        es.onmessage = (event) => {
          if (isUnmountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'status':
              case 'metric':
                // Update status/metrics
                setStatus(prev => ({
                  ...prev,
                  ...data.data
                }));
                break;
              case 'checkpoint':
                console.log('Checkpoint created:', data.data);
                break;
              case 'connected':
                console.log('SSE: Initial connection established and recognized.');
                break;
              case 'no_active_training':
                console.log('SSE: No active training session found on server.');
                setStatus(prev => prev ? {...prev, status: 'idle'} : null);
                break;
              case 'error':
                setError(data.data.message);
                break;
              case 'heartbeat':
                // Keep connection alive
                break;
              default:
                console.log('Unknown SSE event:', data.type);
            }
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        es.onerror = (error) => {
          if (isUnmountedRef.current) return;
          console.error('❌ SSE connection error');
          closeEventSource();

          // Schedule retry if not exceeded max retries
          if (retryCountRef.current < MAX_RETRIES) {
            scheduleRetry();
          } else {
            setError('Failed to connect to training service after multiple attempts');
            console.warn(`Max SSE retry attempts (${MAX_RETRIES}) reached`);
          }
        };

        eventSourceRef.current = es;

      } catch (err) {
        console.error('Failed to create SSE connection:', err);
        if (retryCountRef.current < MAX_RETRIES) {
          scheduleRetry();
        } else {
          setError('Failed to establish SSE connection');
        }
      }
    // وابستگی‌ها: فقط توابع React که استفاده شده‌اند
  }, [closeEventSource, scheduleRetry]); 


  const fetchStatus = useCallback(async () => {
    try {
      const newStatus = await trainingAPI.getStatus();
      setStatus(newStatus);
      setError(null);
    } catch (err: any) {
      // Stop polling if we get 404/409 (no active training session)
      if (err.message.includes('404') || err.message.includes('409')) {
        console.log('No active training session, stopping polling');
        setStatus(prev => prev ? {...prev, status: 'idle'} : null);
        setError(null);
        return;
      }
      setError(err.message);
      console.error('Failed to fetch training status:', err); 
    }
  }, []);

  /**
   * Manually refresh status
   */
  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  /**
   * Reconnect to SSE
   */
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connectSSE();
  }, [connectSSE]);
  
  const startTraining = useCallback(async (config: TrainingConfig) => { /* ... */ }, [fetchStatus]);
  const pauseTraining = useCallback(async () => { /* ... */ }, [fetchStatus]);
  const resumeTraining = useCallback(async () => { /* ... */ }, [fetchStatus]);
  const stopTraining = useCallback(async () => { /* ... */ }, [fetchStatus]);
  const createCheckpoint = useCallback(async () => { /* ... */ }, [fetchStatus]);
  const getMetrics = useCallback(async (sinceId?: string) => { /* ... */ }, []);
  const getCheckpoints = useCallback(async (runId?: string) => { /* ... */ }, []);
  const getRuns = useCallback(async () => { /* ... */ }, []);
  const getLogs = useCallback(async (limit: number = 100) => { /* ... */ }, []);
  
  // Effect 1: Setup SSE connection (runs only once on mount)
  useEffect(() => {
    isUnmountedRef.current = false;
    connectSSE();

    // Cleanup: Close SSE connection when component unmounts
    return () => {
      isUnmountedRef.current = true;
      closeEventSource();
    };
  }, [connectSSE, closeEventSource]); // Added closeEventSource dependency

  // Effect 2: Initial status fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]); 

  // Effect 3: Polling fallback when SSE is not available
  useEffect(() => {
    // از eventSourceRef.current برای بررسی وضعیت استفاده می‌کنیم
    if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
      const interval = setInterval(() => {
        // Only poll if there's an active training session
        if (status?.status === 'running' || status?.status === 'paused') { 
          fetchStatus(); 
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status?.status, fetchStatus]);

  return {
    status,
    isLoading,
    error,
    isConnected,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    createCheckpoint,
    getMetrics,
    getCheckpoints,
    getRuns,
    getLogs,
    fetchStatus,
    refreshStatus,
    reconnect,
  };
}