// BACKEND/src/services/downloads.ts - FIXED VERSION

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { logger } from '../middleware/logger';
import { notificationService } from './notifications';
import { getModelById, getAllDownloadUrls, getFilenameFromUrl } from '../config/modelCatalog';

export interface DownloadJob {
  id: string;
  kind: 'model' | 'tts' | 'dataset';
  repoId: string;
  repoType: 'model' | 'dataset';
  dest: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number; // 0-100
  bytesDownloaded?: number;
  bytesTotal?: number;
  speed?: number; // bytes per second
  eta?: number; // seconds
  currentFile?: string;
  completedFiles: string[];
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

// In-memory job storage
const jobs = new Map<string, DownloadJob>();
const jobProcesses = new Map<string, any>();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateJobId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Download a single file with progress tracking
 */
async function downloadFile(
  url: string, 
  destination: string, 
  onProgress?: (downloaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destination);
          return downloadFile(redirectUrl, destination, onProgress)
            .then(resolve)
            .catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destination);
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        if (onProgress && totalBytes > 0) {
          onProgress(downloadedBytes, totalBytes);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(destination);
        reject(err);
      });
    });

    request.on('error', (err) => {
      file.close();
      try {
        fs.unlinkSync(destination);
      } catch (e) {
        // Ignore
      }
      reject(err);
    });

    request.setTimeout(30000); // 30 second timeout
  });
}

/**
 * Download model using direct URLs from catalog
 */
async function downloadModelDirect(
  jobId: string,
  modelId: string,
  destination: string
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  // Get model info from catalog
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Model not found in catalog: ${modelId}`);
  }

  // Get all download URLs
  const urls = getAllDownloadUrls(modelId);
  if (urls.length === 0) {
    throw new Error(`No download URLs found for model: ${modelId}`);
  }

  logger.info({ 
    msg: 'Starting direct download', 
    jobId, 
    modelId, 
    fileCount: urls.length 
  });

  // Create destination directory
  ensureDir(destination);

  job.status = 'downloading';
  job.progress = 0;

  // Download all files
  let completedFiles = 0;
  const totalFiles = urls.length;

  for (const url of urls) {
    const filename = getFilenameFromUrl(url);
    const filepath = path.join(destination, filename);

    job.currentFile = filename;
    logger.info({ msg: 'Downloading file', jobId, filename, url });

    try {
      await downloadFile(url, filepath, (downloaded, total) => {
        // Calculate overall progress
        const fileProgress = (downloaded / total) * 100;
        const overallProgress = ((completedFiles / totalFiles) * 100) + 
                              (fileProgress / totalFiles);
        
        job.progress = Math.round(overallProgress);
        job.bytesDownloaded = downloaded;
        job.bytesTotal = total;

        // Update job
        jobs.set(jobId, job);
      });

      job.completedFiles.push(filename);
      completedFiles++;
      
      logger.info({ msg: 'File downloaded', jobId, filename });
    } catch (error: any) {
      logger.error({ msg: 'File download failed', jobId, filename, error: error.message });
      throw new Error(`Failed to download ${filename}: ${error.message}`);
    }
  }

  // Mark as completed
  job.status = 'completed';
  job.progress = 100;
  job.finishedAt = new Date().toISOString();
  jobs.set(jobId, job);

  logger.info({ msg: 'Download completed', jobId, modelId });
}

/**
 * Download using git clone (fallback method)
 */
async function downloadWithGit(
  jobId: string,
  modelId: string,
  _repoType: 'model' | 'dataset',
  destination: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const job = jobs.get(jobId);
    if (!job) {
      reject(new Error('Job not found'));
      return;
    }

    ensureDir(destination);

    const gitUrl = `https://huggingface.co/${modelId}`;
    const gitProcess = spawn('git', ['clone', '--progress', gitUrl, destination], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    jobProcesses.set(jobId, gitProcess);

    job.status = 'downloading';
    job.progress = 5;

    let progressRegex = /(\d+)%/;
    
    gitProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(progressRegex);
        if (match) {
          job.progress = Math.min(95, parseInt(match[1]));
          jobs.set(jobId, job);
        }
      }
    });

    gitProcess.stderr?.on('data', (data) => {
      const errorData = data.toString();
      logger.debug(`Git: ${errorData}`);
      
      const progressMatch = errorData.match(progressRegex);
      if (progressMatch) {
        job.progress = Math.min(95, parseInt(progressMatch[1]));
        jobs.set(jobId, job);
      }
      
      if (errorData.includes('fatal:') || errorData.includes('error:')) {
        job.error = errorData;
        job.status = 'error';
        jobs.set(jobId, job);
      }
    });

    gitProcess.on('close', (code) => {
      jobProcesses.delete(jobId);
      
      if (code === 0) {
        job.status = 'completed';
        job.progress = 100;
        job.finishedAt = new Date().toISOString();
        jobs.set(jobId, job);
        logger.info(`Git clone completed: ${modelId}`);
        resolve();
      } else {
        job.status = 'error';
        job.error = `Git clone failed with code ${code}`;
        jobs.set(jobId, job);
        reject(new Error(`Download failed with code ${code}`));
      }
    });

    gitProcess.on('error', (error) => {
      jobProcesses.delete(jobId);
      job.status = 'error';
      job.error = `Git process error: ${error.message}`;
      jobs.set(jobId, job);
      reject(error);
    });
  });
}

/**
 * Start a new download job
 */
export async function startDownload(
  kind: 'model' | 'tts' | 'dataset',
  repoId: string,
  repoType: 'model' | 'dataset',
  dest: string
): Promise<DownloadJob> {
  const jobId = generateJobId();
  
  const job: DownloadJob = {
    id: jobId,
    kind,
    repoId,
    repoType,
    dest,
    status: 'pending',
    progress: 0,
    completedFiles: [],
    startedAt: new Date().toISOString(),
  };

  jobs.set(jobId, job);

  ensureDir(dest);

  // Log directory
  const logDir = path.join('logs', 'downloads');
  ensureDir(logDir);
  const logFile = path.join(logDir, `${jobId}.json`);
  fs.writeFileSync(logFile, JSON.stringify(job, null, 2));

  logger.info({ msg: 'Starting download', jobId, repoId, repoType, dest });

  // Start download process (async)
  (async () => {
    try {
      // Try direct download first (from catalog)
      const model = getModelById(repoId);
      if (model && model.downloadUrls) {
        await downloadModelDirect(jobId, repoId, dest);
      } else {
        // Fallback to git clone
        logger.info({ msg: 'Using git clone fallback', jobId, repoId });
        await downloadWithGit(jobId, repoId, repoType, dest);
      }

      notificationService.notifyDownloadCompleted(repoId.split('/').pop() || repoId);
    } catch (error: any) {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message;
        job.finishedAt = new Date().toISOString();
        jobs.set(jobId, job);
      }
      
      logger.error({ msg: 'Download failed', jobId, repoId, error: error.message });
      notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, error.message);
    }

    // Update log file
    const job = jobs.get(jobId);
    if (job) {
      fs.writeFileSync(logFile, JSON.stringify(job, null, 2));
    }
  })();

  return job;
}

export function getDownloadJob(jobId: string): DownloadJob | null {
  return jobs.get(jobId) || null;
}

export function getAllDownloadJobs(): DownloadJob[] {
  return Array.from(jobs.values());
}

export function cancelDownload(jobId: string): boolean {
  const proc = jobProcesses.get(jobId);
  const job = jobs.get(jobId);

  if (proc && job) {
    proc.kill();
    job.status = 'error';
    job.error = 'Cancelled by user';
    job.finishedAt = new Date().toISOString();
    return true;
  }

  return false;
}
