"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
let experiments = [];
router.get('/', (_req, res) => {
    res.json({
        success: true,
        data: experiments,
        total: experiments.length,
    });
});
router.post('/', (req, res) => {
    try {
        const { name, description, dataset, model, config, notes } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Experiment name is required',
            });
        }
        const experiment = {
            id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            dataset,
            model,
            status: 'idle',
            progress: 0,
            config,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        experiments.push(experiment);
        return res.json({
            success: true,
            data: experiment,
        });
    }
    catch (error) {
        console.error('Error creating experiment:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create experiment',
        });
    }
});
router.post('/:id/start', (req, res) => {
    const { id } = req.params;
    const experiment = experiments.find((e) => e.id === id);
    if (!experiment) {
        return res.status(404).json({
            success: false,
            error: 'Experiment not found',
        });
    }
    experiment.status = 'running';
    experiment.startTime = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    return res.json({
        success: true,
        data: experiment,
    });
});
router.post('/:id/stop', (req, res) => {
    const { id } = req.params;
    const experiment = experiments.find((e) => e.id === id);
    if (!experiment) {
        return res.status(404).json({
            success: false,
            error: 'Experiment not found',
        });
    }
    experiment.status = 'completed';
    experiment.endTime = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    return res.json({
        success: true,
        data: experiment,
    });
});
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const index = experiments.findIndex((e) => e.id === id);
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Experiment not found',
        });
    }
    experiments.splice(index, 1);
    return res.json({
        success: true,
        message: 'Experiment deleted',
    });
});
router.get('/:id/download', (req, res) => {
    const { id } = req.params;
    const experiment = experiments.find((e) => e.id === id);
    if (!experiment) {
        return res.status(404).json({
            success: false,
            error: 'Experiment not found',
        });
    }
    const data = JSON.stringify(experiment, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="experiment_${id}.json"`);
    return res.send(data);
});
exports.default = router;
//# sourceMappingURL=experiments.js.map