import { ReactNode } from 'react';
import { ArrowRightIcon } from 'lucide-react';

interface LinkCardProps {
  title: string;
  description?: string;
  link: string;
  linkText?: string;
  children?: ReactNode;
  className?: string;
}

const LinkCard = ({ title, description, link, linkText = 'Read more', children, className = '' }: LinkCardProps) => {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      <div className="p-6">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <a
          href={link}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {linkText}
          <ArrowRightIcon className="size-4" />
        </a>
      </div>
    </div>
  );
};

export default LinkCard;