import type React from 'react';
import { Link } from '@inertiajs/react';

interface DropdownItemProps {
	tag?: 'a' | 'button';
	to?: string;
	onClick?: () => void;
	onItemClick?: () => void;
	icon?: React.ReactNode;
	disabled?: boolean;
	variant?: 'default' | 'destructive';
	baseClassName?: string;
	className?: string;
	children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
	tag = 'button',
	to,
	onClick,
	onItemClick,
	icon,
	disabled = false,
	variant = 'default',
	baseClassName,
	className = '',
	children,
}) => {
	const defaultBaseClassName =
		'flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium transition-colors';

	const variantClasses = {
		default:
			'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
		destructive:
			'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10',
	};

	const disabledClasses = disabled
		? 'opacity-50 cursor-not-allowed pointer-events-none'
		: '';

	const combinedClasses = `${baseClassName || defaultBaseClassName} ${
		variantClasses[variant]
	} ${disabledClasses} ${className}`.trim();

	const handleClick = (event: React.MouseEvent) => {
		if (disabled) {
			event.preventDefault();
			return;
		}
		if (tag === 'button') {
			event.preventDefault();
		}
		if (onClick) onClick();
		if (onItemClick) onItemClick();
	};

	const content = (
		<>
			{icon && (
				<span
					className={`flex-shrink-0 ${
						variant === 'destructive'
							? 'text-error-600 dark:text-error-400'
							: 'text-gray-500 dark:text-gray-400'
					}`}>
					{icon}
				</span>
			)}
			<span className="flex-1">{children}</span>
		</>
	);

	if (tag === 'a' && to && !disabled) {
		return (
			<Link
				href={to}
				className={combinedClasses}
				onClick={handleClick}
				role="menuitem"
				tabIndex={0}>
				{content}
			</Link>
		);
	}

	return (
		<button
			onClick={handleClick}
			className={combinedClasses}
			disabled={disabled}
			role="menuitem"
			tabIndex={0}>
			{content}
		</button>
	);
};
