"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSmallPersianTextDataset = findSmallPersianTextDataset;
exports.findSmallPersianTTSModel = findSmallPersianTTSModel;
const node_fetch_1 = __importDefault(require("node-fetch"));
const HF_BASE = 'https://huggingface.co';
async function findSmallPersianTextDataset(_maxMB = 10) {
    // Very small heuristic search; prefer datasets containing FA content and small sizes.
    // We query the hub API; the agent should keep it stable and pick the smallest viable.
    const q = encodeURIComponent('persian fa small');
    const res = await (0, node_fetch_1.default)(`${HF_BASE}/api/datasets?search=${q}`);
    if (!res.ok)
        throw new Error('HF dataset search failed');
    const items = await res.json();
    // pick first reasonable candidate (agent can refine ordering by size if available)
    const pick = items.find(i => i.id && !i.id.includes('oscar') && !i.id.includes('cc100')) || items[0];
    if (!pick?.id)
        throw new Error('No small Persian dataset found');
    return pick.id;
}
async function findSmallPersianTTSModel(_maxMB = 12) {
    const q = encodeURIComponent('persian fa tts vits small');
    const res = await (0, node_fetch_1.default)(`${HF_BASE}/api/models?search=${q}`);
    if (!res.ok)
        throw new Error('HF model search failed');
    const items = await res.json();
    const pick = items.find(i => i.id && (i.id.toLowerCase().includes('vits') || i.id.toLowerCase().includes('tts'))) || items[0];
    if (!pick?.id)
        throw new Error('No small Persian TTS model found');
    return pick.id;
}
//# sourceMappingURL=hf.js.map