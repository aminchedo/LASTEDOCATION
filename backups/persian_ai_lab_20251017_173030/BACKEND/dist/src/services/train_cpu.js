#!/usr/bin/env ts-node
"use strict";
/**
 * CPU-based fine-tuning script for Persian chat model.
 * TypeScript wrapper for Python-based training (PyTorch/Transformers)
 *
 * NOTE: Deep learning model training requires Python/PyTorch.
 * This TypeScript script provides a typed interface and delegates to Python.
 * For a pure TypeScript ML solution, consider TensorFlow.js or ONNX Runtime.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainModel = trainModel;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Execute Python training script with TypeScript argument handling
 */
async function trainModel(args) {
    const scriptDir = path.dirname(process.argv[1]);
    const pythonScript = path.join(scriptDir, 'train_cpu.py');
    // Verify Python script exists
    if (!fs.existsSync(pythonScript)) {
        console.error(`❌ Python training script not found: ${pythonScript}`);
        console.error('   Model training requires PyTorch (Python).');
        console.error('   For TypeScript-only ML, consider TensorFlow.js or ONNX Runtime.');
        process.exit(1);
    }
    // Build command arguments
    const commandArgs = [pythonScript];
    if (args.epochs !== undefined) {
        commandArgs.push('--epochs', String(args.epochs));
    }
    if (args.batch_size !== undefined) {
        commandArgs.push('--batch_size', String(args.batch_size));
    }
    if (args.lr !== undefined) {
        commandArgs.push('--lr', String(args.lr));
    }
    if (args.max_length !== undefined) {
        commandArgs.push('--max_length', String(args.max_length));
    }
    if (args.seed !== undefined) {
        commandArgs.push('--seed', String(args.seed));
    }
    if (args.model_name) {
        commandArgs.push('--model_name', args.model_name);
    }
    if (args.dataset || args.data) {
        commandArgs.push('--dataset', args.dataset || args.data || '');
    }
    if (args.output_dir) {
        commandArgs.push('--output_dir', args.output_dir);
    }
    if (args.log_file) {
        commandArgs.push('--log_file', args.log_file);
    }
    console.log('🚀 Starting Python training process...');
    console.log(`   Command: python3 ${commandArgs.join(' ')}`);
    console.log();
    // Spawn Python process
    const pythonProcess = (0, child_process_1.spawn)('python3', commandArgs, {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Training completed successfully!');
                resolve();
            }
            else {
                console.error(`\n❌ Training failed with exit code ${code}`);
                reject(new Error(`Training process exited with code ${code}`));
            }
        });
        pythonProcess.on('error', (error) => {
            console.error('❌ Failed to start training process:', error);
            reject(error);
        });
    });
}
/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {};
    for (let i = 2; i < process.argv.length; i += 2) {
        const key = process.argv[i];
        const value = process.argv[i + 1];
        switch (key) {
            case '--epochs':
                args.epochs = parseInt(value, 10);
                break;
            case '--batch_size':
                args.batch_size = parseInt(value, 10);
                break;
            case '--lr':
                args.lr = parseFloat(value);
                break;
            case '--max_length':
                args.max_length = parseInt(value, 10);
                break;
            case '--seed':
                args.seed = parseInt(value, 10);
                break;
            case '--model_name':
                args.model_name = value;
                break;
            case '--dataset':
                args.dataset = value;
                break;
            case '--data':
                args.data = value;
                break;
            case '--output_dir':
                args.output_dir = value;
                break;
            case '--log_file':
                args.log_file = value;
                break;
            default:
                console.warn(`Unknown argument: ${key}`);
        }
    }
    return args;
}
/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Persian Chat Model Training (TypeScript → Python)');
    console.log('='.repeat(60));
    console.log();
    console.log('ℹ️  Note: This TypeScript script delegates to Python for PyTorch training.');
    console.log('   Backend API remains TypeScript-only.');
    console.log();
    const args = parseArgs();
    try {
        await trainModel(args);
    }
    catch (error) {
        console.error('Training failed:', error);
        process.exit(1);
    }
}
// Execute if run directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=train_cpu.js.map