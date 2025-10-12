import React, { useState, useRef } from 'react';
import { uploadAndTrain, getStatus } from '../api/ml';

export default function Train() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.name.endsWith('.csv')) {
      setError('Must be CSV');
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const res = await uploadAndTrain(file);
      setJobId(res.job_id);
      startPolling(res.job_id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startPolling = (id: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      try {
        const s = await getStatus(id);
        setStatus(s);

        if (s.status === 'completed' || s.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError('Status check failed');
      }
    }, 2000);
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Train Model</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
        
        <button
          onClick={() => fileRef.current?.click()}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Select CSV
        </button>
        
        {file && <p className="mt-4">Selected: {file.name}</p>}

        {file && !jobId && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Start Training'}
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
        )}
      </div>

      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          
          <div className="mb-4">
            <p><strong>Job ID:</strong> <code>{status.job_id}</code></p>
            <p><strong>Status:</strong> {status.status}</p>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded h-3">
              <div
                className="bg-blue-600 h-3 rounded"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <p className="text-sm text-right">{status.progress}%</p>
          </div>

          {status.metrics && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-sm text-gray-600">RMSE Lat</p>
                <p className="text-lg font-bold">{status.metrics.rmse_lat.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">RMSE Lon</p>
                <p className="text-lg font-bold">{status.metrics.rmse_lon.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Combined</p>
                <p className="text-lg font-bold">{status.metrics.rmse_combined.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">R²</p>
                <p className="text-lg font-bold">{status.metrics.r2_lat.toFixed(4)}</p>
              </div>
            </div>
          )}

          {status.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">{status.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
