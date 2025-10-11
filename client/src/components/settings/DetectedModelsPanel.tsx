import React, { useState } from 'react';
import {
    HardDrive,
    Cpu,
    Mic,
    Database,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Folder,
    FileText,
    Calendar,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDetectedModels } from '@/hooks/useDetectedModels';

const typeIcons = {
    model: Cpu,
    tts: Mic,
    dataset: Database,
    unknown: HardDrive
} as const;

const typeLabels = {
    model: 'مدل',
    tts: 'صدا (TTS)',
    dataset: 'داده',
    unknown: 'نامشخص'
} as const;

const formatColors = {
    pytorch: 'bg-orange-500/10 text-orange-600 border-orange-200',
    onnx: 'bg-blue-500/10 text-blue-600 border-blue-200',
    safetensors: 'bg-green-500/10 text-green-600 border-green-200',
    tensorflow: 'bg-purple-500/10 text-purple-600 border-purple-200',
    gguf: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    ggml: 'bg-teal-500/10 text-teal-600 border-teal-200',
    bin: 'bg-gray-500/10 text-gray-600 border-gray-200',
    unknown: 'bg-slate-500/10 text-slate-600 border-slate-200'
} as const;

interface DetectedModelsPanelProps {
    className?: string;
}

export function DetectedModelsPanel({ className }: DetectedModelsPanelProps) {
    const {
        models,
        statistics,
        loading,
        error,
        scannedDirectories,
        configuration,
        refetch
    } = useDetectedModels();

    const [expandedModel, setExpandedModel] = useState<string | null>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString('fa-IR');
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <Card className={`${className} animate-pulse`}>
                <CardContent className="flex items-center justify-center p-8">
                    <div className="flex items-center gap-3 text-[color:var(--c-muted)]">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>در حال اسکن مدل‌ها...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`${className} border-[color:var(--c-error)]/20`}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-[color:var(--c-error)] mb-4">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">خطا در اسکن مدل‌ها</span>
                    </div>
                    <p className="text-sm text-[color:var(--c-muted)] mb-4">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={refetch}
                    >
                        تلاش مجدد
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            {/* Statistics Summary */}
            {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-[color:var(--c-surface)] rounded-lg p-3 border border-[color:var(--c-border)]">
                        <div className="text-lg font-bold text-[color:var(--c-primary)]">{statistics.total_models}</div>
                        <div className="text-xs text-[color:var(--c-muted)]">کل مدل‌ها</div>
                    </div>
                    <div className="bg-[color:var(--c-surface)] rounded-lg p-3 border border-[color:var(--c-border)]">
                        <div className="text-lg font-bold text-blue-600">{statistics.by_type.model}</div>
                        <div className="text-xs text-[color:var(--c-muted)]">مدل‌های AI</div>
                    </div>
                    <div className="bg-[color:var(--c-surface)] rounded-lg p-3 border border-[color:var(--c-border)]">
                        <div className="text-lg font-bold text-green-600">{statistics.by_type.tts}</div>
                        <div className="text-xs text-[color:var(--c-muted)]">مدل‌های TTS</div>
                    </div>
                    <div className="bg-[color:var(--c-surface)] rounded-lg p-3 border border-[color:var(--c-border)]">
                        <div className="text-lg font-bold text-orange-600">{statistics.by_type.dataset}</div>
                        <div className="text-xs text-[color:var(--c-muted)]">دیتاست‌ها</div>
                    </div>
                </div>
            )}

            {/* Scan Info */}
            {configuration && scannedDirectories.length > 0 && (
                <div className="bg-[color:var(--c-border)]/10 rounded-lg p-4 mb-6 border border-[color:var(--c-border)]/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-[color:var(--c-primary)]" />
                            <span className="text-sm font-medium text-[color:var(--c-text)]">
                                {scannedDirectories.length} پوشه اسکن شده
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RefreshCw className="w-4 h-4" />}
                            onClick={refetch}
                            className="hover:scale-105 transition-transform"
                        >
                            بروزرسانی
                        </Button>
                    </div>
                    <div className="text-xs text-[color:var(--c-muted)] space-y-1">
                        <div>عمق اسکن: {configuration.scanDepth} سطح</div>
                        <div>اسکن خودکار: {configuration.autoScan ? 'فعال' : 'غیرفعال'}</div>
                        {scannedDirectories.length > 0 && (
                            <details className="mt-2">
                                <summary className="cursor-pointer hover:text-[color:var(--c-primary)] transition-colors">
                                    مشاهده پوشه‌ها
                                </summary>
                                <div className="mt-2 space-y-1 mr-4">
                                    {scannedDirectories.map((dir, index) => (
                                        <div key={index} className="text-xs font-mono bg-[color:var(--c-surface)]/50 px-2 py-1 rounded">
                                            {dir}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            )}

            {/* Models List */}
            <div className="space-y-3">
                {models.length === 0 ? (
                    <div className="text-center py-12">
                        <HardDrive className="w-12 h-12 mx-auto text-[color:var(--c-muted)] mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-[color:var(--c-text)] mb-2">
                            هیچ مدلی پیدا نشد
                        </h3>
                        <p className="text-sm text-[color:var(--c-muted)] max-w-md mx-auto">
                            در پوشه‌های تعریف شده مدلی شناسایی نشد. پوشه‌های جدید اضافه کنید یا تنظیمات اسکن را بررسی کنید.
                        </p>
                    </div>
                ) : (
                    models.map((model) => {
                        const TypeIcon = typeIcons[model.type];
                        const isExpanded = expandedModel === model.id;

                        return (
                            <Card
                                key={model.id}
                                className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${model.type === 'model' ? 'bg-blue-500/10' :
                                                model.type === 'tts' ? 'bg-green-500/10' :
                                                    model.type === 'dataset' ? 'bg-orange-500/10' :
                                                        'bg-gray-500/10'
                                            }`}>
                                            <TypeIcon className={`w-5 h-5 ${model.type === 'model' ? 'text-blue-600' :
                                                    model.type === 'tts' ? 'text-green-600' :
                                                        model.type === 'dataset' ? 'text-orange-600' :
                                                            'text-gray-600'
                                                }`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-[color:var(--c-text)] truncate">
                                                    {model.name}
                                                </h4>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs px-2 py-1"
                                                >
                                                    {typeLabels[model.type]}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs px-2 py-1 ${formatColors[model.modelFormat] || formatColors.unknown}`}
                                                >
                                                    {model.modelFormat.toUpperCase()}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-[color:var(--c-muted)]">
                                                <span>{formatFileSize(model.size)}</span>
                                                <span>{model.files.length} فایل</span>
                                                {model.lastModified && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(model.lastModified)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {model.description && (
                                                <p className="text-xs text-[color:var(--c-muted)] mt-2 line-clamp-2">
                                                    {model.description}
                                                </p>
                                            )}

                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t border-[color:var(--c-border)] space-y-3">
                                                    <div>
                                                        <div className="text-xs font-medium text-[color:var(--c-text)] mb-1">مسیر:</div>
                                                        <div className="text-xs font-mono bg-[color:var(--c-surface)]/50 px-2 py-1 rounded break-all">
                                                            {model.path}
                                                        </div>
                                                    </div>

                                                    {model.architecture && (
                                                        <div>
                                                            <div className="text-xs font-medium text-[color:var(--c-text)] mb-1">معماری:</div>
                                                            <div className="text-xs text-[color:var(--c-muted)]">{model.architecture}</div>
                                                        </div>
                                                    )}

                                                    {model.language && model.language.length > 0 && (
                                                        <div>
                                                            <div className="text-xs font-medium text-[color:var(--c-text)] mb-1">زبان‌ها:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {model.language.map((lang, index) => (
                                                                    <Badge key={index} variant="outline" className="text-xs">
                                                                        {lang}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <div className="text-xs font-medium text-[color:var(--c-text)] mb-1">فایل‌ها:</div>
                                                        <div className="text-xs text-[color:var(--c-muted)] space-y-1">
                                                            {model.files.slice(0, 10).map((file, index) => (
                                                                <div key={index} className="flex items-center gap-2">
                                                                    <FileText className="w-3 h-3" />
                                                                    <span>{file}</span>
                                                                </div>
                                                            ))}
                                                            {model.files.length > 10 && (
                                                                <div className="text-[color:var(--c-muted)] italic">
                                                                    و {model.files.length - 10} فایل دیگر...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
