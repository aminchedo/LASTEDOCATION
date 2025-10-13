import React, { useState } from 'react';
import { datasetsService } from '../../services/datasets.service';

interface DatasetUploadProps {
  onUploadSuccess?: () => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await datasetsService.upload(file, name);
      
      // Success - reset form
      setFile(null);
      setName('');
      setSuccess(true);
      
      // Clear file input
      const fileInput = document.getElementById('dataset-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Notify parent component
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dataset-upload bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Upload Dataset
      </h3>
      
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="dataset-file-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Dataset File
          </label>
          <input
            id="dataset-file-input"
            type="file"
            accept=".csv,.json,.jsonl"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900 dark:file:text-blue-200
              dark:hover:file:bg-blue-800
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Supported formats: CSV, JSON, JSONL (max 100MB)
          </p>
        </div>

        <div>
          <label 
            htmlFor="dataset-name-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Dataset Name (optional)
          </label>
          <input
            id="dataset-name-input"
            type="text"
            placeholder="e.g., My Training Dataset"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
              rounded-md shadow-sm placeholder-gray-400 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:text-white dark:placeholder-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {file && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Selected:</span> {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full flex justify-center py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white 
            bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500
            disabled:bg-gray-400 disabled:cursor-not-allowed
            dark:focus:ring-offset-gray-800"
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            'Upload Dataset'
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Dataset uploaded successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
