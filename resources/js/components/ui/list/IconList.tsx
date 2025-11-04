import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface IconListProps {
  children: ReactNode;
  className?: string;
}

export const IconList = ({ children, className }: IconListProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

interface IconListItemProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export const IconListItem = ({
  icon,
  children,
  className,
}: IconListItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      {children}
    </div>
  );
};
