"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        try {
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (['.jsonl', '.json', '.csv', '.txt'].includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only .jsonl, .json, .csv, .txt allowed'));
        }
    }
});
async function validateDataset(filePath) {
    try {
        const content = await promises_1.default.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        const errors = [];
        let validLines = 0;
        const samples = [];
        for (let i = 0; i < Math.min(lines.length, 1000); i++) { // Validate first 1000 lines
            try {
                const obj = JSON.parse(lines[i]);
                // Check required fields
                if (!obj.question && !obj.text && !obj.input) {
                    errors.push(`Line ${i + 1}: Missing required field (question/text/input)`);
                }
                else if (obj.question && !obj.answer) {
                    errors.push(`Line ${i + 1}: Question provided but answer is missing`);
                }
                else {
                    validLines++;
                    if (samples.length < 5) {
                        samples.push(obj);
                    }
                }
            }
            catch (err) {
                errors.push(`Line ${i + 1}: Invalid JSON - ${String(err?.message || err)}`);
            }
        }
        return {
            valid: errors.length === 0 || (errors.length < lines.length * 0.1), // Allow up to 10% errors
            totalLines: lines.length,
            validLines: validLines,
            errors: errors.slice(0, 20), // Return first 20 errors
            samples: samples
        };
    }
    catch (error) {
        return {
            valid: false,
            totalLines: 0,
            validLines: 0,
            errors: [`File read error: ${error.message}`]
        };
    }
}
async function generateDatasetMetadata(filePath) {
    const stats = await promises_1.default.stat(filePath);
    const content = await promises_1.default.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    // Sample first item to determine fields
    let fields = [];
    let sampleData = null;
    if (lines.length > 0) {
        try {
            sampleData = JSON.parse(lines[0]);
            fields = Object.keys(sampleData);
        }
        catch (e) {
            // Ignore parse errors
        }
    }
    return {
        fileName: path_1.default.basename(filePath),
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
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
// GET /api/datasets/list - List all datasets
router.get('/list', async (req, res) => {
    try {
        const dataDir = path_1.default.join(process.cwd(), 'data', 'datasets');
        try {
            await promises_1.default.mkdir(dataDir, { recursive: true });
        }
        catch (e) {
            // Directory might already exist
        }
        const files = await promises_1.default.readdir(dataDir);
        const datasets = [];
        for (const file of files) {
            if (file.endsWith('.jsonl') || file.endsWith('.json')) {
                const filePath = path_1.default.join(dataDir, file);
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
    }
    catch (error) {
        logger_1.logger.error(`Failed to list datasets: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
// POST /api/datasets/upload - Upload new dataset
router.post('/upload', upload.single('dataset'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        logger_1.logger.info(`Dataset upload started: ${req.file.originalname} (${req.file.size} bytes)`);
        // Validate dataset
        const validation = await validateDataset(req.file.path);
        if (!validation.valid) {
            await promises_1.default.unlink(req.file.path); // Delete invalid file
            res.status(400).json({
                success: false,
                error: 'Invalid dataset format',
                details: validation.errors
            });
            return;
        }
        // Move to permanent storage
        const dataDir = path_1.default.join(process.cwd(), 'data', 'datasets');
        await promises_1.default.mkdir(dataDir, { recursive: true });
        const finalPath = path_1.default.join(dataDir, req.file.originalname);
        await promises_1.default.rename(req.file.path, finalPath);
        // Generate metadata
        const metadata = await generateDatasetMetadata(finalPath);
        logger_1.logger.info(`Dataset uploaded successfully: ${req.file.originalname} (${validation.validLines} lines)`);
        res.json({
            success: true,
            message: 'Dataset uploaded successfully',
            data: {
                id: req.file.originalname.replace(/\.(jsonl|json)$/, ''),
                path: finalPath,
                metadata: metadata,
                validation: {
                    totalLines: validation.totalLines,
                    validLines: validation.validLines,
                    errorCount: validation.errors.length
                }
            }
        });
        return;
    }
    catch (error) {
        logger_1.logger.error(`Dataset upload failed: ${error.message}`);
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await promises_1.default.unlink(req.file.path);
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
// GET /api/datasets/preview/:datasetId - Preview dataset
router.get('/preview/:datasetId', async (req, res) => {
    try {
        const { datasetId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const datasetPath = path_1.default.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
        // Try .json if .jsonl doesn't exist
        let content;
        try {
            content = await promises_1.default.readFile(datasetPath, 'utf-8');
        }
        catch (e) {
            const jsonPath = path_1.default.join(process.cwd(), 'data', 'datasets', `${datasetId}.json`);
            content = await promises_1.default.readFile(jsonPath, 'utf-8');
        }
        const lines = content.split('\n').filter(line => line.trim()).slice(0, limit);
        const samples = lines.map((line, index) => {
            try {
                return JSON.parse(line);
            }
            catch (e) {
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
    }
    catch (error) {
        logger_1.logger.error(`Dataset preview failed for ${req.params.datasetId}: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
// GET /api/datasets/validate/:datasetId - Validate dataset
router.get('/validate/:datasetId', async (req, res) => {
    try {
        const { datasetId } = req.params;
        const datasetPath = path_1.default.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
        const validation = await validateDataset(datasetPath);
        res.json({
            success: true,
            data: validation
        });
        return;
    }
    catch (error) {
        logger_1.logger.error(`Dataset validation failed for ${req.params.datasetId}: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
// DELETE /api/datasets/:datasetId - Delete dataset
router.delete('/:datasetId', async (req, res) => {
    try {
        const { datasetId } = req.params;
        const datasetPath = path_1.default.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
        await promises_1.default.unlink(datasetPath);
        logger_1.logger.info(`Dataset deleted: ${datasetId}`);
        res.json({
            success: true,
            message: 'Dataset deleted successfully'
        });
        return;
    }
    catch (error) {
        logger_1.logger.error(`Dataset deletion failed for ${req.params.datasetId}: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
// GET /api/datasets/stats/:datasetId - Get dataset statistics
router.get('/stats/:datasetId', async (req, res) => {
    try {
        const { datasetId } = req.params;
        const datasetPath = path_1.default.join(process.cwd(), 'data', 'datasets', `${datasetId}.jsonl`);
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
    }
    catch (error) {
        logger_1.logger.error(`Failed to get dataset stats for ${req.params.datasetId}: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=datasets.js.map