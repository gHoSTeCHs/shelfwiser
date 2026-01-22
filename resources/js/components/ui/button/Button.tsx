import React, { ReactNode } from 'react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
	children: ReactNode;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	loading?: boolean;
	fullWidth?: boolean;
	type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
	children,
	size = 'md',
	variant = 'primary',
	startIcon,
	endIcon,
	onClick,
	disabled = false,
	loading = false,
	fullWidth = false,
	className = '',
	type = 'button',
	...rest
}) => {
	const sizeClasses = {
		sm: 'px-3.5 py-2.5 text-sm min-h-[44px]',
		md: 'px-4 py-3 text-sm min-h-[44px]',
		lg: 'px-5 py-3.5 text-base min-h-[44px]',
	};

	const variantClasses = {
		primary:
			'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 focus:ring-4 focus:ring-brand-500/12 disabled:bg-brand-300 disabled:shadow-none',
		secondary:
			'bg-gray-900 text-white shadow-theme-xs hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/12 disabled:bg-gray-300 disabled:shadow-none dark:bg-white dark:text-gray-900 dark:hover:bg-gray-50 dark:disabled:bg-gray-600',
		outline:
			'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-900/12 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-transparent dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:disabled:bg-transparent dark:disabled:text-gray-600',
		ghost:
			'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-4 focus:ring-gray-900/12 disabled:text-gray-400 disabled:bg-transparent dark:text-gray-300 dark:hover:bg-white/5 dark:disabled:text-gray-600',
		destructive:
			'bg-error-600 text-white shadow-theme-xs hover:bg-error-700 focus:ring-4 focus:ring-error-600/12 disabled:bg-error-300 disabled:shadow-none',
	};

	const iconSizeClasses = {
		sm: '[&_svg]:size-4',
		md: '[&_svg]:size-5',
		lg: '[&_svg]:size-5',
	};

	const isDisabled = disabled || loading;

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={isDisabled}
			{...rest}
			className={`
        inline-flex items-center justify-center font-medium gap-2 rounded-lg transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${iconSizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `
				.trim()
				.replace(/\s+/g, ' ')}>
			{loading ? (
				<svg
					className="animate-spin"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg">
					<path
						d="M8 1.5V4.5M8 11.5V14.5M3.75 3.75L5.86 5.86M10.14 10.14L12.25 12.25M1.5 8H4.5M11.5 8H14.5M3.75 12.25L5.86 10.14M10.14 5.86L12.25 3.75"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			) : (
				startIcon && <span className="flex items-center">{startIcon}</span>
			)}
			{children}
			{!loading && endIcon && (
				<span className="flex items-center">{endIcon}</span>
			)}
		</button>
	);
};

export default Button;
