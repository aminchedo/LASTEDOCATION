"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HF_TOKEN = void 0;
exports.getAuthHeaders = getAuthHeaders;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const HF_TOKEN_BASE64 = process.env.HF_TOKEN_BASE64;
if (!HF_TOKEN_BASE64) {
    console.warn('⚠️  [HF] Missing HF_TOKEN_BASE64 in environment');
    console.warn('   Add to .env: HF_TOKEN_BASE64=<base64_encoded_token>');
}
exports.HF_TOKEN = HF_TOKEN_BASE64
    ? Buffer.from(HF_TOKEN_BASE64, 'base64').toString('utf8').trim()
    : '';
function getAuthHeaders() {
    if (!exports.HF_TOKEN) {
        console.warn('⚠️  [HF] No token available - requests may be rate-limited');
        return {};
    }
    return { Authorization: `Bearer ${exports.HF_TOKEN}` };
}
if (exports.HF_TOKEN && exports.HF_TOKEN.startsWith('hf_')) {
    console.log('✅ [HF] Token loaded successfully');
}
else if (exports.HF_TOKEN) {
    console.error('❌ [HF] Invalid token format');
}
//# sourceMappingURL=hf-token.js.map