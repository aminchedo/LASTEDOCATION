// Lightweight bootstrap/download API client using fetch

// Match backend alias mounted at /api/download
const API_BASE_URL = 'http://localhost:3001/api';

export interface BootstrapJob {
  id: string;
  url: string;
  dest: string;
  kind: 'text' | 'asr' | 'tts' | 'generic' | 'model';
  bytesTotal?: number;
  bytesReceived: number;
  status: 'pending' | 'running' | 'downloading' | 'installed' | 'done' | 'error' | 'not_installed' | 'completed';
  error?: string | null;
  startedAt?: number | string | null;
  finishedAt?: number | string | null;
  percent?: number;
}

export interface StartBootstrapRequest {
  url: string;
  dest: string;
  kind: 'text' | 'asr' | 'tts' | 'generic' | 'model';
}

export interface StartBootstrapResponse {
  ok: boolean;
  id: string;
  error?: string;
}

export interface BootstrapStatusResponse {
  ok: boolean;
  job: BootstrapJob;
  error?: string;
}

export interface BootstrapApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ProvenanceData {
  id: string;
  source: string;
  timestamp: string;
}

export interface BootstrapLog {
  timestamp: string;
  level: 'info' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

// Start a new bootstrap/download job (mapped to /api/bootstrap/download)
export async function startBootstrap(params: StartBootstrapRequest): Promise<StartBootstrapResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: params.kind, id: params.url, dest: params.dest })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // backend returns { success: boolean, data: downloadJob }
    const apiResponse = data as BootstrapApiResponse;
    return {
      ok: Boolean(apiResponse?.success),
      id: String(apiResponse?.data?.id ?? ''),
      error: apiResponse?.success ? undefined : (apiResponse?.error || 'failed')
    };
  } catch (error: any) {
    return { ok: false, id: '', error: error?.message || 'failed_to_start' };
  }
}

// Get the status of a bootstrap job (maps backend list to a single job)
export async function getBootstrapStatus(jobId: string): Promise<BootstrapStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/bootstrap/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // backend returns { success: true, data: downloads[] }
    const apiResponse = data as BootstrapApiResponse;
    const list: any[] = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    const found = list.find((d: any) => String(d.id) === String(jobId)) || list[0];

    const job: BootstrapJob = {
      id: String(found?.id ?? jobId ?? 'job_1'),
      url: '',
      dest: String(found?.destination ?? ''),
      kind: (found?.kind as BootstrapJob['kind']) || 'generic',
      bytesTotal: Number(found?.totalBytes ?? 0) || undefined,
      bytesReceived: Number(found?.downloadedBytes ?? 0) || 0,
      status: (found?.status as BootstrapJob['status']) || 'pending',
      error: found?.error ?? null,
      startedAt: found?.startedAt ?? null,
      finishedAt: found?.completedAt ?? null,
      percent: typeof found?.progress === 'number' ? found.progress : undefined,
    };

    return { ok: true, job };
  } catch (error: any) {
    return {
      ok: false,
      job: {
        id: jobId,
        url: '',
        dest: '',
        kind: 'generic',
        bytesReceived: 0,
        status: 'error',
        error: error?.message || 'failed_to_get_status',
      }
    };
  }
}

export async function getProvenance(_jobId: string): Promise<ProvenanceData> {
  const res = await fetch(`${API_BASE_URL}/bootstrap/provenance`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ProvenanceData>;
}

export async function getBootstrapLog(_jobId: string): Promise<BootstrapLog[]> {
  const res = await fetch(`${API_BASE_URL}/bootstrap/log`);
  if (!res.ok) return [];
  return res.json() as Promise<BootstrapLog[]>;
}

// Utility: poll job status until completed or error
export function pollBootstrapStatus(jobId: string, interval = 2000): Promise<BootstrapJob> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getBootstrapStatus(jobId);
        if (response.ok) {
          if (response.job.status === 'done' || response.job.status === 'installed' || response.job.status === 'completed' || response.job.status === 'error') {
            resolve(response.job);
          } else {
            setTimeout(poll, interval);
          }
        } else {
          reject(new Error(response.error || 'Failed to get status'));
        }
      } catch (error) {
        reject(error);
      }
    };
    poll();
  });
}

export default {
  startBootstrap,
  getBootstrapStatus,
  getProvenance,
  getBootstrapLog,
  pollBootstrapStatus,
};


