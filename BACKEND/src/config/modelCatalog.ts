export interface ModelEntry {
  id: string;
  name: string;
  provider: string; // 'HuggingFace', 'Custom', etc.
  type: 'model' | 'tts' | 'dataset';
  repoType: 'model' | 'dataset';
  size: string; // Human readable
  sizeBytes?: number; // Approximate
  license: string;
  tags: string[];
  url: string;
  description: string;
  language: string[];
  defaultDest?: string;
}

// Real Persian models and datasets from Hugging Face
export const MODEL_CATALOG: ModelEntry[] = [
  // TTS Models
  {
    id: 'Kamtera/persian-tts-male-vits',
    name: 'Persian TTS Male (VITS)',
    provider: 'Kamtera',
    type: 'tts',
    repoType: 'model',
    size: '~50 MB',
    sizeBytes: 50 * 1024 * 1024,
    license: 'MIT',
    tags: ['persian', 'tts', 'vits', 'male-voice'],
    url: 'https://huggingface.co/Kamtera/persian-tts-male-vits',
    description: 'Persian Text-to-Speech model using VITS architecture with male voice',
    language: ['fa'],
    defaultDest: 'datasets/tts/kamtera_vits_male'
  },
  {
    id: 'Kamtera/persian-tts-female-vits',
    name: 'Persian TTS Female (VITS)',
    provider: 'Kamtera',
    type: 'tts',
    repoType: 'model',
    size: '~50 MB',
    sizeBytes: 50 * 1024 * 1024,
    license: 'MIT',
    tags: ['persian', 'tts', 'vits', 'female-voice'],
    url: 'https://huggingface.co/Kamtera/persian-tts-female-vits',
    description: 'Persian Text-to-Speech model using VITS architecture with female voice',
    language: ['fa'],
    defaultDest: 'datasets/tts/kamtera_vits_female'
  },
  
  // Chat/LLM Models (Small, CPU-friendly)
  {
    id: 'HooshvareLab/bert-fa-base-uncased',
    name: 'Persian BERT Base',
    provider: 'HooshvareLab',
    type: 'model',
    repoType: 'model',
    size: '~440 MB',
    sizeBytes: 440 * 1024 * 1024,
    license: 'Apache 2.0',
    tags: ['persian', 'bert', 'transformer', 'nlp'],
    url: 'https://huggingface.co/HooshvareLab/bert-fa-base-uncased',
    description: 'Persian BERT model for various NLP tasks',
    language: ['fa'],
    defaultDest: 'models/bert_fa_base'
  },
  {
    id: 'persiannlp/mt5-small-parsinlu-squad-reading-comprehension',
    name: 'Persian mT5 Small (QA)',
    provider: 'PersianNLP',
    type: 'model',
    repoType: 'model',
    size: '~300 MB',
    sizeBytes: 300 * 1024 * 1024,
    license: 'Apache 2.0',
    tags: ['persian', 'mt5', 'qa', 'reading-comprehension'],
    url: 'https://huggingface.co/persiannlp/mt5-small-parsinlu-squad-reading-comprehension',
    description: 'Small mT5 model fine-tuned for Persian question answering',
    language: ['fa'],
    defaultDest: 'models/mt5_small_qa'
  },

  // Datasets
  {
    id: 'persiannlp/parsinlu_reading_comprehension',
    name: 'ParsiNLU Reading Comprehension',
    provider: 'PersianNLP',
    type: 'dataset',
    repoType: 'dataset',
    size: '~10 MB',
    sizeBytes: 10 * 1024 * 1024,
    license: 'CC BY-NC-SA 4.0',
    tags: ['persian', 'qa', 'reading-comprehension', 'nlp'],
    url: 'https://huggingface.co/datasets/persiannlp/parsinlu_reading_comprehension',
    description: 'Persian reading comprehension dataset from ParsiNLU benchmark',
    language: ['fa'],
    defaultDest: 'datasets/text/parsinlu_rc'
  },
  {
    id: 'hezarai/common-voice-13-fa',
    name: 'Common Voice 13 (Persian)',
    provider: 'Hezar AI',
    type: 'dataset',
    repoType: 'dataset',
    size: '~2 GB',
    sizeBytes: 2 * 1024 * 1024 * 1024,
    license: 'CC0-1.0',
    tags: ['persian', 'speech', 'asr', 'audio'],
    url: 'https://huggingface.co/datasets/hezarai/common-voice-13-fa',
    description: 'Persian portion of Mozilla Common Voice dataset v13',
    language: ['fa'],
    defaultDest: 'datasets/speech/cv_fa_13'
  },
  {
    id: 'HooshvareLab/pn_summary',
    name: 'Persian News Summary',
    provider: 'HooshvareLab',
    type: 'dataset',
    repoType: 'dataset',
    size: '~50 MB',
    sizeBytes: 50 * 1024 * 1024,
    license: 'CC BY-NC-SA 4.0',
    tags: ['persian', 'summarization', 'news', 'text'],
    url: 'https://huggingface.co/datasets/HooshvareLab/pn_summary',
    description: 'Persian news articles with summaries for text summarization tasks',
    language: ['fa'],
    defaultDest: 'datasets/text/pn_summary'
  },
  {
    id: 'persiannlp/parsinlu_translation_fa_en',
    name: 'ParsiNLU Translation (FA-EN)',
    provider: 'PersianNLP',
    type: 'dataset',
    repoType: 'dataset',
    size: '~15 MB',
    sizeBytes: 15 * 1024 * 1024,
    license: 'CC BY-NC-SA 4.0',
    tags: ['persian', 'english', 'translation', 'bilingual'],
    url: 'https://huggingface.co/datasets/persiannlp/parsinlu_translation_fa_en',
    description: 'Persian-English translation pairs from ParsiNLU',
    language: ['fa', 'en'],
    defaultDest: 'datasets/text/parsinlu_translation'
  },
];

export function getModelById(id: string): ModelEntry | undefined {
  return MODEL_CATALOG.find(m => m.id === id);
}

export function getModelsByType(type: 'model' | 'tts' | 'dataset'): ModelEntry[] {
  return MODEL_CATALOG.filter(m => m.type === type);
}

export function searchModels(query: string): ModelEntry[] {
  const q = query.toLowerCase();
  return MODEL_CATALOG.filter(m => 
    m.name.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.tags.some(t => t.toLowerCase().includes(q))
  );
}

