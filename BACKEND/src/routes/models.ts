import { Router } from 'express';
import multer from 'multer';
import * as ml from '../services/mlProxy';
import fs from 'fs';

const router = Router();

const upload = multer({
  dest: './uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }
});

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

router.post('/train', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }

    const result = await ml.startTraining(req.file.path);
    fs.unlinkSync(req.file.path);

    return res.json({ job_id: result.jobId, status: 'queued' });
  } catch (err: any) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/status/:jobId', async (req, res) => {
  try {
    const status = await ml.getStatus(req.params.jobId);
    return res.json(status);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { features, modelPath } = req.body;
    const result = await ml.predict(features, modelPath);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/list', async (_req, res) => {
  try {
    const models = await ml.listModels();
    return res.json(models);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
