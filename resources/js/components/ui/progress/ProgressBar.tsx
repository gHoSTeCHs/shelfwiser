import { cn } from '@/utils/cn.ts';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'striped' | 'animated';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const ProgressBar = ({
  value,
  max = 100,
  className,
  variant = 'default',
  size = 'md',
  showValue = false,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        'w-full bg-gray-200 rounded-full dark:bg-gray-700',
        {
          'h-1.5': size === 'sm',
          'h-2.5': size === 'md',
          'h-4': size === 'lg',
        },
        className
      )}>
      <div
        className={cn(
          'rounded-full bg-brand-500 transition-all duration-300',
          {
            'h-1.5': size === 'sm',
            'h-2.5': size === 'md',
            'h-4': size === 'lg',
            'bg-gradient-striped bg-striped': variant === 'striped',
            'animate-progress-bar': variant === 'animated',
          }
        )}
        style={{ width: `${percentage}%` }}>
        {showValue && size === 'lg' && (
          <span className="flex items-center justify-center h-full text-xs font-medium text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};
