import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface ListProps {
  children: ReactNode;
  className?: string;
  ordered?: boolean;
}

export const List = ({ children, className, ordered = false }: ListProps) => {
  const Component = ordered ? 'ol' : 'ul';

  return (
    <Component
      className={cn(
        'space-y-2',
        ordered && 'list-decimal pl-4',
        !ordered && 'list-disc pl-4',
        className
      )}
    >
      {children}
    </Component>
  );
};

interface ListItemProps {
  children: ReactNode;
  className?: string;
}

export const ListItem = ({ children, className }: ListItemProps) => {
  return (
    <li className={cn('text-gray-600 dark:text-gray-400', className)}>
      {children}
    </li>
  );
};
