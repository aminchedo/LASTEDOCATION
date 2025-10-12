import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_URL = process.env.ML_SERVICE_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: ML_URL,
  timeout: 120000
});

async function retry<T>(fn: () => Promise<T>, times = 3): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (times === 1 || err.response?.status < 500) throw err;
    await new Promise(r => setTimeout(r, 1000));
    return retry(fn, times - 1);
  }
}

export async function startTraining(filePath: string) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const res = await client.post('/train', form, {
    headers: form.getHeaders()
  });
  
  return { jobId: res.data.job_id };
}

export async function getStatus(jobId: string) {
  const res = await retry(() => client.get(`/train/status/${jobId}`));
  return res.data;
}

export async function predict(features: any, modelPath?: string) {
  const res = await retry(() => client.post('/predict', { features, model_path: modelPath }));
  return res.data;
}

export async function listModels() {
  const res = await retry(() => client.get('/models/list'));
  return res.data;
}
