"use strict";
// Lightweight bootstrap/download API client using fetch
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBootstrap = startBootstrap;
exports.getBootstrapStatus = getBootstrapStatus;
exports.getProvenance = getProvenance;
exports.getBootstrapLog = getBootstrapLog;
exports.pollBootstrapStatus = pollBootstrapStatus;
// Match backend alias mounted at /api/download
const API_BASE_URL = 'http://localhost:3001/api';
// Start a new bootstrap/download job (mapped to /api/bootstrap/download)
async function startBootstrap(params) {
    try {
        const res = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: params.kind, id: params.url, dest: params.dest })
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // backend returns { success: boolean, data: downloadJob }
        const apiResponse = data;
        return {
            ok: Boolean(apiResponse?.success),
            id: String(apiResponse?.data?.id ?? ''),
            error: apiResponse?.success ? undefined : (apiResponse?.error || 'failed')
        };
    }
    catch (error) {
        return { ok: false, id: '', error: error?.message || 'failed_to_start' };
    }
}
// Get the status of a bootstrap job (maps backend list to a single job)
async function getBootstrapStatus(jobId) {
    try {
        const res = await fetch(`${API_BASE_URL}/bootstrap/status`);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // backend returns { success: true, data: downloads[] }
        const apiResponse = data;
        const list = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
        const found = list.find((d) => String(d.id) === String(jobId)) || list[0];
        const job = {
            id: String(found?.id ?? jobId ?? 'job_1'),
            url: '',
            dest: String(found?.destination ?? ''),
            kind: found?.kind || 'generic',
            bytesTotal: Number(found?.totalBytes ?? 0) || undefined,
            bytesReceived: Number(found?.downloadedBytes ?? 0) || 0,
            status: found?.status || 'pending',
            error: found?.error ?? null,
            startedAt: found?.startedAt ?? null,
            finishedAt: found?.completedAt ?? null,
            percent: typeof found?.progress === 'number' ? found.progress : undefined,
        };
        return { ok: true, job };
    }
    catch (error) {
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
async function getProvenance(_jobId) {
    const res = await fetch(`${API_BASE_URL}/bootstrap/provenance`);
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return res.json();
}
async function getBootstrapLog(_jobId) {
    const res = await fetch(`${API_BASE_URL}/bootstrap/log`);
    if (!res.ok)
        return [];
    return res.json();
}
// Utility: poll job status until completed or error
function pollBootstrapStatus(jobId, interval = 2000) {
    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                const response = await getBootstrapStatus(jobId);
                if (response.ok) {
                    if (response.job.status === 'done' || response.job.status === 'installed' || response.job.status === 'completed' || response.job.status === 'error') {
                        resolve(response.job);
                    }
                    else {
                        setTimeout(poll, interval);
                    }
                }
                else {
                    reject(new Error(response.error || 'Failed to get status'));
                }
            }
            catch (error) {
                reject(error);
            }
        };
        poll();
    });
}
exports.default = {
    startBootstrap,
    getBootstrapStatus,
    getProvenance,
    getBootstrapLog,
    pollBootstrapStatus,
};
//# sourceMappingURL=bootstrapApi.js.map