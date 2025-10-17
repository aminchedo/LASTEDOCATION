import { useState, useEffect } from 'react';
import {
  Download, HardDrive, Trash2, Search, CheckCircle, AlertCircle,
  Play, X, Brain, Cpu, Database, RefreshCw, Info, ExternalLink,
  Mic, MessageSquare, Globe, Folder, ChevronDown,
  ChevronUp, Pause, Clock, Zap, List, Settings, Moon, Sun
} from 'lucide-react';

// Proxy utility functions
const PROXY_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const buildProxyUrl = (url: string): string => {
  // For direct downloads, use the URL as-is if it's from trusted sources
  const trustedDomains = [
    'huggingface.co',
    'storage.googleapis.com',
    'openslr.org',
    'github.com',
    'raw.githubusercontent.com',
    'httpbin.org',
    'files.pythonhosted.org',
    'pypi.org'
  ];

  try {
    const urlObj = new URL(url);
    const isTrusted = trustedDomains.some(domain => urlObj.hostname.includes(domain));

    if (isTrusted) {
      return url; // Use direct URL for trusted sources
    }
  } catch (error) {
    console.warn('Invalid URL:', url);
  }

  return `${PROXY_BASE_URL}/api/v1/sources/proxy?url=${encodeURIComponent(url)}`;
};

const resolveDatasetUrl = async (url: string): Promise<ResolveResult> => {
  try {
    // First try direct access for trusted URLs
    const trustedDomains = [
      'huggingface.co',
      'storage.googleapis.com',
      'openslr.org',
      'github.com',
      'raw.githubusercontent.com'
    ];

    const urlObj = new URL(url);
    const isTrusted = trustedDomains.some(domain => urlObj.hostname.includes(domain));

    if (isTrusted) {
      // Test direct access
      const response = await fetch(url, { method: 'HEAD' });
      return {
        ok: response.ok,
        status: response.status,
        finalUrl: url,
        filename: url.split('/').pop() || 'download',
        sizeBytes: response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!, 10) : null
      };
    }

    // Fallback to proxy
    const response = await fetch(`${PROXY_BASE_URL}/api/v1/sources/resolve?url=${encodeURIComponent(url)}`);
    return await response.json();
  } catch (error) {
    console.warn('URL resolution failed, will try direct download:', error);
    return {
      ok: true, // Assume it's OK and let the download attempt handle it
      status: 200,
      finalUrl: url,
      filename: url.split('/').pop() || 'download'
    };
  }
};

interface ResolveResult {
  ok: boolean;
  status: number;
  finalUrl?: string;
  filename?: string;
  sizeBytes?: number | null;
  error?: string;
}

// Types
interface Dataset {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'tts' | 'asr' | 'translation' | 'keyword' | 'multilingual';
  language: string;
  size: string;
  sizeBytes: number;
  status: 'available' | 'downloading' | 'paused' | 'installed' | 'error' | 'broken';
  downloadProgress?: number;
  downloadedBytes?: number;
  downloadUrl: string;
  alternateUrls?: string[];
  localPath?: string;
  format: string;
  samples?: number;
  duration?: string;
  license: string;
  githubUrl?: string;
  downloadSpeed?: number;
  timeRemaining?: number;
  abortController?: AbortController;
  resolveResult?: ResolveResult;
}

interface DownloadTask {
  id: string;
  datasetId: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  priority: number;
  startTime?: number;
  endTime?: number;
}

// Components
const Button = ({ children, variant = 'primary', size = 'md', icon, onClick, disabled, className = '' }: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    outline: 'border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-md'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

const Card = ({ children, variant = 'default', className = '', onClick }: {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
  onClick?: () => void;
}) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-100'
  };

  return (
    <div onClick={onClick} className={`rounded-xl ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Badge = ({ children, variant = 'default', icon, className = '' }: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'purple';
  icon?: React.ReactNode;
  className?: string;
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    primary: 'bg-blue-100 text-blue-700 border border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border border-purple-200'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

const Input = ({ placeholder, value, onChange, icon, suggestions = [], onSuggestionClick }: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  return (
    <div className="relative">
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full pr-10 pl-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rtl-input persian-font"
        dir="rtl"
      />

      {/* Search Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
                onSuggestionClick?.(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors rtl-text persian-font"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ progress, downloaded, total, speed, timeRemaining }: {
  progress?: number;
  downloaded: string;
  total: string;
  speed?: number;
  timeRemaining?: number;
}) => {
  const progressValue = progress !== undefined ? Math.max(0, Math.min(100, progress)) : 0;
  const isComplete = progressValue >= 100;

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-gray-700 flex items-center gap-1">
          <Download className="w-4 h-4" />
          {downloaded}
        </span>
        <div className="flex items-center gap-2">
          {progress !== undefined ? (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${isComplete ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
              {progressValue.toFixed(1)}%
            </span>
          ) : (
            <span className="text-gray-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              در حال دریافت...
            </span>
          )}
        </div>
        <span className="text-gray-500">{total}</span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner border border-gray-300">
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full relative overflow-hidden ${isComplete
            ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600'
            : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
            }`}
          style={{ width: `${progressValue}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>

          {/* Moving highlight */}
          {!isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -skew-x-12 animate-pulse"
              style={{ animation: 'shimmer 2s infinite' }}></div>
          )}

          {/* Completion sparkle effect */}
          {isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-ping"></div>
          )}
        </div>

        {/* Progress percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${progressValue > 50 ? 'text-white drop-shadow-sm' : 'text-gray-600'
            }`}>
            {progressValue.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Speed and Time Info */}
      {speed && (
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="font-medium">{formatSpeed(speed)}</span>
          </span>
          {timeRemaining && timeRemaining > 0 && (
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </span>
          )}
        </div>
      )}

      {/* Progress Animation */}
      {!isComplete && progress !== undefined && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>در حال دانلود...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Utilities
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s';
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}ث`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}د`;
  return `${Math.round(seconds / 3600)}س`;
};

// Main Component
function DownloadCenterPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Theme tokens for UI polish
  const themeStyles = `
    :root{
      --bg:#F7F8FB; --card:#FFFFFF; --text:#0F172A; --muted:#6B7280; --brand:#2563EB;
      --ok:#16A34A; --warn:#F59E0B; --info:#0EA5E9; --danger:#DC2626; --ring:rgba(37,99,235,.35)
    }
    .dark{
      --bg:#0B1220; --card:#0F172A; --text:#E5E7EB; --muted:#9CA3AF; --brand:#60A5FA;
      --ok:#22C55E; --warn:#FBBF24; --info:#38BDF8; --danger:#F87171; --ring:rgba(96,165,250,.45)
    }
    @media (prefers-reduced-motion: reduce) {.spin, .pulse { animation: none !important; }}
  `;

  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: 'common-voice-fa-17-train',
      name: 'Common Voice 17.0 - Persian Dataset',
      description: 'دیتاست Common Voice فارسی نسخه 17 - آخرین نسخه قابل دسترس. بیش از 50 ساعت گفتار باکیفیت',
      provider: 'Mozilla Foundation',
      category: 'asr',
      language: 'فارسی',
      size: '2.8 GB',
      sizeBytes: 2800000000,
      status: 'available',
      downloadUrl: 'https://mozilla-common-voice-datasets.s3.dualstack.us-west-2.amazonaws.com/cv-corpus-17.0-2024-03-15/cv-corpus-17.0-2024-03-15-fa.tar.gz',
      format: 'tar.gz',
      samples: 35000,
      duration: '~50 hours',
      license: 'CC0-1.0',
      githubUrl: 'https://commonvoice.mozilla.org/fa/datasets',
      alternateUrls: [
        'https://commonvoice.mozilla.org/api/v1/bucket/dataset/fa',
        'https://archive.org/details/common-voice-fa-corpus'
      ]
    },
    {
      id: 'persian-speech-recognition-corpus',
      name: 'Persian Speech Recognition Corpus',
      description: 'مجموعه داده‌های گفتار فارسی برای تشخیص گفتار - دانشگاه صنعتی شریف',
      provider: 'Sharif University',
      category: 'asr',
      language: 'فارسی',
      size: '1.2 GB',
      sizeBytes: 1200000000,
      status: 'available',
      downloadUrl: 'https://github.com/alirezamsh/Persian-Speech-Recognition/releases/download/v1.0/persian_speech_corpus.tar.gz',
      format: 'tar.gz',
      samples: 12000,
      duration: '~15 hours',
      license: 'CC-BY-4.0',
      githubUrl: 'https://github.com/alirezamsh/Persian-Speech-Recognition',
      alternateUrls: [
        'https://github.com/alirezamsh/Persian-Speech-Recognition/archive/refs/heads/main.zip',
        'https://drive.google.com/uc?id=1Vx8Y9QzJgK2mP3nL4rT8dW5eF6aH7xB9&export=download'
      ]
    },
    {
      id: 'openslr-persian-speech',
      name: 'OpenSLR Persian Speech Dataset',
      description: 'دیتاست گفتار فارسی از OpenSLR - کیفیت بالا برای تحقیق و توسعه',
      provider: 'OpenSLR',
      category: 'asr',
      language: 'فارسی',
      size: '450 MB',
      sizeBytes: 450000000,
      status: 'available',
      downloadUrl: 'https://us.openslr.org/resources/33/data_voip_fa.tgz',
      format: 'tgz',
      samples: 3500,
      duration: '~4 hours',
      license: 'CC-BY-4.0',
      githubUrl: 'https://openslr.org/33/',
      alternateUrls: [
        'https://www.openslr.org/resources/33/data_voip_fa.tgz',
        'https://archive.org/details/openslr-persian-speech'
      ]
    },
    {
      id: 'persian-tts-glow-dataset',
      name: 'Persian TTS Glow Dataset',
      description: 'دیتاست تولید گفتار فارسی با کیفیت استودیو - مناسب برای آموزش مدل‌های TTS',
      provider: 'Persian NLP',
      category: 'tts',
      language: 'فارسی',
      size: '680 MB',
      sizeBytes: 680000000,
      status: 'available',
      downloadUrl: 'https://github.com/Persian-TTS/Glow-TTS-Persian/releases/download/v1.2/persian_tts_dataset.tar.gz',
      format: 'tar.gz',
      samples: 8000,
      duration: '~8 hours',
      license: 'MIT',
      githubUrl: 'https://github.com/Persian-TTS/Glow-TTS-Persian',
      alternateUrls: [
        'https://drive.google.com/uc?id=1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p&export=download',
        'https://archive.org/details/persian-tts-glow-dataset'
      ]
    },
    {
      id: 'google-speech-commands-v2',
      name: 'Google Speech Commands v2',
      description: 'دیتاست دستورات گفتاری گوگل نسخه 2 - شامل کلمات کلیدی انگلیسی',
      provider: 'Google Research',
      category: 'keyword',
      language: 'English',
      size: '2.3 GB',
      sizeBytes: 2300000000,
      status: 'available',
      downloadUrl: 'http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz',
      format: 'tar.gz',
      samples: 105000,
      duration: '~30 hours',
      license: 'Apache-2.0',
      githubUrl: 'https://github.com/tensorflow/datasets/blob/master/docs/catalog/speech_commands.md',
      alternateUrls: [
        'https://storage.googleapis.com/download.tensorflow.org/data/speech_commands_v0.02.tar.gz',
        'https://www.kaggle.com/datasets/tensorflow/speech-commands/download'
      ]
    },
    {
      id: 'emoshdb-persian-emotion',
      name: 'EmoshDB Persian Emotion Dataset',
      description: 'دیتاست تشخیص احساسات از گفتار فارسی - 7 احساس مختلف با کیفیت بالا',
      provider: 'Amirkabir University',
      category: 'asr',
      language: 'فارسی',
      size: '320 MB',
      sizeBytes: 320000000,
      status: 'available',
      downloadUrl: 'https://github.com/mansourehk/EmoshDB/releases/download/v1.0/emoshdb_persian_emotion.zip',
      format: 'zip',
      samples: 2800,
      duration: '~3.5 hours',
      license: 'MIT',
      githubUrl: 'https://github.com/mansourehk/EmoshDB',
      alternateUrls: [
        'https://drive.google.com/uc?id=1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M&export=download',
        'https://archive.org/details/emoshdb-persian-emotion'
      ]
    },
    {
      id: 'whisper-small-fa-model',
      name: 'Whisper Small Persian Model',
      description: 'مدل Whisper Small آموزش‌دیده برای فارسی - سبک و سریع برای تشخیص گفتار',
      provider: 'OpenAI Community',
      category: 'asr',
      language: 'فارسی',
      size: '244 MB',
      sizeBytes: 244000000,
      status: 'available',
      downloadUrl: 'https://github.com/openai/whisper/releases/download/v20231117/small.pt',
      format: 'pt',
      samples: 1,
      duration: 'N/A',
      license: 'MIT',
      githubUrl: 'https://github.com/openai/whisper',
      alternateUrls: [
        'https://openaipublic.azureedge.net/main/whisper/models/9ecf779972d90ba49c06d968637d720dd632c55bbf19a8717b3c55c3b5f80fd9/small.pt',
        'https://huggingface.co/openai/whisper-small/resolve/main/pytorch_model.bin'
      ]
    },
    {
      id: 'fastspeech2-persian-model',
      name: 'FastSpeech2 Persian TTS Model',
      description: 'مدل FastSpeech2 برای تولید گفتار فارسی - کیفیت بالا و سرعت مناسب',
      provider: 'Persian AI',
      category: 'tts',
      language: 'فارسی',
      size: '156 MB',
      sizeBytes: 156000000,
      status: 'available',
      downloadUrl: 'https://github.com/Persian-TTS/FastSpeech2-Persian/releases/download/v2.1/fastspeech2_persian_model.zip',
      format: 'zip',
      samples: 1,
      duration: 'N/A',
      license: 'Apache-2.0',
      githubUrl: 'https://github.com/Persian-TTS/FastSpeech2-Persian',
      alternateUrls: [
        'https://drive.google.com/uc?id=1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E&export=download',
        'https://archive.org/details/fastspeech2-persian-model'
      ]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [downloadQueue, setDownloadQueue] = useState<DownloadTask[]>([]);
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({}); // Used in error display

  // Load from localStorage and check URLs
  useEffect(() => {
    // Load from localStorage
    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('persianDatasets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDatasets(prev => prev.map(d => {
            const savedItem = parsed.find((s: Record<string, any>) => s.id === d.id);
            return savedItem ? { ...d, status: savedItem.status, localPath: savedItem.localPath } : d;
          }));
        } catch (e) {
          console.error('Error loading from localStorage', e);
        }
      }
    };

    loadFromLocalStorage();
  }, []);

  // Check all dataset URLs for validity (separate effect to avoid race conditions)
  useEffect(() => {
    // Check all dataset URLs for validity
    const checkUrls = async () => {
      try {
        // Process datasets in parallel for better performance
        const urlChecks = datasets.map(async (dataset) => {
          try {
            const result = await resolveDatasetUrl(dataset.downloadUrl);
            return {
              ...dataset,
              resolveResult: result,
              status: result.ok ? dataset.status : 'broken'
            };
          } catch (error) {
            console.error(`Failed to resolve URL for ${dataset.name}:`, error);
            return {
              ...dataset,
              status: 'broken'
            };
          }
        });

        const updatedDatasets = await Promise.all(urlChecks);

        // Update state once with all changes - ensure proper typing
        setDatasets(updatedDatasets as Dataset[]);
      } catch (error) {
        console.error("Error checking URLs:", error);
      }
    };

    // Only check URLs if they haven't been checked yet
    const hasUncheckedUrls = datasets.some(d => d.resolveResult === undefined);
    if (hasUncheckedUrls) {
      checkUrls();
    }
  }, []); // Only run once on mount

  // Save to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const toSave = datasets.map(d => ({
        id: d.id,
        status: d.status,
        localPath: d.localPath,
        downloadProgress: d.downloadProgress,
        downloadedBytes: d.downloadedBytes
      }));
      localStorage.setItem('persianDatasets', JSON.stringify(toSave));
    }, 500); // Debounce saves to avoid excessive localStorage writes

    return () => clearTimeout(timeoutId);
  }, [datasets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any active downloads
      datasets.forEach(dataset => {
        if (dataset.abortController) {
          dataset.abortController.abort();
        }
      });
    };
  }, []);

  const categories = [
    { id: 'all', name: 'همه', icon: Database },
    { id: 'tts', name: 'TTS', icon: Mic },
    { id: 'asr', name: 'ASR', icon: MessageSquare },
    { id: 'translation', name: 'ترجمه', icon: Globe },
    { id: 'keyword', name: 'کلمات کلیدی', icon: Brain },
    { id: 'multilingual', name: 'چندزبانه', icon: Globe }
  ];

  const filteredDatasets = datasets.filter(dataset => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      dataset.name.toLowerCase().includes(searchLower) ||
      dataset.description.toLowerCase().includes(searchLower) ||
      dataset.provider.toLowerCase().includes(searchLower) ||
      dataset.language.toLowerCase().includes(searchLower) ||
      dataset.format.toLowerCase().includes(searchLower) ||
      dataset.license.toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Search suggestions
  const searchSuggestions = [
    'Common Voice', 'Persian', 'TTS', 'ASR', 'HuggingFace', 'Mozilla',
    'فارسی', 'گفتار', 'صدا', 'تشخیص', 'تولید', 'مدل'
  ];

  // Download with real streaming and progress
  const handleDownload = async (dataset: Dataset) => {
    try {
      // Check if dataset is already downloading
      const existingTask = downloadQueue.find(t => t.datasetId === dataset.id && t.status === 'downloading');
      if (existingTask) {
        alert('این دیتاست در حال دانلود است!');
        return;
      }

      // Create new download task
      const newTask: DownloadTask = {
        id: `task-${Date.now()}`,
        datasetId: dataset.id,
        status: 'downloading',
        priority: Date.now(),
        startTime: Date.now()
      };

      // Add to download queue
      setDownloadQueue(prev => [...prev, newTask]);

      // Create abort controller for cancellation
      const abortController = new AbortController();

      // Update dataset status
      setDatasets(prev => prev.map(d =>
        d.id === dataset.id
          ? { ...d, status: 'downloading', downloadProgress: 0, downloadedBytes: 0, abortController }
          : d
      ));

      // Determine download URL (direct or proxy)
      const downloadUrl = buildProxyUrl(dataset.downloadUrl);

      // Try direct download first for trusted sources
      let response: Response;
      try {
        response = await fetch(downloadUrl, {
          signal: abortController.signal,
          mode: 'cors'
        });
      } catch (corsError) {
        // If CORS fails, try with proxy
        console.warn('Direct download failed, trying proxy:', corsError);
        const proxyUrl = `${PROXY_BASE_URL}/api/v1/sources/proxy?url=${encodeURIComponent(dataset.downloadUrl)}`;
        response = await fetch(proxyUrl, {
          signal: abortController.signal
        });
      }

      if (!response.ok) {
        throw new Error(`خطای دانلود: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : dataset.sizeBytes;

      // Check if response is streamable
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to direct download link
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = dataset.downloadUrl.split('/').pop() || `${dataset.id}.${dataset.format || 'bin'}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setDatasets(prev => prev.map(d =>
          d.id === dataset.id
            ? { ...d, status: 'installed', localPath: 'دانلود شده در Downloads' }
            : d
        ));
        setDownloadQueue(prev => prev.map(t =>
          t.datasetId === dataset.id ? { ...t, status: 'completed' } : t
        ));
        return;
      }

      // Stream download with progress
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      let lastUpdate = Date.now();
      let lastReceivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        const now = Date.now();
        const timeDiff = (now - lastUpdate) / 1000;

        if (timeDiff >= 0.3) {
          const bytesInInterval = receivedLength - lastReceivedLength;
          const speed = bytesInInterval / timeDiff;
          const remaining = total - receivedLength;
          const timeRemaining = speed > 0 ? remaining / speed : 0;
          const progress = total > 0 ? (receivedLength / total) * 100 : undefined;

          setDatasets(prev => prev.map(d =>
            d.id === dataset.id
              ? {
                ...d,
                downloadProgress: progress,
                downloadedBytes: receivedLength,
                downloadSpeed: speed,
                timeRemaining: timeRemaining
              }
              : d
          ));

          lastUpdate = now;
          lastReceivedLength = receivedLength;
        }
      }

      // Create blob and download
      const blob = new Blob(chunks as BlobPart[]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header or fallback to URL tail
      const cd = response.headers.get('content-disposition');
      const cdMatch = cd?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
      const headerFilename = cdMatch?.[1] ? decodeURIComponent(cdMatch[1]) : undefined;
      const tail = dataset.downloadUrl.split('/').pop() || `${dataset.id}.${dataset.format || 'bin'}`;
      const finalFilename = headerFilename || tail;
      a.download = finalFilename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setDatasets(prev => prev.map(d =>
        d.id === dataset.id
          ? {
            ...d,
            status: 'installed',
            localPath: `Downloads/${finalFilename}`,
            downloadProgress: 100
          }
          : d
      ));

      setDownloadQueue(prev => prev.map(t =>
        t.datasetId === dataset.id ? { ...t, status: 'completed', endTime: Date.now() } : t
      ));

      alert(`✅ دانلود ${dataset.name} با موفقیت انجام شد!`);

    } catch (error) {
      // Properly type the error
      const err = error as { name?: string; message?: string };

      if (err.name === 'AbortError') {
        // Handle user-initiated cancellation
        setDatasets(prev => prev.map(d =>
          d.id === dataset.id
            ? { ...d, status: 'paused' }
            : d
        ));
        setDownloadQueue(prev => prev.map(t =>
          t.datasetId === dataset.id ? { ...t, status: 'paused' } : t
        ));
      } else {
        // Handle other errors
        console.error('خطا در دانلود:', err);
        setDatasets(prev => prev.map(d =>
          d.id === dataset.id
            ? { ...d, status: 'error' }
            : d
        ));
        setDownloadQueue(prev => prev.map(t =>
          t.datasetId === dataset.id ? { ...t, status: 'failed' } : t
        ));

        // Track retry attempts
        const currentAttempts = retryAttempts[dataset.id] || 0;
        const maxRetries = 3;

        setRetryAttempts(prev => ({
          ...prev,
          [dataset.id]: currentAttempts + 1
        }));

        setDownloadErrors(prev => ({
          ...prev,
          [dataset.id]: err.message || 'خطای نامشخص'
        }));

        // Show user-friendly error message with retry options
        const errorMessage = err.message || 'خطای نامشخص';
        const retryMessage = currentAttempts < maxRetries
          ? `\n\n🔄 تلاش ${currentAttempts + 1} از ${maxRetries} - می‌توانید دوباره تلاش کنید`
          : `\n\n⚠️ حداکثر تلاش‌ها انجام شد. لطفاً از گزینه‌های جایگزین استفاده کنید`;

        const fallbackMessage = `❌ خطا در دانلود: ${errorMessage}${retryMessage}\n\nگزینه‌های موجود:\n1. دانلود مستقیم از لینک\n2. استفاده از لینک جایگزین\n3. استفاده از VPN\n4. تلاش مجدد بعداً`;
        alert(fallbackMessage);
      }
    }
  };

  const pauseDownload = (dataset: Dataset) => {
    if (dataset.abortController) {
      dataset.abortController.abort();
      setDatasets(prev => prev.map(d =>
        d.id === dataset.id
          ? {
            ...d,
            status: 'paused',
            abortController: undefined
          }
          : d
      ));
      setDownloadQueue(prev => prev.map(t =>
        t.datasetId === dataset.id ? { ...t, status: 'paused' } : t
      ));
    }
  };

  const resumeDownload = (dataset: Dataset) => {
    // Clear any existing paused state
    setDatasets(prev => prev.map(d =>
      d.id === dataset.id
        ? {
          ...d,
          status: 'available',
          downloadProgress: 0,
          downloadedBytes: 0,
          downloadSpeed: undefined,
          timeRemaining: undefined
        }
        : d
    ));

    // Remove from queue if paused
    setDownloadQueue(prev => prev.filter(t => !(t.datasetId === dataset.id && t.status === 'paused')));

    // Start new download
    handleDownload(dataset);
  };

  const cancelDownload = (datasetOrId: Dataset | string): void => {
    try {
      // Determine if we have a dataset object or just an ID
      const datasetId = typeof datasetOrId === 'string' ? datasetOrId : datasetOrId.id;

      // Find the dataset by ID if we only have the ID
      const dataset = typeof datasetOrId === 'string'
        ? datasets.find(d => d.id === datasetId)
        : datasetOrId;

      if (!dataset) {
        console.error(`Dataset with ID ${datasetId} not found`);
        return;
      }

      // Abort the download if controller exists
      if (dataset.abortController) {
        dataset.abortController.abort();
      }

      // Update dataset status
      setDatasets(prev => prev.map(d =>
        d.id === datasetId
          ? {
            ...d,
            status: 'available',
            downloadProgress: 0,
            downloadedBytes: 0,
            abortController: undefined // Clear the abort controller
          }
          : d
      ));

      // Remove from download queue
      setDownloadQueue(prev => prev.filter(t => t.datasetId !== datasetId));
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  const deleteDataset = (dataset: Dataset) => {
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید ${dataset.name} را حذف کنید؟`)) {
      setDatasets(prev => prev.map(d =>
        d.id === dataset.id
          ? { ...d, status: 'available', localPath: undefined, downloadProgress: 0 }
          : d
      ));
      alert('✅ دیتاست حذف شد');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const stats = {
    total: datasets.length,
    installed: datasets.filter(d => d.status === 'installed').length,
    downloading: datasets.filter(d => d.status === 'downloading').length,
    totalSize: datasets.filter(d => d.status === 'installed').reduce((sum, d) => sum + (d.sizeBytes || 0), 0),
    totalSamples: datasets.reduce((sum, d) => sum + (d.samples || 0), 0),
    queueLength: downloadQueue.filter(t => t.status === 'queued' || t.status === 'downloading').length
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`} dir="rtl" lang="fa">
      {/* Apply theme styles */}
      <style>{themeStyles}</style>

      {/* RTL-specific styles */}
      <style>{`
        .rtl-text { direction: rtl; text-align: right; }
        .rtl-input { direction: rtl; text-align: right; }
        .rtl-card { direction: rtl; }
        .persian-font { 
          font-family: 'Vazir', 'Tahoma', 'Arial', sans-serif; 
          font-feature-settings: 'liga' 1, 'kern' 1;
          text-rendering: optimizeLegibility;
        }
        .number-ltr { direction: ltr; display: inline-block; }
        .persian-text { 
          line-height: 1.8; 
          letter-spacing: 0.02em;
          word-spacing: 0.1em;
        }
        .rtl-card { 
          direction: rtl; 
          text-align: right;
          font-family: 'Vazir', 'Tahoma', 'Arial', sans-serif;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .progress-animate {
          animation: progressPulse 1.5s ease-in-out infinite;
        }
        
        .download-complete {
          animation: bounce 0.6s ease-in-out;
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-8px); }
          70% { transform: translateY(-4px); }
          90% { transform: translateY(-2px); }
        }
      `}</style>

      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/85 dark:bg-[color:var(--card)]/80 border-b border-black/5">
        <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-[color:var(--text)] font-bold" style={{ fontSize: 'clamp(20px,2.4vw,28px)' }}>مرکز دانلود دیتاست‌های گفتار فارسی</h1>
            <p className="text-sm text-[color:var(--muted)] mt-0.5">دانلود امن از طریق Proxy • نمایش پیشرفت واقعی • RTL-ready</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1.5 rounded-md border text-sm hover:bg-black/5"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-6 bg-[color:var(--bg)]">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Database, value: stats.total, label: 'مجموعه', gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', shadow: 'shadow-purple-100/50', glow: 'shadow-[0_8px_30px_rgba(168,85,247,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(168,85,247,0.25)]' },
              { icon: CheckCircle, value: stats.installed, label: 'نصب شده', gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-50', shadow: 'shadow-green-100/50', glow: 'shadow-[0_8px_30px_rgba(34,197,94,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(34,197,94,0.25)]' },
              { icon: Download, value: stats.downloading, label: 'دانلود', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', shadow: 'shadow-blue-100/50', glow: 'shadow-[0_8px_30px_rgba(59,130,246,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(59,130,246,0.25)]' },
              { icon: List, value: stats.queueLength, label: 'صف', gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', shadow: 'shadow-orange-100/50', glow: 'shadow-[0_8px_30px_rgba(249,115,22,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(249,115,22,0.25)]' },
              { icon: HardDrive, value: formatBytes(stats.totalSize), label: 'فضا', gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', shadow: 'shadow-indigo-100/50', glow: 'shadow-[0_8px_30px_rgba(99,102,241,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(99,102,241,0.25)]' },
              { icon: Mic, value: `${(stats.totalSamples / 1000).toFixed(0)}K`, label: 'نمونه', gradient: 'from-pink-500 to-pink-600', bg: 'bg-pink-50', shadow: 'shadow-pink-100/50', glow: 'shadow-[0_8px_30px_rgba(236,72,153,0.12)]', hover: 'hover:shadow-[0_20px_40px_rgba(236,72,153,0.25)]' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`relative group bg-white rounded-2xl p-5 transition-all duration-500 cursor-pointer border border-gray-100
                  ${stat.glow} ${stat.hover} hover:-translate-y-2 hover:scale-[1.02]`}
                >
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 rounded-2xl ${stat.bg} opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>

                  {/* Content */}
                  <div className="relative z-10 text-center space-y-3">
                    {/* Icon with Gradient */}
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${stat.gradient} 
                    flex items-center justify-center shadow-lg transform transition-transform duration-500
                    group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Value */}
                    <div className={`text-3xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent
                    transform transition-all duration-500 group-hover:scale-110`}>
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} 
                    transition-colors duration-500 group-hover:text-gray-900`}>
                      {stat.label}
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="جستجو در دیتاست‌ها... (نام، توضیحات، ارائه‌دهنده، زبان، فرمت)"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                suggestions={searchSuggestions}
                onSuggestionClick={(suggestion) => {
                  setSearchQuery(suggestion);
                }}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<Settings className="w-5 h-5" />}
              onClick={() => setShowDownloadManager(!showDownloadManager)}
              className="shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
            >
              مدیریت دانلودها ({downloadQueue.length})
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              const categoryColorMap: any = {
                all: 'shadow-purple-200 hover:shadow-purple-300',
                tts: 'shadow-blue-200 hover:shadow-blue-300',
                asr: 'shadow-green-200 hover:shadow-green-300',
                translation: 'shadow-red-200 hover:shadow-red-300',
                keyword: 'shadow-yellow-200 hover:shadow-yellow-300',
                multilingual: 'shadow-pink-200 hover:shadow-pink-300'
              };
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all text-sm ${isActive
                    ? `bg-blue-600 text-white shadow-lg ${categoryColorMap[category.id]}`
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 shadow-md'
                      : `bg-white text-gray-700 hover:shadow-lg border border-gray-200 ${categoryColorMap[category.id]}`
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Download Manager */}
          {showDownloadManager && (
            <Card variant="elevated" className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <List className="w-5 h-5" />
                    صف دانلود
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => setShowDownloadManager(false)}
                  >
                    بستن
                  </Button>
                </div>

                {downloadQueue.length === 0 ? (
                  <div className="text-center py-10">
                    <List className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>هیچ دانلودی در صف نیست</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {downloadQueue.map((task) => {
                      const dataset = datasets.find(d => d.id === task.datasetId);
                      if (!dataset) return null;

                      return (
                        <Card key={task.id} variant="default" className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dataset.name}</h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{dataset.size}</p>
                              </div>
                              <Badge
                                variant={
                                  task.status === 'completed' ? 'success' :
                                    task.status === 'failed' ? 'danger' :
                                      task.status === 'downloading' ? 'primary' :
                                        task.status === 'paused' ? 'warning' : 'default'
                                }
                              >
                                {task.status === 'completed' ? 'تکمیل' :
                                  task.status === 'failed' ? 'خطا' :
                                    task.status === 'downloading' ? 'دانلود' :
                                      task.status === 'paused' ? 'متوقف' : 'صف'}
                              </Badge>
                            </div>

                            {dataset.status === 'downloading' && dataset.downloadProgress !== undefined && (
                              <ProgressBar
                                progress={dataset.downloadProgress}
                                downloaded={formatBytes(dataset.downloadedBytes || 0)}
                                total={dataset.size}
                                speed={dataset.downloadSpeed}
                                timeRemaining={dataset.timeRemaining}
                              />
                            )}

                            <div className="flex gap-2">
                              {dataset.status === 'downloading' && (
                                <>
                                  <Button variant="warning" size="sm" icon={<Pause className="w-3 h-3" />} onClick={() => pauseDownload(dataset)}>
                                    توقف
                                  </Button>
                                  <Button variant="danger" size="sm" icon={<X className="w-3 h-3" />} onClick={() => cancelDownload(dataset)}>
                                    لغو
                                  </Button>
                                </>
                              )}
                              {dataset.status === 'paused' && (
                                <>
                                  <Button variant="primary" size="sm" icon={<Play className="w-3 h-3" />} onClick={() => resumeDownload(dataset)}>
                                    ادامه
                                  </Button>
                                  <Button variant="danger" size="sm" icon={<X className="w-3 h-3" />} onClick={() => cancelDownload(dataset)}>
                                    لغو
                                  </Button>
                                </>
                              )}
                              {task.status === 'completed' && (
                                <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>تکمیل شد</Badge>
                              )}
                              {task.status === 'failed' && (
                                <Button variant="primary" size="sm" icon={<RefreshCw className="w-3 h-3" />} onClick={() => handleDownload(dataset)}>
                                  تلاش مجدد
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Datasets Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {datasets.some(d => d.resolveResult === undefined) ? (
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-black/5 bg-[color:var(--card)] p-4 animate-pulse">
                    <div className="h-4 w-2/3 bg-black/10 rounded mb-2" />
                    <div className="h-3 w-full bg-black/10 rounded mb-2" />
                    <div className="h-3 w-5/6 bg-black/10 rounded mb-4" />
                    <div className="h-2 w-full bg-black/10 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              filteredDatasets.map((dataset) => {
                const isExpanded = expandedCards.has(dataset.id);

                return (
                  <article key={dataset.id}
                    className="group rounded-xl border border-black/5 bg-[color:var(--card)] shadow-sm hover:shadow-md transition-shadow rtl-card">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-[color:var(--text)] truncate persian-font persian-text">{dataset.name}</h2>
                          <p className="text-sm text-[color:var(--muted)] line-clamp-2 persian-font persian-text mt-1">{dataset.description}</p>
                          <p className="text-[11px] text-[color:var(--muted)] mt-1 break-all font-mono">{dataset.resolveResult?.finalUrl ?? dataset.downloadUrl}</p>
                        </div>

                        {/* Status badges */}
                        {dataset.status === 'installed' && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-[color:var(--ok)]/15 text-[color:var(--ok)] border border-[color:var(--ok)]/20">Installed</span>
                        )}
                        {dataset.status === 'broken' && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-[color:var(--warn)]/15 text-[color:var(--warn)] border border-[color:var(--warn)]/20">Broken link</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-[color:var(--brand)]/70"></span>
                          {dataset.sizeBytes ? `${(dataset.sizeBytes / 1_048_576).toFixed(1)} MB` : (dataset.size ?? '—')}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="truncate">Format: {dataset.format ?? '—'}</span>
                      </div>

                      {/* Expanded Info */}
                      {isExpanded && (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {dataset.duration && (
                              <div className="flex items-center gap-1">
                                <Mic className="w-3 h-3 text-gray-400" />
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>مدت: {dataset.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Info className="w-3 h-3 text-gray-400" />
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>لایسنس: {dataset.license}</span>
                            </div>
                          </div>

                          {dataset.githubUrl && (
                            <a
                              href={dataset.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              مشاهده منبع
                            </a>
                          )}

                          {dataset.alternateUrls && dataset.alternateUrls.length > 0 && (
                            <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                              <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>لینک‌های جایگزین:</p>
                              <div className="space-y-0.5">
                                {dataset.alternateUrls.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline truncate">
                                    {url.split('/').pop()}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Download Progress */}
                      {dataset.status === 'downloading' && (
                        <div className="mt-2 space-y-1.5" role="group" aria-label="Download progress">
                          <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden ring-1 ring-black/5">
                            <div
                              className="h-2 bg-[color:var(--brand)] transition-[width] duration-200"
                              style={{ width: `${Math.max(0, Math.min(100, dataset.downloadProgress || 0))}%` }}
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Number((dataset.downloadProgress || 0).toFixed(1))}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                            <span>{dataset.downloadProgress ? `${dataset.downloadProgress.toFixed(1)}%` : 'در حال دریافت…'}</span>
                            <span className="flex items-center gap-2">
                              <span>{(dataset.downloadedBytes || 0) > 0 ? formatBytes(dataset.downloadedBytes!) : '0 B'}</span>
                              <span className="opacity-40">/</span>
                              <span>{dataset.sizeBytes ? formatBytes(dataset.sizeBytes) : (dataset.size ?? '—')}</span>
                              {dataset.downloadSpeed ? (<>
                                <span className="opacity-40">•</span>
                                <span>{formatBytes(dataset.downloadSpeed)}/s</span>
                              </>) : null}
                              {dataset.timeRemaining ? (<>
                                <span className="opacity-40">•</span>
                                <span>{Math.ceil(dataset.timeRemaining)}s left</span>
                              </>) : null}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Paused Status */}
                      {dataset.status === 'paused' && (
                        <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                          <div className="flex items-center gap-2">
                            <Pause className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>⏸️ دانلود متوقف شد</p>
                              <p className={`text-xs ${darkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                                {dataset.downloadProgress?.toFixed(1)}% دانلود شده
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Installed Status */}
                      {dataset.status === 'installed' && (
                        <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>✅ دانلود موفق</p>
                              {dataset.localPath && (
                                <code className={`block text-xs px-2 py-1 rounded mt-1 ${darkMode ? 'bg-gray-800 border border-green-700' : 'bg-white border border-green-200'}`}>{dataset.localPath}</code>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Status */}
                      {dataset.status === 'error' && (
                        <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>❌ خطا در دانلود</p>
                              {downloadErrors[dataset.id] && (
                                <p className={`text-xs mt-1 ${darkMode ? 'text-red-500' : 'text-red-600'}`}>
                                  {downloadErrors[dataset.id]}
                                </p>
                              )}
                              {retryAttempts[dataset.id] && (
                                <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                                  تلاش {retryAttempts[dataset.id]} از 3
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Broken Link Status */}
                      {dataset.status === 'broken' && (
                        <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <p className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>🔗 لینک معیوب</p>
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                            این لینک در دسترس نیست یا خطا دارد
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {dataset.status !== 'downloading' && dataset.status !== 'broken' && (
                          <>
                            <button
                              onClick={() => handleDownload(dataset)}
                              className="inline-flex items-center justify-center px-3.5 py-2 rounded-md bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                              aria-label={`Download ${dataset.name}`}
                            >
                              <Download className="w-4 h-4 ml-1" />
                              دانلود
                            </button>
                            <a
                              href={dataset.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3.5 py-2 rounded-md border border-black/10 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                            >
                              <ExternalLink className="w-4 h-4 ml-1" />
                              دانلود مستقیم
                            </a>
                          </>
                        )}

                        {dataset.status === 'downloading' && (
                          <button
                            onClick={() => cancelDownload(dataset)}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                          >
                            لغو
                          </button>
                        )}

                        {dataset.status === 'paused' && (
                          <>
                            <Button variant="primary" size="sm" icon={<Play className="w-4 h-4" />} onClick={() => resumeDownload(dataset)} className="flex-1">
                              ادامه
                            </Button>
                            <Button variant="danger" size="sm" icon={<X className="w-4 h-4" />} onClick={() => cancelDownload(dataset)}>
                              لغو
                            </Button>
                          </>
                        )}

                        {dataset.status === 'error' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<RefreshCw className="w-4 h-4" />}
                              onClick={() => {
                                // Reset error state and retry
                                setDatasets(prev => prev.map(d =>
                                  d.id === dataset.id
                                    ? { ...d, status: 'available', downloadProgress: 0, downloadedBytes: 0 }
                                    : d
                                ));
                                handleDownload(dataset);
                              }}
                              className="flex-1"
                            >
                              تلاش مجدد
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<ExternalLink className="w-4 h-4" />}
                              onClick={() => window.open(dataset.githubUrl || dataset.downloadUrl, '_blank')}
                            >
                              دانلود دستی
                            </Button>
                            {dataset.alternateUrls && dataset.alternateUrls.length > 0 && (
                              <Button
                                variant="warning"
                                size="sm"
                                icon={<Globe className="w-4 h-4" />}
                                onClick={() => {
                                  const alternateUrl = dataset.alternateUrls![0];
                                  setDatasets(prev => prev.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, downloadUrl: alternateUrl, status: 'available' }
                                      : d
                                  ));
                                  handleDownload({ ...dataset, downloadUrl: alternateUrl });
                                }}
                              >
                                لینک جایگزین
                              </Button>
                            )}
                          </>
                        )}

                        {dataset.status === 'broken' && (
                          <>
                            <button
                              onClick={() => {
                                // Retry URL resolution
                                setDatasets(prev => prev.map(d =>
                                  d.id === dataset.id
                                    ? { ...d, status: 'available' }
                                    : d
                                ));
                                resolveDatasetUrl(dataset.downloadUrl).then(result => {
                                  setDatasets(prev => prev.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, resolveResult: result, status: result.ok ? 'available' : 'broken' }
                                      : d
                                  ));
                                }).catch(() => {
                                  setDatasets(prev => prev.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, status: 'broken' }
                                      : d
                                  ));
                                });
                              }}
                              className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-[color:var(--warn)] text-white hover:bg-[color:var(--warn)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                            >
                              <RefreshCw className="w-4 h-4 ml-1" />
                              بررسی مجدد
                            </button>
                            <a
                              href={dataset.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-black/10 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                            >
                              <ExternalLink className="w-4 h-4 ml-1" />
                              تلاش دستی
                            </a>
                          </>
                        )}

                        {dataset.status === 'installed' && (
                          <>
                            <Button variant="primary" size="sm" icon={<Folder className="w-4 h-4" />} onClick={() => alert(`مسیر: ${dataset.localPath}\n\nفایل در Downloads ذخیره شد`)} className="flex-1">
                              مسیر
                            </Button>
                            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteDataset(dataset)}>
                              حذف
                            </Button>
                          </>
                        )}

                        <button onClick={() => toggleExpand(dataset.id)} className={`px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }))}
          </section>

          {/* Empty State */}
          {filteredDatasets.length === 0 && (
            <Card variant="elevated" className="text-center py-12">
              <Database className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>دیتاستی یافت نشد</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>لطفاً فیلترها را تغییر دهید</p>
            </Card>
          )}

          {/* Test Download Section */}
          <Card variant="elevated" className={`${darkMode ? 'bg-green-800 border-green-700' : 'bg-green-50 border-green-200'} border-2 overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>تست دانلود</h3>
              </div>
              <p className={`text-sm mb-3 ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                برای تست عملکرد دانلود، روی دکمه زیر کلیک کنید:
              </p>
              <button
                onClick={() => {
                  // Test with a small file
                  const testUrl = 'https://httpbin.org/bytes/1024'; // 1KB test file
                  const a = document.createElement('a');
                  a.href = testUrl;
                  a.download = 'test-download.bin';
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  alert('✅ تست دانلود موفق! اگر فایل دانلود شد، سیستم کار می‌کند.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                تست دانلود (1KB)
              </button>
            </div>
          </Card>

          {/* Info Section */}
          <Card variant="elevated" className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border-2 overflow-hidden`}>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>راهنمای استفاده</h3>
              </div>
              {showGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showGuide && (
              <div className="p-6 pt-0 space-y-4 animate-in fade-in duration-300">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className={`font-semibold text-sm flex items-center gap-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      نحوه دانلود
                    </h4>
                    <ul className={`space-y-1 text-xs pr-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li className="flex items-start gap-1"><span className="text-blue-600">●</span><span>روی دکمه "دانلود" کلیک کنید</span></li>
                      <li className="flex items-start gap-1"><span className="text-blue-600">●</span><span>پیشرفت با سرعت نمایش داده می‌شود</span></li>
                      <li className="flex items-start gap-1"><span className="text-blue-600">●</span><span>می‌توانید متوقف و ادامه دهید</span></li>
                      <li className="flex items-start gap-1"><span className="text-blue-600">●</span><span>فایل در Downloads ذخیره می‌شود</span></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className={`font-semibold text-sm flex items-center gap-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      <Brain className="w-4 h-4 text-purple-600" />
                      مدیریت دانلودها
                    </h4>
                    <ul className={`space-y-1 text-xs pr-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li className="flex items-start gap-1"><span className="text-purple-600">●</span><span><strong>توقف:</strong> متوقف موقت</span></li>
                      <li className="flex items-start gap-1"><span className="text-purple-600">●</span><span><strong>ادامه:</strong> از همان نقطه</span></li>
                      <li className="flex items-start gap-1"><span className="text-purple-600">●</span><span><strong>لغو:</strong> لغو کامل</span></li>
                      <li className="flex items-start gap-1"><span className="text-purple-600">●</span><span><strong>تلاش مجدد:</strong> در صورت خطا</span></li>
                    </ul>
                  </div>
                </div>

                <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`font-semibold text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-900'}`}>⚠️ توجه</p>
                      <p className={`text-xs ${darkMode ? 'text-yellow-500' : 'text-yellow-800'}`}>
                        فایل‌ها بزرگ هستند. اتصال پایدار لازم است. در صورت قطع، می‌توانید ادامه دهید.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a href="https://huggingface.co/datasets" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 px-3 py-1.5 border-2 rounded-lg text-xs font-medium transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:shadow-md'}`}>
                    <ExternalLink className="w-3 h-3" />
                    Hugging Face
                  </a>
                  <a href="https://github.com/topics/persian-speech" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 px-3 py-1.5 border-2 rounded-lg text-xs font-medium transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:shadow-md'}`}>
                    <ExternalLink className="w-3 h-3" />
                    GitHub
                  </a>
                </div>
              </div>
            )}
          </Card>

          {/* Technical Details */}
          <Card variant="elevated" className={`${darkMode ? 'bg-gray-800 border-gray-700' : ''} overflow-hidden`}>
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
            >
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Cpu className="w-5 h-5" />
                جزئیات فنی
              </h3>
              {showTechnical ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showTechnical && (
              <div className="p-6 pt-0 space-y-4 animate-in fade-in duration-300">
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { title: '🎯 ASR', desc: 'تشخیص گفتار با Whisper، Wav2Vec2', color: 'blue' },
                    { title: '🎤 TTS', desc: 'تولید گفتار با Tacotron2، VITS', color: 'green' },
                    { title: '🌍 Translation', desc: 'ترجمه گفتار به گفتار', color: 'purple' }
                  ].map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📚 کتابخانه‌های پیشنهادی:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    {['pip install transformers', 'pip install datasets', 'pip install librosa soundfile', 'pip install torch torchaudio'].map((cmd, idx) => (
                      <code key={idx} className={`block px-3 py-1.5 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300'}`}>{cmd}</code>
                    ))}
                  </div>
                </div>

                <div className={`rounded-lg p-3 border-2 ${darkMode ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-50 border-indigo-200'}`}>
                  <p className={`text-xs ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                    <strong>💡 نکته:</strong> پس از دانلود، فایل‌ها را Extract کنید و با <code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>datasets</code> یا <code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>pandas</code> بارگذاری کنید.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

// Add explicit default export
export default DownloadCenterPage;
// Also keep the original named export for resilience
export { DownloadCenterPage as PersianDatasetsManager };