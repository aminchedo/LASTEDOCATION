"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDir = ensureDir;
exports.sha256 = sha256;
exports.downloadFile = downloadFile;
exports.readableSize = readableSize;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// import { logger } from '../middleware/logger';
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
async function ensureDir(dir) {
    await fs_1.default.promises.mkdir(dir, { recursive: true });
}
async function sha256(filePath) {
    const hash = crypto_1.default.createHash('sha256');
    const input = fs_1.default.createReadStream(filePath);
    return new Promise((resolve, reject) => {
        input.on('error', reject);
        input.on('data', (chunk) => hash.update(chunk));
        input.on('end', () => resolve(hash.digest('hex')));
    });
}
async function downloadFile(url, targetPath, onProgress, byteLimit) {
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Download failed ${res.status} ${res.statusText}`);
    const total = Number(res.headers.get('content-length') || 0);
    if (byteLimit && total && total > byteLimit) {
        throw new Error(`File too large: ${total} bytes > limit ${byteLimit}`);
    }
    await ensureDir(path_1.default.dirname(targetPath));
    let downloaded = 0;
    const file = fs_1.default.createWriteStream(targetPath);
    await streamPipeline(res.body.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total && onProgress) {
            const pct = Math.round((downloaded / total) * 100);
            onProgress(Math.min(100, pct));
        }
    }), file);
    return { bytes: downloaded };
}
function readableSize(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}
//# sourceMappingURL=downloader.js.map