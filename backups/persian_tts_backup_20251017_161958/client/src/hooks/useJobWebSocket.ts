import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../services/auth.service';

export interface JobStatus {
  job_id: string;
  status: 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  progress: number;
  epoch?: number;
  step?: number;
  total_steps?: number;
  loss?: number;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseJobWebSocketReturn {
  jobStatus: JobStatus | null;
  connected: boolean;
  error: string | null;
  reconnecting: boolean;
}

/**
 * Hook to connect to WebSocket and receive real-time job updates
 */
export function useJobWebSocket(jobId: string | null): UseJobWebSocketReturn {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) {
      setError('No authentication token');
      return;
    }

    // Create socket connection
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setConnected(true);
      setError(null);
      setReconnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, need manual reconnection
        socket.connect();
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
      setReconnecting(true);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setReconnecting(false);
      setError(null);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      setError('Failed to reconnect to server');
      setReconnecting(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err.message);
      setError(err.message);
      setConnected(false);
    });

    socket.on('job_update', (status: JobStatus) => {
      console.log('[WebSocket] Job update received:', status);
      setJobStatus(status);
    });

    return cleanup;
  }, []); // Only run once on mount

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && socket.connected && jobId) {
      // Subscribe to this job
      console.log(`[WebSocket] Subscribing to job ${jobId}`);
      socket.emit('subscribe_job', jobId);
      
      return () => {
        // Unsubscribe when jobId changes or component unmounts
        console.log(`[WebSocket] Unsubscribing from job ${jobId}`);
        socket.emit('unsubscribe_job', jobId);
      };
    }
  }, [jobId]); // Run when jobId changes

  return { jobStatus, connected, error, reconnecting };
}
