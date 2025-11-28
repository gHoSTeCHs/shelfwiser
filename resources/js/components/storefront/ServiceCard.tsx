import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import { Service } from '@/types/service';
import { Shop } from '@/types/shop';
import { Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import React from 'react';

interface ServiceCardProps {
    service: Service;
    shop: Shop;
}

/**
 * Reusable service card component for displaying services in grids.
 * Shows service image, name, price, duration, and link to detail page.
 */
const ServiceCard: React.FC<ServiceCardProps> = ({ service, shop }) => {
    const mainVariant = service.variants?.[0];
    const basePrice = mainVariant?.base_price || 0;
    const duration = mainVariant?.estimated_duration_minutes;

    return (
        <Link
            href={StorefrontController.showService.url({
                shop: shop.slug,
                service: service.slug,
            })}
        >
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    {service.image_url ? (
                        <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg
                                className="h-16 w-16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="mb-2">
                        {service.category && (
                            <p className="mb-1 text-xs text-gray-500">
                                {service.category.name}
                            </p>
                        )}
                        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
                            {service.name}
                        </h3>
                    </div>

                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold text-gray-900">
                                {shop.currency_symbol}
                                {Number(basePrice).toFixed(2)}
                            </p>
                            {service.has_material_options && (
                                <p className="text-xs text-gray-500">
                                    Starting price
                                </p>
                            )}
                        </div>

                        {duration && (
                            <Badge
                                color="info"
                                size="sm"
                                startIcon={<Clock className="h-3 w-3" />}
                            >
                                {duration} min
                            </Badge>
                        )}
                    </div>

                    {service.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                            {service.description}
                        </p>
                    )}

                    {service.variants && service.variants.length > 1 && (
                        <Badge color="light" size="sm" className="mt-2">
                            {service.variants.length} options
                        </Badge>
                    )}
                </div>
            </Card>
        </Link>
    );
};

export default ServiceCard;
