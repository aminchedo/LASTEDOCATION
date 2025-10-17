import React, { useState } from 'react';
import {
    Database,
    CheckCircle,
    Search,
    Filter,
    Tag,
    Hash,
    Calendar,
    FileText,
    Globe,
    Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { useDetectedModels, DetectedModel } from '@/hooks/useDetectedModels';

interface DatasetSelectorProps {
    selectedDatasets: string[];
    onDatasetToggle: (dataset: DetectedModel) => void;
    multiSelect?: boolean;
    className?: string;
}

export function DatasetSelector({
    selectedDatasets,
    onDatasetToggle,
    multiSelect = true,
    className
}: DatasetSelectorProps) {
    const { models, loading, error } = useDetectedModels();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');

    // Filter datasets
    const datasets = models.filter(model => model.type === 'dataset');

    const allTags = [...new Set(datasets.flatMap(d => d.tags || []))];
    const allDomains = [...new Set(datasets.map(d => d.domain).filter(Boolean))];

    const filteredDatasets = datasets.filter(dataset => {
        const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !selectedTag || (dataset.tags && dataset.tags.includes(selectedTag));
        const matchesDomain = !selectedDomain || dataset.domain === selectedDomain;
        return matchesSearch && matchesTag && matchesDomain;
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

    const getDomainColor = (domain?: string): string => {
        if (!domain) return 'bg-gray-500/10 text-gray-600';

        const colors = {
            'text-classification': 'bg-blue-500/10 text-blue-600',
            'question-answering': 'bg-green-500/10 text-green-600',
            'translation': 'bg-purple-500/10 text-purple-600',
            'summarization': 'bg-orange-500/10 text-orange-600',
            'conversational': 'bg-pink-500/10 text-pink-600',
            'general': 'bg-gray-500/10 text-gray-600'
        };

        return colors[domain as keyof typeof colors] || 'bg-gray-500/10 text-gray-600';
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
                        <p className="font-medium">خطا در بارگذاری دیتاست‌ها</p>
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
                        انتخاب دیتاست
                    </h3>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {selectedDatasets.length} انتخاب شده
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {filteredDatasets.length} دیتاست
                        </Badge>
                    </div>
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
                            placeholder="جستجو در دیتاست‌ها..."
                            className="pl-10"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {allTags.length > 0 && (
                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="px-3 py-1 text-xs rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)]"
                            >
                                <option value="">همه تگ‌ها</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>
                        )}

                        {allDomains.length > 0 && (
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className="px-3 py-1 text-xs rounded-lg border border-[color:var(--c-border)] bg-[color:var(--c-bg)] text-[color:var(--c-text)]"
                            >
                                <option value="">همه دامنه‌ها</option>
                                {allDomains.map(domain => (
                                    <option key={domain} value={domain}>
                                        {domain}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selectedTag && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTag('')}
                                className="text-xs h-auto py-1"
                            >
                                <Tag className="w-3 h-3 ml-1" />
                                {selectedTag} ×
                            </Button>
                        )}
                    </div>
                </div>

                {/* Datasets List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredDatasets.length === 0 ? (
                        <div className="text-center py-8 text-[color:var(--c-muted)]">
                            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">هیچ دیتاستی پیدا نشد</p>
                        </div>
                    ) : (
                        filteredDatasets.map((dataset) => {
                            const isSelected = selectedDatasets.includes(dataset.id);

                            return (
                                <div
                                    key={dataset.id}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                                            ? 'border-[color:var(--c-primary)] bg-[color:var(--c-primary)]/5'
                                            : 'border-[color:var(--c-border)] hover:border-[color:var(--c-primary)]/50 hover:bg-[color:var(--c-border)]/10'
                                        }`}
                                    onClick={() => onDatasetToggle(dataset)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Database className="w-5 h-5 text-emerald-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-[color:var(--c-text)] truncate">
                                                    {dataset.name}
                                                </h4>
                                                {dataset.domain && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${getDomainColor(dataset.domain)}`}
                                                    >
                                                        {dataset.domain}
                                                    </Badge>
                                                )}
                                            </div>

                                            {dataset.description && (
                                                <p className="text-xs text-[color:var(--c-muted)] mb-2 line-clamp-2">
                                                    {dataset.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-[color:var(--c-muted)]">
                                                <span>{formatFileSize(dataset.size)}</span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    {dataset.files.length} فایل
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(dataset.lastModified)}
                                                </span>
                                            </div>

                                            {/* Language Support */}
                                            {dataset.language && dataset.language.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2 text-xs">
                                                    <Globe className="w-3 h-3 text-[color:var(--c-muted)]" />
                                                    <span className="text-[color:var(--c-muted)]">
                                                        {dataset.language.join(', ')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* License */}
                                            {dataset.license && (
                                                <div className="flex items-center gap-1 mt-1 text-xs">
                                                    <Shield className="w-3 h-3 text-[color:var(--c-muted)]" />
                                                    <span className="text-[color:var(--c-muted)]">
                                                        {dataset.license}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {dataset.tags && dataset.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {dataset.tags.slice(0, 4).map((tag, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-xs px-1 py-0.5"
                                                        >
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                    {dataset.tags.length > 4 && (
                                                        <Badge variant="outline" className="text-xs px-1 py-0.5">
                                                            +{dataset.tags.length - 4}
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

                {/* Selection Summary */}
                {selectedDatasets.length > 0 && (
                    <div className="p-3 bg-[color:var(--c-primary)]/5 rounded-lg border border-[color:var(--c-primary)]/20">
                        <div className="text-sm font-medium text-[color:var(--c-text)] mb-1">
                            دیتاست‌های انتخاب شده ({selectedDatasets.length}):
                        </div>
                        <div className="text-xs text-[color:var(--c-muted)]">
                            {selectedDatasets.map(id => {
                                const dataset = datasets.find(d => d.id === id);
                                return dataset?.name;
                            }).filter(Boolean).join(', ')}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
