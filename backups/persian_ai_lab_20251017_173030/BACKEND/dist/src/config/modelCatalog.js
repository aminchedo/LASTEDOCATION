"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_CATALOG = void 0;
exports.getModelById = getModelById;
exports.getModelsByType = getModelsByType;
exports.searchModels = searchModels;
exports.getAllDownloadUrls = getAllDownloadUrls;
exports.getFilenameFromUrl = getFilenameFromUrl;
// Real Persian models and datasets from Hugging Face
exports.MODEL_CATALOG = [
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
        defaultDest: 'models/tts/male',
        downloadUrls: {
            main: 'https://huggingface.co/Kamtera/persian-tts-male-vits/resolve/main/model.pth',
            config: 'https://huggingface.co/Kamtera/persian-tts-male-vits/resolve/main/config.json',
            additional: [
                'https://huggingface.co/Kamtera/persian-tts-male-vits/resolve/main/vocab.txt'
            ]
        }
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
        defaultDest: 'models/tts/female',
        downloadUrls: {
            main: 'https://huggingface.co/Kamtera/persian-tts-female-vits/resolve/main/model.pth',
            config: 'https://huggingface.co/Kamtera/persian-tts-female-vits/resolve/main/config.json',
            additional: [
                'https://huggingface.co/Kamtera/persian-tts-female-vits/resolve/main/vocab.txt'
            ]
        }
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
        defaultDest: 'models/bert_fa_base',
        downloadUrls: {
            main: 'https://huggingface.co/HooshvareLab/bert-fa-base-uncased/resolve/main/pytorch_model.bin',
            config: 'https://huggingface.co/HooshvareLab/bert-fa-base-uncased/resolve/main/config.json',
            vocab: 'https://huggingface.co/HooshvareLab/bert-fa-base-uncased/resolve/main/vocab.txt',
            additional: [
                'https://huggingface.co/HooshvareLab/bert-fa-base-uncased/resolve/main/tokenizer_config.json',
                'https://huggingface.co/HooshvareLab/bert-fa-base-uncased/resolve/main/special_tokens_map.json'
            ]
        }
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
        defaultDest: 'models/mt5_small_qa',
        downloadUrls: {
            main: 'https://huggingface.co/persiannlp/mt5-small-parsinlu-squad-reading-comprehension/resolve/main/pytorch_model.bin',
            config: 'https://huggingface.co/persiannlp/mt5-small-parsinlu-squad-reading-comprehension/resolve/main/config.json',
            additional: [
                'https://huggingface.co/persiannlp/mt5-small-parsinlu-squad-reading-comprehension/resolve/main/tokenizer.json',
                'https://huggingface.co/persiannlp/mt5-small-parsinlu-squad-reading-comprehension/resolve/main/spiece.model'
            ]
        }
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
        defaultDest: 'datasets/text/parsinlu_rc',
        downloadUrls: {
            main: 'https://huggingface.co/datasets/persiannlp/parsinlu_reading_comprehension/resolve/main/train.json',
            additional: [
                'https://huggingface.co/datasets/persiannlp/parsinlu_reading_comprehension/resolve/main/test.json',
                'https://huggingface.co/datasets/persiannlp/parsinlu_reading_comprehension/resolve/main/dev.json'
            ]
        }
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
        defaultDest: 'datasets/speech/cv_fa_13',
        downloadUrls: {
            main: 'https://huggingface.co/datasets/hezarai/common-voice-13-fa/resolve/main/train.tar.gz',
            additional: [
                'https://huggingface.co/datasets/hezarai/common-voice-13-fa/resolve/main/test.tar.gz',
                'https://huggingface.co/datasets/hezarai/common-voice-13-fa/resolve/main/validated.tar.gz'
            ]
        }
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
        defaultDest: 'datasets/text/pn_summary',
        downloadUrls: {
            main: 'https://huggingface.co/datasets/HooshvareLab/pn_summary/resolve/main/train.json',
            additional: [
                'https://huggingface.co/datasets/HooshvareLab/pn_summary/resolve/main/test.json',
                'https://huggingface.co/datasets/HooshvareLab/pn_summary/resolve/main/validation.json'
            ]
        }
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
        defaultDest: 'datasets/text/parsinlu_translation',
        downloadUrls: {
            main: 'https://huggingface.co/datasets/persiannlp/parsinlu_translation_fa_en/resolve/main/train.json',
            additional: [
                'https://huggingface.co/datasets/persiannlp/parsinlu_translation_fa_en/resolve/main/test.json'
            ]
        }
    }
];
function getModelById(id) {
    return exports.MODEL_CATALOG.find(m => m.id === id);
}
function getModelsByType(type) {
    return exports.MODEL_CATALOG.filter(m => m.type === type);
}
function searchModels(query) {
    const q = query.toLowerCase();
    return exports.MODEL_CATALOG.filter(m => m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q)));
}
/**
 * Get all download URLs for a model (main + additional files)
 */
function getAllDownloadUrls(modelId) {
    const model = getModelById(modelId);
    if (!model || !model.downloadUrls) {
        return [];
    }
    const urls = [];
    if (model.downloadUrls.main) {
        urls.push(model.downloadUrls.main);
    }
    if (model.downloadUrls.config) {
        urls.push(model.downloadUrls.config);
    }
    if (model.downloadUrls.vocab) {
        urls.push(model.downloadUrls.vocab);
    }
    if (model.downloadUrls.additional) {
        urls.push(...model.downloadUrls.additional);
    }
    return urls;
}
/**
 * Extract filename from download URL
 */
function getFilenameFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'model_file';
}
//# sourceMappingURL=modelCatalog.js.map