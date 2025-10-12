import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/models`
});

export async function uploadAndTrain(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await API.post('/train', form);
  return res.data;
}

export async function getStatus(jobId: string) {
  const res = await API.get(`/status/${jobId}`);
  return res.data;
}

export async function predict(features: any) {
  const res = await API.post('/predict', { features });
  return res.data;
}

export async function listModels() {
  const res = await API.get('/list');
  return res.data;
}
