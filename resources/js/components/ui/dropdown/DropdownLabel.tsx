import type React from 'react';

interface DropdownLabelProps {
	children: React.ReactNode;
	className?: string;
}

export const DropdownLabel: React.FC<DropdownLabelProps> = ({
	children,
	className = '',
}) => {
	return (
		<div
			className={`px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
			{children}
		</div>
	);
};
