// Simple Express server without TypeScript compilation issues
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock users
const MOCK_USERS = [
    {
        id: '1',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'مدیر سیستم'
    },
    {
        id: '2',
        username: 'user',
        password: 'user123',
        role: 'user',
        name: 'کاربر عادی'
    }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required',
            message: 'لطفاً توکن دسترسی را ارسال کنید'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'توکن منقضی شده است'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid token',
            message: 'توکن نامعتبر است'
        });
    }
};

// Simple model detection service (JavaScript version)
class SimpleModelDetection {
    constructor() {
        this.supportedExtensions = ['.bin', '.pt', '.pth', '.onnx', '.pb', '.h5', '.safetensors', '.ggml', '.gguf'];
        this.modelIndicators = ['model', 'checkpoint', 'trained'];
        this.ttsIndicators = ['vits', 'tts', 'speech', 'voice'];
        this.datasetIndicators = ['dataset', 'data', 'corpus'];
    }

    getDefaultDirectories() {
        const dirs = [
            path.resolve('./models'),
            path.resolve('./datasets'),
            path.resolve('../models'),
            path.join(process.cwd(), 'models'),
            path.join(process.cwd(), 'datasets'),
        ];

        return dirs.filter(dir => {
            try {
                return fs.existsSync(dir);
            } catch {
                return false;
            }
        });
    }

    async scanDirectories(folders, options = {}) {
        const models = [];
        const maxDepth = options.maxDepth || 3;

        for (const folder of folders) {
            if (!fs.existsSync(folder)) continue;

            try {
                const foundModels = this.scanDir(folder, 0, maxDepth);
                models.push(...foundModels);
            } catch (error) {
                console.error(`Error scanning ${folder}:`, error.message);
            }
        }

        return models;
    }

    scanDir(dirPath, currentDepth, maxDepth) {
        const models = [];

        if (currentDepth >= maxDepth) return models;

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            // Check if current directory is a model
            const currentModel = this.analyzeDirectory(dirPath);
            if (currentModel) {
                models.push(currentModel);
                return models; // Don't scan subdirectories if parent is a model
            }

            // Scan subdirectories
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const subPath = path.join(dirPath, entry.name);
                    const subModels = this.scanDir(subPath, currentDepth + 1, maxDepth);
                    models.push(...subModels);
                }
            }
        } catch (error) {
            // Ignore permission errors
        }

        return models;
    }

    analyzeDirectory(dirPath) {
        try {
            const files = fs.readdirSync(dirPath);
            const modelFiles = files.filter(file =>
                this.supportedExtensions.some(ext => file.toLowerCase().endsWith(ext))
            );

            if (modelFiles.length === 0) return null;

            const stat = fs.statSync(dirPath);
            const totalSize = this.getDirectorySize(dirPath);
            const dirName = path.basename(dirPath);

            // Detect type
            let type = 'model';
            if (this.ttsIndicators.some(ind => dirName.toLowerCase().includes(ind))) {
                type = 'tts';
            } else if (this.datasetIndicators.some(ind => dirName.toLowerCase().includes(ind))) {
                type = 'dataset';
            }

            // Detect if trained
            const isTrainedModel = this.modelIndicators.some(ind =>
                dirName.toLowerCase().includes(ind)
            );

            return {
                id: `local-${dirPath.replace(/[/\\]/g, '-')}`,
                name: dirName,
                type,
                modelFormat: this.detectFormat(modelFiles),
                path: dirPath,
                size: totalSize,
                files: modelFiles,
                lastModified: stat.mtime.toISOString(),
                isTrainedModel,
                tags: this.extractTags(dirName),
                domain: this.detectDomain(dirName)
            };
        } catch (error) {
            return null;
        }
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    totalSize += stat.size;
                }
            }
        } catch (error) {
            // Ignore errors
        }
        return totalSize;
    }

    detectFormat(modelFiles) {
        for (const file of modelFiles) {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.onnx') return 'onnx';
            if (ext === '.safetensors') return 'safetensors';
            if (['.pt', '.pth'].includes(ext)) return 'pytorch';
            if (['.pb', '.h5'].includes(ext)) return 'tensorflow';
            if (ext === '.gguf') return 'gguf';
            if (ext === '.ggml') return 'ggml';
            if (ext === '.bin') return 'bin';
        }
        return 'unknown';
    }

    extractTags(dirName) {
        const tags = [];
        const lower = dirName.toLowerCase();

        if (lower.includes('persian') || lower.includes('fa')) tags.push('persian');
        if (lower.includes('finetuned') || lower.includes('trained')) tags.push('fine-tuned');
        if (lower.includes('lora')) tags.push('lora');
        if (lower.includes('chat')) tags.push('chat');

        return tags;
    }

    detectDomain(dirName) {
        const lower = dirName.toLowerCase();

        if (lower.includes('chat') || lower.includes('instruct')) return 'conversational';
        if (lower.includes('qa') || lower.includes('question')) return 'question-answering';
        if (lower.includes('sentiment')) return 'sentiment-analysis';
        if (lower.includes('translation')) return 'translation';

        return 'general';
    }
}

const modelDetection = new SimpleModelDetection();

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password required',
                message: 'نام کاربری و رمز عبور الزامی است'
            });
        }

        const user = MOCK_USERS.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        const token = jwt.sign({
            userId: user.id,
            role: user.role,
            username: user.username,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, JWT_SECRET);

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Login failed',
            details: error.message
        });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required',
                message: 'توکن الزامی است'
            });
        }

        const payload = jwt.verify(token, JWT_SECRET);

        if (!payload) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'توکن نامعتبر است'
            });
        }

        const user = MOCK_USERS.find(u => u.id === payload.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                message: 'کاربر یافت نشد'
            });
        }

        return res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Token verification failed',
            details: error.message
        });
    }
});

// Model detection routes
app.get('/api/models/default-directories', authenticateToken, async (req, res) => {
    try {
        const directories = modelDetection.getDefaultDirectories();
        return res.json({
            success: true,
            directories,
            count: directories.length
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get default directories',
            details: error.message
        });
    }
});

app.post('/api/models/scan', authenticateToken, async (req, res) => {
    try {
        const { folders = [], maxDepth = 3 } = req.body;

        if (!Array.isArray(folders) || folders.length === 0) {
            return res.status(400).json({
                error: 'folders array is required'
            });
        }

        const models = await modelDetection.scanDirectories(folders, { maxDepth });

        return res.json({
            success: true,
            models,
            scanned_folders: folders,
            total_found: models.length
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to scan for models',
            details: error.message
        });
    }
});

app.get('/api/models/detected', authenticateToken, async (req, res) => {
    try {
        const customFolders = req.query.customFolders ?
            JSON.parse(req.query.customFolders) : [];
        const scanDepth = parseInt(req.query.scanDepth) || 2;
        const autoScan = req.query.autoScan !== 'false';

        let foldersToScan = [];

        if (autoScan) {
            const defaultDirs = modelDetection.getDefaultDirectories();
            foldersToScan.push(...defaultDirs);
        }

        if (Array.isArray(customFolders)) {
            foldersToScan.push(...customFolders);
        }

        foldersToScan = [...new Set(foldersToScan)];

        if (foldersToScan.length === 0) {
            return res.json({
                success: true,
                models: [],
                message: 'No directories configured for scanning'
            });
        }

        const models = await modelDetection.scanDirectories(foldersToScan, { maxDepth: scanDepth });

        return res.json({
            success: true,
            models,
            scanned_directories: foldersToScan,
            configuration: { customFolders, scanDepth, autoScan },
            statistics: {
                total_models: models.length,
                by_type: {
                    model: models.filter(m => m.type === 'model').length,
                    tts: models.filter(m => m.type === 'tts').length,
                    dataset: models.filter(m => m.type === 'dataset').length,
                    unknown: models.filter(m => m.type === 'unknown').length
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Failed to get detected models',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Simple server running' });
});

// Training status (mock)
app.get('/api/train/status', (req, res) => {
    res.json({
        success: true,
        status: 'idle',
        message: 'Training service available'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl,
        message: 'Simple server - endpoint not implemented'
    });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`🚀 Simple backend server running on port ${port}`);
    console.log(`📁 Scanning these directories for models:`);
    const dirs = modelDetection.getDefaultDirectories();
    dirs.forEach(dir => console.log(`   - ${dir}`));
});
