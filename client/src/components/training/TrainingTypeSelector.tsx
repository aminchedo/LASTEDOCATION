import React from 'react';
import {
    Zap,
    Target,
    Scissors,
    Layers,
    Brain,
    Cpu,
    MessageCircle,
    FileText,
    Globe,
    Music,
    CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type TrainingType =
    | 'fine-tuning'
    | 'lora'
    | 'qlora'
    | 'prefix-tuning'
    | 'adapter'
    | 'distillation'
    | 'instruction-tuning'
    | 'chat-tuning'
    | 'domain-adaptation'
    | 'multi-task';

interface TrainingTypeInfo {
    id: TrainingType;
    name: string;
    description: string;
    icon: React.ElementType;
    difficulty: 'آسان' | 'متوسط' | 'سخت';
    memoryUsage: 'کم' | 'متوسط' | 'زیاد';
    trainingTime: 'کوتاه' | 'متوسط' | 'طولانی';
    quality: 'خوب' | 'عالی' | 'فوق‌العاده';
    bestFor: string[];
    requirements: string[];
    color: string;
}

const trainingTypes: TrainingTypeInfo[] = [
    {
        id: 'fine-tuning',
        name: 'Fine-Tuning کامل',
        description: 'آموزش تمام پارامترهای مدل روی داده‌های جدید',
        icon: Brain,
        difficulty: 'متوسط',
        memoryUsage: 'زیاد',
        trainingTime: 'طولانی',
        quality: 'فوق‌العاده',
        bestFor: ['تغییرات عمده', 'دامنه‌های جدید', 'کیفیت بالا'],
        requirements: ['GPU قوی', 'حافظه زیاد', 'داده‌های کیفی'],
        color: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    {
        id: 'lora',
        name: 'LoRA',
        description: 'آموزش ماتریس‌های کم‌رتبه برای تطبیق کارآمد',
        icon: Layers,
        difficulty: 'آسان',
        memoryUsage: 'کم',
        trainingTime: 'کوتاه',
        quality: 'عالی',
        bestFor: ['سرعت آموزش', 'کاربرد عملی', 'منابع محدود'],
        requirements: ['GPU متوسط', 'حافظه کم', 'داده‌های کم'],
        color: 'bg-green-500/10 text-green-600 border-green-200'
    },
    {
        id: 'qlora',
        name: 'QLoRA',
        description: 'LoRA با کوانتیزاسیون 4-بیت برای کاهش حافظه',
        icon: Zap,
        difficulty: 'متوسط',
        memoryUsage: 'کم',
        trainingTime: 'کوتاه',
        quality: 'عالی',
        bestFor: ['GPU ضعیف', 'مدل‌های بزرگ', 'کاهش هزینه'],
        requirements: ['GPU کوچک', 'حافظه خیلی کم', 'bitsandbytes'],
        color: 'bg-purple-500/10 text-purple-600 border-purple-200'
    },
    {
        id: 'prefix-tuning',
        name: 'Prefix Tuning',
        description: 'آموزش پیشوندهای قابل تنظیم برای کنترل رفتار مدل',
        icon: Target,
        difficulty: 'متوسط',
        memoryUsage: 'کم',
        trainingTime: 'کوتاه',
        quality: 'خوب',
        bestFor: ['کنترل دقیق', 'چندین کار', 'تنوع خروجی'],
        requirements: ['GPU متوسط', 'طراحی پیشوند', 'تجربه تنظیم'],
        color: 'bg-orange-500/10 text-orange-600 border-orange-200'
    },
    {
        id: 'adapter',
        name: 'Adapter Layers',
        description: 'افزودن لایه‌های کوچک تطبیقی بین لایه‌های موجود',
        icon: Scissors,
        difficulty: 'متوسط',
        memoryUsage: 'کم',
        trainingTime: 'متوسط',
        quality: 'عالی',
        bestFor: ['چندین دامنه', 'تعویض سریع', 'مدولار بودن'],
        requirements: ['GPU متوسط', 'طراحی معماری', 'مدیریت adapter'],
        color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200'
    },
    {
        id: 'distillation',
        name: 'Knowledge Distillation',
        description: 'انتقال دانش از مدل بزرگ به مدل کوچک',
        icon: Cpu,
        difficulty: 'سخت',
        memoryUsage: 'زیاد',
        trainingTime: 'طولانی',
        quality: 'عالی',
        bestFor: ['کاهش اندازه', 'سرعت اجرا', 'بهینه‌سازی'],
        requirements: ['مدل معلم', 'GPU قوی', 'تجربه distillation'],
        color: 'bg-red-500/10 text-red-600 border-red-200'
    },
    {
        id: 'instruction-tuning',
        name: 'Instruction Tuning',
        description: 'آموزش مدل برای پیروی از دستورات و راهنمایی‌ها',
        icon: FileText,
        difficulty: 'متوسط',
        memoryUsage: 'متوسط',
        trainingTime: 'متوسط',
        quality: 'فوق‌العاده',
        bestFor: ['دستیار هوشمند', 'پیروی از دستور', 'تعامل کاربر'],
        requirements: ['داده‌های instruction', 'GPU متوسط', 'طراحی prompt'],
        color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
    },
    {
        id: 'chat-tuning',
        name: 'Chat Tuning',
        description: 'تخصصی‌سازی برای گفت‌وگو و پاسخ‌دهی تعاملی',
        icon: MessageCircle,
        difficulty: 'متوسط',
        memoryUsage: 'متوسط',
        trainingTime: 'متوسط',
        quality: 'فوق‌العاده',
        bestFor: ['ربات گفت‌وگو', 'پاسخ‌دهی', 'تعامل طبیعی'],
        requirements: ['داده‌های مکالمه', 'GPU متوسط', 'تنوع پاسخ'],
        color: 'bg-pink-500/10 text-pink-600 border-pink-200'
    },
    {
        id: 'domain-adaptation',
        name: 'Domain Adaptation',
        description: 'تطبیق مدل با دامنه یا موضوع خاص',
        icon: Globe,
        difficulty: 'متوسط',
        memoryUsage: 'متوسط',
        trainingTime: 'متوسط',
        quality: 'عالی',
        bestFor: ['تخصص دامنه', 'زبان تخصصی', 'کاربرد خاص'],
        requirements: ['داده‌های دامنه', 'GPU متوسط', 'تحلیل دامنه'],
        color: 'bg-teal-500/10 text-teal-600 border-teal-200'
    },
    {
        id: 'multi-task',
        name: 'Multi-Task Learning',
        description: 'آموزش همزمان چندین کار روی یک مدل',
        icon: Music,
        difficulty: 'سخت',
        memoryUsage: 'زیاد',
        trainingTime: 'طولانی',
        quality: 'عالی',
        bestFor: ['چندکاره بودن', 'بهره‌وری منابع', 'تعمیم‌پذیری'],
        requirements: ['چندین dataset', 'GPU قوی', 'توازن کارها'],
        color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
    }
];

interface TrainingTypeSelectorProps {
    selectedType: TrainingType | null;
    onTypeSelect: (type: TrainingType) => void;
    className?: string;
}

export function TrainingTypeSelector({
    selectedType,
    onTypeSelect,
    className
}: TrainingTypeSelectorProps) {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'آسان': return 'text-green-600 bg-green-500/10';
            case 'متوسط': return 'text-yellow-600 bg-yellow-500/10';
            case 'سخت': return 'text-red-600 bg-red-500/10';
            default: return 'text-gray-600 bg-gray-500/10';
        }
    };

    const getUsageColor = (usage: string) => {
        switch (usage) {
            case 'کم': return 'text-green-600 bg-green-500/10';
            case 'متوسط': return 'text-yellow-600 bg-yellow-500/10';
            case 'زیاد': return 'text-red-600 bg-red-500/10';
            default: return 'text-gray-600 bg-gray-500/10';
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <h3 className="text-lg font-semibold text-[color:var(--c-text)]">
                    نوع آموزش
                </h3>
                <p className="text-sm text-[color:var(--c-muted)]">
                    روش آموزش مناسب برای نیاز خود انتخاب کنید
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainingTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;

                        return (
                            <div
                                key={type.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                                        ? 'border-[color:var(--c-primary)] bg-[color:var(--c-primary)]/5 scale-105'
                                        : 'border-[color:var(--c-border)] hover:border-[color:var(--c-primary)]/50 hover:scale-102'
                                    }`}
                                onClick={() => onTypeSelect(type.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    {isSelected && (
                                        <CheckCircle className="w-5 h-5 text-[color:var(--c-primary)]" />
                                    )}
                                </div>

                                <h4 className="font-semibold text-[color:var(--c-text)] mb-2">
                                    {type.name}
                                </h4>

                                <p className="text-sm text-[color:var(--c-muted)] mb-3 line-clamp-2">
                                    {type.description}
                                </p>

                                {/* Specs */}
                                <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[color:var(--c-muted)]">سختی:</span>
                                        <Badge className={`text-xs ${getDifficultyColor(type.difficulty)}`}>
                                            {type.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[color:var(--c-muted)]">حافظه:</span>
                                        <Badge className={`text-xs ${getUsageColor(type.memoryUsage)}`}>
                                            {type.memoryUsage}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[color:var(--c-muted)]">زمان:</span>
                                        <Badge className={`text-xs ${getUsageColor(type.trainingTime)}`}>
                                            {type.trainingTime}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Best For */}
                                <div className="mb-3">
                                    <div className="text-xs font-medium text-[color:var(--c-text)] mb-1">
                                        مناسب برای:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {type.bestFor.slice(0, 2).map((item, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="text-xs px-1 py-0.5"
                                            >
                                                {item}
                                            </Badge>
                                        ))}
                                        {type.bestFor.length > 2 && (
                                            <Badge variant="outline" className="text-xs px-1 py-0.5">
                                                +{type.bestFor.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Quality Indicator */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[color:var(--c-muted)]">کیفیت:</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(type.quality === 'خوب' ? 3 : type.quality === 'عالی' ? 4 : 5)].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[color:var(--c-primary)]"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Type Details */}
                {selectedType && (
                    <div className="mt-6 p-4 bg-[color:var(--c-primary)]/5 rounded-lg border border-[color:var(--c-primary)]/20">
                        {(() => {
                            const type = trainingTypes.find(t => t.id === selectedType)!;
                            const Icon = type.icon;

                            return (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-[color:var(--c-text)]">
                                                {type.name}
                                            </h5>
                                            <p className="text-sm text-[color:var(--c-muted)]">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="font-medium text-[color:var(--c-text)] mb-1">
                                                مناسب برای:
                                            </div>
                                            <ul className="space-y-0.5 text-[color:var(--c-muted)]">
                                                {type.bestFor.map((item, index) => (
                                                    <li key={index} className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <div className="font-medium text-[color:var(--c-text)] mb-1">
                                                نیازمندی‌ها:
                                            </div>
                                            <ul className="space-y-0.5 text-[color:var(--c-muted)]">
                                                {type.requirements.map((req, index) => (
                                                    <li key={index} className="flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-[color:var(--c-muted)]"></div>
                                                        {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
