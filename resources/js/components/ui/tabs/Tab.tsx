import { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';

interface TabProps {
	children: ReactNode;
	className?: string;
	variant?: 'default' | 'underline' | 'icon' | 'badge';
}

export const Tab = ({ children, className }: TabProps) => {
	return <div className={cn('w-full', className)}>{children}</div>;
};

interface TabListProps {
	children: ReactNode;
	className?: string;
	variant?: 'default' | 'underline' | 'icon' | 'badge';
}

export const TabList = ({
	children,
	className,
	variant = 'default',
}: TabListProps) => {
	const variantClasses = {
		default: 'gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-900',
		underline: 'gap-4 border-b border-gray-200 dark:border-gray-800',
		icon: 'flex-nowrap overflow-x-auto gap-8 border-b border-gray-200 dark:border-gray-800',
		badge: 'flex-nowrap overflow-x-auto gap-2',
	};

	return (
		<div className={cn('flex', variantClasses[variant], className)}>
			{children}
		</div>
	);
};

interface TabTriggerProps {
	children: ReactNode;
	isActive?: boolean;
	onClick?: () => void;
	className?: string;
	variant?: 'default' | 'underline' | 'icon' | 'badge';
}

export const TabTrigger = ({
	children,
	isActive = false,
	onClick,
	className,
	variant = 'default',
}: TabTriggerProps) => {
	const getVariantClasses = () => {
		const baseClasses =
			'outline-none focus:outline-none transition-colors duration-200';

		switch (variant) {
			case 'default':
				return cn(
					baseClasses,
					'px-5 py-2 text-sm font-medium rounded-md',
					isActive
						? 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
						: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
				);

			case 'underline':
				return cn(
					baseClasses,
					'pb-3 text-sm font-medium border-b-2',
					isActive
						? 'text-brand-500 border-brand-500 dark:text-brand-400 dark:border-brand-400'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
				);

			case 'icon':
				return cn(
					baseClasses,
					'pb-3 flex items-center gap-2 text-sm font-medium border-b-2',
					isActive
						? 'text-brand-500 border-brand-500 dark:text-brand-400 dark:border-brand-400'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
				);

			case 'badge':
				return cn(
					baseClasses,
					'px-2 py-1 text-xs font-medium rounded',
					isActive
						? 'text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/10'
						: 'text-gray-500 bg-transparent hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
				);

			default:
				return baseClasses;
		}
	};

	return (
		<button onClick={onClick} className={cn(getVariantClasses(), className)}>
			{children}
		</button>
	);
};

interface TabContentProps {
	children: ReactNode;
	className?: string;
}

export const TabContent = ({ children, className }: TabContentProps) => {
	return <div className={cn('mt-6', className)}>{children}</div>;
};
