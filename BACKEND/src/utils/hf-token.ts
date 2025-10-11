import { config } from 'dotenv';

config();

const HF_TOKEN_BASE64 = process.env.HF_TOKEN_BASE64;

if (!HF_TOKEN_BASE64) {
  console.warn('⚠️  [HF] Missing HF_TOKEN_BASE64 in environment');
  console.warn('   Add to .env: HF_TOKEN_BASE64=<base64_encoded_token>');
}

export const HF_TOKEN = HF_TOKEN_BASE64 
  ? Buffer.from(HF_TOKEN_BASE64, 'base64').toString('utf8').trim()
  : '';

export function getAuthHeaders(): Record<string, string> {
  if (!HF_TOKEN) {
    console.warn('⚠️  [HF] No token available - requests may be rate-limited');
    return {};
  }
  return { Authorization: `Bearer ${HF_TOKEN}` };
}

if (HF_TOKEN && HF_TOKEN.startsWith('hf_')) {
  console.log('✅ [HF] Token loaded successfully');
} else if (HF_TOKEN) {
  console.error('❌ [HF] Invalid token format');
}
