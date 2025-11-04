import type React from 'react';

interface DropdownHeaderProps {
	title: string;
	subtitle?: string;
	avatar?: React.ReactNode;
	className?: string;
}

export const DropdownHeader: React.FC<DropdownHeaderProps> = ({
	title,
	subtitle,
	avatar,
	className = '',
}) => {
	return (
		<div className={`flex items-center gap-3 px-4 py-3 ${className}`}>
			{avatar && <div className="flex-shrink-0">{avatar}</div>}
			<div className="flex flex-col min-w-0">
				<span className="text-sm font-medium text-gray-900 dark:text-white truncate">
					{title}
				</span>
				{subtitle && (
					<span className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{subtitle}
					</span>
				)}
			</div>
		</div>
	);
};
