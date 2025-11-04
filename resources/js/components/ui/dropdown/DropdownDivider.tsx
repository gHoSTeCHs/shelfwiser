import type React from 'react';

interface DropdownDividerProps {
	className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({
	className = '',
}) => {
	return (
		<div
			className={`my-1 border-t border-gray-200 dark:border-gray-800 ${className}`}
		/>
	);
};
