import { ChevronLeftIcon, AngleLeftIcon, AngleRightIcon } from '../../../icons';
import { ChevronRightIcon } from 'lucide-react';
import React from 'react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	variant?: 'numbered' | 'simple' | 'compact';
	showPageInfo?: boolean;
	className?: string;
	disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	variant = 'numbered',
	showPageInfo = true,
	className = '',
	disabled = false,
}) => {
	const handlePageChange = (page: number) => {
		if (disabled || page < 1 || page > totalPages || page === currentPage)
			return;
		onPageChange(page);
	};

	const handlePrevious = () => {
		handlePageChange(currentPage - 1);
	};

	const handleNext = () => {
		handlePageChange(currentPage + 1);
	};

	const getVisiblePages = () => {
		const delta = 2;
		const range = [];
		const rangeWithDots = [];

		for (
			let i = Math.max(2, currentPage - delta);
			i <= Math.min(totalPages - 1, currentPage + delta);
			i++
		) {
			range.push(i);
		}

		if (currentPage - delta > 2) {
			rangeWithDots.push(1, '...');
		} else {
			rangeWithDots.push(1);
		}

		rangeWithDots.push(...range);

		if (currentPage + delta < totalPages - 1) {
			rangeWithDots.push('...', totalPages);
		} else if (totalPages > 1) {
			rangeWithDots.push(totalPages);
		}

		return rangeWithDots;
	};

	const buttonBaseClasses = `
    inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors
    border border-gray-300 dark:border-gray-600
    ${
			disabled
				? 'cursor-not-allowed opacity-50'
				: 'hover:bg-gray-50 dark:hover:bg-gray-700'
		}
  `;

	const activeButtonClasses = `
    ${buttonBaseClasses}
    bg-brand-500 text-white border-brand-500 hover:bg-brand-600 dark:hover:bg-brand-600
  `;

	const inactiveButtonClasses = `
    ${buttonBaseClasses}
    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
  `;

	if (variant === 'simple') {
		return (
			<div className={`flex items-center justify-between ${className}`}>
				<button
					onClick={handlePrevious}
					disabled={disabled || currentPage <= 1}
					className={`
            inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${
							disabled || currentPage <= 1
								? 'cursor-not-allowed opacity-50 bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
								: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
						}
          `}>
					<ChevronLeftIcon className="w-4 h-4" />
					Previous
				</button>

				{showPageInfo && (
					<span className="text-sm text-gray-700 dark:text-gray-300">
						Page {currentPage} of {totalPages}
					</span>
				)}

				<button
					onClick={handleNext}
					disabled={disabled || currentPage >= totalPages}
					className={`
            inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${
							disabled || currentPage >= totalPages
								? 'cursor-not-allowed opacity-50 bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
								: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
						}
          `}>
					Next
					<ChevronRightIcon className="w-4 h-4" />
				</button>
			</div>
		);
	}

	if (variant === 'compact') {
		return (
			<div className={`flex items-center gap-1 ${className}`}>
				<button
					onClick={handlePrevious}
					disabled={disabled || currentPage <= 1}
					className={`
            p-2 rounded-lg transition-colors
            ${
							disabled || currentPage <= 1
								? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-600'
								: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
						}
          `}
					aria-label="Previous page">
					<AngleLeftIcon className="w-4 h-4" />
				</button>

				<span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
					{currentPage} of {totalPages}
				</span>

				<button
					onClick={handleNext}
					disabled={disabled || currentPage >= totalPages}
					className={`
            p-2 rounded-lg transition-colors
            ${
							disabled || currentPage >= totalPages
								? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-600'
								: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
						}
          `}
					aria-label="Next page">
					<AngleRightIcon className="w-4 h-4" />
				</button>
			</div>
		);
	}

	return (
		<div className={`flex items-center justify-center ${className}`}>
			<nav className="flex items-center gap-1" aria-label="Pagination">
				<button
					onClick={handlePrevious}
					disabled={disabled || currentPage <= 1}
					className={`
            p-2 rounded-lg transition-colors
            ${
							disabled || currentPage <= 1
								? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-600'
								: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
						}
          `}
					aria-label="Previous page">
					<ChevronLeftIcon className="w-4 h-4" />
				</button>

				{getVisiblePages().map((page, index) => {
					if (page === '...') {
						return (
							<span
								key={`dots-${index}`}
								className="px-3 py-2 text-gray-500 dark:text-gray-400">
								...
							</span>
						);
					}

					const pageNumber = page as number;
					const isActive = pageNumber === currentPage;

					return (
						<button
							key={pageNumber}
							onClick={() => handlePageChange(pageNumber)}
							disabled={disabled}
							className={`
                min-w-[40px] h-10 rounded-lg transition-colors
                ${isActive ? activeButtonClasses : inactiveButtonClasses}
              `}
							aria-label={`Go to page ${pageNumber}`}
							aria-current={isActive ? 'page' : undefined}>
							{pageNumber}
						</button>
					);
				})}

				<button
					onClick={handleNext}
					disabled={disabled || currentPage >= totalPages}
					className={`
            p-2 rounded-lg transition-colors
            ${
							disabled || currentPage >= totalPages
								? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-600'
								: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
						}
          `}
					aria-label="Next page">
					<ChevronRightIcon className="w-4 h-4" />
				</button>
			</nav>
		</div>
	);
};

export default Pagination;
