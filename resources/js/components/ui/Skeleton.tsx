import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700';

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
        none: '',
    };

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
    }

    return (
        <div
            className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

interface SkeletonCardProps {
    lines?: number;
    showImage?: boolean;
    showActions?: boolean;
    className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    lines = 3,
    showImage = false,
    showActions = false,
    className = '',
}) => {
    return (
        <div
            className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
        >
            {showImage && (
                <Skeleton variant="rectangular" height={160} className="w-full" />
            )}
            <div className="p-6 space-y-3">
                <Skeleton variant="text" className="w-3/4 h-5" />
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="text"
                        className={i === lines - 1 ? 'w-1/2' : 'w-full'}
                    />
                ))}
            </div>
            {showActions && (
                <div className="flex border-t border-gray-200 dark:border-gray-700">
                    <Skeleton variant="rectangular" height={48} className="flex-1" />
                    <Skeleton variant="rectangular" height={48} className="flex-1" />
                </div>
            )}
        </div>
    );
};

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
    className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
    rows = 5,
    columns = 4,
    showHeader = true,
    className = '',
}) => {
    return (
        <div
            className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
        >
            {showHeader && (
                <div className="flex gap-4 border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} variant="text" className="flex-1 h-4" />
                    ))}
                </div>
            )}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex gap-4 p-4">
                        {Array.from({ length: columns }).map((_, colIdx) => (
                            <Skeleton
                                key={colIdx}
                                variant="text"
                                className={`flex-1 ${colIdx === 0 ? 'h-5' : 'h-4'}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface SkeletonListProps {
    items?: number;
    showAvatar?: boolean;
    className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    items = 5,
    showAvatar = false,
    className = '',
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    {showAvatar && (
                        <Skeleton variant="circular" width={40} height={40} />
                    )}
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" className="w-3/4 h-4" />
                        <Skeleton variant="text" className="w-1/2 h-3" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
