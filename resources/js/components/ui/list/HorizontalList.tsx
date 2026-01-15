import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface HorizontalListProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export const HorizontalList = ({
  children,
  className,
  gap = 'md',
}: HorizontalListProps) => {
  return (
    <div
      className={cn(
        'flex items-center',
        {
          'gap-2': gap === 'sm',
          'gap-4': gap === 'md',
          'gap-6': gap === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
};

interface HorizontalListItemProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const HorizontalListItem = ({
  children,
  className,
  icon,
}: HorizontalListItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      {icon && (
        <span className="text-gray-400 dark:text-gray-300">{icon}</span>
      )}
      {children}
    </div>
  );
};
