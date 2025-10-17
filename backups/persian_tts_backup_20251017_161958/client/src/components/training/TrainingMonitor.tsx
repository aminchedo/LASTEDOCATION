import React, { useState, useEffect } from 'react';
import { useJobWebSocket } from '../../hooks/useJobWebSocket';
import { trainingService } from '../../services/training.service';

interface TrainingMonitorProps {
  jobId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const TrainingMonitor: React.FC<TrainingMonitorProps> = ({ jobId, onComplete, onError }) => {
  const { jobStatus, connected, error: wsError, reconnecting } = useJobWebSocket(jobId);
  const [initialStatus, setInitialStatus] = useState<any>(null);
  const [stopping, setStopping] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await trainingService.getJobStatus(jobId);
        setInitialStatus(response.status);
      } catch (error: any) {
        console.error('Failed to fetch initial status:', error);
        if (onError) {
          onError(error.message);
        }
      }
    };

    fetchStatus();
  }, [jobId, onError]);

  // Use WebSocket status if available, otherwise use initial status
  const currentStatus = jobStatus || initialStatus;

  // Call onComplete when job finishes
  useEffect(() => {
    if (currentStatus?.status === 'COMPLETED' && onComplete) {
      onComplete();
    }
  }, [currentStatus?.status, onComplete]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await trainingService.stopJob(jobId);
    } catch (error: any) {
      console.error('Failed to stop job:', error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setStopping(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await trainingService.downloadModelToFile(jobId);
    } catch (error: any) {
      console.error('Failed to download model:', error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!currentStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-blue-600" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading job status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'FAILED':
      case 'STOPPED':
        return 'bg-red-500';
      case 'RUNNING':
        return 'bg-blue-500';
      case 'QUEUED':
      case 'STARTING':
      case 'LOADING':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return 'Queued';
      case 'STARTING':
        return 'Starting';
      case 'LOADING':
        return 'Loading Data';
      case 'RUNNING':
        return 'Training';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'STOPPED':
        return 'Stopped';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Training Job
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            {jobId}
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {reconnecting ? (
            <>
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">Reconnecting...</span>
            </>
          ) : connected ? (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 dark:text-green-400">Live</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-gray-400 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Polling</span>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-3">
        <div className={`px-4 py-2 rounded-full ${getStatusColor(currentStatus.status)} text-white font-semibold`}>
          {getStatusText(currentStatus.status)}
        </div>
        {currentStatus.status === 'RUNNING' && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentStatus.epoch && `Epoch ${currentStatus.epoch}`}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentStatus.progress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              currentStatus.status === 'COMPLETED' ? 'bg-green-500' :
              currentStatus.status === 'FAILED' || currentStatus.status === 'STOPPED' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${Math.min(currentStatus.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Training Metrics */}
      {currentStatus.status === 'RUNNING' && (
        <div className="grid grid-cols-3 gap-4">
          {currentStatus.epoch && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Epoch</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStatus.epoch}
              </div>
            </div>
          )}
          {currentStatus.step !== undefined && currentStatus.total_steps && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Step</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStatus.step} / {currentStatus.total_steps}
              </div>
            </div>
          )}
          {currentStatus.loss !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Loss</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStatus.loss.toFixed(6)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {currentStatus.message && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {currentStatus.message}
          </p>
        </div>
      )}

      {/* WebSocket Error */}
      {wsError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            WebSocket: {wsError}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        {currentStatus.status === 'RUNNING' && (
          <button
            onClick={handleStop}
            disabled={stopping}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium
              disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {stopping ? 'Stopping...' : 'Stop Training'}
          </button>
        )}

        {currentStatus.status === 'COMPLETED' && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium
              disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {downloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              'Download Model'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
