import React, { useState } from 'react';
import {
    Cpu,
    CheckCircle,
    Clock,
    TrendingUp,
    Calendar,
    Hash,
    Target,
    Award,
    Search,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { useDetectedModels, DetectedModel } from '@/hooks/useDetectedModels';

interface TrainedModelSelectorProps {
    selectedModel: string;
    onModelSelect: (model: DetectedModel) => void;
    className?: string;
}

export function TrainedModelSelector({
    selectedModel,
    onModelSelect,
    className
}: TrainedModelSelectorProps) {
    const { models, loading, error } = useDetectedModels();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [showTrainedOnly, setShowTrainedOnly] = useState(false);

    // Filter models
    const trainedModels = models.filter(model =>
        model.type === 'model' &&
        (!showTrainedOnly || model.isTrainedModel)
    );

    const domains = [...new Set(trainedModels.map(m => m.domain).filter(Boolean))];

    const filteredModels = trainedModels.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDomain = !selectedDomain || model.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'نامشخص';
        try {
            return new Date(dateString).toLocaleDateString('fa-IR');
        } catch {
            return 'نامشخص';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`${className} border-red-200 dark:border-red-800`}>
                <CardContent className="p-6">
                    <div className="text-center text-red-600 dark:text-red-400">
                        <p className="font-medium">خطا در بارگذاری مدل‌ها</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                        انتخاب مدل پایه
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                        {filteredModels.length} مدل
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search and Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--c-muted)]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجو در مدل‌ها..."
                            className="pl-10"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={showTrainedOnly ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setShowTrainedOnly(!showTrainedOnly)}
                            className="text-xs"
                        >
                            <Filter className="w-3 h-3 ml-1" />
                            فقط مدل‌های آموزش‌دیده
                        </Button>

                        {domains.length > 0 && (
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className="px-3 py-1 text-xs rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)]"
                            >
                                <option value="">همه دامنه‌ها</option>
                                {domains.map(domain => (
                                    <option key={domain} value={domain}>
                                        {domain}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Models List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                        <div className="text-center py-8 text-[color:var(--c-muted)]">
                            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">هیچ مدلی پیدا نشد</p>
                        </div>
                    ) : (
                        filteredModels.map((model) => {
                            const isSelected = selectedModel === model.id;

                            return (
                                <div
                                    key={model.id}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                                            ? 'border-[color:var(--c-primary)] bg-[color:var(--c-primary)]/5'
                                            : 'border-[color:var(--c-border)] hover:border-[color:var(--c-primary)]/50 hover:bg-[color:var(--c-border)]/10'
                                        }`}
                                    onClick={() => onModelSelect(model)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${model.isTrainedModel
                                                ? 'bg-green-500/10'
                                                : 'bg-blue-500/10'
                                            }`}>
                                            {model.isTrainedModel ? (
                                                <Award className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Cpu className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-[color:var(--c-text)] truncate">
                                                    {model.name}
                                                </h4>
                                                {model.isTrainedModel && (
                                                    <Badge variant="success" className="text-xs">
                                                        آموزش‌دیده
                                                    </Badge>
                                                )}
                                                {model.domain && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {model.domain}
                                                    </Badge>
                                                )}
                                            </div>

                                            {model.description && (
                                                <p className="text-xs text-[color:var(--c-muted)] mb-2 line-clamp-2">
                                                    {model.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-[color:var(--c-muted)]">
                                                <span>{formatFileSize(model.size)}</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(model.lastModified)}
                                                </span>
                                                {model.trainingInfo?.epochs && (
                                                    <span className="flex items-center gap-1">
                                                        <Hash className="w-3 h-3" />
                                                        {model.trainingInfo.epochs} epochs
                                                    </span>
                                                )}
                                            </div>

                                            {/* Training Metrics */}
                                            {model.trainingInfo?.metrics && (
                                                <div className="flex items-center gap-4 mt-2 text-xs">
                                                    {model.trainingInfo.metrics.finalLoss && (
                                                        <span className="flex items-center gap-1 text-orange-600">
                                                            <TrendingUp className="w-3 h-3" />
                                                            Loss: {model.trainingInfo.metrics.finalLoss.toFixed(4)}
                                                        </span>
                                                    )}
                                                    {model.trainingInfo.metrics.finalAccuracy && (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <Target className="w-3 h-3" />
                                                            Acc: {(model.trainingInfo.metrics.finalAccuracy * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {model.tags && model.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {model.tags.slice(0, 3).map((tag, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-xs px-1 py-0.5"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {model.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-xs px-1 py-0.5">
                                                            +{model.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center">
                                                <CheckCircle className="w-5 h-5 text-[color:var(--c-primary)]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
