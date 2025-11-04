import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface ActionListProps {
  children: ReactNode;
  className?: string;
}

export const ActionList = ({ children, className }: ActionListProps) => {
  return (
    <div className={cn('space-y-1', className)}>
      {children}
    </div>
  );
};

interface ActionListItemProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export const ActionListItem = ({
  icon,
  label,
  onClick,
  className,
  active = false,
}: ActionListItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white',
        className
      )}
    >
      {icon && (
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      )}
      {label}
    </button>
  );
};
