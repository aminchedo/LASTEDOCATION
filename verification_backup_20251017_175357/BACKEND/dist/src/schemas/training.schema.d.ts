import { z } from 'zod';
export declare const trainingConfigSchema: z.ZodObject<{
    datasetId: z.ZodString;
    epochs: z.ZodNumber;
    batchSize: z.ZodNumber;
    learningRate: z.ZodNumber;
    modelType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["simple", "advanced", "custom"]>>>;
    validationSplit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    optimizer: z.ZodDefault<z.ZodOptional<z.ZodEnum<["adam", "sgd", "rmsprop", "adagrad"]>>>;
    momentum: z.ZodOptional<z.ZodNumber>;
    decay: z.ZodOptional<z.ZodNumber>;
    epsilon: z.ZodOptional<z.ZodNumber>;
    beta1: z.ZodOptional<z.ZodNumber>;
    beta2: z.ZodOptional<z.ZodNumber>;
    clipValue: z.ZodOptional<z.ZodNumber>;
    clipNorm: z.ZodOptional<z.ZodNumber>;
    globalClipNorm: z.ZodOptional<z.ZodNumber>;
    useBias: z.ZodOptional<z.ZodBoolean>;
    weightDecay: z.ZodOptional<z.ZodNumber>;
    lossFunction: z.ZodOptional<z.ZodEnum<["mse", "mae", "huber", "categorical_crossentropy", "binary_crossentropy"]>>;
    metrics: z.ZodOptional<z.ZodArray<z.ZodEnum<["accuracy", "precision", "recall", "f1", "auc"]>, "many">>;
    earlyStoppingPatience: z.ZodOptional<z.ZodNumber>;
    reduceLRPatience: z.ZodOptional<z.ZodNumber>;
    reduceLRFactor: z.ZodOptional<z.ZodNumber>;
    modelName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    datasetId: string;
    epochs: number;
    batchSize: number;
    validationSplit: number;
    learningRate: number;
    modelType: "simple" | "custom" | "advanced";
    optimizer: "adam" | "sgd" | "rmsprop" | "adagrad";
    metrics?: ("accuracy" | "precision" | "recall" | "f1" | "auc")[] | undefined;
    momentum?: number | undefined;
    decay?: number | undefined;
    epsilon?: number | undefined;
    beta1?: number | undefined;
    beta2?: number | undefined;
    clipValue?: number | undefined;
    clipNorm?: number | undefined;
    globalClipNorm?: number | undefined;
    useBias?: boolean | undefined;
    weightDecay?: number | undefined;
    lossFunction?: "mse" | "mae" | "huber" | "categorical_crossentropy" | "binary_crossentropy" | undefined;
    earlyStoppingPatience?: number | undefined;
    reduceLRPatience?: number | undefined;
    reduceLRFactor?: number | undefined;
    modelName?: string | undefined;
}, {
    datasetId: string;
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit?: number | undefined;
    metrics?: ("accuracy" | "precision" | "recall" | "f1" | "auc")[] | undefined;
    modelType?: "simple" | "custom" | "advanced" | undefined;
    optimizer?: "adam" | "sgd" | "rmsprop" | "adagrad" | undefined;
    momentum?: number | undefined;
    decay?: number | undefined;
    epsilon?: number | undefined;
    beta1?: number | undefined;
    beta2?: number | undefined;
    clipValue?: number | undefined;
    clipNorm?: number | undefined;
    globalClipNorm?: number | undefined;
    useBias?: boolean | undefined;
    weightDecay?: number | undefined;
    lossFunction?: "mse" | "mae" | "huber" | "categorical_crossentropy" | "binary_crossentropy" | undefined;
    earlyStoppingPatience?: number | undefined;
    reduceLRPatience?: number | undefined;
    reduceLRFactor?: number | undefined;
    modelName?: string | undefined;
}>;
export declare const jobIdParamSchema: z.ZodObject<{
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
}, {
    jobId: string;
}>;
export declare const trainingSchemas: {
    create: {
        body: z.ZodObject<{
            datasetId: z.ZodString;
            epochs: z.ZodNumber;
            batchSize: z.ZodNumber;
            learningRate: z.ZodNumber;
            modelType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["simple", "advanced", "custom"]>>>;
            validationSplit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            optimizer: z.ZodDefault<z.ZodOptional<z.ZodEnum<["adam", "sgd", "rmsprop", "adagrad"]>>>;
            momentum: z.ZodOptional<z.ZodNumber>;
            decay: z.ZodOptional<z.ZodNumber>;
            epsilon: z.ZodOptional<z.ZodNumber>;
            beta1: z.ZodOptional<z.ZodNumber>;
            beta2: z.ZodOptional<z.ZodNumber>;
            clipValue: z.ZodOptional<z.ZodNumber>;
            clipNorm: z.ZodOptional<z.ZodNumber>;
            globalClipNorm: z.ZodOptional<z.ZodNumber>;
            useBias: z.ZodOptional<z.ZodBoolean>;
            weightDecay: z.ZodOptional<z.ZodNumber>;
            lossFunction: z.ZodOptional<z.ZodEnum<["mse", "mae", "huber", "categorical_crossentropy", "binary_crossentropy"]>>;
            metrics: z.ZodOptional<z.ZodArray<z.ZodEnum<["accuracy", "precision", "recall", "f1", "auc"]>, "many">>;
            earlyStoppingPatience: z.ZodOptional<z.ZodNumber>;
            reduceLRPatience: z.ZodOptional<z.ZodNumber>;
            reduceLRFactor: z.ZodOptional<z.ZodNumber>;
            modelName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            datasetId: string;
            epochs: number;
            batchSize: number;
            validationSplit: number;
            learningRate: number;
            modelType: "simple" | "custom" | "advanced";
            optimizer: "adam" | "sgd" | "rmsprop" | "adagrad";
            metrics?: ("accuracy" | "precision" | "recall" | "f1" | "auc")[] | undefined;
            momentum?: number | undefined;
            decay?: number | undefined;
            epsilon?: number | undefined;
            beta1?: number | undefined;
            beta2?: number | undefined;
            clipValue?: number | undefined;
            clipNorm?: number | undefined;
            globalClipNorm?: number | undefined;
            useBias?: boolean | undefined;
            weightDecay?: number | undefined;
            lossFunction?: "mse" | "mae" | "huber" | "categorical_crossentropy" | "binary_crossentropy" | undefined;
            earlyStoppingPatience?: number | undefined;
            reduceLRPatience?: number | undefined;
            reduceLRFactor?: number | undefined;
            modelName?: string | undefined;
        }, {
            datasetId: string;
            epochs: number;
            batchSize: number;
            learningRate: number;
            validationSplit?: number | undefined;
            metrics?: ("accuracy" | "precision" | "recall" | "f1" | "auc")[] | undefined;
            modelType?: "simple" | "custom" | "advanced" | undefined;
            optimizer?: "adam" | "sgd" | "rmsprop" | "adagrad" | undefined;
            momentum?: number | undefined;
            decay?: number | undefined;
            epsilon?: number | undefined;
            beta1?: number | undefined;
            beta2?: number | undefined;
            clipValue?: number | undefined;
            clipNorm?: number | undefined;
            globalClipNorm?: number | undefined;
            useBias?: boolean | undefined;
            weightDecay?: number | undefined;
            lossFunction?: "mse" | "mae" | "huber" | "categorical_crossentropy" | "binary_crossentropy" | undefined;
            earlyStoppingPatience?: number | undefined;
            reduceLRPatience?: number | undefined;
            reduceLRFactor?: number | undefined;
            modelName?: string | undefined;
        }>;
    };
    getJob: {
        params: z.ZodObject<{
            jobId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            jobId: string;
        }, {
            jobId: string;
        }>;
    };
    cancelJob: {
        params: z.ZodObject<{
            jobId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            jobId: string;
        }, {
            jobId: string;
        }>;
    };
};
export type TrainingConfig = z.infer<typeof trainingConfigSchema>;
export type JobIdParam = z.infer<typeof jobIdParamSchema>;
//# sourceMappingURL=training.schema.d.ts.map