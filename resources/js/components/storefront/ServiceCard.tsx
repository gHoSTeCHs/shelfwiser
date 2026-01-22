import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Badge from '@/components/ui/badge/Badge';
import useCurrency from '@/hooks/useCurrency';
import { Service } from '@/types/service';
import { Shop } from '@/types/shop';
import { Link } from '@inertiajs/react';
import { Briefcase, Clock } from 'lucide-react';
import React from 'react';

interface ServiceCardProps {
    service: Service;
    shop: Shop;
}

/**
 * Service card with playful-luxury styling.
 * Features duration badge, price display, and hover effects.
 */
const ServiceCard: React.FC<ServiceCardProps> = ({ service, shop }) => {
    const { formatCurrency } = useCurrency(shop);
    const mainVariant = service.variants?.[0];
    const basePrice = mainVariant?.base_price || 0;
    const duration = mainVariant?.estimated_duration_minutes;

    const formatDuration = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };

    return (
        <Link
            href={StorefrontController.showService.url({
                shop: shop.slug,
                service: service.slug,
            })}
            className="group block h-full"
        >
            <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800 dark:hover:border-brand-500 dark:hover:shadow-brand-500/10">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-navy-700">
                    {service.image_url ? (
                        <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                            <Briefcase
                                className="h-12 w-12 sm:h-16 sm:w-16"
                                strokeWidth={1}
                            />
                        </div>
                    )}

                    {/* Duration badge */}
                    {duration && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm dark:bg-navy-800/90 dark:text-gray-300">
                                <Clock className="h-3 w-3" />
                                {formatDuration(duration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                    {/* Category */}
                    {service.category && (
                        <p className="mb-1 text-[10px] font-medium tracking-wide text-brand-600 uppercase sm:text-xs dark:text-brand-400">
                            {service.category.name}
                        </p>
                    )}

                    {/* Service name */}
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-brand-600 sm:text-base dark:text-white dark:group-hover:text-brand-400">
                        {service.name}
                    </h3>

                    {/* Description */}
                    {service.description && (
                        <p className="mt-1 line-clamp-2 flex-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                            {service.description}
                        </p>
                    )}

                    {/* Bottom row: price and options */}
                    <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                            <p className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                                {formatCurrency(basePrice)}
                            </p>
                            {service.has_material_options && (
                                <p className="text-[10px] text-gray-500 sm:text-xs dark:text-gray-400">
                                    Starting from
                                </p>
                            )}
                        </div>

                        {service.variants && service.variants.length > 1 && (
                            <Badge color="light" size="sm">
                                {service.variants.length} options
                            </Badge>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default ServiceCard;
