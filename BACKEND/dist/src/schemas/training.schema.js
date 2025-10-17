"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingSchemas = exports.jobIdParamSchema = exports.trainingConfigSchema = void 0;
const zod_1 = require("zod");
// Training configuration schema
exports.trainingConfigSchema = zod_1.z.object({
    datasetId: zod_1.z.string().min(1, 'Dataset ID is required'),
    epochs: zod_1.z.number().int().min(1).max(1000),
    batchSize: zod_1.z.number().int().min(1).max(512),
    learningRate: zod_1.z.number().min(0.00001).max(1),
    modelType: zod_1.z.enum(['simple', 'advanced', 'custom']).optional().default('simple'),
    validationSplit: zod_1.z.number().min(0).max(1).optional().default(0.2),
    optimizer: zod_1.z.enum(['adam', 'sgd', 'rmsprop', 'adagrad']).optional().default('adam'),
    // Additional optional fields
    momentum: zod_1.z.number().min(0).max(1).optional(),
    decay: zod_1.z.number().min(0).max(1).optional(),
    epsilon: zod_1.z.number().min(0).optional(),
    beta1: zod_1.z.number().min(0).max(1).optional(),
    beta2: zod_1.z.number().min(0).max(1).optional(),
    clipValue: zod_1.z.number().min(0).optional(),
    clipNorm: zod_1.z.number().min(0).optional(),
    globalClipNorm: zod_1.z.number().min(0).optional(),
    useBias: zod_1.z.boolean().optional(),
    weightDecay: zod_1.z.number().min(0).optional(),
    lossFunction: zod_1.z.enum(['mse', 'mae', 'huber', 'categorical_crossentropy', 'binary_crossentropy']).optional(),
    metrics: zod_1.z.array(zod_1.z.enum(['accuracy', 'precision', 'recall', 'f1', 'auc'])).optional(),
    earlyStoppingPatience: zod_1.z.number().int().min(1).optional(),
    reduceLRPatience: zod_1.z.number().int().min(1).optional(),
    reduceLRFactor: zod_1.z.number().min(0).max(1).optional(),
    modelName: zod_1.z.string().min(1).max(100).optional()
});
// Job ID parameter schema
exports.jobIdParamSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid('Invalid job ID format')
});
// Training schemas for route validation
exports.trainingSchemas = {
    create: {
        body: exports.trainingConfigSchema
    },
    getJob: {
        params: exports.jobIdParamSchema
    },
    cancelJob: {
        params: exports.jobIdParamSchema
    }
};
//# sourceMappingURL=training.schema.js.map