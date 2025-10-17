import fs from 'fs';
import path from 'path';
import { BOOTSTRAP } from '../config/bootstrap';
import { ensureDir, readableSize } from './downloader';
import { logger } from '../middleware/logger';
import { findSmallPersianTextDataset, findSmallPersianTTSModel } from './hf';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
const exec = promisify(_exec);

type Phase = 'idle'|'running'|'done'|'error';
type AssetId = 'text'|'asr'|'tts';

type AssetStatus = {
  id: AssetId;
  title: string;
  status: 'not_installed'|'installing'|'installed'|'error';
  bytes?: number;
  progress?: number; // 0-100
  error?: string;
  selectedId?: string;
};

type BootstrapState = {
  phase: Phase;
  totalBytes?: number;
  startedAt?: string;
  finishedAt?: string;
  assets: Record<AssetId, AssetStatus>;
};

const initState: BootstrapState = {
  phase: 'idle',
  assets: {
    text: { id:'text', title:'Persian Text (minimal)', status:'not_installed' },
    asr:  { id:'asr',  title:'ASR Sample (Common Voice fa)', status:'not_installed' },
    tts:  { id:'tts',  title:'Persian TTS (VITS minimal)', status:'not_installed' },
  }
};

function readState(): BootstrapState {
  try {
    const raw = fs.readFileSync(BOOTSTRAP.STATUS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return initState;
  }
}

function writeState(s: BootstrapState) {
  fs.writeFileSync(BOOTSTRAP.STATUS_FILE, JSON.stringify(s, null, 2), 'utf-8');
}

function writeProv(name: AssetId, payload: any) {
  let root: any = {};
  try { root = JSON.parse(fs.readFileSync(BOOTSTRAP.PROVENANCE_FILE, 'utf-8')); } catch {}
  root[name] = payload;
  fs.writeFileSync(BOOTSTRAP.PROVENANCE_FILE, JSON.stringify(root, null, 2), 'utf-8');
}

async function hfSnapshotDownload(repoType: 'dataset'|'model', repoId: string, outDir: string) {
  await ensureDir(outDir);
  // Use huggingface-cli to fetch a snapshot (keeps it real and traceable)
  await exec(`huggingface-cli snapshot-download --repo-type ${repoType} ${repoId} --local-dir ${outDir} --local-dir-use-symlinks False >> ${BOOTSTRAP.LOG_FILE} 2>&1`);
}

function dirSizeSync(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isFile()) size += stat.size;
    else if (stat.isDirectory()) size += dirSizeSync(full);
  }
  return size;
}

export async function startBootstrap(): Promise<BootstrapState> {
  let state = readState();
  if (state.phase === 'running') return state;

  state.phase = 'running';
  state.startedAt = new Date().toISOString();
  writeState(state);

  const tasks: [AssetId, () => Promise<void>][] = [
    ['text', async () => {
      const outDir = `${BOOTSTRAP.TEXT_DIR}/data`;
      const chosen = BOOTSTRAP.DEFAULTS.TEXT_DATASET || await findSmallPersianTextDataset();
      state.assets.text.selectedId = chosen;
      state.assets.text.status = 'installing'; state.assets.text.progress = 5; writeState(state);

      await hfSnapshotDownload('dataset', chosen, outDir);
      // prune if oversize
      const bytes = dirSizeSync(outDir);
      state.assets.text.bytes = bytes;
      state.assets.text.progress = 100;
      state.assets.text.status = 'installed'; writeState(state);

      writeProv('text', { repoType:'dataset', id: chosen, dir: outDir, bytes, human: readableSize(bytes) });
      logger.info({ msg:'bootstrap_text_installed', id: chosen, bytes });
    }],

    ['asr', async () => {
      const outDir = `${BOOTSTRAP.ASR_DIR}/data`;
      const chosen = BOOTSTRAP.DEFAULTS.ASR_DATASET;
      state.assets.asr.selectedId = chosen;
      state.assets.asr.status = 'installing'; state.assets.asr.progress = 5; writeState(state);

      await hfSnapshotDownload('dataset', chosen, outDir);
      // Keep only up to MAX_ASR_FILES files > 1 byte
      const files = listFiles(outDir).filter(f => fs.statSync(f).size > 1);
      if (files.length > BOOTSTRAP.MAX_ASR_FILES) {
        for (let i = BOOTSTRAP.MAX_ASR_FILES; i < files.length; i++) fs.rmSync(files[i], { force: true });
      }
      const bytes = dirSizeSync(outDir);
      state.assets.asr.bytes = bytes;
      state.assets.asr.progress = 100;
      state.assets.asr.status = 'installed'; writeState(state);

      writeProv('asr', { repoType:'dataset', id: chosen, dir: outDir, keptFiles: Math.min(files.length, BOOTSTRAP.MAX_ASR_FILES), bytes, human: readableSize(bytes) });
      logger.info({ msg:'bootstrap_asr_installed', id: chosen, bytes });
    }],

    ['tts', async () => {
      const outDir = `${BOOTSTRAP.TTS_DIR}/model`;
      const chosen = BOOTSTRAP.DEFAULTS.TTS_MODEL || await findSmallPersianTTSModel();
      state.assets.tts.selectedId = chosen;
      state.assets.tts.status = 'installing'; state.assets.tts.progress = 5; writeState(state);

      await hfSnapshotDownload('model', chosen, outDir);
      const bytes = dirSizeSync(outDir);
      state.assets.tts.bytes = bytes;
      state.assets.tts.progress = 100;
      state.assets.tts.status = 'installed'; writeState(state);

      writeProv('tts', { repoType:'model', id: chosen, dir: outDir, bytes, human: readableSize(bytes) });
      logger.info({ msg:'bootstrap_tts_installed', id: chosen, bytes });
    }],
  ];

  // Run sequentially to keep CPU/IO sane on small VPS
  try {
    for (const [, job] of tasks) {
      await job();
    }
    state.phase = 'done';
    state.finishedAt = new Date().toISOString();
    writeState(state);
    return state;
  } catch (err: any) {
    const message = err?.message || String(err);
    // Set failing asset to error
    const failing = Object.values(state.assets).find(a => a.status === 'installing');
    if (failing) {
      failing.status = 'error';
      failing.error = message;
    }
    state.phase = 'error';
    writeState(state);
    logger.error({ msg:'bootstrap_failed', error: message });
    return state;
  }
}

function listFiles(root: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root)) {
    const full = path.join(root, entry);
    const st = fs.statSync(full);
    if (st.isFile()) out.push(full);
    else if (st.isDirectory()) out.push(...listFiles(full));
  }
  return out;
}

export function getBootstrapStatus() {
  return readState();
}

export function getProvenance() {
  try {
    return JSON.parse(fs.readFileSync(BOOTSTRAP.PROVENANCE_FILE, 'utf-8'));
  } catch { return {}; }
}
