import React, { useState } from 'react';
import { predict } from '../api/ml';

export default function Predict() {
  const [features, setFeatures] = useState({
    timestamp: new Date().toISOString(),
    feature_speed: '',
    feature_bearing: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatures({ ...features, [e.target.name]: e.target.value });
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const processed = {
        timestamp: features.timestamp,
        feature_speed: parseFloat(features.feature_speed) || 0,
        feature_bearing: parseFloat(features.feature_bearing) || 0
      };

      const res = await predict(processed);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Predict Location</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Timestamp</label>
            <input
              type="datetime-local"
              name="timestamp"
              value={features.timestamp.slice(0, 16)}
              onChange={(e) => setFeatures({ ...features, timestamp: new Date(e.target.value).toISOString() })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Speed (m/s)</label>
            <input
              type="number"
              name="feature_speed"
              value={features.feature_speed}
              onChange={handleChange}
              step="0.1"
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bearing (°)</label>
            <input
              type="number"
              name="feature_bearing"
              value={features.feature_bearing}
              onChange={handleChange}
              step="1"
              min="0"
              max="360"
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Result</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Latitude</p>
              <p className="text-2xl font-bold text-blue-600">
                {result.predicted_latitude.toFixed(6)}°
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Longitude</p>
              <p className="text-2xl font-bold text-blue-600">
                {result.predicted_longitude.toFixed(6)}°
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
