"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOTSTRAP = void 0;
exports.BOOTSTRAP = {
    ROOT: 'datasets',
    TEXT_DIR: 'datasets/text/persian_min',
    ASR_DIR: 'datasets/speech/cv_fa_min',
    TTS_DIR: 'datasets/tts/vits_fa_female_min',
    STATUS_FILE: 'datasets/.status.json',
    PROVENANCE_FILE: 'datasets/.provenance.json',
    LOG_FILE: 'logs/dataset_download.log',
    // Limits (keep it truly small)
    MAX_TOTAL_MB: 30,
    MAX_PER_ASSET_MB: 12,
    MAX_ASR_FILES: 20,
    // Preferred defaults (can be overridden by env, or auto-discovered if missing)
    DEFAULTS: {
        // Small Persian text dataset (auto-discover if blank)
        TEXT_DATASET: process.env.TEXT_DATASET_ID || '',
        // Common Voice FA mirror (dataset id is known and stable)
        ASR_DATASET: process.env.ASR_DATASET_ID || 'hezarai/common-voice-13-fa',
        // A Persian VITS TTS model (auto-discover if blank)
        TTS_MODEL: process.env.TTS_MODEL_ID || '',
    },
};
//# sourceMappingURL=bootstrap.js.map