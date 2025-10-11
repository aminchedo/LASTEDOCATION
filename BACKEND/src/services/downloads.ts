import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';
import { notificationService } from './notifications';

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

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, DownloadJob>();
const jobProcesses = new Map<string, ReturnType<typeof spawn>>();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateJobId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseHFProgress(line: string, job: DownloadJob) {
  // Parse huggingface-cli output for progress
  // Example formats:
  // "Fetching 5 files: 100%|████████| 5/5 [00:01<00:00]"
  // "model.safetensors: 45%|███▌     | 450MB/1GB [00:30<00:37, 15.0MB/s]"
  
  // File completion
  const fileMatch = line.match(/Fetching (\d+) files:.*?(\d+)\/(\d+)/);
  if (fileMatch) {
    const completed = parseInt(fileMatch[2]);
    const total = parseInt(fileMatch[3]);
    job.progress = Math.round((completed / total) * 100);
    return;
  }

  // Download progress with bytes
  const progressMatch = line.match(/(\d+(?:\.\d+)?)(MB|GB)\/(\d+(?:\.\d+)?)(MB|GB).*?\[.*?<.*?,\s*([\d.]+)(MB|GB)\/s\]/);
  if (progressMatch) {
    const downloaded = parseFloat(progressMatch[1]);
    const downloadedUnit = progressMatch[2];
    const total = parseFloat(progressMatch[3]);
    const totalUnit = progressMatch[4];
    const speed = parseFloat(progressMatch[5]);
    const speedUnit = progressMatch[6];

    // Convert to bytes
    const bytesDownloaded = downloadedUnit === 'GB' ? downloaded * 1024 * 1024 * 1024 : downloaded * 1024 * 1024;
    const bytesTotal = totalUnit === 'GB' ? total * 1024 * 1024 * 1024 : total * 1024 * 1024;
    const bytesSpeed = speedUnit === 'GB' ? speed * 1024 * 1024 * 1024 : speed * 1024 * 1024;

    job.bytesDownloaded = bytesDownloaded;
    job.bytesTotal = bytesTotal;
    job.speed = bytesSpeed;
    job.progress = Math.round((bytesDownloaded / bytesTotal) * 100);
    job.eta = bytesSpeed > 0 ? Math.round((bytesTotal - bytesDownloaded) / bytesSpeed) : undefined;
  }

  // Current file being downloaded
  const fileNameMatch = line.match(/^([\w\-./]+\.\w+):/);
  if (fileNameMatch) {
    job.currentFile = fileNameMatch[1];
  }
}

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

  // Ensure destination directory exists
  ensureDir(dest);

  // Log directory for this job
  const logDir = path.join('logs', 'downloads');
  ensureDir(logDir);
  const logFile = path.join(logDir, `${jobId}.json`);

  // Write initial job state
  fs.writeFileSync(logFile, JSON.stringify(job, null, 2));

  // Spawn huggingface-cli process
  const args = [
    'snapshot-download',
    '--repo-type', repoType,
    repoId,
    '--local-dir', dest,
    '--local-dir-use-symlinks', 'False'
  ];

  logger.info({ msg: 'Starting download', jobId, repoId, repoType, dest });

  const proc = spawn('huggingface-cli', args);

  jobProcesses.set(jobId, proc);
  job.status = 'downloading';

  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        parseHFProgress(line, job);
        logger.debug({ msg: 'Download progress', jobId, line: line.trim() });
      }
    }
    // Update log file
    fs.writeFileSync(logFile, JSON.stringify(job, null, 2));
  });

  proc.stderr.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        parseHFProgress(line, job);
        logger.debug({ msg: 'Download stderr', jobId, line: line.trim() });
      }
    }
  });

  proc.on('close', (code: number) => {
    jobProcesses.delete(jobId);

    if (code === 0) {
      job.status = 'completed';
      job.progress = 100;
      job.finishedAt = new Date().toISOString();
      logger.info({ msg: 'Download completed', jobId, repoId });
      
      // Notify download completed
      notificationService.notifyDownloadCompleted(repoId.split('/').pop() || repoId);
    } else {
      job.status = 'error';
      job.error = `Process exited with code ${code}`;
      job.finishedAt = new Date().toISOString();
      logger.error({ msg: 'Download failed', jobId, repoId, code });
      
      // Notify download error
      notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, `Process exited with code ${code}`);
    }

    // Final update to log file
    fs.writeFileSync(logFile, JSON.stringify(job, null, 2));
  });

  proc.on('error', (err: Error) => {
    job.status = 'error';
    job.error = err.message;
    job.finishedAt = new Date().toISOString();
    logger.error({ msg: 'Download process error', jobId, error: err.message });
    
    // Notify download error
    notificationService.notifyDownloadError(repoId.split('/').pop() || repoId, err.message);
    
    fs.writeFileSync(logFile, JSON.stringify(job, null, 2));
  });

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

