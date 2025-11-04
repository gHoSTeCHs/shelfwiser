import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface RibbonProps {
  children: ReactNode;
  className?: string;
  variant?: 'rounded' | 'filled' | 'hover';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const Ribbon = ({
  children,
  className,
  variant = 'rounded',
  position = 'top-right',
}: RibbonProps) => {
  return (
    <div
      className={cn(
        'absolute inline-flex items-center justify-center text-sm font-medium',
        {
          'px-3 py-1 rounded-full': variant === 'rounded',
          'px-4 py-1.5': variant === 'filled',
          'px-3 py-1 transition-colors duration-200': variant === 'hover',

          'top-3 -right-1': position === 'top-right',
          'top-3 -left-1': position === 'top-left',
          'bottom-3 -right-1': position === 'bottom-right',
          'bottom-3 -left-1': position === 'bottom-left',

          'bg-brand-500 text-white hover:bg-brand-600': variant === 'filled',
          'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400': variant === 'rounded',
          'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300': variant === 'hover',
        },
        className
      )}>
      {children}
    </div>
  );
};
