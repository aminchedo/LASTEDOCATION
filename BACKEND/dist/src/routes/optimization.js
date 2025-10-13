"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const optimization_1 = require("../services/optimization");
const logger_1 = require("../middleware/logger");
const router = (0, express_1.Router)();
// POST /api/optimization/jobs - Start hyperparameter optimization
router.post('/jobs', async (req, res) => {
    try {
        const { name, baseModelPath, datasetPath, outputDir, config, strategy = 'random', maxTrials = 10 } = req.body;
        if (!name || !baseModelPath || !datasetPath || !outputDir || !config) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, baseModelPath, datasetPath, outputDir, config',
            });
        }
        // Validate config
        if (!config.learningRate || !config.batchSize || !config.epochs) {
            return res.status(400).json({
                success: false,
                error: 'Config must include learningRate, batchSize, and epochs',
            });
        }
        const job = await (0, optimization_1.startOptimizationJob)(name, baseModelPath, datasetPath, outputDir, config, strategy, maxTrials);
        return res.json({
            success: true,
            data: job,
            message: 'Optimization job started',
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error starting optimization job', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to start optimization job',
            message: error.message,
        });
    }
});
// GET /api/optimization/jobs - Get all optimization jobs
router.get('/jobs', (_req, res) => {
    try {
        const jobs = (0, optimization_1.getAllOptimizationJobs)();
        return res.json({
            success: true,
            data: jobs,
            count: jobs.length,
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error getting optimization jobs', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to get optimization jobs',
            message: error.message,
        });
    }
});
// GET /api/optimization/jobs/:jobId - Get specific optimization job
router.get('/jobs/:jobId', (req, res) => {
    try {
        const job = (0, optimization_1.getOptimizationJob)(req.params.jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Optimization job not found',
            });
        }
        return res.json({
            success: true,
            data: job,
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error getting optimization job', jobId: req.params.jobId, error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to get optimization job',
            message: error.message,
        });
    }
});
// POST /api/optimization/jobs/:jobId/cancel - Cancel optimization job
router.post('/jobs/:jobId/cancel', (req, res) => {
    try {
        const success = (0, optimization_1.cancelOptimizationJob)(req.params.jobId);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Optimization job not found or already completed',
            });
        }
        return res.json({
            success: true,
            message: 'Optimization job cancelled',
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error cancelling optimization job', jobId: req.params.jobId, error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to cancel optimization job',
            message: error.message,
        });
    }
});
// POST /api/optimization/compare - Create model comparison
router.post('/compare', async (req, res) => {
    try {
        const { name, modelPaths, testDataset, comparisonMetrics } = req.body;
        if (!name || !modelPaths || !testDataset || !comparisonMetrics) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, modelPaths, testDataset, comparisonMetrics',
            });
        }
        if (modelPaths.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 models required for comparison',
            });
        }
        const comparison = await (0, optimization_1.createModelComparison)(name, modelPaths, testDataset, comparisonMetrics);
        return res.json({
            success: true,
            data: comparison,
            message: 'Model comparison created',
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error creating model comparison', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to create model comparison',
            message: error.message,
        });
    }
});
// POST /api/optimization/prune - Prune a model
router.post('/prune', async (req, res) => {
    try {
        const { modelPath, outputPath, config } = req.body;
        if (!modelPath || !outputPath || !config) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: modelPath, outputPath, config',
            });
        }
        const result = await (0, optimization_1.pruneModel)(modelPath, outputPath, config);
        return res.json({
            success: result.success,
            data: result,
            message: result.message,
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error pruning model', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to prune model',
            message: error.message,
        });
    }
});
// POST /api/optimization/quantize - Quantize a model
router.post('/quantize', async (req, res) => {
    try {
        const { modelPath, outputPath, config } = req.body;
        if (!modelPath || !outputPath || !config) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: modelPath, outputPath, config',
            });
        }
        const result = await (0, optimization_1.quantizeModel)(modelPath, outputPath, config);
        return res.json({
            success: result.success,
            data: result,
            message: result.message,
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error quantizing model', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to quantize model',
            message: error.message,
        });
    }
});
// GET /api/optimization/metrics - Get optimization metrics
router.get('/metrics', (_req, res) => {
    try {
        const metrics = (0, optimization_1.getOptimizationMetrics)();
        return res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        logger_1.logger.error({ msg: 'Error getting optimization metrics', error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Failed to get optimization metrics',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=optimization.js.map