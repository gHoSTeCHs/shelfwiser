import { ReactNode } from 'react';

interface HorizontalCardProps {
  title: string;
  description?: string;
  image?: string;
  children?: ReactNode;
  className?: string;
}

const HorizontalCard = ({ title, description, image, children, className = '' }: HorizontalCardProps) => {
  return (
    <div className={`flex rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      {image && (
        <div className="relative h-auto w-[280px] overflow-hidden rounded-l-2xl">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex-1 p-6">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default HorizontalCard;