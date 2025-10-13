"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBootstrap = startBootstrap;
exports.getBootstrapStatus = getBootstrapStatus;
exports.getProvenance = getProvenance;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bootstrap_1 = require("../config/bootstrap");
const downloader_1 = require("./downloader");
const logger_1 = require("../middleware/logger");
const hf_1 = require("./hf");
const child_process_1 = require("child_process");
const util_1 = require("util");
const exec = (0, util_1.promisify)(child_process_1.exec);
const initState = {
    phase: 'idle',
    assets: {
        text: { id: 'text', title: 'Persian Text (minimal)', status: 'not_installed' },
        asr: { id: 'asr', title: 'ASR Sample (Common Voice fa)', status: 'not_installed' },
        tts: { id: 'tts', title: 'Persian TTS (VITS minimal)', status: 'not_installed' },
    }
};
function readState() {
    try {
        const raw = fs_1.default.readFileSync(bootstrap_1.BOOTSTRAP.STATUS_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return initState;
    }
}
function writeState(s) {
    fs_1.default.writeFileSync(bootstrap_1.BOOTSTRAP.STATUS_FILE, JSON.stringify(s, null, 2), 'utf-8');
}
function writeProv(name, payload) {
    let root = {};
    try {
        root = JSON.parse(fs_1.default.readFileSync(bootstrap_1.BOOTSTRAP.PROVENANCE_FILE, 'utf-8'));
    }
    catch { }
    root[name] = payload;
    fs_1.default.writeFileSync(bootstrap_1.BOOTSTRAP.PROVENANCE_FILE, JSON.stringify(root, null, 2), 'utf-8');
}
async function hfSnapshotDownload(repoType, repoId, outDir) {
    await (0, downloader_1.ensureDir)(outDir);
    // Use huggingface-cli to fetch a snapshot (keeps it real and traceable)
    await exec(`huggingface-cli snapshot-download --repo-type ${repoType} ${repoId} --local-dir ${outDir} --local-dir-use-symlinks False >> ${bootstrap_1.BOOTSTRAP.LOG_FILE} 2>&1`);
}
function dirSizeSync(dir) {
    let size = 0;
    if (!fs_1.default.existsSync(dir))
        return 0;
    for (const entry of fs_1.default.readdirSync(dir)) {
        const full = path_1.default.join(dir, entry);
        const stat = fs_1.default.statSync(full);
        if (stat.isFile())
            size += stat.size;
        else if (stat.isDirectory())
            size += dirSizeSync(full);
    }
    return size;
}
async function startBootstrap() {
    let state = readState();
    if (state.phase === 'running')
        return state;
    state.phase = 'running';
    state.startedAt = new Date().toISOString();
    writeState(state);
    const tasks = [
        ['text', async () => {
                const outDir = `${bootstrap_1.BOOTSTRAP.TEXT_DIR}/data`;
                const chosen = bootstrap_1.BOOTSTRAP.DEFAULTS.TEXT_DATASET || await (0, hf_1.findSmallPersianTextDataset)();
                state.assets.text.selectedId = chosen;
                state.assets.text.status = 'installing';
                state.assets.text.progress = 5;
                writeState(state);
                await hfSnapshotDownload('dataset', chosen, outDir);
                // prune if oversize
                const bytes = dirSizeSync(outDir);
                state.assets.text.bytes = bytes;
                state.assets.text.progress = 100;
                state.assets.text.status = 'installed';
                writeState(state);
                writeProv('text', { repoType: 'dataset', id: chosen, dir: outDir, bytes, human: (0, downloader_1.readableSize)(bytes) });
                logger_1.logger.info({ msg: 'bootstrap_text_installed', id: chosen, bytes });
            }],
        ['asr', async () => {
                const outDir = `${bootstrap_1.BOOTSTRAP.ASR_DIR}/data`;
                const chosen = bootstrap_1.BOOTSTRAP.DEFAULTS.ASR_DATASET;
                state.assets.asr.selectedId = chosen;
                state.assets.asr.status = 'installing';
                state.assets.asr.progress = 5;
                writeState(state);
                await hfSnapshotDownload('dataset', chosen, outDir);
                // Keep only up to MAX_ASR_FILES files > 1 byte
                const files = listFiles(outDir).filter(f => fs_1.default.statSync(f).size > 1);
                if (files.length > bootstrap_1.BOOTSTRAP.MAX_ASR_FILES) {
                    for (let i = bootstrap_1.BOOTSTRAP.MAX_ASR_FILES; i < files.length; i++)
                        fs_1.default.rmSync(files[i], { force: true });
                }
                const bytes = dirSizeSync(outDir);
                state.assets.asr.bytes = bytes;
                state.assets.asr.progress = 100;
                state.assets.asr.status = 'installed';
                writeState(state);
                writeProv('asr', { repoType: 'dataset', id: chosen, dir: outDir, keptFiles: Math.min(files.length, bootstrap_1.BOOTSTRAP.MAX_ASR_FILES), bytes, human: (0, downloader_1.readableSize)(bytes) });
                logger_1.logger.info({ msg: 'bootstrap_asr_installed', id: chosen, bytes });
            }],
        ['tts', async () => {
                const outDir = `${bootstrap_1.BOOTSTRAP.TTS_DIR}/model`;
                const chosen = bootstrap_1.BOOTSTRAP.DEFAULTS.TTS_MODEL || await (0, hf_1.findSmallPersianTTSModel)();
                state.assets.tts.selectedId = chosen;
                state.assets.tts.status = 'installing';
                state.assets.tts.progress = 5;
                writeState(state);
                await hfSnapshotDownload('model', chosen, outDir);
                const bytes = dirSizeSync(outDir);
                state.assets.tts.bytes = bytes;
                state.assets.tts.progress = 100;
                state.assets.tts.status = 'installed';
                writeState(state);
                writeProv('tts', { repoType: 'model', id: chosen, dir: outDir, bytes, human: (0, downloader_1.readableSize)(bytes) });
                logger_1.logger.info({ msg: 'bootstrap_tts_installed', id: chosen, bytes });
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
    }
    catch (err) {
        const message = err?.message || String(err);
        // Set failing asset to error
        const failing = Object.values(state.assets).find(a => a.status === 'installing');
        if (failing) {
            failing.status = 'error';
            failing.error = message;
        }
        state.phase = 'error';
        writeState(state);
        logger_1.logger.error({ msg: 'bootstrap_failed', error: message });
        return state;
    }
}
function listFiles(root) {
    const out = [];
    if (!fs_1.default.existsSync(root))
        return out;
    for (const entry of fs_1.default.readdirSync(root)) {
        const full = path_1.default.join(root, entry);
        const st = fs_1.default.statSync(full);
        if (st.isFile())
            out.push(full);
        else if (st.isDirectory())
            out.push(...listFiles(full));
    }
    return out;
}
function getBootstrapStatus() {
    return readState();
}
function getProvenance() {
    try {
        return JSON.parse(fs_1.default.readFileSync(bootstrap_1.BOOTSTRAP.PROVENANCE_FILE, 'utf-8'));
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=bootstrapManager.js.map