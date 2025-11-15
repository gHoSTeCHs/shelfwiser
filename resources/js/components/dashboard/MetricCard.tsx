import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function MetricCard({
    title,
    value,
    icon: Icon,
    iconColor = 'text-brand-600 dark:text-brand-400',
    iconBgColor = 'bg-brand-100 dark:bg-brand-900/20',
    subtitle,
    trend,
}: MetricCardProps) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${iconBgColor}`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <p
                            className={`text-sm ${trend.isPositive ? 'text-success-600' : 'text-error-600'}`}
                        >
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}
                            %
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
