import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface SelectableListProps {
  children: ReactNode;
  className?: string;
}

export const SelectableList = ({ children, className }: SelectableListProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

interface SelectableListItemProps {
  children: ReactNode;
  type: 'checkbox' | 'radio';
  name?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const SelectableListItem = ({
  children,
  type,
  name,
  checked = false,
  onChange,
  className,
}: SelectableListItemProps) => {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={cn(
          'h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-400',
          {
            'rounded-full': type === 'radio',
          }
        )}
      />
      {children}
    </label>
  );
};
