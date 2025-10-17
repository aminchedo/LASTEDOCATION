import { z } from 'zod';

// Training configuration schema
export const trainingConfigSchema = z.object({
  datasetId: z.string().min(1, 'Dataset ID is required'),
  epochs: z.number().int().min(1).max(1000),
  batchSize: z.number().int().min(1).max(512),
  learningRate: z.number().min(0.00001).max(1),
  modelType: z.enum(['simple', 'advanced', 'custom']).optional().default('simple'),
  validationSplit: z.number().min(0).max(1).optional().default(0.2),
  optimizer: z.enum(['adam', 'sgd', 'rmsprop', 'adagrad']).optional().default('adam'),
  // Additional optional fields
  momentum: z.number().min(0).max(1).optional(),
  decay: z.number().min(0).max(1).optional(),
  epsilon: z.number().min(0).optional(),
  beta1: z.number().min(0).max(1).optional(),
  beta2: z.number().min(0).max(1).optional(),
  clipValue: z.number().min(0).optional(),
  clipNorm: z.number().min(0).optional(),
  globalClipNorm: z.number().min(0).optional(),
  useBias: z.boolean().optional(),
  weightDecay: z.number().min(0).optional(),
  lossFunction: z.enum(['mse', 'mae', 'huber', 'categorical_crossentropy', 'binary_crossentropy']).optional(),
  metrics: z.array(z.enum(['accuracy', 'precision', 'recall', 'f1', 'auc'])).optional(),
  earlyStoppingPatience: z.number().int().min(1).optional(),
  reduceLRPatience: z.number().int().min(1).optional(),
  reduceLRFactor: z.number().min(0).max(1).optional(),
  modelName: z.string().min(1).max(100).optional()
});

// Job ID parameter schema
export const jobIdParamSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format')
});

// Training schemas for route validation
export const trainingSchemas = {
  create: {
    body: trainingConfigSchema
  },
  getJob: {
    params: jobIdParamSchema
  },
  cancelJob: {
    params: jobIdParamSchema
  }
};

// Export types
export type TrainingConfig = z.infer<typeof trainingConfigSchema>;
export type JobIdParam = z.infer<typeof jobIdParamSchema>;