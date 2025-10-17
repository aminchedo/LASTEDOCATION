import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import crypto from 'crypto';
import fetch from 'node-fetch';
// import { logger } from '../middleware/logger';
const streamPipeline = promisify(pipeline);

export async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

export async function sha256(filePath: string) {
  const hash = crypto.createHash('sha256');
  const input = fs.createReadStream(filePath);
  return new Promise<string>((resolve, reject) => {
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function downloadFile(
  url: string,
  targetPath: string,
  onProgress?: (pct: number) => void,
  byteLimit?: number
) {
  const res: any = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} ${res.statusText}`);

  const total = Number(res.headers.get('content-length') || 0);
  if (byteLimit && total && total > byteLimit) {
    throw new Error(`File too large: ${total} bytes > limit ${byteLimit}`);
  }

  await ensureDir(path.dirname(targetPath));

  let downloaded = 0;
  const file = fs.createWriteStream(targetPath);
  await streamPipeline(
    res.body.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      if (total && onProgress) {
        const pct = Math.round((downloaded / total) * 100);
        onProgress(Math.min(100, pct));
      }
    }),
    file
  );

  return { bytes: downloaded };
}

export function readableSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}
