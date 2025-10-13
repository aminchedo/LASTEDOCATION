import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jsonl', '.json', '.csv', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .jsonl, .json, .csv, .txt allowed'));
    }
  }
});

interface ValidationResult {
  valid: boolean;
  totalLines: number;
  validLines: number;
  errors: string[];
  samples?: any[];
}

async function validateDataset(filePath: string): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const errors: string[] = [];
    let validLines = 0;
    const samples: any[] = [];
    
    for (let i = 0; i < Math.min(lines.length, 1000); i++) { // Validate first 1000 lines
      try {
        const obj = JSON.parse(lines[i]);
        
        // Check required fields
        if (!obj.question && !obj.text && !obj.input) {
          errors.push(`Line ${i + 1}: Missing required field (question/text/input)`);
        } else if (obj.question && !obj.answer) {
          errors.push(`Line ${i + 1}: Question provided but answer is missing`);
        } else {
          validLines++;
          if (samples.length < 5) {
            samples.push(obj);
          }
        }
      } catch (err) {
        errors.push(`Line ${i + 1}: Invalid JSON - ${String((err as any)?.message || err)}`);
      }
    }
    
    return {
      valid: errors.length === 0 || (errors.length < lines.length * 0.1), // Allow up to 10% errors
      totalLines: lines.length,
      validLines: validLines,
      errors: errors.slice(0, 20), // Return first 20 errors
      samples: samples
    };
  } catch (error: any) {
    return {
      valid: false,
      totalLines: 0,
      validLines: 0,
      errors: [`File read error: ${error.message}`]
    };
  }
}

async function generateDatasetMetadata(filePath: string): Promise<any> {
  const stats = await fs.stat(filePath);
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Sample first item to determine fields
  let fields: string[] = [];
  let sampleData: any = null;
  
  if (lines.length > 0) {
    try {
      sampleData = JSON.parse(lines[0]);
      fields = Object.keys(sampleData);
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return {
    fileName: path.basename(filePath),
    filePath: filePath,
    fileSize: stats.size,
    fileSizeFormatted: formatBytes(stats.size),
    lineCount: lines.length,
    fields: fields,
    sampleData: sampleData,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// GET /api/datasets - List all datasets
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'datasets');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    // Check for metadata file
    const metadataPath = path.join(dataDir, 'metadata.json');
    let datasets: any[] = [];
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      datasets = JSON.parse(metadataContent);
    } catch (e) {
      // Metadata file doesn't exist or is invalid, scan directory
      const files = await fs.readdir(dataDir);
      
      for (const file of files) {
        if (file === 'metadata.json') continue;
        if (file.endsWith('.jsonl') || file.endsWith('.json') || file.endsWith('.csv')) {
          const filePath = path.join(dataDir, file);
          const stats = await fs.stat(filePath);
          datasets.push({
            id: Date.now().toString() + '-' + file.replace(/\.(jsonl|json|csv)$/, ''),
            name: file,
            filename: file,
            path: filePath,
            size: stats.size,
            type: path.extname(file).slice(1),
            uploaded_at: stats.birthtime.toISOString()
          });
        }
      }
      
      // Save metadata for future use
      if (datasets.length > 0) {
        await fs.writeFile(metadataPath, JSON.stringify(datasets, null, 2));
      }
    }
    
    res.json({
      ok: true,
      datasets: datasets
    });
    return;
  } catch (error: any) {
    logger.error(`Failed to list datasets: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
});

// GET /api/datasets/list - Backward compatibility
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'datasets');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    const files = await fs.readdir(dataDir);
    const datasets: any[] = [];
    
    for (const file of files) {
      if (file === 'metadata.json') continue;
      if (file.endsWith('.jsonl') || file.endsWith('.json')) {
        const filePath = path.join(dataDir, file);
        const metadata = await generateDatasetMetadata(filePath);
        datasets.push({
          id: file.replace(/\.(jsonl|json)$/, ''),
          name: file,
          ...metadata
        });
      }
    }
    
    res.json({
      success: true,
      data: datasets,
      total: datasets.length
    });
    return;
  } catch (error: any) {
    logger.error(`Failed to list datasets: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
    return;
  }
});

// POST /api/datasets/upload - Upload new dataset
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'No file uploaded' });
      return;
    }
    
    logger.info(`Dataset upload started: ${req.file.originalname} (${req.file.size} bytes)`);
    
    const dataDir = path.join(process.cwd(), 'data', 'datasets');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${req.file.originalname}`;
    const finalPath = path.join(dataDir, uniqueName);
    
    // Move file to permanent storage
    await fs.rename(req.file.path, finalPath);
    
    // Create dataset metadata
    const dataset = {
      id: timestamp.toString(),
      name: req.body.name || req.file.originalname,
      filename: uniqueName,
      path: finalPath,
      size: req.file.size,
      type: path.extname(req.file.originalname).slice(1),
      uploaded_at: new Date().toISOString()
    };
    
    // Update metadata file
    const metadataPath = path.join(dataDir, 'metadata.json');
    let datasets: any[] = [];
    
    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      datasets = JSON.parse(content);
    } catch (e) {
      // Metadata file doesn't exist yet
    }
    
    datasets.push(dataset);
    await fs.writeFile(metadataPath, JSON.stringify(datasets, null, 2));
    
    logger.info(`Dataset uploaded successfully: ${req.file.originalname}`);
    
    res.json({
      ok: true,
      dataset: dataset
    });
    return;
  } catch (error: any) {
    logger.error(`Dataset upload failed: ${error.message}`);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
});

// GET /api/datasets/preview/:datasetId - Preview dataset
router.get('/preview/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const datasetPath = path.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
    
    // Try .json if .jsonl doesn't exist
    let content: string;
    try {
      content = await fs.readFile(datasetPath, 'utf-8');
    } catch (e) {
      const jsonPath = path.join(process.cwd(), 'data', 'datasets', `${datasetId}.json`);
      content = await fs.readFile(jsonPath, 'utf-8');
    }
    
    const lines = content.split('\n').filter(line => line.trim()).slice(0, limit);
    const samples = lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { error: `Invalid JSON at line ${index + 1}` };
      }
    });
    
    res.json({
      success: true,
      data: {
        samples: samples,
        total: samples.length,
        datasetId: datasetId
      }
    });
    return;
  } catch (error: any) {
    logger.error(`Dataset preview failed for ${req.params.datasetId}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
    return;
  }
});

// GET /api/datasets/validate/:datasetId - Validate dataset
router.get('/validate/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const datasetPath = path.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
    
    const validation = await validateDataset(datasetPath);
    
    res.json({
      success: true,
      data: validation
    });
    return;
  } catch (error: any) {
    logger.error(`Dataset validation failed for ${req.params.datasetId}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
    return;
  }
});

// GET /api/datasets/:id - Get dataset by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const metadataPath = path.join(process.cwd(), 'data', 'datasets', 'metadata.json');
    
    if (!(await fs.stat(metadataPath).catch(() => null))) {
      res.status(404).json({ ok: false, error: 'Dataset not found' });
      return;
    }
    
    const content = await fs.readFile(metadataPath, 'utf-8');
    const datasets = JSON.parse(content);
    const dataset = datasets.find((d: any) => d.id === id);
    
    if (!dataset) {
      res.status(404).json({ ok: false, error: 'Dataset not found' });
      return;
    }
    
    res.json({
      ok: true,
      dataset: dataset
    });
    return;
  } catch (error: any) {
    logger.error(`Failed to get dataset ${req.params.id}: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
});

// DELETE /api/datasets/:id - Delete dataset
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dataDir = path.join(process.cwd(), 'data', 'datasets');
    const metadataPath = path.join(dataDir, 'metadata.json');
    
    if (!(await fs.stat(metadataPath).catch(() => null))) {
      res.status(404).json({ ok: false, error: 'Dataset not found' });
      return;
    }
    
    const content = await fs.readFile(metadataPath, 'utf-8');
    let datasets = JSON.parse(content);
    const dataset = datasets.find((d: any) => d.id === id);
    
    if (!dataset) {
      res.status(404).json({ ok: false, error: 'Dataset not found' });
      return;
    }
    
    // Delete file
    const datasetPath = path.join(dataDir, dataset.filename);
    try {
      await fs.unlink(datasetPath);
    } catch (e) {
      logger.warn(`Failed to delete file ${dataset.filename}: ${(e as any).message}`);
    }
    
    // Remove from metadata
    datasets = datasets.filter((d: any) => d.id !== id);
    await fs.writeFile(metadataPath, JSON.stringify(datasets, null, 2));
    
    logger.info(`Dataset deleted: ${id}`);
    
    res.json({
      ok: true,
      message: 'Dataset deleted successfully'
    });
    return;
  } catch (error: any) {
    logger.error(`Dataset deletion failed for ${req.params.id}: ${error.message}`);
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
});

// DELETE /api/datasets/:datasetId - Backward compatibility
router.delete('/legacy/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const datasetPath = path.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
    
    await fs.unlink(datasetPath);
    
    logger.info(`Dataset deleted: ${datasetId}`);
    
    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
    return;
  } catch (error: any) {
    logger.error(`Dataset deletion failed for ${req.params.datasetId}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
    return;
  }
});

// GET /api/datasets/stats/:datasetId - Get dataset statistics
router.get('/stats/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const datasetPath = path.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
    
    const metadata = await generateDatasetMetadata(datasetPath);
    const validation = await validateDataset(datasetPath);
    
    res.json({
      success: true,
      data: {
        metadata: metadata,
        validation: {
          totalLines: validation.totalLines,
          validLines: validation.validLines,
          errorCount: validation.errors.length,
          errorRate: validation.totalLines > 0 ? (validation.errors.length / validation.totalLines) * 100 : 0
        },
        samples: validation.samples
      }
    });
    return;
  } catch (error: any) {
    logger.error(`Failed to get dataset stats for ${req.params.datasetId}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
    return;
  }
});

export default router;
