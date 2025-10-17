import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    HardDrive,
    Database,
    Search,
    Filter,
    Download,
    Upload,
    Eye,
    Settings,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    FolderOpen,
    FileText,
    Zap,
    Tag,
    Calendar,
    HardDriveIcon,
    DatabaseIcon
} from 'lucide-react';
import { useDetectedModels } from '@/hooks/useDetectedModels';
import { useTheme } from '@/core/contexts/ThemeContext';

interface ModelItem {
    id: string;
    name: string;
    type: 'model' | 'tts' | 'dataset' | 'unknown';
    modelFormat: string;
    path: string;
    size: number;
    files: string[];
    lastModified: string;
    isTrainedModel: boolean;
    tags: string[];
    domain: string;
    trainingInfo?: {
        epochs?: number;
        steps?: number;
        learningRate?: number;
        batchSize?: number;
        trainedOn?: string[];
        trainingDate?: string;
        metrics?: {
            finalLoss?: number;
            finalAccuracy?: number;
        };
    };
}

interface DatasetItem {
    id: string;
    name: string;
    description?: string;
    size?: number;
    format?: string;
    tags?: string[];
    source?: string;
    lastModified?: string;
    samples?: number;
    language?: string;
}

const ITEMS_PER_PAGE = 12;

export default function ModelsDatasetsPage() {
    const { settings } = useTheme();
    const { models: detectedModels, loading: modelsLoading, refetch: refetchModels } = useDetectedModels();

    const [activeTab, setActiveTab] = useState<'models' | 'datasets'>('models');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedFormat, setSelectedFormat] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [datasets, setDatasets] = useState<DatasetItem[]>([]);
    const [datasetsLoading, setDatasetsLoading] = useState(false);

    // Filter models based on search and filters
    const filteredModels = detectedModels.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === 'all' || model.type === selectedType;
        const matchesFormat = selectedFormat === 'all' || model.modelFormat === selectedFormat;

        return matchesSearch && matchesType && matchesFormat;
    });

    // Filter datasets
    const filteredDatasets = datasets.filter(dataset => {
        const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dataset.description && dataset.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (dataset.tags && dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(
        activeTab === 'models' ? filteredModels.length / ITEMS_PER_PAGE : filteredDatasets.length / ITEMS_PER_PAGE
    );

    const currentItems = activeTab === 'models'
        ? filteredModels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        : filteredDatasets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Load datasets
    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        setDatasetsLoading(true);
        try {
            // Mock datasets for now - replace with actual API call
            const mockDatasets: DatasetItem[] = [
                {
                    id: '1',
                    name: 'Persian Conversations',
                    description: 'Large dataset of Persian conversational data',
                    size: 1024 * 1024 * 500, // 500MB
                    format: 'jsonl',
                    tags: ['persian', 'conversation', 'chat'],
                    source: 'local',
                    lastModified: new Date().toISOString(),
                    samples: 50000,
                    language: 'fa'
                },
                {
                    id: '2',
                    name: 'Persian Text Corpus',
                    description: 'General Persian text corpus for language modeling',
                    size: 1024 * 1024 * 200, // 200MB
                    format: 'txt',
                    tags: ['persian', 'text', 'corpus'],
                    source: 'local',
                    lastModified: new Date().toISOString(),
                    samples: 100000,
                    language: 'fa'
                }
            ];
            setDatasets(mockDatasets);
        } catch (error) {
            console.error('Error loading datasets:', error);
        } finally {
            setDatasetsLoading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('fa-IR');
    };

    const getModelTypeIcon = (type: string) => {
        switch (type) {
            case 'tts': return <Zap className="w-4 h-4" />;
            case 'dataset': return <Database className="w-4 h-4" />;
            default: return <HardDrive className="w-4 h-4" />;
        }
    };

    const getModelTypeColor = (type: string) => {
        switch (type) {
            case 'tts': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'dataset': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'model': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'models') {
            refetchModels();
        } else {
            loadDatasets();
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            مدل‌ها و مجموعه داده‌ها
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            مدیریت و مشاهده مدل‌ها و مجموعه داده‌های محلی
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            icon={<RefreshCw className="w-4 h-4" />}
                            onClick={handleRefresh}
                            disabled={activeTab === 'models' ? modelsLoading : datasetsLoading}
                        >
                            بروزرسانی
                        </Button>
                        <Button
                            variant="outline"
                            icon={<Settings className="w-4 h-4" />}
                            onClick={() => window.location.href = '/settings'}
                        >
                            تنظیمات
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Card className="overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'models'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            onClick={() => {
                                setActiveTab('models');
                                setCurrentPage(1);
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <HardDriveIcon className="w-4 h-4" />
                                مدل‌ها ({filteredModels.length})
                            </div>
                        </button>
                        <button
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'datasets'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            onClick={() => {
                                setActiveTab('datasets');
                                setCurrentPage(1);
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <DatabaseIcon className="w-4 h-4" />
                                مجموعه داده‌ها ({filteredDatasets.length})
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Search and Filters */}
                <Card className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="جستجو در مدل‌ها و مجموعه داده‌ها..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3">
                            {activeTab === 'models' && (
                                <>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => {
                                            setSelectedType(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="all">همه انواع</option>
                                        <option value="model">مدل</option>
                                        <option value="tts">TTS</option>
                                        <option value="dataset">مجموعه داده</option>
                                    </select>
                                    <select
                                        value={selectedFormat}
                                        onChange={(e) => {
                                            setSelectedFormat(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="all">همه فرمت‌ها</option>
                                        <option value="pytorch">PyTorch</option>
                                        <option value="onnx">ONNX</option>
                                        <option value="safetensors">SafeTensors</option>
                                        <option value="gguf">GGUF</option>
                                        <option value="bin">BIN</option>
                                    </select>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeTab === 'models' ? (
                        modelsLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <Card key={i} className="p-6 animate-pulse">
                                    <div className="space-y-3">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </Card>
                            ))
                        ) : currentItems.length > 0 ? (
                            currentItems.map((model) => (
                                <Card key={model.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {getModelTypeIcon(model.type)}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {model.name}
                                                    </h3>
                                                    <Badge className={`text-xs ${getModelTypeColor(model.type)}`}>
                                                        {model.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {model.isTrainedModel && (
                                                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                    آموزش دیده
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                <span>{model.modelFormat}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="w-3 h-3" />
                                                <span>{formatFileSize(model.size)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(model.lastModified)}</span>
                                            </div>
                                        </div>

                                        {/* Training Info */}
                                        {model.trainingInfo && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                                                    اطلاعات آموزش
                                                </h4>
                                                <div className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                                                    {model.trainingInfo.epochs && (
                                                        <div>دوره‌ها: {model.trainingInfo.epochs}</div>
                                                    )}
                                                    {model.trainingInfo.metrics?.finalAccuracy && (
                                                        <div>دقت: {(model.trainingInfo.metrics.finalAccuracy * 100).toFixed(1)}%</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {model.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {model.tags.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {model.tags.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{model.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<Eye className="w-3 h-3" />}
                                                className="flex-1"
                                            >
                                                مشاهده
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<FolderOpen className="w-3 h-3" />}
                                                onClick={() => {
                                                    // Open folder in file explorer
                                                    console.log('Opening folder:', model.path);
                                                }}
                                            >
                                                پوشه
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <HardDrive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    هیچ مدلی یافت نشد
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    مدل‌ها را در تنظیمات پوشه‌ها پیکربندی کنید
                                </p>
                                <Button onClick={() => window.location.href = '/settings'}>
                                    تنظیمات پوشه‌ها
                                </Button>
                            </div>
                        )
                    ) : (
                        datasetsLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <Card key={i} className="p-6 animate-pulse">
                                    <div className="space-y-3">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </Card>
                            ))
                        ) : currentItems.length > 0 ? (
                            currentItems.map((dataset) => (
                                <Card key={dataset.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {dataset.name}
                                                    </h3>
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        مجموعه داده
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {dataset.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {dataset.description}
                                            </p>
                                        )}

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            {dataset.size && (
                                                <div className="flex items-center gap-2">
                                                    <HardDrive className="w-3 h-3" />
                                                    <span>{formatFileSize(dataset.size)}</span>
                                                </div>
                                            )}
                                            {dataset.samples && (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3 h-3" />
                                                    <span>{dataset.samples.toLocaleString()} نمونه</span>
                                                </div>
                                            )}
                                            {dataset.format && (
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-3 h-3" />
                                                    <span>{dataset.format}</span>
                                                </div>
                                            )}
                                            {dataset.language && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                        {dataset.language === 'fa' ? 'فارسی' : dataset.language}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {dataset.tags && dataset.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {dataset.tags.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {dataset.tags.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{dataset.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<Eye className="w-3 h-3" />}
                                                className="flex-1"
                                            >
                                                مشاهده
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={<Download className="w-3 h-3" />}
                                            >
                                                دانلود
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    هیچ مجموعه داده‌ای یافت نشد
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    مجموعه داده‌ها را در تنظیمات پیکربندی کنید
                                </p>
                                <Button onClick={() => window.location.href = '/settings'}>
                                    تنظیمات مجموعه داده‌ها
                                </Button>
                            </div>
                        )
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                صفحه {currentPage} از {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<ChevronRight className="w-4 h-4" />}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    قبلی
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {page}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<ChevronLeft className="w-4 h-4" />}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    بعدی
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
