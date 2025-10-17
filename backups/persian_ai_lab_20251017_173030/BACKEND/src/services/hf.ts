import fetch from 'node-fetch';

interface HFItem { id: string; downloads?: number; sha?: string; }
const HF_BASE = 'https://huggingface.co';

export async function findSmallPersianTextDataset(_maxMB = 10): Promise<string> {
  // Very small heuristic search; prefer datasets containing FA content and small sizes.
  // We query the hub API; the agent should keep it stable and pick the smallest viable.
  const q = encodeURIComponent('persian fa small');
  const res = await fetch(`${HF_BASE}/api/datasets?search=${q}`);
  if (!res.ok) throw new Error('HF dataset search failed');
  const items: HFItem[] = await res.json();

  // pick first reasonable candidate (agent can refine ordering by size if available)
  const pick = items.find(i => i.id && !i.id.includes('oscar') && !i.id.includes('cc100')) || items[0];
  if (!pick?.id) throw new Error('No small Persian dataset found');
  return pick.id;
}

export async function findSmallPersianTTSModel(_maxMB = 12): Promise<string> {
  const q = encodeURIComponent('persian fa tts vits small');
  const res = await fetch(`${HF_BASE}/api/models?search=${q}`);
  if (!res.ok) throw new Error('HF model search failed');
  const items: HFItem[] = await res.json();
  const pick = items.find(i => i.id && (i.id.toLowerCase().includes('vits') || i.id.toLowerCase().includes('tts'))) || items[0];
  if (!pick?.id) throw new Error('No small Persian TTS model found');
  return pick.id;
}
